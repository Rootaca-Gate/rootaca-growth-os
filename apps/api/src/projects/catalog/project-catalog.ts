import { LevelCode, PathCode, ProjectPurpose } from '@prisma/client';

export type ProjectCatalogItem = {
  code: string;
  name: string;
  description: string;
  learningGoal: string;
  purpose: ProjectPurpose;
  path: PathCode;
  level: LevelCode;
  durationDays: number;
  sortOrder: number;
};

export const PROJECT_CATALOG: ProjectCatalogItem[] = [
  {
    code: 'FIRST_WEB_PAGE',
    name: 'First Web Page Studio',
    description:
      'A classroom web practice: HTML, CSS, and one interactive bit. Built for mentor review in a learning studio.',
    learningGoal: 'Ship a personal practice page a classmate can open without the student present.',
    purpose: ProjectPurpose.EDUCATIONAL,
    path: PathCode.WEB,
    level: LevelCode.EXPLORER,
    durationDays: 38,
    sortOrder: 1,
  },
  {
    code: 'MOBILE_PRACTICE_SCREEN',
    name: 'Mobile Practice Screen',
    description:
      'Design and build one mobile learning screen. This is a studio exercise for explaining layout and taps.',
    learningGoal:
      'Show a single screen that updates when the student taps, then explain the layout choices.',
    purpose: ProjectPurpose.EDUCATIONAL,
    path: PathCode.MOBILE,
    level: LevelCode.BEGINNER,
    durationDays: 38,
    sortOrder: 2,
  },
  {
    code: 'DATA_STORY_NOTEBOOK',
    name: 'Data Story Notebook',
    description:
      'An educational notebook that charts a small public dataset. The output is a learning story for class.',
    learningGoal:
      'Load data, make one chart, and write three sentences about what the numbers show.',
    purpose: ProjectPurpose.EDUCATIONAL,
    path: PathCode.DATA,
    level: LevelCode.FOUNDATION,
    durationDays: 38,
    sortOrder: 3,
  },
  {
    code: 'SCRATCH_ARCADE_LAB',
    name: 'Scratch Arcade Lab',
    description:
      'A short arcade-style game for class practice. Fun for peers to try during a mentor demo.',
    learningGoal:
      'Finish a playable loop with start, play, and a simple score the student can demo.',
    purpose: ProjectPurpose.EDUCATIONAL,
    path: PathCode.GAME,
    level: LevelCode.EXPLORER,
    durationDays: 38,
    sortOrder: 4,
  },
  {
    code: 'LEARNING_LOG_SITE',
    name: 'Learning Log Site',
    description:
      'A student-owned log of skills practiced this term. It is a growth artifact for mentors and the student.',
    learningGoal:
      'Publish three dated entries and one screenshot of a skill the student can now explain.',
    purpose: ProjectPurpose.EDUCATIONAL,
    path: PathCode.GENERAL,
    level: LevelCode.BEGINNER,
    durationDays: 38,
    sortOrder: 5,
  },
];
