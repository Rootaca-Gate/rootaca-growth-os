import { KpiCategory, KpiFrequency } from '@prisma/client';

export type KpiCatalogItem = {
  code: string;
  name: string;
  description: string;
  category: KpiCategory;
  target: number;
  unit: string;
  frequency: KpiFrequency;
  weight: number;
  sortOrder: number;
};

export const KPI_CATALOG: KpiCatalogItem[] = [
  {
    code: 'CODING_PROBLEMS',
    name: 'Coding Problems',
    description: 'Short problems completed during the week to build syntax and pattern memory.',
    category: KpiCategory.CODING,
    target: 10,
    unit: 'problems',
    frequency: KpiFrequency.WEEKLY,
    weight: 15,
    sortOrder: 1,
  },
  {
    code: 'MINI_PROJECTS',
    name: 'Mini Projects',
    description: 'Small shipped artifacts that someone else can try without the student present.',
    category: KpiCategory.PROJECTS,
    target: 2,
    unit: 'projects',
    frequency: KpiFrequency.MONTHLY,
    weight: 15,
    sortOrder: 2,
  },
  {
    code: 'INDEPENDENT_TASKS',
    name: 'Independent Tasks',
    description: 'Tasks finished with little mentor prompting after the brief is understood.',
    category: KpiCategory.INDEPENDENCE,
    target: 3,
    unit: 'tasks',
    frequency: KpiFrequency.WEEKLY,
    weight: 15,
    sortOrder: 3,
  },
  {
    code: 'WEEKLY_PRACTICE_HOURS',
    name: 'Weekly Practice Hours',
    description: 'Focused practice time. Default target follows the student intake hours.',
    category: KpiCategory.PRACTICE,
    target: 6,
    unit: 'hours',
    frequency: KpiFrequency.WEEKLY,
    weight: 15,
    sortOrder: 4,
  },
  {
    code: 'PROJECT_COMPLETION',
    name: 'Project Completion',
    description: 'Share of the current roadmap that is finished this month.',
    category: KpiCategory.PROJECTS,
    target: 100,
    unit: '%',
    frequency: KpiFrequency.MONTHLY,
    weight: 15,
    sortOrder: 5,
  },
  {
    code: 'PROBLEM_SOLVING',
    name: 'Problem Solving',
    description: 'Problem-solving skill score from assessment, tracked against a weekly target.',
    category: KpiCategory.PROBLEM_SOLVING,
    target: 70,
    unit: 'score',
    frequency: KpiFrequency.WEEKLY,
    weight: 15,
    sortOrder: 6,
  },
  {
    code: 'INDEPENDENCE',
    name: 'Independence',
    description: 'Independence skill score, tracked as a monthly growth target.',
    category: KpiCategory.INDEPENDENCE,
    target: 70,
    unit: 'score',
    frequency: KpiFrequency.MONTHLY,
    weight: 10,
    sortOrder: 7,
  },
];

export const SYSTEM_KPI_CODES = ['PROJECT_COMPLETION', 'PROBLEM_SOLVING', 'INDEPENDENCE'] as const;
