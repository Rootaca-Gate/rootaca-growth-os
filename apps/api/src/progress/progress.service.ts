import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KpiFrequency, ReviewKind } from '@prisma/client';
import { endOfUtcMonth, startOfUtcMonth, toDateOnly } from '../kpi/kpi-math';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateOnly } from '../roadmap/roadmap-progress';
import { CreateProgressReviewDto, UpdateProgressReviewDto } from './dto/progress-write.dto';
import {
  GrowthChartDto,
  ProgressReviewDto,
  StudentProgressDashboardDto,
} from './dto/progress-response.dto';
import { REVIEW_DIMENSIONS, scoresFromReview } from './progress-growth';
import {
  progressReviewInclude,
  ProgressReviewRecord,
  skillSeries,
  storedOverall,
  withGrowth,
} from './progress.mapper';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(studentId: string): Promise<StudentProgressDashboardDto> {
    await this.requireStudent(studentId);
    const history = await this.loadHistory(studentId);
    const latest = history[0] ?? null;
    const live = await this.snapshotPercents(studentId);
    return {
      studentId,
      latest,
      dimensions: latest?.dimensions ?? emptyDimensions(),
      currentScore: latest?.overallScore ?? 0,
      previousScore: latest?.previousOverallScore ?? null,
      growth: latest?.overallGrowth ?? null,
      history,
      skillGrowth: skillSeries([...history].reverse()),
      kpiGrowth: await this.kpiChart(studentId, history, live.kpi),
      projectGrowth: await this.projectChart(studentId, history, live.project),
    };
  }

  async list(studentId: string): Promise<ProgressReviewDto[]> {
    await this.requireStudent(studentId);
    return this.loadHistory(studentId);
  }

  async get(studentId: string, reviewId: string): Promise<ProgressReviewDto> {
    const history = await this.list(studentId);
    const item = history.find((review) => review.id === reviewId);
    if (!item) {
      throw new NotFoundException('Progress review not found');
    }
    return item;
  }

  async create(
    studentId: string,
    reviewerId: string,
    dto: CreateProgressReviewDto,
  ): Promise<ProgressReviewDto> {
    await this.requireStudent(studentId);
    const reviewedAt = parseDateOnly(dto.reviewedAt ?? toDateOnly(new Date()));
    const period = this.resolvePeriod(dto.kind, reviewedAt, dto.periodStart, dto.periodEnd);
    const scores = scoresFromReview(dto);
    const live = await this.snapshotPercents(studentId);

    if (dto.kind === ReviewKind.INITIAL_ASSESSMENT) {
      const existing = await this.prisma.progressReview.findFirst({
        where: { studentId, kind: ReviewKind.INITIAL_ASSESSMENT },
      });
      if (existing) {
        throw new ConflictException('This student already has an initial assessment');
      }
    }

    try {
      const created = await this.prisma.progressReview.create({
        data: {
          studentId,
          reviewerId,
          kind: dto.kind,
          reviewedAt,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          ...scores,
          overallScore: storedOverall(scores),
          kpiOverallPercent: live.kpi,
          projectOverallPercent: live.project,
          notes: dto.notes?.trim() ?? '',
          strengths: dto.strengths?.trim() ?? '',
          nextFocus: dto.nextFocus?.trim() ?? '',
        },
        include: progressReviewInclude,
      });
      return this.toDtoWithPrevious(created);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new ConflictException('A review already exists for this student and period');
      }
      throw error;
    }
  }

  async update(
    studentId: string,
    reviewId: string,
    dto: UpdateProgressReviewDto,
  ): Promise<ProgressReviewDto> {
    const current = await this.requireReview(studentId, reviewId);
    const kind = dto.kind ?? current.kind;
    const reviewedAt = dto.reviewedAt ? parseDateOnly(dto.reviewedAt) : current.reviewedAt;
    const period = this.resolvePeriod(
      kind,
      reviewedAt,
      dto.periodStart ?? toDateOnly(current.periodStart),
      dto.periodEnd ?? toDateOnly(current.periodEnd),
    );
    const scores = scoresFromReview({
      technicalSkills: dto.technicalSkills ?? current.technicalSkills,
      problemSolving: dto.problemSolving ?? current.problemSolving,
      projects: dto.projects ?? current.projects,
      independence: dto.independence ?? current.independence,
      communication: dto.communication ?? current.communication,
    });

    if (kind === ReviewKind.INITIAL_ASSESSMENT && current.kind !== ReviewKind.INITIAL_ASSESSMENT) {
      const existing = await this.prisma.progressReview.findFirst({
        where: { studentId, kind: ReviewKind.INITIAL_ASSESSMENT, NOT: { id: reviewId } },
      });
      if (existing) {
        throw new ConflictException('This student already has an initial assessment');
      }
    }

    try {
      const updated = await this.prisma.progressReview.update({
        where: { id: reviewId },
        data: {
          kind,
          reviewedAt,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          ...scores,
          overallScore: storedOverall(scores),
          notes: dto.notes === undefined ? undefined : dto.notes.trim(),
          strengths: dto.strengths === undefined ? undefined : dto.strengths.trim(),
          nextFocus: dto.nextFocus === undefined ? undefined : dto.nextFocus.trim(),
        },
        include: progressReviewInclude,
      });
      return this.toDtoWithPrevious(updated);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new ConflictException('A review already exists for this student and period');
      }
      throw error;
    }
  }

  async remove(studentId: string, reviewId: string): Promise<StudentProgressDashboardDto> {
    await this.requireReview(studentId, reviewId);
    await this.prisma.progressReview.delete({ where: { id: reviewId } });
    return this.getDashboard(studentId);
  }

  private async loadHistory(studentId: string): Promise<ProgressReviewDto[]> {
    const items = await this.prisma.progressReview.findMany({
      where: { studentId },
      include: progressReviewInclude,
      orderBy: [{ reviewedAt: 'asc' }, { createdAt: 'asc' }],
    });
    return withGrowth(items).reverse();
  }

  private async toDtoWithPrevious(item: ProgressReviewRecord): Promise<ProgressReviewDto> {
    const history = await this.loadHistory(item.studentId);
    const mapped = history.find((review) => review.id === item.id);
    if (!mapped) {
      throw new NotFoundException('Progress review not found');
    }
    return mapped;
  }

  private async requireStudent(id: string): Promise<void> {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
  }

  private async requireReview(studentId: string, reviewId: string): Promise<ProgressReviewRecord> {
    await this.requireStudent(studentId);
    const item = await this.prisma.progressReview.findFirst({
      where: { id: reviewId, studentId },
      include: progressReviewInclude,
    });
    if (!item) {
      throw new NotFoundException('Progress review not found');
    }
    return item;
  }

  private resolvePeriod(
    kind: ReviewKind,
    reviewedAt: Date,
    periodStart?: string,
    periodEnd?: string,
  ): { periodStart: Date; periodEnd: Date } {
    if (kind === ReviewKind.INITIAL_ASSESSMENT) {
      const start = periodStart ? parseDateOnly(periodStart) : reviewedAt;
      return { periodStart: start, periodEnd: periodEnd ? parseDateOnly(periodEnd) : start };
    }
    const start = periodStart ? parseDateOnly(periodStart) : startOfUtcMonth(reviewedAt);
    const end = periodEnd ? parseDateOnly(periodEnd) : endOfUtcMonth(reviewedAt);
    if (end.getTime() < start.getTime()) {
      throw new BadRequestException('Review period end must be on or after the start date');
    }
    return { periodStart: start, periodEnd: end };
  }

  private async snapshotPercents(studentId: string): Promise<{ kpi: number; project: number }> {
    const [kpis, projects] = await Promise.all([
      this.prisma.studentKpi.findMany({
        where: { studentId, active: true },
        include: { kpi: true },
      }),
      this.prisma.studentProject.findMany({ where: { studentId } }),
    ]);
    const weightTotal = kpis.reduce((sum, item) => sum + item.kpi.weight, 0);
    const kpi =
      weightTotal === 0
        ? 0
        : Math.round(
            kpis.reduce((sum, item) => sum + item.progressPercent * item.kpi.weight, 0) /
              weightTotal,
          );
    const project =
      projects.length === 0
        ? 0
        : Math.round(
            projects.reduce((sum, item) => sum + item.progressPercent, 0) / projects.length,
          );
    return { kpi, project };
  }

  private async kpiChart(
    studentId: string,
    history: ProgressReviewDto[],
    liveOverall: number,
  ): Promise<GrowthChartDto> {
    const records = await this.prisma.kpiRecord.findMany({
      where: { studentKpi: { studentId }, frequency: KpiFrequency.MONTHLY },
      include: { studentKpi: { include: { kpi: true } } },
      orderBy: { periodStart: 'asc' },
    });

    const byPeriod = new Map<string, { weight: number; weighted: number }>();
    for (const record of records) {
      const label = toDateOnly(record.periodStart);
      const current = byPeriod.get(label) ?? { weight: 0, weighted: 0 };
      current.weight += record.studentKpi.kpi.weight;
      current.weighted += record.progressPercent * record.studentKpi.kpi.weight;
      byPeriod.set(label, current);
    }

    const fromRecords = [...byPeriod.entries()].map(([label, value]) => ({
      label,
      value: value.weight === 0 ? 0 : Math.round(value.weighted / value.weight),
    }));

    const fromReviews = [...history]
      .reverse()
      .map((item) => ({ label: item.reviewedAt, value: item.kpiOverallPercent }));

    const merged = mergeSeries(fromRecords.length > 0 ? fromRecords : fromReviews, {
      label: toDateOnly(new Date()),
      value: liveOverall,
    });

    return {
      title: 'KPI Growth',
      labels: merged.map((item) => item.label),
      series: [
        { key: 'kpiOverall', label: 'KPI overall', points: merged.map((item) => item.value) },
      ],
    };
  }

  private async projectChart(
    studentId: string,
    history: ProgressReviewDto[],
    liveOverall: number,
  ): Promise<GrowthChartDto> {
    const assignments = await this.prisma.studentProject.findMany({
      where: { studentId },
      include: { project: true },
      orderBy: { assignedAt: 'asc' },
    });
    const fromReviews = [...history]
      .reverse()
      .map((item) => ({ label: item.reviewedAt, value: item.projectOverallPercent }));
    const overall = mergeSeries(fromReviews, {
      label: toDateOnly(new Date()),
      value: liveOverall,
    });
    const series = [
      {
        key: 'projectOverall',
        label: 'Classroom projects',
        points: padPoints(
          overall.map((item) => item.value),
          overall.length,
        ),
      },
      ...assignments.map((item) => ({
        key: item.id,
        label: item.project.name,
        points: overall.map((point) =>
          point.label < toDateOnly(item.assignedAt) ? 0 : item.progressPercent,
        ),
      })),
    ];
    return {
      title: 'Project Growth',
      labels: overall.map((item) => item.label),
      series: series.filter((item) => item.points.length > 0),
    };
  }
}

function emptyDimensions() {
  return REVIEW_DIMENSIONS.map((item) => ({
    key: item.key,
    label: item.label,
    currentScore: 0,
    previousScore: null,
    growth: null,
  }));
}

function mergeSeries(
  points: Array<{ label: string; value: number }>,
  live: { label: string; value: number },
): Array<{ label: string; value: number }> {
  const map = new Map<string, number>();
  for (const point of points) {
    map.set(point.label, point.value);
  }
  if (!map.has(live.label)) {
    map.set(live.label, live.value);
  }
  return [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value }));
}

function padPoints(points: number[], length: number): number[] {
  if (points.length === length) {
    return points;
  }
  return [...points, ...Array.from({ length: Math.max(0, length - points.length) }, () => 0)];
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}
