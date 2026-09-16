import { OrientationStage, OrientationSessionStatus, QuestionType } from './orientation.models';

export const ORIENTATION_STAGES: OrientationStage[] = [
  'STUDENT_PROFILE',
  'TECHNICAL_CHECK',
  'PROBLEM_SOLVING',
  'INTEREST_PATH',
  'SUMMARY',
];

export const STAGE_META: Record<
  OrientationStage,
  { label: string; window: string; sortOrder: number }
> = {
  STUDENT_PROFILE: { label: 'Student Profile', window: '00–03', sortOrder: 1 },
  TECHNICAL_CHECK: { label: 'Technical Check', window: '03–08', sortOrder: 2 },
  PROBLEM_SOLVING: { label: 'Problem Solving', window: '08–13', sortOrder: 3 },
  INTEREST_PATH: { label: 'Interest & Path', window: '13–17', sortOrder: 4 },
  SUMMARY: { label: 'Summary', window: '17–20', sortOrder: 5 },
};

export const SESSION_STATUS_LABELS: Record<OrientationSessionStatus, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In progress',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Multiple choice',
  RATING: 'Rating',
  MENTOR_EVALUATION: 'Mentor evaluation',
  PRACTICAL_EVALUATION: 'Practical evaluation',
  FREE_TEXT: 'Notes',
};

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
