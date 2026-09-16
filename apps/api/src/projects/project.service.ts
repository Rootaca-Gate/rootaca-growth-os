import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project, ProjectPurpose, StudentProjectStatus } from '@prisma/client';
import { addUtcDays, parseDateOnly } from '../roadmap/roadmap-progress';
import { PrismaService } from '../prisma/prisma.service';
import { MILESTONE_CATALOG, MILESTONE_DURATION_TOTAL } from './catalog/milestone-catalog';
import {
  AssignProjectDto,
  CreateProjectDto,
  UpdateMilestoneDto,
  UpdateProjectDto,
  UpdateStudentProjectDto,
} from './dto/project-write.dto';
import {
  ProjectDefinitionDto,
  ProjectDetailsDto,
  StudentProjectDto,
  StudentProjectSummaryDto,
} from './dto/project-response.dto';
import {
  optionalDate,
  studentProjectInclude,
  StudentProjectRecord,
  toProjectDto,
  toStudentProjectDto,
} from './project.mapper';
import {
  deriveStudentProjectStatus,
  normalizeMilestoneProgress,
  projectOverallPercent,
} from './project-progress';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(): Promise<ProjectDefinitionDto[]> {
    const items = await this.prisma.project.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { assignments: true } } },
    });
    return items.map((item) => toProjectDto(item, item._count.assignments));
  }

  async getProject(id: string): Promise<ProjectDetailsDto> {
    const project = await this.requireProject(id);
    const assignments = await this.prisma.studentProject.findMany({
      where: { projectId: id },
      include: studentProjectInclude,
      orderBy: { assignedAt: 'desc' },
    });
    return {
      ...toProjectDto(project, assignments.length),
      assignments: assignments.map(toStudentProjectDto),
    };
  }

  async createProject(dto: CreateProjectDto): Promise<ProjectDefinitionDto> {
    this.assertEducationalCopy(dto.name, dto.description, dto.learningGoal);
    const last = await this.prisma.project.findFirst({ orderBy: { sortOrder: 'desc' } });
    const code = dto.code ?? this.toCode(dto.name);
    try {
      const created = await this.prisma.project.create({
        data: {
          code,
          name: dto.name.trim(),
          description: dto.description.trim(),
          learningGoal: dto.learningGoal.trim(),
          purpose: ProjectPurpose.EDUCATIONAL,
          path: dto.path,
          level: dto.level,
          durationDays: dto.durationDays,
          sortOrder: (last?.sortOrder ?? 0) + 1,
        },
      });
      return toProjectDto(created, 0);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new ConflictException('A project with this code already exists');
      }
      throw error;
    }
  }

  async updateProject(id: string, dto: UpdateProjectDto): Promise<ProjectDefinitionDto> {
    const current = await this.requireProject(id);
    this.assertEducationalCopy(
      dto.name ?? current.name,
      dto.description ?? current.description,
      dto.learningGoal ?? current.learningGoal,
    );
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        learningGoal: dto.learningGoal?.trim(),
        path: dto.path,
        level: dto.level,
        durationDays: dto.durationDays,
        active: dto.active,
      },
    });
    const count = await this.prisma.studentProject.count({ where: { projectId: id } });
    return toProjectDto(updated, count);
  }

  async deactivateProject(id: string): Promise<ProjectDefinitionDto> {
    await this.requireProject(id);
    const updated = await this.prisma.project.update({
      where: { id },
      data: { active: false },
    });
    const count = await this.prisma.studentProject.count({ where: { projectId: id } });
    return toProjectDto(updated, count);
  }

  async assign(projectId: string, dto: AssignProjectDto): Promise<StudentProjectDto> {
    const project = await this.requireProject(projectId);
    if (!project.active) {
      throw new BadRequestException('This educational project is inactive');
    }
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const assignedAt = new Date();
    const dueDate = dto.dueDate
      ? parseDateOnly(dto.dueDate)
      : addUtcDays(assignedAt, project.durationDays);
    const scale = project.durationDays / MILESTONE_DURATION_TOTAL;

    try {
      const created = await this.prisma.studentProject.create({
        data: {
          studentId: student.id,
          projectId: project.id,
          dueDate,
          notes: dto.notes?.trim() ?? '',
          milestones: {
            create: MILESTONE_CATALOG.map((milestone, index) => {
              const prior = MILESTONE_CATALOG.slice(0, index).reduce(
                (sum, item) => sum + item.durationDays,
                0,
              );
              const days = Math.max(1, Math.round(milestone.durationDays * scale));
              const startOffset = Math.round(prior * scale);
              return {
                kind: milestone.kind,
                title: milestone.title,
                description: milestone.description,
                sortOrder: milestone.sortOrder,
                dueDate: addUtcDays(assignedAt, startOffset + days),
              };
            }),
          },
        },
        include: studentProjectInclude,
      });
      return toStudentProjectDto(created);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new ConflictException('This educational project is already assigned to the student');
      }
      throw error;
    }
  }

  async listStudentProjects(studentId: string): Promise<StudentProjectSummaryDto> {
    await this.requireStudent(studentId);
    const items = await this.prisma.studentProject.findMany({
      where: { studentId },
      include: studentProjectInclude,
      orderBy: { assignedAt: 'desc' },
    });
    return this.toSummary(studentId, items);
  }

  async getStudentProject(studentId: string, studentProjectId: string): Promise<StudentProjectDto> {
    return toStudentProjectDto(await this.requireStudentProject(studentId, studentProjectId));
  }

  async updateStudentProject(
    studentId: string,
    studentProjectId: string,
    dto: UpdateStudentProjectDto,
  ): Promise<StudentProjectDto> {
    const current = await this.requireStudentProject(studentId, studentProjectId);
    const overall = projectOverallPercent(current.milestones);
    const status = deriveStudentProjectStatus({
      current: current.status,
      requested: dto.status,
      overallPercent: overall,
    });
    await this.prisma.studentProject.update({
      where: { id: current.id },
      data: {
        status,
        progressPercent: overall,
        dueDate: optionalDate(dto.dueDate),
        notes: dto.notes === undefined ? undefined : dto.notes.trim(),
      },
    });
    return toStudentProjectDto(await this.requireStudentProject(studentId, studentProjectId));
  }

  async updateMilestone(
    studentId: string,
    studentProjectId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ): Promise<StudentProjectDto> {
    const current = await this.requireStudentProject(studentId, studentProjectId);
    const milestone = current.milestones.find((item) => item.id === milestoneId);
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    if (
      dto.completionPercent === undefined &&
      dto.status === undefined &&
      dto.dueDate === undefined &&
      dto.mentorFeedback === undefined
    ) {
      throw new BadRequestException('Provide completion, status, due date, or mentor feedback');
    }

    const normalized = normalizeMilestoneProgress({
      status: dto.status,
      completionPercent: dto.completionPercent,
      currentStatus: milestone.status,
      currentPercent: milestone.completionPercent,
    });

    await this.prisma.projectMilestone.update({
      where: { id: milestone.id },
      data: {
        completionPercent: normalized.completionPercent,
        status: normalized.status,
        dueDate: optionalDate(dto.dueDate),
        mentorFeedback: dto.mentorFeedback === undefined ? undefined : dto.mentorFeedback.trim(),
      },
    });

    const refreshed = await this.requireStudentProject(studentId, studentProjectId);
    const overall = projectOverallPercent(refreshed.milestones);
    const status = deriveStudentProjectStatus({
      current: refreshed.status,
      overallPercent: overall,
    });
    await this.prisma.studentProject.update({
      where: { id: refreshed.id },
      data: { progressPercent: overall, status },
    });
    return toStudentProjectDto(await this.requireStudentProject(studentId, studentProjectId));
  }

  async unassign(studentId: string, studentProjectId: string): Promise<StudentProjectSummaryDto> {
    await this.requireStudentProject(studentId, studentProjectId);
    await this.prisma.studentProject.delete({ where: { id: studentProjectId } });
    return this.listStudentProjects(studentId);
  }

  private toSummary(studentId: string, items: StudentProjectRecord[]): StudentProjectSummaryDto {
    const mapped = items.map(toStudentProjectDto);
    const percents = mapped.map((item) => item.progressPercent);
    const overallPercent =
      percents.length === 0
        ? 0
        : Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length);
    return {
      studentId,
      overallPercent,
      assignedCount: mapped.filter((item) => item.status === StudentProjectStatus.ASSIGNED).length,
      inProgressCount: mapped.filter((item) => item.status === StudentProjectStatus.IN_PROGRESS)
        .length,
      completedCount: mapped.filter((item) => item.status === StudentProjectStatus.COMPLETED)
        .length,
      items: mapped,
    };
  }

  private async requireProject(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Educational project not found');
    }
    return project;
  }

  private async requireStudent(id: string): Promise<void> {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
  }

  private async requireStudentProject(
    studentId: string,
    studentProjectId: string,
  ): Promise<StudentProjectRecord> {
    await this.requireStudent(studentId);
    const item = await this.prisma.studentProject.findFirst({
      where: { id: studentProjectId, studentId },
      include: studentProjectInclude,
    });
    if (!item) {
      throw new NotFoundException('Student project not found');
    }
    return item;
  }

  private assertEducationalCopy(name: string, description: string, learningGoal: string): void {
    const haystack = `${name} ${description} ${learningGoal}`.toLowerCase();
    const banned = [
      'client',
      'case study',
      'case-study',
      'customer deliverable',
      'agency portfolio',
    ];
    if (banned.some((term) => haystack.includes(term))) {
      throw new BadRequestException(
        'Projects are classroom learning work and cannot be described as client case studies',
      );
    }
  }

  private toCode(name: string): string {
    const code = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    if (code.length < 2) {
      throw new BadRequestException('Project name is too short to derive a code');
    }
    return code.slice(0, 48);
  }
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}
