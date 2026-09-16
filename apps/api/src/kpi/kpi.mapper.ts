import { Kpi, KpiFrequency, KpiRecord, KpiStatus, Prisma, StudentKpi } from '@prisma/client';
import {
  KpiDefinitionDto,
  KpiRecordDto,
  StudentKpiDashboardDto,
  StudentKpiItemDto,
} from './dto/kpi-response.dto';
import { overallStatus, startOfUtcDay, toDateOnly } from './kpi-math';

export const studentKpiInclude = {
  kpi: true,
  records: { orderBy: [{ periodStart: 'desc' }, { frequency: 'asc' }] },
} satisfies Prisma.StudentKpiInclude;

export type StudentKpiRecord = StudentKpi & {
  kpi: Kpi;
  records: KpiRecord[];
};

export function toDefinitionDto(kpi: Kpi): KpiDefinitionDto {
  return {
    id: kpi.id,
    code: kpi.code,
    name: kpi.name,
    description: kpi.description,
    category: kpi.category,
    target: kpi.target,
    unit: kpi.unit,
    frequency: kpi.frequency,
    weight: kpi.weight,
    active: kpi.active,
    sortOrder: kpi.sortOrder,
    createdAt: kpi.createdAt.toISOString(),
    updatedAt: kpi.updatedAt.toISOString(),
  };
}

export function toRecordDto(record: KpiRecord): KpiRecordDto {
  return {
    id: record.id,
    frequency: record.frequency,
    periodStart: toDateOnly(record.periodStart),
    periodEnd: toDateOnly(record.periodEnd),
    target: record.target,
    actual: record.actual,
    progressPercent: record.progressPercent,
    status: record.status,
    notes: record.notes,
    source: record.source,
  };
}

export function toStudentKpiItem(item: StudentKpiRecord, now = new Date()): StudentKpiItemDto {
  const weekly = currentRecord(item.records, KpiFrequency.WEEKLY, now);
  const monthly = currentRecord(item.records, KpiFrequency.MONTHLY, now);
  const current =
    (item.kpi.frequency === KpiFrequency.WEEKLY ? weekly : monthly) ??
    weekly ??
    monthly ??
    item.records[0];

  if (!current) {
    throw new Error(`Student KPI ${item.id} is missing period records`);
  }

  const currentId = current.id;
  return {
    id: item.id,
    kpi: toDefinitionDto(item.kpi),
    target: current.target,
    actual: current.actual,
    progressPercent: current.progressPercent,
    status: current.status,
    current: toRecordDto(current),
    weekly: weekly ? toRecordDto(weekly) : null,
    monthly: monthly ? toRecordDto(monthly) : null,
    history: item.records.filter((record) => record.id !== currentId).map(toRecordDto),
  };
}

export function toDashboard(
  studentId: string,
  items: StudentKpiRecord[],
  now = new Date(),
): StudentKpiDashboardDto {
  const mapped = items.map((item) => toStudentKpiItem(item, now));
  const weightTotal = mapped.reduce((sum, item) => sum + item.kpi.weight, 0);
  const overallPercent =
    weightTotal === 0
      ? 0
      : Math.round(
          mapped.reduce((sum, item) => sum + item.progressPercent * item.kpi.weight, 0) /
            weightTotal,
        );

  return {
    studentId,
    overallPercent,
    overallStatus: overallStatus(overallPercent),
    onTrackCount: mapped.filter((item) => item.status === KpiStatus.ON_TRACK).length,
    atRiskCount: mapped.filter((item) => item.status === KpiStatus.AT_RISK).length,
    behindCount: mapped.filter((item) => item.status === KpiStatus.BEHIND).length,
    completedCount: mapped.filter((item) => item.status === KpiStatus.COMPLETED).length,
    items: mapped,
  };
}

function currentRecord(
  records: KpiRecord[],
  frequency: KpiFrequency,
  now: Date,
): KpiRecord | undefined {
  const today = startOfUtcDay(now).getTime();
  return records.find(
    (record) =>
      record.frequency === frequency &&
      record.periodStart.getTime() <= today &&
      record.periodEnd.getTime() >= today,
  );
}
