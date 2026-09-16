import { KpiFrequency, KpiStatus } from '@prisma/client';
import {
  deriveKpiStatus,
  periodBounds,
  progressPercent,
  scaledTarget,
  startOfUtcWeek,
} from './kpi-math';

describe('KPI math', () => {
  it('computes progress from actual versus target', () => {
    expect(progressPercent(5, 10)).toBe(50);
    expect(progressPercent(12, 10)).toBe(100);
    expect(progressPercent(0, 0)).toBe(0);
  });

  it('marks completed work and uses elapsed time for status', () => {
    const periodStart = new Date('2026-09-14T00:00:00.000Z');
    const periodEnd = new Date('2026-09-20T00:00:00.000Z');

    expect(
      deriveKpiStatus({
        actual: 10,
        target: 10,
        periodStart,
        periodEnd,
        now: new Date('2026-09-16T00:00:00.000Z'),
      }),
    ).toEqual({ progressPercent: 100, status: KpiStatus.COMPLETED });

    expect(
      deriveKpiStatus({
        actual: 0,
        target: 10,
        periodStart,
        periodEnd,
        now: new Date('2026-09-14T00:00:00.000Z'),
      }).status,
    ).toBe(KpiStatus.ON_TRACK);

    expect(
      deriveKpiStatus({
        actual: 1,
        target: 10,
        periodStart,
        periodEnd,
        now: new Date('2026-09-20T00:00:00.000Z'),
      }).status,
    ).toBe(KpiStatus.BEHIND);
  });

  it('scales weekly targets into monthly records', () => {
    const at = new Date('2026-09-16T00:00:00.000Z');
    expect(scaledTarget(10, KpiFrequency.WEEKLY, KpiFrequency.WEEKLY, at)).toBe(10);
    expect(scaledTarget(10, KpiFrequency.WEEKLY, KpiFrequency.MONTHLY, at)).toBe(40);
    expect(startOfUtcWeek(at).toISOString().startsWith('2026-09-14')).toBe(true);
    expect(
      periodBounds(KpiFrequency.MONTHLY, at).periodStart.toISOString().startsWith('2026-09-01'),
    ).toBe(true);
  });
});
