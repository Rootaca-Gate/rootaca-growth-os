import { Placement } from '../placement/placement.models';

export type OrientationSessionStatus = 'DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
export type OrientationStage =
  'STUDENT_PROFILE' | 'TECHNICAL_CHECK' | 'PROBLEM_SOLVING' | 'INTEREST_PATH' | 'SUMMARY';
export type QuestionType =
  'MULTIPLE_CHOICE' | 'RATING' | 'MENTOR_EVALUATION' | 'PRACTICAL_EVALUATION' | 'FREE_TEXT';
export type AssessmentCategoryCode =
  | 'PROGRAMMING_FUNDAMENTALS'
  | 'PROBLEM_SOLVING'
  | 'TECHNICAL_KNOWLEDGE'
  | 'PRACTICAL_SKILLS'
  | 'COMMUNICATION_LEARNING';

export type AssessmentOption = {
  id: string;
  label: string;
  scoreValue: number;
  sortOrder: number;
};

export type AssessmentQuestion = {
  id: string;
  categoryCode: AssessmentCategoryCode;
  categoryName: string;
  stage: OrientationStage;
  type: QuestionType;
  prompt: string;
  helperText?: string | null;
  skillKey?: string | null;
  scored: boolean;
  maxScore: number;
  scaleMax: number;
  sortOrder: number;
  options: AssessmentOption[];
};

export type AssessmentAnswer = {
  questionId: string;
  optionId?: string | null;
  numericValue?: number | null;
  textValue?: string | null;
  score?: number | null;
};

export type CategoryScore = {
  code: AssessmentCategoryCode;
  name: string;
  weightPercent: number;
  score: number;
};

export type SkillScore = {
  key: string;
  score: number;
};

export type AssessmentResult = {
  id: string;
  sessionId: string;
  overallScore: number;
  categoryScores: CategoryScore[];
  skillScores: SkillScore[];
  summary: string;
  completedAt: string;
  placement?: Placement | null;
};

export type OrientationSession = {
  id: string;
  studentId: string;
  studentName: string;
  createdById: string;
  status: OrientationSessionStatus;
  currentStage: OrientationStage;
  notes: string;
  elapsedMs: number;
  targetDurationMs: number;
  remainingMs: number;
  overtime: boolean;
  running: boolean;
  startedAt?: string | null;
  pausedAt?: string | null;
  completedAt?: string | null;
  lastResumedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  questions: AssessmentQuestion[];
  answers: AssessmentAnswer[];
  result?: AssessmentResult | null;
};

export type OrientationSessionSummary = {
  id: string;
  studentId: string;
  status: OrientationSessionStatus;
  currentStage: OrientationStage;
  elapsedMs: number;
  targetDurationMs: number;
  remainingMs: number;
  overtime: boolean;
  running: boolean;
  createdAt: string;
  completedAt?: string | null;
  overallScore?: number | null;
};

export type AnswerPayload = {
  questionId: string;
  optionId?: string;
  numericValue?: number;
  textValue?: string;
};
