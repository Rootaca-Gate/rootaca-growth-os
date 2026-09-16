import { AssessmentCategoryCode, OrientationStage } from '@prisma/client';

export const TARGET_DURATION_MS = 20 * 60 * 1000;

export const CATEGORY_WEIGHTS: Record<AssessmentCategoryCode, number> = {
  PROGRAMMING_FUNDAMENTALS: 25,
  PROBLEM_SOLVING: 30,
  TECHNICAL_KNOWLEDGE: 15,
  PRACTICAL_SKILLS: 20,
  COMMUNICATION_LEARNING: 10,
};

export const CATEGORY_NAMES: Record<AssessmentCategoryCode, string> = {
  PROGRAMMING_FUNDAMENTALS: 'Programming Fundamentals',
  PROBLEM_SOLVING: 'Problem Solving',
  TECHNICAL_KNOWLEDGE: 'Technical Knowledge',
  PRACTICAL_SKILLS: 'Practical Skills',
  COMMUNICATION_LEARNING: 'Communication & Learning',
};

export const STAGE_WINDOWS: Record<
  OrientationStage,
  { label: string; startMin: number; endMin: number; sortOrder: number }
> = {
  STUDENT_PROFILE: { label: 'Student Profile', startMin: 0, endMin: 3, sortOrder: 1 },
  TECHNICAL_CHECK: { label: 'Technical Check', startMin: 3, endMin: 8, sortOrder: 2 },
  PROBLEM_SOLVING: { label: 'Problem Solving', startMin: 8, endMin: 13, sortOrder: 3 },
  INTEREST_PATH: { label: 'Interest & Path Discovery', startMin: 13, endMin: 17, sortOrder: 4 },
  SUMMARY: { label: 'Summary', startMin: 17, endMin: 20, sortOrder: 5 },
};

export const ORIENTATION_STAGES: OrientationStage[] = [
  'STUDENT_PROFILE',
  'TECHNICAL_CHECK',
  'PROBLEM_SOLVING',
  'INTEREST_PATH',
  'SUMMARY',
];
