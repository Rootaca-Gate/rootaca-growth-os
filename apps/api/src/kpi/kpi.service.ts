import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Kpi, KpiFrequency, KpiRecord, KpiRecordSource, SkillCode, Student } from '@prisma/client';
import { averagePercent } from '../roadmap/roadmap-progress';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKpiDto, RecordStudentKpiDto, UpdateKpiDto } from './dto/kpi-write.dto';
import { KpiDefinitionDto, StudentKpiDashboardDto } from './dto/kpi-response.dto';
import { studentKpiInclude, StudentKpiRecord, toDashboard, toDefinitionDto } from './kpi.mapper';
import {
  deriveKpiStatus,
  periodBounds,
  roundMetric,
  scaledTarget,
  startOfUtcMonth,
} from './kpi-math';

@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  async listDefinitions(): Promise<KpiDefinitionDto[]> {
    const items = await this.prisma.kpi.findMany({ orderBy: { sortOrder: 'asc' } });
    return items.map(toDefinitionDto);
  }

  async createDefinition(dto: CreateKpiDto): Promise<KpiDefinitionDto> {
    const last = await this.prisma.kpi.findFirst({ orderBy: { sortOrder: 'desc' } });
    const code = dto.code ?? this.toCode(dto.name);
    try {
      const created = await this.prisma.kpi.create({
        data: {
          code,
          name: dto.name.trim(),
          description: dto.description.trim(),
          category: dto.category,
          target: dto.target,
          unit: dto.unit.trim(),
          frequency: dto.frequency,
          weight: dto.weight,
          sortOrder: (last?.sortOrder ?? 0) + 1,
        },
      });
      return toDefinitionDto(created);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new ConflictException('A KPI with this code already exists');
      }
      throw error;
    }
  }

  async updateDefinition(id: string, dto: UpdateKpiDto): Promise<KpiDefinitionDto> {
    await this.requireDefinition(id);
    const updated = await this.prisma.kpi.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        category: dto.category,
        target: dto.target,
        unit: dto.unit?.trim(),
        frequency: dto.frequency,
        weight: dto.weight,
        active: dto.active,
        sortOrder: dto.sortOrder,
      },
    });
    return toDefinitionDto(updated);
  }

  async deactivateDefinition(id: string): Promise<KpiDefinitionDto> {
    await this.requireDefinition(id);
    const updated = await this.prisma.kpi.update({
      where: { id },
      data: { active: false },
    });
    return toDefinitionDto(updated);
  }

  async getStudentDashboard(studentId: string, now = new Date()): Promise<StudentKpiDashboardDto> {
    const items = await this.ensureStudentKpis(studentId, now);
    return toDashboard(studentId, items, now);
  }

  async recordActual(
    studentId: string,
    studentKpiId: string,
    dto: RecordStudentKpiDto,
    now = new Date(),
  ): Promise<StudentKpiDashboardDto> {
    if (dto.actual === undefined && dto.target === undefined && dto.notes === undefined) {
      throw new BadRequestException('Provide actual, target, or notes');
    }

    await this.ensureStudentKpis(studentId, now);
    const studentKpi = await this.prisma.studentKpi.findFirst({
      where: { id: studentKpiId, studentId },
      include: { kpi: true },
    });
    if (!studentKpi) {
      throw new NotFoundException('Student KPI not found');
    }

    const frequency = dto.frequency ?? studentKpi.kpi.frequency;
    const bounds = periodBounds(frequency, now);
    const existing = await this.prisma.kpiRecord.findUnique({
      where: {
        studentKpiId_frequency_periodStart: {
          studentKpiId: studentKpi.id,
          frequency,
          periodStart: bounds.periodStart,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Current KPI period is missing');
    }

    const target = dto.target === undefined ? existing.target : roundMetric(dto.target);
    const actual = dto.actual === undefined ? existing.actual : roundMetric(dto.actual);
    const computed = deriveKpiStatus({
      actual,
      target,
      periodStart: existing.periodStart,
      periodEnd: existing.periodEnd,
      now,
    });

    await this.prisma.kpiRecord.update({
      where: { id: existing.id },
      data: {
        target,
        actual,
        progressPercent: computed.progressPercent,
        status: computed.status,
        notes: dto.notes === undefined ? undefined : dto.notes.trim(),
        source: KpiRecordSource.MANUAL,
      },
    });

    if (frequency === KpiFrequency.WEEKLY && studentKpi.kpi.frequency === KpiFrequency.WEEKLY) {
      await this.rollupMonthly(studentKpi.id, now);
    }

    if (dto.target !== undefined) {
      await this.prisma.studentKpi.update({
        where: { id: studentKpi.id },
        data: { target },
      });
    }

    return this.getStudentDashboard(studentId, now);
  }

  private async ensureStudentKpis(studentId: string, now: Date): Promise<StudentKpiRecord[]> {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const definitions = await this.prisma.kpi.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    const systemValues = await this.loadSystemValues(student);

    for (const kpi of definitions) {
      const target = this.effectiveTarget(kpi, student);
      const studentKpi = await this.prisma.studentKpi.upsert({
        where: { studentId_kpiId: { studentId, kpiId: kpi.id } },
        update: { active: true },
        create: {
          studentId,
          kpiId: kpi.id,
          target,
          actual: 0,
        },
      });

      await this.ensurePeriod(studentKpi.id, kpi, KpiFrequency.WEEKLY, target, now);
      await this.ensurePeriod(studentKpi.id, kpi, KpiFrequency.MONTHLY, target, now);
      await this.applySystemActual(studentKpi.id, kpi, systemValues, now);
      if (kpi.frequency === KpiFrequency.WEEKLY) {
        await this.rollupMonthly(studentKpi.id, now);
      }
    }

    const items = await this.prisma.studentKpi.findMany({
      where: { studentId, active: true, kpi: { active: true } },
      include: studentKpiInclude,
      orderBy: { kpi: { sortOrder: 'asc' } },
    });

    for (const item of items) {
      const primary =
        item.records.find((record) => record.frequency === item.kpi.frequency) ?? item.records[0];
      if (!primary) {
        continue;
      }
      await this.prisma.studentKpi.update({
        where: { id: item.id },
        data: {
          target: primary.target,
          actual: primary.actual,
          progressPercent: primary.progressPercent,
          status: primary.status,
        },
      });
    }

    return this.prisma.studentKpi.findMany({
      where: { studentId, active: true, kpi: { active: true } },
      include: studentKpiInclude,
      orderBy: { kpi: { sortOrder: 'asc' } },
    });
  }

  private async ensurePeriod(
    studentKpiId: string,
    kpi: Kpi,
    frequency: KpiFrequency,
    baseTarget: number,
    now: Date,
  ): Promise<KpiRecord> {
    const bounds = periodBounds(frequency, now);
    const target = scaledTarget(baseTarget, kpi.frequency, frequency, now);
    const computed = deriveKpiStatus({
      actual: 0,
      target,
      periodStart: bounds.periodStart,
      periodEnd: bounds.periodEnd,
      now,
    });

    const record = await this.prisma.kpiRecord.upsert({
      where: {
        studentKpiId_frequency_periodStart: {
          studentKpiId,
          frequency,
          periodStart: bounds.periodStart,
        },
      },
      update: {},
      create: {
        studentKpiId,
        frequency,
        periodStart: bounds.periodStart,
        periodEnd: bounds.periodEnd,
        target,
        actual: 0,
        progressPercent: computed.progressPercent,
        status: computed.status,
        source: KpiRecordSource.SYSTEM,
      },
    });

    const refreshed = deriveKpiStatus({
      actual: record.actual,
      target: record.target,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      now,
    });
    if (
      refreshed.progressPercent !== record.progressPercent ||
      refreshed.status !== record.status
    ) {
      return this.prisma.kpiRecord.update({
        where: { id: record.id },
        data: {
          progressPercent: refreshed.progressPercent,
          status: refreshed.status,
        },
      });
    }
    return record;
  }

  private async applySystemActual(
    studentKpiId: string,
    kpi: Kpi,
    values: Record<string, number>,
    now: Date,
  ): Promise<void> {
    const actual = values[kpi.code];
    if (actual === undefined) {
      return;
    }

    const bounds = periodBounds(kpi.frequency, now);
    const record = await this.prisma.kpiRecord.findUnique({
      where: {
        studentKpiId_frequency_periodStart: {
          studentKpiId,
          frequency: kpi.frequency,
          periodStart: bounds.periodStart,
        },
      },
    });
    if (!record || record.source === KpiRecordSource.MANUAL) {
      return;
    }

    const computed = deriveKpiStatus({
      actual,
      target: record.target,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      now,
    });
    await this.prisma.kpiRecord.update({
      where: { id: record.id },
      data: {
        actual,
        progressPercent: computed.progressPercent,
        status: computed.status,
        source: KpiRecordSource.SYSTEM,
      },
    });
  }

  private async rollupMonthly(studentKpiId: string, now: Date): Promise<void> {
    const monthStart = startOfUtcMonth(now);
    const nextMonth = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
    );
    const weekly = await this.prisma.kpiRecord.findMany({
      where: {
        studentKpiId,
        frequency: KpiFrequency.WEEKLY,
        periodStart: { gte: monthStart, lt: nextMonth },
      },
    });
    const monthly = await this.prisma.kpiRecord.findUnique({
      where: {
        studentKpiId_frequency_periodStart: {
          studentKpiId,
          frequency: KpiFrequency.MONTHLY,
          periodStart: monthStart,
        },
      },
    });
    if (!monthly || monthly.source === KpiRecordSource.MANUAL) {
      return;
    }

    const actual = roundMetric(weekly.reduce((sum, item) => sum + item.actual, 0));
    const computed = deriveKpiStatus({
      actual,
      target: monthly.target,
      periodStart: monthly.periodStart,
      periodEnd: monthly.periodEnd,
      now,
    });
    await this.prisma.kpiRecord.update({
      where: { id: monthly.id },
      data: {
        actual,
        progressPercent: computed.progressPercent,
        status: computed.status,
        source: KpiRecordSource.SYSTEM,
      },
    });
  }

  private async loadSystemValues(student: Student): Promise<Record<string, number>> {
    const values: Record<string, number> = {};
    const skills = await this.prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: { skill: true },
    });
    const problemSolving = skills.find((item) => item.skill.code === SkillCode.PROBLEM_SOLVING);
    const independence = skills.find((item) => item.skill.code === SkillCode.INDEPENDENCE);
    if (problemSolving) {
      values.PROBLEM_SOLVING = roundMetric(problemSolving.score);
    }
    if (independence) {
      values.INDEPENDENCE = roundMetric(independence.score);
    }

    const roadmap = await this.prisma.roadmap.findUnique({
      where: { studentId: student.id },
      include: { phases: { include: { items: true } } },
    });
    if (roadmap) {
      values.PROJECT_COMPLETION = averagePercent(roadmap.phases.flatMap((phase) => phase.items));
    }

    return values;
  }

  private effectiveTarget(kpi: Kpi, student: Student): number {
    if (kpi.code === 'WEEKLY_PRACTICE_HOURS' && student.availableHoursPerWeek > 0) {
      return student.availableHoursPerWeek;
    }
    return kpi.target;
  }

  private async requireDefinition(id: string): Promise<Kpi> {
    const kpi = await this.prisma.kpi.findUnique({ where: { id } });
    if (!kpi) {
      throw new NotFoundException('KPI not found');
    }
    return kpi;
  }

  private toCode(name: string): string {
    const code = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    if (code.length < 2) {
      throw new BadRequestException('KPI name is too short to derive a code');
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
