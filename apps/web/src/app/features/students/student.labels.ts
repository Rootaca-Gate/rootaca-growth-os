import {
  EnglishLevel,
  LearningPath,
  ProgrammingExperience,
  StudentLevel,
  StudentStatus,
} from './student.models';

export const STUDENT_STATUSES: StudentStatus[] = [
  'INTAKE',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'WITHDRAWN',
];

export const STUDENT_LEVELS: StudentLevel[] = ['FOUNDATION', 'JUNIOR', 'INTERMEDIATE', 'ADVANCED'];

export const LEARNING_PATHS: LearningPath[] = ['WEB', 'MOBILE', 'DATA', 'GAME', 'GENERAL'];

export const ENGLISH_LEVELS: EnglishLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'FLUENT'];

export const PROGRAMMING_EXPERIENCE: ProgrammingExperience[] = [
  'NONE',
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
];

export const LANGUAGE_OPTIONS = [
  'Scratch',
  'Python',
  'JavaScript',
  'HTML/CSS',
  'Java',
  'C++',
  'C#',
  'SQL',
  'Dart',
  'Lua',
];

export const INTEREST_OPTIONS = [
  'Web',
  'Mobile',
  'Games',
  'AI',
  'Robotics',
  'Design',
  'Data',
  'Competitive programming',
];

export const STATUS_LABELS: Record<StudentStatus, string> = {
  INTAKE: 'Intake',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  WITHDRAWN: 'Withdrawn',
};

export const LEVEL_LABELS: Record<StudentLevel, string> = {
  FOUNDATION: 'Foundation',
  JUNIOR: 'Junior',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const PATH_LABELS: Record<LearningPath, string> = {
  WEB: 'Web',
  MOBILE: 'Mobile',
  DATA: 'Data',
  GAME: 'Game',
  GENERAL: 'General',
};

export const ENGLISH_LABELS: Record<EnglishLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  FLUENT: 'Fluent',
};

export const EXPERIENCE_LABELS: Record<ProgrammingExperience, string> = {
  NONE: 'None',
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const STUDENT_SORT_FIELDS = [
  'createdAt',
  'fullName',
  'status',
  'schoolGrade',
  'availableHoursPerWeek',
  'dateOfBirth',
  'level',
  'path',
] as const;

export type StudentSortField = (typeof STUDENT_SORT_FIELDS)[number];

export const SORT_FIELD_LABELS: Record<StudentSortField, string> = {
  createdAt: 'Newest',
  fullName: 'Name',
  status: 'Status',
  schoolGrade: 'Grade',
  availableHoursPerWeek: 'Hours / week',
  dateOfBirth: 'Date of birth',
  level: 'Level',
  path: 'Path',
};
