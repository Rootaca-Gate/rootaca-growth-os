import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AssessmentResultResponseDto } from '../orientation/dto/session-response.dto';
import { toResultResponse } from '../orientation/orientation.mapper';
import { KpiService } from '../kpi/kpi.service';
import { PlacementService } from '../placement/placement.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { ProjectService } from '../projects/project.service';
import { RoadmapService } from '../roadmap/roadmap.service';
import { StudentsService } from '../students/students.service';
import { ReportLocale } from './dto/report-query.dto';
import { StudentProgressReportDto } from './dto/report-response.dto';
import { toStudentProgressReport } from './report.mapper';
import { renderStudentProgressPdf } from './report-pdf';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentsService: StudentsService,
    private readonly placementService: PlacementService,
    private readonly roadmapService: RoadmapService,
    private readonly kpiService: KpiService,
    private readonly projectService: ProjectService,
    private readonly progressService: ProgressService,
  ) {}

  async getReport(
    studentId: string,
    locale: ReportLocale = 'en',
  ): Promise<StudentProgressReportDto> {
    const student = await this.studentsService.findOne(studentId);
    const [skills, placement, roadmap, kpis, projects, progress, assessment] = await Promise.all([
      this.placementService.listStudentSkills(studentId),
      this.optional(() => this.placementService.getStudentPlacement(studentId)),
      this.optional(() => this.roadmapService.getForStudent(studentId)),
      this.kpiService.getStudentDashboard(studentId),
      this.projectService.listStudentProjects(studentId),
      this.progressService.getDashboard(studentId),
      this.latestAssessment(studentId),
    ]);

    return toStudentProgressReport({
      locale,
      generatedAt: new Date(),
      student,
      skills,
      placement,
      assessment,
      roadmap,
      kpis,
      projects,
      progress,
    });
  }

  async renderPdf(
    studentId: string,
    locale: ReportLocale = 'en',
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const report = await this.getReport(studentId, locale);
    const buffer = await renderStudentProgressPdf(report);
    return { buffer, fileName: report.fileName };
  }

  private async latestAssessment(studentId: string): Promise<AssessmentResultResponseDto | null> {
    const session = await this.prisma.orientationSession.findFirst({
      where: { studentId, result: { isNot: null } },
      include: { result: true },
      orderBy: { completedAt: 'desc' },
    });
    return session?.result ? toResultResponse(session.result) : null;
  }

  private async optional<T>(load: () => Promise<T>): Promise<T | null> {
    try {
      return await load();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        return null;
      }
      throw error;
    }
  }
}
