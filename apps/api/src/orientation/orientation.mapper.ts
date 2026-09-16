import {
  AssessmentAnswer,
  AssessmentCategory,
  AssessmentOption,
  AssessmentQuestion,
  AssessmentResult,
  OrientationSession,
  OrientationSessionStatus,
  Prisma,
  Student,
} from '@prisma/client';
import { TARGET_DURATION_MS } from './orientation.constants';
import {
  AssessmentAnswerResponseDto,
  AssessmentQuestionResponseDto,
  AssessmentResultResponseDto,
  CategoryScoreDto,
  OrientationSessionResponseDto,
  OrientationSessionSummaryDto,
  SkillScoreDto,
} from './dto/session-response.dto';
import { CategoryScore, SkillScore } from './scoring/score-engine';

export type QuestionWithCategory = AssessmentQuestion & {
  category: AssessmentCategory;
  options: AssessmentOption[];
};

export type SessionRecord = OrientationSession & {
  student: Student;
  answers: AssessmentAnswer[];
  result: AssessmentResult | null;
};

export function currentElapsedMs(
  session: Pick<OrientationSession, 'elapsedMs' | 'status' | 'lastResumedAt'>,
  now = new Date(),
): number {
  if (session.status === OrientationSessionStatus.IN_PROGRESS && session.lastResumedAt) {
    return session.elapsedMs + Math.max(0, now.getTime() - session.lastResumedAt.getTime());
  }

  return session.elapsedMs;
}

export function toTimerFields(session: OrientationSession, now = new Date()) {
  const elapsedMs = currentElapsedMs(session, now);
  const remainingMs = Math.max(0, TARGET_DURATION_MS - elapsedMs);

  return {
    elapsedMs,
    targetDurationMs: TARGET_DURATION_MS,
    remainingMs,
    overtime: elapsedMs > TARGET_DURATION_MS,
    running: session.status === OrientationSessionStatus.IN_PROGRESS,
  };
}

export function toQuestionResponse(question: QuestionWithCategory): AssessmentQuestionResponseDto {
  return {
    id: question.id,
    categoryCode: question.category.code,
    categoryName: question.category.name,
    stage: question.stage,
    type: question.type,
    prompt: question.prompt,
    helperText: question.helperText,
    skillKey: question.skillKey,
    scored: question.scored,
    maxScore: question.maxScore,
    scaleMax: question.scaleMax,
    sortOrder: question.sortOrder,
    options: [...question.options]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((option) => ({
        id: option.id,
        label: option.label,
        scoreValue: option.scoreValue,
        sortOrder: option.sortOrder,
      })),
  };
}

export function toAnswerResponse(answer: AssessmentAnswer): AssessmentAnswerResponseDto {
  return {
    questionId: answer.questionId,
    optionId: answer.optionId,
    numericValue: answer.numericValue,
    textValue: answer.textValue,
    score: answer.score,
  };
}

export function toResultResponse(result: AssessmentResult): AssessmentResultResponseDto {
  return {
    id: result.id,
    sessionId: result.sessionId,
    overallScore: result.overallScore,
    categoryScores: result.categoryScores as unknown as CategoryScoreDto[],
    skillScores: result.skillScores as unknown as SkillScoreDto[],
    summary: result.summary,
    completedAt: result.completedAt.toISOString(),
  };
}

export function toSessionResponse(
  session: SessionRecord,
  questions: QuestionWithCategory[],
  now = new Date(),
): OrientationSessionResponseDto {
  return {
    id: session.id,
    studentId: session.studentId,
    studentName: session.student.fullName,
    createdById: session.createdById,
    status: session.status,
    currentStage: session.currentStage,
    notes: session.notes,
    ...toTimerFields(session, now),
    startedAt: session.startedAt?.toISOString() ?? null,
    pausedAt: session.pausedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    lastResumedAt: session.lastResumedAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    questions: [...questions]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map(toQuestionResponse),
    answers: session.answers.map(toAnswerResponse),
    result: session.result ? toResultResponse(session.result) : null,
  };
}

export function toSessionSummary(
  session: OrientationSession & { result: AssessmentResult | null },
  now = new Date(),
): OrientationSessionSummaryDto {
  return {
    id: session.id,
    studentId: session.studentId,
    status: session.status,
    currentStage: session.currentStage,
    ...toTimerFields(session, now),
    createdAt: session.createdAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    overallScore: session.result?.overallScore ?? null,
  };
}

export function toJsonValue(value: CategoryScore[] | SkillScore[]): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
