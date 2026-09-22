import { AssessmentCategoryCode, QuestionType } from '@prisma/client';
import { CATEGORY_NAMES, CATEGORY_WEIGHTS } from '../orientation.constants';
import { buildAssessmentSummary } from './summary';

export type ScoreableQuestion = {
  id: string;
  categoryCode: AssessmentCategoryCode;
  type: QuestionType;
  skillKey: string | null;
  scored: boolean;
  maxScore: number;
  scaleMax: number;
};

export type ScoreableOption = {
  id: string;
  questionId: string;
  scoreValue: number;
};

export type ScoreableAnswer = {
  questionId: string;
  optionId?: string | null;
  numericValue?: number | null;
  textValue?: string | null;
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

export type AssessmentComputation = {
  overallScore: number;
  categoryScores: CategoryScore[];
  skillScores: SkillScore[];
  summary: string;
  questionScores: Record<string, number | null>;
};

export function roundScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clampScore(value: number): number {
  return roundScore(Math.min(100, Math.max(0, value)));
}

export function scoreQuestion(
  question: ScoreableQuestion,
  answer: ScoreableAnswer | undefined,
  option: ScoreableOption | undefined,
  missingAsZero: boolean,
): number | null {
  if (!question.scored) {
    return null;
  }

  const missing = () => (missingAsZero ? 0 : null);

  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE: {
      if (!answer?.optionId || !option) {
        return missing();
      }
      return clampScore(option.scoreValue);
    }
    case QuestionType.RATING: {
      if (answer?.numericValue === null || answer?.numericValue === undefined) {
        return missing();
      }
      const scale = question.scaleMax > 0 ? question.scaleMax : 5;
      return clampScore((answer.numericValue / scale) * 100);
    }
    case QuestionType.MENTOR_EVALUATION:
    case QuestionType.PRACTICAL_EVALUATION: {
      if (answer?.numericValue === null || answer?.numericValue === undefined) {
        return missing();
      }
      const max = question.maxScore > 0 ? question.maxScore : 10;
      return clampScore((answer.numericValue / max) * 100);
    }
    case QuestionType.FREE_TEXT: {
      if (answer?.numericValue === null || answer?.numericValue === undefined) {
        return missing();
      }
      const max = question.maxScore > 0 ? question.maxScore : 100;
      return clampScore((answer.numericValue / max) * 100);
    }
    default:
      return missing();
  }
}

export function computeAssessment(input: {
  questions: ScoreableQuestion[];
  answers: ScoreableAnswer[];
  options: ScoreableOption[];
  missingAsZero: boolean;
}): AssessmentComputation {
  const answersByQuestion = new Map(input.answers.map((answer) => [answer.questionId, answer]));
  const optionsById = new Map(input.options.map((option) => [option.id, option]));
  const questionScores: Record<string, number | null> = {};

  for (const question of input.questions) {
    const answer = answersByQuestion.get(question.id);
    const option = answer?.optionId ? optionsById.get(answer.optionId) : undefined;
    questionScores[question.id] = scoreQuestion(question, answer, option, input.missingAsZero);
  }

  const categoryScores = (Object.keys(CATEGORY_WEIGHTS) as AssessmentCategoryCode[]).map((code) => {
    const scored = input.questions.filter(
      (question) => question.categoryCode === code && question.scored,
    );
    const values = scored
      .map((question) => questionScores[question.id])
      .filter((value): value is number => value !== null);
    const score =
      scored.length === 0
        ? 0
        : input.missingAsZero
          ? roundScore(
              scored.reduce((sum, question) => sum + (questionScores[question.id] ?? 0), 0) /
                scored.length,
            )
          : values.length === 0
            ? 0
            : roundScore(values.reduce((sum, value) => sum + value, 0) / values.length);

    return {
      code,
      name: CATEGORY_NAMES[code],
      weightPercent: CATEGORY_WEIGHTS[code],
      score,
    };
  });

  const overallScore = roundScore(
    categoryScores.reduce(
      (sum, category) => sum + (category.score * category.weightPercent) / 100,
      0,
    ),
  );

  const skillKeys = [
    ...new Set(
      input.questions
        .filter((question) => question.scored && question.skillKey)
        .map((question) => question.skillKey as string),
    ),
  ].sort();

  const skillScores = skillKeys.map((key) => {
    const questions = input.questions.filter(
      (question) => question.scored && question.skillKey === key,
    );
    const values = questions
      .map((question) => questionScores[question.id])
      .filter((value): value is number => value !== null);
    const score = input.missingAsZero
      ? roundScore(
          questions.reduce((sum, question) => sum + (questionScores[question.id] ?? 0), 0) /
            questions.length,
        )
      : values.length === 0
        ? 0
        : roundScore(values.reduce((sum, value) => sum + value, 0) / values.length);

    return { key, score };
  });

  return {
    overallScore,
    categoryScores,
    skillScores,
    summary: buildAssessmentSummary(overallScore, categoryScores),
    questionScores,
  };
}
