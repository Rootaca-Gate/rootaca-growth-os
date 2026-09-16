import { AssessmentCategoryCode, OrientationStage, QuestionType } from '@prisma/client';
import { CATEGORY_NAMES, CATEGORY_WEIGHTS } from '../orientation.constants';

export type CatalogOption = {
  id: string;
  label: string;
  scoreValue: number;
  sortOrder: number;
};

export type CatalogQuestion = {
  id: string;
  categoryCode: AssessmentCategoryCode;
  stage: OrientationStage;
  type: QuestionType;
  prompt: string;
  helperText?: string;
  skillKey: string | null;
  scored: boolean;
  maxScore: number;
  scaleMax: number;
  sortOrder: number;
  options: CatalogOption[];
};

export type CatalogCategory = {
  id: string;
  code: AssessmentCategoryCode;
  name: string;
  weightPercent: number;
  sortOrder: number;
};

const cat = (n: number) => `c0000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const q = (n: number) => `a0000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const o = (question: number, option: number) =>
  `b0000000-0000-4000-8000-${(question * 100 + option).toString().padStart(12, '0')}`;

export const CATALOG_CATEGORIES: CatalogCategory[] = (
  Object.keys(CATEGORY_WEIGHTS) as AssessmentCategoryCode[]
).map((code, index) => ({
  id: cat(index + 1),
  code,
  name: CATEGORY_NAMES[code],
  weightPercent: CATEGORY_WEIGHTS[code],
  sortOrder: index + 1,
}));

function mc(
  id: number,
  categoryCode: AssessmentCategoryCode,
  stage: OrientationStage,
  prompt: string,
  skillKey: string,
  options: Array<[string, number]>,
  helperText?: string,
): CatalogQuestion {
  return {
    id: q(id),
    categoryCode,
    stage,
    type: QuestionType.MULTIPLE_CHOICE,
    prompt,
    helperText,
    skillKey,
    scored: true,
    maxScore: 100,
    scaleMax: 5,
    sortOrder: id,
    options: options.map(([label, scoreValue], index) => ({
      id: o(id, index + 1),
      label,
      scoreValue,
      sortOrder: index + 1,
    })),
  };
}

function rating(
  id: number,
  categoryCode: AssessmentCategoryCode,
  stage: OrientationStage,
  prompt: string,
  skillKey: string,
  helperText?: string,
): CatalogQuestion {
  return {
    id: q(id),
    categoryCode,
    stage,
    type: QuestionType.RATING,
    prompt,
    helperText: helperText ?? 'Rate from 1 (low) to 5 (high).',
    skillKey,
    scored: true,
    maxScore: 5,
    scaleMax: 5,
    sortOrder: id,
    options: [],
  };
}

function numeric(
  id: number,
  type: Extract<QuestionType, 'MENTOR_EVALUATION' | 'PRACTICAL_EVALUATION'>,
  categoryCode: AssessmentCategoryCode,
  stage: OrientationStage,
  prompt: string,
  skillKey: string,
  helperText?: string,
): CatalogQuestion {
  return {
    id: q(id),
    categoryCode,
    stage,
    type,
    prompt,
    helperText: helperText ?? 'Score from 0 to 10.',
    skillKey,
    scored: true,
    maxScore: 10,
    scaleMax: 10,
    sortOrder: id,
    options: [],
  };
}

function freeText(
  id: number,
  categoryCode: AssessmentCategoryCode,
  stage: OrientationStage,
  prompt: string,
  skillKey: string | null,
  helperText?: string,
): CatalogQuestion {
  return {
    id: q(id),
    categoryCode,
    stage,
    type: QuestionType.FREE_TEXT,
    prompt,
    helperText,
    skillKey,
    scored: false,
    maxScore: 100,
    scaleMax: 5,
    sortOrder: id,
    options: [],
  };
}

export const CATALOG_QUESTIONS: CatalogQuestion[] = [
  freeText(
    1,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'Why does this student want to join ROOTACA?',
    'motivation',
    'Capture their own words. This note is qualitative and is not scored.',
  ),
  rating(
    2,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'How clearly can the student introduce themselves and their goal?',
    'communication',
  ),
  mc(
    3,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'How does the student prefer to learn new skills?',
    'learning-style',
    [
      ['Mostly watching videos, little practice', 25],
      ['Copying examples with some questions', 50],
      ['Trying small exercises and asking for help', 80],
      ['Building, reflecting, and explaining what they learned', 100],
    ],
  ),
  freeText(
    4,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'Confirm weekly hours, school load, and any constraints.',
    null,
    'Unscored profile note for the mentor.',
  ),
  mc(
    5,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'What is a variable?',
    'variables',
    [
      ['A picture on the screen', 0],
      ['A named place that stores a value', 100],
      ['A type of loop', 20],
      ['The name of a file', 10],
    ],
  ),
  mc(
    6,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'What does a loop do?',
    'control-flow',
    [
      ['Runs a set of steps again while a condition is true', 100],
      ['Deletes a file', 0],
      ['Changes the screen color once', 15],
      ['Stops the program immediately', 10],
    ],
  ),
  mc(
    7,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'A student wants a sprite to move when a key is pressed. What is the best first step?',
    'computational-thinking',
    [
      ['Guess random blocks until something works', 20],
      ['Write the full game before testing', 30],
      ['Break the behavior into detect input, then change position', 100],
      ['Change the background image', 10],
    ],
  ),
  mc(
    8,
    AssessmentCategoryCode.TECHNICAL_KNOWLEDGE,
    OrientationStage.TECHNICAL_CHECK,
    'What is the main difference between HTML and JavaScript in a web page?',
    'web-basics',
    [
      ['HTML styles colors; JavaScript stores files', 20],
      ['HTML describes structure; JavaScript adds behavior', 100],
      ['They are two names for the same language', 0],
      ['JavaScript only works on phones', 15],
    ],
  ),
  numeric(
    9,
    QuestionType.MENTOR_EVALUATION,
    AssessmentCategoryCode.TECHNICAL_KNOWLEDGE,
    OrientationStage.TECHNICAL_CHECK,
    'Mentor score for technical conversation (vocabulary, tools, and prior work).',
    'technical-interview',
  ),
  mc(
    10,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'The program runs but the score never increases. What should the student do first?',
    'debugging',
    [
      ['Delete the project and start over', 10],
      ['Check where the score is stored and when it should change', 100],
      ['Add more sprites', 15],
      ['Change the language setting', 5],
    ],
  ),
  mc(
    11,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'How should a student plan a “collect 10 coins to win” game?',
    'decomposition',
    [
      ['Draw the win screen only', 15],
      ['List coins, collision, counter, and win condition as separate steps', 100],
      ['Write one giant script with no tests', 30],
      ['Ask the mentor to build it', 10],
    ],
  ),
  numeric(
    12,
    QuestionType.PRACTICAL_EVALUATION,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'Live puzzle: student explains or sketches a solution to a short logic task.',
    'applied-reasoning',
    '0 = no attempt, 10 = clear, testable plan.',
  ),
  rating(
    13,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'When stuck, how persistently does the student try another approach?',
    'resilience',
  ),
  mc(
    14,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'Which path is the student most curious about right now?',
    'path-fit',
    [
      ['Not sure yet / general exploration', 40],
      ['Web', 100],
      ['Mobile', 100],
      ['Data', 100],
      ['Games', 100],
    ],
    'Used for discovery. Partial credit for a clear preference.',
  ),
  numeric(
    15,
    QuestionType.PRACTICAL_EVALUATION,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'Hands-on mini task in the student’s area of interest.',
    'hands-on',
    'Observe setup, attempt, and whether they can describe what they did.',
  ),
  mc(
    16,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'Which statement best matches the student’s tool experience?',
    'tools',
    [
      ['Has never used a programming tool', 20],
      ['Has opened Scratch, a browser, or a block editor', 60],
      ['Has completed a small project in any language', 85],
      ['Can start a project and make a visible change without help', 100],
    ],
  ),
  rating(
    17,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'How excited is the student to build a real project this term?',
    'maker-mindset',
  ),
  freeText(
    18,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'Dream first project in their own words.',
    'project-idea',
    'Unscored. Use this in the session notes and later roadmap work.',
  ),
  numeric(
    19,
    QuestionType.MENTOR_EVALUATION,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.SUMMARY,
    'Mentor score for listening, questions, and collaboration during the session.',
    'collaboration',
  ),
  numeric(
    20,
    QuestionType.PRACTICAL_EVALUATION,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.SUMMARY,
    'Can the student explain what they tried in the last 20 minutes?',
    'explanation',
  ),
  freeText(
    21,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.SUMMARY,
    'Mentor wrap-up notes (strengths, support needs, family context).',
    null,
    'Unscored qualitative record. Level assignment is not applied in this phase.',
  ),
];

export const CATALOG_CATEGORY_BY_CODE = Object.fromEntries(
  CATALOG_CATEGORIES.map((item) => [item.code, item]),
) as Record<AssessmentCategoryCode, CatalogCategory>;

export function catalogQuestionById(id: string): CatalogQuestion | undefined {
  return CATALOG_QUESTIONS.find((question) => question.id === id);
}
