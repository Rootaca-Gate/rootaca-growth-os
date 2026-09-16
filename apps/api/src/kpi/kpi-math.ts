import { KpiFrequency, KpiStatus } from '@prisma/client';

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function roundMetric(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
}

export function progressPercent(actual: number, target: number): number {
  if (target <= 0) {
    return actual > 0 ? 100 : 0;
  }
  return clampPercent((actual / target) * 100);
}

export function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function addUtcDays(value: Date, days: number): Date {
  const next = startOfUtcDay(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function startOfUtcWeek(value: Date): Date {
  const date = startOfUtcDay(value);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addUtcDays(date, diff);
}

export function endOfUtcWeek(value: Date): Date {
  return addUtcDays(startOfUtcWeek(value), 6);
}

export function startOfUtcMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

export function endOfUtcMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));
}

export function daysInclusive(start: Date, end: Date): number {
  const ms = startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function weeksInMonth(value: Date): number {
  return Math.max(1, Math.round(daysInclusive(startOfUtcMonth(value), endOfUtcMonth(value)) / 7));
}

export function periodBounds(
  frequency: KpiFrequency,
  at: Date,
): { periodStart: Date; periodEnd: Date } {
  if (frequency === KpiFrequency.WEEKLY) {
    return { periodStart: startOfUtcWeek(at), periodEnd: endOfUtcWeek(at) };
  }
  return { periodStart: startOfUtcMonth(at), periodEnd: endOfUtcMonth(at) };
}

export function scaledTarget(
  baseTarget: number,
  kpiFrequency: KpiFrequency,
  recordFrequency: KpiFrequency,
  at: Date,
): number {
  if (kpiFrequency === recordFrequency) {
    return roundMetric(baseTarget);
  }
  const weeks = weeksInMonth(at);
  if (kpiFrequency === KpiFrequency.WEEKLY && recordFrequency === KpiFrequency.MONTHLY) {
    return roundMetric(baseTarget * weeks);
  }
  return roundMetric(baseTarget / weeks);
}

export function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function deriveKpiStatus(input: {
  actual: number;
  target: number;
  periodStart: Date;
  periodEnd: Date;
  now?: Date;
}): { progressPercent: number; status: KpiStatus } {
  const percent = progressPercent(input.actual, input.target);
  if (percent >= 100) {
    return { progressPercent: 100, status: KpiStatus.COMPLETED };
  }

  const now = startOfUtcDay(input.now ?? new Date());
  const start = startOfUtcDay(input.periodStart);
  const end = startOfUtcDay(input.periodEnd);
  const cursor = now < start ? start : now > end ? end : now;
  const elapsedRatio = daysInclusive(start, cursor) / daysInclusive(start, end);
  const expected = input.target * elapsedRatio;

  if (elapsedRatio <= 0.15 && input.actual <= 0) {
    return { progressPercent: percent, status: KpiStatus.ON_TRACK };
  }

  if (percent >= 70 || input.actual + 1e-9 >= expected * 0.85) {
    return { progressPercent: percent, status: KpiStatus.ON_TRACK };
  }

  if (percent >= 40 || input.actual + 1e-9 >= expected * 0.5) {
    return { progressPercent: percent, status: KpiStatus.AT_RISK };
  }

  return { progressPercent: percent, status: KpiStatus.BEHIND };
}

export function overallStatus(percent: number): KpiStatus {
  if (percent >= 100) {
    return KpiStatus.COMPLETED;
  }
  if (percent >= 70) {
    return KpiStatus.ON_TRACK;
  }
  if (percent >= 40) {
    return KpiStatus.AT_RISK;
  }
  return KpiStatus.BEHIND;
}
