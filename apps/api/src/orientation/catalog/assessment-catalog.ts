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

type QuestionExtras = {
  sortOrder?: number;
  scored?: boolean;
  maxScore?: number;
  scaleMax?: number;
  helperText?: string;
};

function mc(
  id: number,
  categoryCode: AssessmentCategoryCode,
  stage: OrientationStage,
  prompt: string,
  skillKey: string | null,
  options: Array<[string, number]>,
  extras: QuestionExtras = {},
): CatalogQuestion {
  return {
    id: q(id),
    categoryCode,
    stage,
    type: QuestionType.MULTIPLE_CHOICE,
    prompt,
    helperText: extras.helperText,
    skillKey,
    scored: extras.scored ?? true,
    maxScore: extras.maxScore ?? 100,
    scaleMax: extras.scaleMax ?? 5,
    sortOrder: extras.sortOrder ?? id,
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
  extras: QuestionExtras = {},
): CatalogQuestion {
  return {
    id: q(id),
    categoryCode,
    stage,
    type: QuestionType.RATING,
    prompt,
    helperText: extras.helperText ?? '1 = منخفض · 5 = مرتفع',
    skillKey,
    scored: extras.scored ?? true,
    maxScore: extras.maxScore ?? 5,
    scaleMax: extras.scaleMax ?? 5,
    sortOrder: extras.sortOrder ?? id,
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
  extras: QuestionExtras = {},
): CatalogQuestion {
  return {
    id: q(id),
    categoryCode,
    stage,
    type,
    prompt,
    helperText: extras.helperText ?? 'Score from 0 to 10.',
    skillKey,
    scored: extras.scored ?? true,
    maxScore: extras.maxScore ?? 10,
    scaleMax: extras.scaleMax ?? 10,
    sortOrder: extras.sortOrder ?? id,
    options: [],
  };
}

function freeText(
  id: number,
  categoryCode: AssessmentCategoryCode,
  stage: OrientationStage,
  prompt: string,
  skillKey: string | null,
  extras: QuestionExtras = {},
): CatalogQuestion {
  const scored = extras.scored ?? false;
  return {
    id: q(id),
    categoryCode,
    stage,
    type: QuestionType.FREE_TEXT,
    prompt,
    helperText: extras.helperText,
    skillKey,
    scored,
    maxScore: extras.maxScore ?? (scored ? 2 : 100),
    scaleMax: extras.scaleMax ?? 5,
    sortOrder: extras.sortOrder ?? id,
    options: [],
  };
}

const TECH_SCORE_HELP =
  'سجّل إجابة الطالب، ثم قيّم الفهم: 0 = لا يعرف · 1 = فهم جزئي · 2 = فهم جيد';
const PS_SCORE_HELP =
  'سجّل طريقة تفكير الطالب، ثم قيّم: 0 = لم يستطع البدء · 1 = يحتاج مساعدة · 2 = وصل لفكرة صحيحة · 3 = شرح واضح ومنطقي';

export const CATALOG_QUESTIONS: CatalogQuestion[] = [
  // —— TAB 1 · STUDENT_PROFILE (00–03) ——
  freeText(
    22,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'عرّفني بنفسك في دقيقة.',
    'self-introduction',
    {
      sortOrder: 1,
      helperText: 'مقدمة الطالب بكلماته. Qualitative — غير مسجّلة في الدرجة.',
    },
  ),
  freeText(
    1,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'ليه عايز تتعلم البرمجة؟',
    'motivation',
    {
      sortOrder: 2,
      helperText: 'Capture the student\'s own words. This is qualitative and is not scored.',
    },
  ),
  freeText(
    23,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'إيه الحاجة اللي نفسك تعملها بالبرمجة؟',
    'goal',
    { sortOrder: 3 },
  ),
  freeText(
    24,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'هل جربت البرمجة قبل كده؟ لو آه، عملت إيه؟',
    'previous-experience',
    { sortOrder: 4 },
  ),
  mc(
    3,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'لما تتعلم حاجة جديدة، بتحب تتعلمها إزاي؟',
    'learning-style',
    [
      ['Mostly watching videos, little practice', 25],
      ['Copying examples with some questions', 50],
      ['Trying small exercises and asking for help', 80],
      ['Building, reflecting, and explaining what they learned', 100],
    ],
    { sortOrder: 5 },
  ),
  mc(
    25,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'كام ساعة تقدر تخصصها للبرمجة كل أسبوع؟',
    'weekly-availability',
    [
      ['أقل من ساعتين', 20],
      ['2–4 ساعات', 40],
      ['4–6 ساعات', 60],
      ['6–10 ساعات', 80],
      ['أكثر من 10 ساعات', 100],
    ],
    {
      sortOrder: 6,
      scored: false,
      helperText: 'Number / Select — لتخطيط الحمل الأسبوعي (غير مسجّل كدرجة نجاح).',
    },
  ),
  freeText(
    4,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'هل عندك ضغط دراسة أو امتحانات ممكن يأثر على وقتك؟',
    'constraints',
    {
      sortOrder: 7,
      helperText:
        'Confirm weekly hours, school load, and any constraints. This is an unscored profile note for the mentor.',
    },
  ),
  rating(
    2,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'ما مدى وضوح الطالب عند تقديم نفسه وشرح هدفه؟',
    'communication',
    {
      sortOrder: 8,
      helperText: 'Communication Rating · 1 = منخفض · 5 = مرتفع',
    },
  ),
  freeText(
    26,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.STUDENT_PROFILE,
    'ملاحظات المرشد — ملف الطالب',
    'section-notes-profile',
    { sortOrder: 9, helperText: 'Optional mentor notes for this section.' },
  ),

  // —— TAB 2 · TECHNICAL_CHECK (03–08) ——
  freeText(
    27,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'يعني إيه Programming من وجهة نظرك؟',
    'what-is-programming',
    { sortOrder: 10, scored: true, maxScore: 2, helperText: TECH_SCORE_HELP },
  ),
  freeText(
    28,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'إيه الفرق بين Variable و Value؟\n\nage = 16\n\nما هو الـ Variable وما هي الـ Value؟',
    'variables-open',
    { sortOrder: 11, scored: true, maxScore: 2, helperText: TECH_SCORE_HELP },
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
    { sortOrder: 12 },
  ),
  freeText(
    29,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'Basic Operations\n\nx = 10\ny = 5\n\nما قيمة كل من: x + y · x - y · x * y ؟',
    'basic-operations',
    { sortOrder: 13, scored: true, maxScore: 2, helperText: TECH_SCORE_HELP },
  ),
  freeText(
    30,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'إيه معنى if في البرمجة؟',
    'what-is-if',
    { sortOrder: 14, scored: true, maxScore: 2, helperText: TECH_SCORE_HELP },
  ),
  freeText(
    31,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'Conditional Logic\n\nif grade >= 50\n\nماذا يعني هذا الشرط؟',
    'conditional-logic',
    { sortOrder: 15, scored: true, maxScore: 2, helperText: TECH_SCORE_HELP },
  ),
  freeText(
    32,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'إيه الفرق بين Loop و If؟',
    'loops-vs-conditions',
    { sortOrder: 16, scored: true, maxScore: 2, helperText: TECH_SCORE_HELP },
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
    { sortOrder: 17 },
  ),
  freeText(
    33,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'هل تعرف يعني إيه Function؟ اشرحها بطريقتك.',
    'functions-open',
    { sortOrder: 18, scored: true, maxScore: 2, helperText: TECH_SCORE_HELP },
  ),
  freeText(
    34,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'اكتب أو اشرح طريقة برنامج يسأل المستخدم عن عمره، ولو العمر 18 أو أكثر يطبع Adult وإلا يطبع Minor.',
    'practical-coding-logic',
    {
      sortOrder: 19,
      scored: true,
      maxScore: 2,
      helperText: `${TECH_SCORE_HELP} Accept code or explanation.`,
    },
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
    { sortOrder: 20 },
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
    { sortOrder: 21 },
  ),
  numeric(
    9,
    QuestionType.MENTOR_EVALUATION,
    AssessmentCategoryCode.TECHNICAL_KNOWLEDGE,
    OrientationStage.TECHNICAL_CHECK,
    'Mentor score for technical conversation (vocabulary, tools, and prior work).',
    'technical-interview',
    { sortOrder: 22 },
  ),
  freeText(
    35,
    AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS,
    OrientationStage.TECHNICAL_CHECK,
    'ملاحظات المرشد — الفحص التقني',
    'section-notes-technical',
    { sortOrder: 23, helperText: 'Optional mentor notes for this section.' },
  ),

  // —— TAB 3 · PROBLEM_SOLVING (08–13) ——
  freeText(
    36,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'عندك 3 صناديق:\n• صندوق مكتوب عليه Apples\n• صندوق مكتوب عليه Oranges\n• صندوق مكتوب عليه Apples & Oranges\n\nوكل الـ Labels غلط. مسموح لك تسحب ثمرة واحدة من صندوق واحد فقط. إزاي تعرف محتوى الصناديق الثلاثة؟',
    'boxes-puzzle',
    {
      sortOrder: 30,
      scored: true,
      maxScore: 3,
      helperText: `${PS_SCORE_HELP} Evaluate reasoning, not only the final answer.`,
    },
  ),
  freeText(
    37,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'Pattern Recognition\n\n2, 4, 6, 8, ?\n\nما الرقم التالي؟ ولماذا؟\n\nFollow-up: طيب لو قلتلك إن فيه أكثر من Pattern ممكن، إزاي تتأكد إن الـ Pattern اللي اخترته هو المقصود؟',
    'pattern-recognition',
    { sortOrder: 31, scored: true, maxScore: 3, helperText: PS_SCORE_HELP },
  ),
  freeText(
    38,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'Algorithmic Thinking\n\nعندك قائمة درجات: 40, 70, 55, 30, 90\n\nعايزين نعرف أكبر درجة. من غير ما تكتب Code، اشرحلي خطوة بخطوة هتعمل إيه.',
    'algorithmic-thinking',
    { sortOrder: 32, scored: true, maxScore: 3, helperText: PS_SCORE_HELP },
  ),
  freeText(
    39,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'Debugging\n\nage = 15\n\nif age > 18:\n    print("Adult")\nelse:\n    print("Minor")\n\nهل الكود ده هيشتغل صح لو العمر 18؟ وليه؟\n\nFollow-up: إيه التعديل اللي ممكن نعمله لو 18 يعتبر Adult؟',
    'debugging-open',
    { sortOrder: 33, scored: true, maxScore: 3, helperText: PS_SCORE_HELP },
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
    { sortOrder: 34 },
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
    { sortOrder: 35 },
  ),
  numeric(
    12,
    QuestionType.PRACTICAL_EVALUATION,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'Live puzzle: student explains or sketches a solution to a short logic task.',
    'applied-reasoning',
    {
      sortOrder: 36,
      helperText: '0 = no attempt, 10 = clear, testable plan.',
    },
  ),
  rating(
    13,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'When stuck, how persistently does the student try another approach?',
    'resilience',
    { sortOrder: 37 },
  ),
  freeText(
    40,
    AssessmentCategoryCode.PROBLEM_SOLVING,
    OrientationStage.PROBLEM_SOLVING,
    'ملاحظات المرشد — حل المشكلات',
    'section-notes-problem-solving',
    { sortOrder: 38, helperText: 'Optional mentor notes for this section.' },
  ),

  // —— TAB 4 · INTEREST_PATH (13–17) ——
  mc(
    41,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'لو قلتلك عندك شهر تعمل مشروع، تختار تعمل إيه؟ وليه؟',
    'project-interest',
    [
      ['Website', 100],
      ['Mobile App', 100],
      ['Game', 100],
      ['AI Project', 100],
      ['E-commerce', 100],
      ['Data / Analytics', 100],
      ['UI/UX', 100],
      ['Something else', 40],
    ],
    {
      sortOrder: 40,
      scored: false,
      helperText: 'Multiple Choice + Optional Explanation — اختر النوع ثم اكتب السبب في السؤال التالي.',
    },
  ),
  freeText(
    42,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'ليه اخترت نوع المشروع ده؟ (اختياري)',
    'project-interest-why',
    { sortOrder: 41, helperText: 'Optional explanation for the project interest choice.' },
  ),
  mc(
    43,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'إيه أكتر حاجة بتشدك؟',
    'preferred-area',
    [
      ['بناء مواقع', 100],
      ['تطبيقات الموبايل', 100],
      ['الألعاب', 100],
      ['الذكاء الاصطناعي', 100],
      ['تحليل البيانات', 100],
      ['تصميم واجهات المستخدم', 100],
    ],
    { sortOrder: 42, scored: false },
  ),
  mc(
    44,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'لما تستخدم تطبيق أو لعبة، إيه اللي بتفكر فيه أكتر؟',
    'curiosity',
    [
      ['إزاي اتعمل؟', 100],
      ['إزاي الواجهة اتصممت؟', 100],
      ['إزاي البيانات بتتحرك؟', 100],
      ['إزاي الـ AI بيشتغل؟', 100],
      ['إزاي اللعبة بتشتغل؟', 100],
      ['مش بفكر في التفاصيل دي.', 20],
    ],
    { sortOrder: 43, scored: false },
  ),
  mc(
    45,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'لو المشروع فشل أول مرة، هتعمل إيه؟',
    'growth-mindset',
    [
      ['أسيبه', 10],
      ['أدور على الحل', 70],
      ['أسأل حد', 60],
      ['أجرب أكتر من طريقة', 90],
      ['أراجع اللي عملته وأبدأ أصلح المشكلة', 100],
    ],
    { sortOrder: 44, scored: false },
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
    {
      sortOrder: 45,
      scored: false,
      helperText: 'Used for discovery / recommended learning path — not pass/fail.',
    },
  ),
  numeric(
    15,
    QuestionType.PRACTICAL_EVALUATION,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'Hands-on mini task in the student’s area of interest.',
    'hands-on',
    {
      sortOrder: 46,
      helperText: 'Observe setup, attempt, and whether they can describe what they did.',
    },
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
    { sortOrder: 47 },
  ),
  rating(
    17,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'How excited is the student to build a real project this term?',
    'maker-mindset',
    { sortOrder: 48 },
  ),
  freeText(
    18,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'إيه المشروع اللي لو خلصته هتكون فخور إنك عملته؟',
    'project-idea',
    {
      sortOrder: 49,
      helperText: 'Dream project — unscored. Use later in roadmap work.',
    },
  ),
  freeText(
    46,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.INTEREST_PATH,
    'ملاحظات المرشد — الاهتمام والمسار',
    'section-notes-interest',
    { sortOrder: 50, helperText: 'Optional mentor notes for this section.' },
  ),

  // —— TAB 5 · SUMMARY (17–20) ——
  mc(
    47,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.SUMMARY,
    'Current Level',
    'current-level',
    [
      ['Foundation — لا توجد خبرة برمجية واضحة.', 25],
      ['Junior Beginner — عنده فهم بسيط وبعض التجارب.', 50],
      ['Intermediate — فاهم الأساسيات ويقدر يحل مشاكل بسيطة.', 75],
      ['Advanced — عنده خبرة فعلية ويقدر يبني ويشرح حلول.', 100],
    ],
    {
      sortOrder: 60,
      scored: false,
      helperText: 'Mentor summary — اختر المستوى الحالي للطالب.',
    },
  ),
  freeText(
    48,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.SUMMARY,
    'Strengths',
    'strengths',
    {
      sortOrder: 61,
      helperText:
        'Multi-select (اكتب ما ينطبق): Communication · Logic · Problem Solving · Technical Fundamentals · Creativity · Curiosity · Persistence · Self-learning',
    },
  ),
  freeText(
    49,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.SUMMARY,
    'Areas to Improve',
    'areas-to-improve',
    {
      sortOrder: 62,
      helperText:
        'Multi-select (اكتب ما ينطبق): Programming Fundamentals · Problem Solving · English Technical Terms · Communication · Consistency · Debugging',
    },
  ),
  mc(
    50,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.SUMMARY,
    'Recommended Path — Primary',
    'primary-path',
    [
      ['Fundamentals', 100],
      ['Web Development', 100],
      ['Frontend Development', 100],
      ['Backend Development', 100],
      ['Full Stack Development', 100],
      ['Mobile Development', 100],
      ['Game Development', 100],
      ['AI Engineering', 100],
      ['Data / Analytics', 100],
      ['UI/UX', 100],
    ],
    { sortOrder: 63, scored: false, helperText: 'Primary recommended learning path.' },
  ),
  mc(
    51,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.SUMMARY,
    'Recommended Path — Alternative',
    'alternative-path',
    [
      ['Fundamentals', 100],
      ['Web Development', 100],
      ['Frontend Development', 100],
      ['Backend Development', 100],
      ['Full Stack Development', 100],
      ['Mobile Development', 100],
      ['Game Development', 100],
      ['AI Engineering', 100],
      ['Data / Analytics', 100],
      ['UI/UX', 100],
    ],
    { sortOrder: 64, scored: false, helperText: 'Alternative recommended learning path.' },
  ),
  freeText(
    52,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.SUMMARY,
    'First Project Recommendation',
    'first-project',
    {
      sortOrder: 65,
      helperText:
        'Suggested examples: Student Management System · Personal Portfolio Website · Simple AI Chatbot · E-commerce Website · Booking System · Simple Mobile App · Simple Game',
    },
  ),
  numeric(
    19,
    QuestionType.MENTOR_EVALUATION,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.SUMMARY,
    'Mentor score for listening, questions, and collaboration during the session.',
    'collaboration',
    { sortOrder: 66 },
  ),
  numeric(
    20,
    QuestionType.PRACTICAL_EVALUATION,
    AssessmentCategoryCode.PRACTICAL_SKILLS,
    OrientationStage.SUMMARY,
    'Can the student explain what they tried in the last 20 minutes?',
    'explanation',
    { sortOrder: 67 },
  ),
  freeText(
    21,
    AssessmentCategoryCode.COMMUNICATION_LEARNING,
    OrientationStage.SUMMARY,
    'Mentor wrap-up notes (strengths, support needs, family context).',
    null,
    {
      sortOrder: 68,
      helperText: 'Unscored qualitative record. Level assignment is not applied in this phase.',
    },
  ),
];

export const CATALOG_CATEGORY_BY_CODE = Object.fromEntries(
  CATALOG_CATEGORIES.map((item) => [item.code, item]),
) as Record<AssessmentCategoryCode, CatalogCategory>;

export function catalogQuestionById(id: string): CatalogQuestion | undefined {
  return CATALOG_QUESTIONS.find((question) => question.id === id);
}
