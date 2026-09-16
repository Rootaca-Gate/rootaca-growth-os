import { KpiCategory, KpiFrequency, KpiStatus } from './kpi.models';

export const KPI_CATEGORIES: KpiCategory[] = [
  'CODING',
  'PROJECTS',
  'PRACTICE',
  'PROBLEM_SOLVING',
  'INDEPENDENCE',
];

export const KPI_FREQUENCIES: KpiFrequency[] = ['WEEKLY', 'MONTHLY'];

export const KPI_CATEGORY_LABELS: Record<KpiCategory, string> = {
  CODING: 'Coding',
  PROJECTS: 'Projects',
  PRACTICE: 'Practice',
  PROBLEM_SOLVING: 'Problem solving',
  INDEPENDENCE: 'Independence',
};

export const KPI_FREQUENCY_LABELS: Record<KpiFrequency, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

export const KPI_STATUS_LABELS: Record<KpiStatus, string> = {
  ON_TRACK: 'On track',
  AT_RISK: 'At risk',
  BEHIND: 'Behind',
  COMPLETED: 'Completed',
};
