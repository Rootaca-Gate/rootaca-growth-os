import { AssessmentCategoryCode, QuestionType } from '@prisma/client';
import { CATEGORY_WEIGHTS } from '../orientation.constants';
import { CATALOG_CATEGORIES, CATALOG_QUESTIONS } from '../catalog/assessment-catalog';
import {
  computeAssessment,
  roundScore,
  ScoreableAnswer,
  ScoreableOption,
  ScoreableQuestion,
} from './score-engine';

function q(
  id: string,
  categoryCode: AssessmentCategoryCode,
  type: QuestionType,
  extras: Partial<ScoreableQuestion> = {},
): ScoreableQuestion {
  return {
    id,
    categoryCode,
    type,
    skillKey: extras.skillKey ?? id,
    scored: extras.scored ?? true,
    maxScore: extras.maxScore ?? 10,
    scaleMax: extras.scaleMax ?? 5,
  };
}

function option(id: string, questionId: string, scoreValue: number): ScoreableOption {
  return { id, questionId, scoreValue };
}

describe('score engine', () => {
  const questions: ScoreableQuestion[] = [
    q('pf', AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS, QuestionType.MULTIPLE_CHOICE, {
      skillKey: 'variables',
    }),
    q('ps', AssessmentCategoryCode.PROBLEM_SOLVING, QuestionType.MULTIPLE_CHOICE, {
      skillKey: 'debugging',
    }),
    q('tk', AssessmentCategoryCode.TECHNICAL_KNOWLEDGE, QuestionType.MULTIPLE_CHOICE, {
      skillKey: 'web-basics',
    }),
    q('pr', AssessmentCategoryCode.PRACTICAL_SKILLS, QuestionType.PRACTICAL_EVALUATION, {
      skillKey: 'hands-on',
      maxScore: 10,
    }),
    q('cm', AssessmentCategoryCode.COMMUNICATION_LEARNING, QuestionType.RATING, {
      skillKey: 'communication',
      scaleMax: 5,
    }),
    q('notes', AssessmentCategoryCode.COMMUNICATION_LEARNING, QuestionType.FREE_TEXT, {
      scored: false,
      skillKey: 'motivation',
    }),
  ];

  const options: ScoreableOption[] = [
    option('pf-100', 'pf', 100),
    option('pf-80', 'pf', 80),
    option('pf-0', 'pf', 0),
    option('ps-100', 'ps', 100),
    option('ps-60', 'ps', 60),
    option('ps-0', 'ps', 0),
    option('tk-100', 'tk', 100),
    option('tk-40', 'tk', 40),
    option('tk-0', 'tk', 0),
  ];

  function answersFor(scores: {
    pf: number;
    ps: number;
    tk: number;
    pr: number;
    cm: number;
  }): ScoreableAnswer[] {
    return [
      { questionId: 'pf', optionId: `pf-${scores.pf}` },
      { questionId: 'ps', optionId: `ps-${scores.ps}` },
      { questionId: 'tk', optionId: `tk-${scores.tk}` },
      { questionId: 'pr', numericValue: scores.pr / 10 },
      { questionId: 'cm', numericValue: scores.cm / 20 },
    ];
  }

  it('uses the required category weights', () => {
    expect(CATEGORY_WEIGHTS).toEqual({
      PROGRAMMING_FUNDAMENTALS: 25,
      PROBLEM_SOLVING: 30,
      TECHNICAL_KNOWLEDGE: 15,
      PRACTICAL_SKILLS: 20,
      COMMUNICATION_LEARNING: 10,
    });
    expect(Object.values(CATEGORY_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it('scores a perfect attempt as 100 overall', () => {
    const result = computeAssessment({
      questions,
      options,
      answers: answersFor({ pf: 100, ps: 100, tk: 100, pr: 100, cm: 100 }),
      missingAsZero: true,
    });

    expect(result.overallScore).toBe(100);
    for (const category of result.categoryScores) {
      expect(category.score).toBe(100);
    }
  });

  it('scores an all-zero attempt as 0 overall', () => {
    const result = computeAssessment({
      questions,
      options,
      answers: answersFor({ pf: 0, ps: 0, tk: 0, pr: 0, cm: 0 }),
      missingAsZero: true,
    });

    expect(result.overallScore).toBe(0);
  });

  it.each([
    ['PROGRAMMING_FUNDAMENTALS', 25, { pf: 100, ps: 0, tk: 0, pr: 0, cm: 0 }],
    ['PROBLEM_SOLVING', 30, { pf: 0, ps: 100, tk: 0, pr: 0, cm: 0 }],
    ['TECHNICAL_KNOWLEDGE', 15, { pf: 0, ps: 0, tk: 100, pr: 0, cm: 0 }],
    ['PRACTICAL_SKILLS', 20, { pf: 0, ps: 0, tk: 0, pr: 100, cm: 0 }],
    ['COMMUNICATION_LEARNING', 10, { pf: 0, ps: 0, tk: 0, pr: 0, cm: 100 }],
  ] as const)(
    'weights %s at %d%% when it is the only perfect category',
    (code, expected, scores) => {
      const result = computeAssessment({
        questions,
        options,
        answers: answersFor(scores),
        missingAsZero: true,
      });

      const category = result.categoryScores.find((item) => item.code === code);
      expect(category?.score).toBe(100);
      expect(result.overallScore).toBe(expected);
    },
  );

  it('computes a mixed weighted overall score', () => {
    const result = computeAssessment({
      questions,
      options,
      answers: answersFor({ pf: 80, ps: 60, tk: 40, pr: 100, cm: 50 }),
      missingAsZero: true,
    });

    expect(
      result.categoryScores.find((item) => item.code === 'PROGRAMMING_FUNDAMENTALS')?.score,
    ).toBe(80);
    expect(result.categoryScores.find((item) => item.code === 'PROBLEM_SOLVING')?.score).toBe(60);
    expect(result.categoryScores.find((item) => item.code === 'TECHNICAL_KNOWLEDGE')?.score).toBe(
      40,
    );
    expect(result.categoryScores.find((item) => item.code === 'PRACTICAL_SKILLS')?.score).toBe(100);
    expect(
      result.categoryScores.find((item) => item.code === 'COMMUNICATION_LEARNING')?.score,
    ).toBe(50);
    expect(result.overallScore).toBe(69);
  });

  it('treats unanswered scored questions as zero on complete', () => {
    const result = computeAssessment({
      questions,
      options,
      answers: [{ questionId: 'pf', optionId: 'pf-100' }],
      missingAsZero: true,
    });

    expect(
      result.categoryScores.find((item) => item.code === 'PROGRAMMING_FUNDAMENTALS')?.score,
    ).toBe(100);
    expect(result.categoryScores.find((item) => item.code === 'PROBLEM_SOLVING')?.score).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it('ignores unanswered scored questions when previewing', () => {
    const result = computeAssessment({
      questions,
      options,
      answers: [{ questionId: 'pf', optionId: 'pf-100' }],
      missingAsZero: false,
    });

    expect(
      result.categoryScores.find((item) => item.code === 'PROGRAMMING_FUNDAMENTALS')?.score,
    ).toBe(100);
    expect(result.categoryScores.find((item) => item.code === 'PROBLEM_SOLVING')?.score).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it('does not let free-text notes change the numeric score', () => {
    const withoutNotes = computeAssessment({
      questions,
      options,
      answers: answersFor({ pf: 100, ps: 0, tk: 0, pr: 0, cm: 0 }),
      missingAsZero: true,
    });
    const withNotes = computeAssessment({
      questions,
      options,
      answers: [
        ...answersFor({ pf: 100, ps: 0, tk: 0, pr: 0, cm: 0 }),
        { questionId: 'notes', textValue: 'Excellent communicator with a clear goal.' },
      ],
      missingAsZero: true,
    });

    expect(withNotes.overallScore).toBe(withoutNotes.overallScore);
    expect(withNotes.questionScores.notes).toBeNull();
  });

  it('clamps over-max ratings and mentor scores', () => {
    const result = computeAssessment({
      questions: [
        q('rate', AssessmentCategoryCode.COMMUNICATION_LEARNING, QuestionType.RATING, {
          scaleMax: 5,
        }),
        q('mentor', AssessmentCategoryCode.TECHNICAL_KNOWLEDGE, QuestionType.MENTOR_EVALUATION, {
          maxScore: 10,
        }),
      ],
      options: [],
      answers: [
        { questionId: 'rate', numericValue: 50 },
        { questionId: 'mentor', numericValue: 40 },
      ],
      missingAsZero: true,
    });

    expect(
      result.categoryScores.find((item) => item.code === 'COMMUNICATION_LEARNING')?.score,
    ).toBe(100);
    expect(result.categoryScores.find((item) => item.code === 'TECHNICAL_KNOWLEDGE')?.score).toBe(
      100,
    );
  });

  it('averages multiple questions in the same category and skill', () => {
    const result = computeAssessment({
      questions: [
        q('a', AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS, QuestionType.MULTIPLE_CHOICE, {
          skillKey: 'variables',
        }),
        q('b', AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS, QuestionType.MULTIPLE_CHOICE, {
          skillKey: 'variables',
        }),
      ],
      options: [option('a-100', 'a', 100), option('b-40', 'b', 40)],
      answers: [
        { questionId: 'a', optionId: 'a-100' },
        { questionId: 'b', optionId: 'b-40' },
      ],
      missingAsZero: true,
    });

    expect(
      result.categoryScores.find((item) => item.code === 'PROGRAMMING_FUNDAMENTALS')?.score,
    ).toBe(70);
    expect(result.skillScores).toEqual([{ key: 'variables', score: 70 }]);
    expect(result.overallScore).toBe(17.5);
  });

  it('builds a readable summary from strongest and weakest categories', () => {
    const result = computeAssessment({
      questions,
      options,
      answers: answersFor({ pf: 80, ps: 60, tk: 40, pr: 100, cm: 50 }),
      missingAsZero: true,
    });

    expect(result.summary).toContain('69/100');
    expect(result.summary).toContain('Practical Skills (100)');
    expect(result.summary).toContain('Technical Knowledge (40)');
  });

  it('rounds to two decimal places', () => {
    expect(roundScore(17.555)).toBe(17.56);
    expect(roundScore(69)).toBe(69);
  });

  it('keeps the seeded catalog aligned with weights, stages, and question types', () => {
    expect(CATALOG_CATEGORIES.map((item) => item.weightPercent)).toEqual([25, 30, 15, 20, 10]);
    const types = new Set(CATALOG_QUESTIONS.map((item) => item.type));
    expect(types).toEqual(
      new Set<QuestionType>([
        QuestionType.MULTIPLE_CHOICE,
        QuestionType.RATING,
        QuestionType.MENTOR_EVALUATION,
        QuestionType.PRACTICAL_EVALUATION,
        QuestionType.FREE_TEXT,
      ]),
    );
    const stages = new Set(CATALOG_QUESTIONS.map((item) => item.stage));
    expect(stages.size).toBe(5);
    for (const category of CATALOG_CATEGORIES) {
      const scored = CATALOG_QUESTIONS.filter(
        (question) => question.categoryCode === category.code && question.scored,
      );
      expect(scored.length).toBeGreaterThan(0);
    }
  });
});
