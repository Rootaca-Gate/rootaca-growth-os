import { KpiFrequency } from '@prisma/client';
import { KPI_CATALOG } from './kpi-catalog';

describe('KPI catalog', () => {
  it('seeds the seven default KPIs with weekly and monthly coverage', () => {
    expect(KPI_CATALOG).toHaveLength(7);
    expect(KPI_CATALOG.map((item) => item.name)).toEqual([
      'Coding Problems',
      'Mini Projects',
      'Independent Tasks',
      'Weekly Practice Hours',
      'Project Completion',
      'Problem Solving',
      'Independence',
    ]);
    expect(KPI_CATALOG.some((item) => item.frequency === KpiFrequency.WEEKLY)).toBe(true);
    expect(KPI_CATALOG.some((item) => item.frequency === KpiFrequency.MONTHLY)).toBe(true);
    expect(KPI_CATALOG.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });
});
