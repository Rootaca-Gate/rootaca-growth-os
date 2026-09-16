import { MilestoneKind } from '@prisma/client';

export type MilestoneCatalogItem = {
  kind: MilestoneKind;
  title: string;
  description: string;
  sortOrder: number;
  durationDays: number;
};

export const MILESTONE_CATALOG: MilestoneCatalogItem[] = [
  {
    kind: MilestoneKind.PLANNING,
    title: 'Planning',
    description:
      'Write a classroom plan: who the learner is helping, what will be practiced, and what done looks like.',
    sortOrder: 1,
    durationDays: 3,
  },
  {
    kind: MilestoneKind.UI_UX,
    title: 'UI/UX',
    description:
      'Sketch screens on paper or Figma for the learning exercise. Focus on clarity for a classmate.',
    sortOrder: 2,
    durationDays: 5,
  },
  {
    kind: MilestoneKind.FRONTEND,
    title: 'Frontend',
    description:
      'Build the visible practice interface the student can demonstrate in a mentor session.',
    sortOrder: 3,
    durationDays: 8,
  },
  {
    kind: MilestoneKind.BACKEND,
    title: 'Backend',
    description:
      'Add only the server or logic needed for the learning goal. Keep it small and explainable.',
    sortOrder: 4,
    durationDays: 8,
  },
  {
    kind: MilestoneKind.DATABASE,
    title: 'Database',
    description:
      'Store practice data in a simple schema. Document tables as a student exercise, not a production system.',
    sortOrder: 5,
    durationDays: 5,
  },
  {
    kind: MilestoneKind.TESTING,
    title: 'Testing',
    description:
      'Check the happy path and one failure. Write what was tested so a mentor can replay it.',
    sortOrder: 6,
    durationDays: 4,
  },
  {
    kind: MilestoneKind.DEPLOYMENT,
    title: 'Deployment',
    description:
      'Publish a practice build a classmate can open. This is a sharing step for the studio.',
    sortOrder: 7,
    durationDays: 3,
  },
  {
    kind: MilestoneKind.PRESENTATION,
    title: 'Presentation',
    description:
      'Walk a mentor through what was learned, what blocked the work, and the next skill to grow.',
    sortOrder: 8,
    durationDays: 2,
  },
];

export const MILESTONE_DURATION_TOTAL = MILESTONE_CATALOG.reduce(
  (sum, item) => sum + item.durationDays,
  0,
);
