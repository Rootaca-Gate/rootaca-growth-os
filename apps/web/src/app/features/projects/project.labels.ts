import {
  LevelCode,
  MilestoneKind,
  MilestoneStatus,
  PathCode,
  StudentProjectStatus,
} from './project.models';

export const PROJECT_PATHS: PathCode[] = ['WEB', 'MOBILE', 'DATA', 'GAME', 'GENERAL'];
export const PROJECT_LEVELS: LevelCode[] = [
  'EXPLORER',
  'BEGINNER',
  'FOUNDATION',
  'INTERMEDIATE',
  'ADVANCED',
];
export const STUDENT_PROJECT_STATUSES: StudentProjectStatus[] = [
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'ON_HOLD',
];
export const MILESTONE_STATUSES: MilestoneStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
];

export const PATH_LABELS: Record<PathCode, string> = {
  WEB: 'Web',
  MOBILE: 'Mobile',
  DATA: 'Data',
  GAME: 'Game',
  GENERAL: 'General',
};

export const LEVEL_LABELS: Record<LevelCode, string> = {
  EXPLORER: 'Explorer',
  BEGINNER: 'Beginner',
  FOUNDATION: 'Foundation',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const STUDENT_PROJECT_STATUS_LABELS: Record<StudentProjectStatus, string> = {
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On hold',
};

export const MILESTONE_KIND_LABELS: Record<MilestoneKind, string> = {
  PLANNING: 'Planning',
  UI_UX: 'UI/UX',
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  DATABASE: 'Database',
  TESTING: 'Testing',
  DEPLOYMENT: 'Deployment',
  PRESENTATION: 'Presentation',
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
};
