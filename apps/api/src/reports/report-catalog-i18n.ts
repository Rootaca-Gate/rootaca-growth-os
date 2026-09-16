import { ReportLocale } from './dto/report-query.dto';

const EMPTY: Record<string, string> = {};

const AR_LEVELS: Record<string, string> = {
  EXPLORER: 'مستكشف',
  BEGINNER: 'مبتدئ',
  FOUNDATION: 'تأسيسي',
  JUNIOR: 'ناشئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
};

const AR_LEVEL_DETAILS: Record<string, string> = {
  EXPLORER: 'استكشاف مبكر. التركيز على الثقة والأدوات والتدريب الموجّه.',
  BEGINNER: 'يستطيع اتباع الأمثلة وإنجاز مهام قصيرة بمساعدة المرشد.',
  FOUNDATION: 'يفهم الأفكار الأساسية وينجز مشاريع بسيطة مع المرشد.',
  JUNIOR: 'يبني استقلالية أوّلية وينجز مهام قصيرة بثقة متزايدة.',
  INTERMEDIATE: 'يخطط وينقّح الأخطاء ويسلّم مشاريع صغيرة باستقلالية متزايدة.',
  ADVANCED: 'يعمل باستقلالية ويشرح الخيارات، وجاهز لمسارات أعمق.',
};

const AR_PATHS: Record<string, string> = {
  WEB: 'تطوير الويب',
  MOBILE: 'تطبيقات الموبايل',
  DATA: 'البيانات',
  GAME: 'تطوير الألعاب',
  GENERAL: 'مسار عام',
};

const AR_PATH_DETAILS: Record<string, string> = {
  WEB: 'مواقع، واجهات، ومشاريع تعمل من المتصفح.',
  MOBILE: 'تطبيقات الهاتف والتابلت، بما في ذلك أسلوب Flutter.',
  DATA: 'بيانات وPython وSQL ومشاريع تحليل.',
  GAME: 'ألعاب وتفاعل ومشاريع قابلة للعب.',
  GENERAL: 'أساس واسع قبل التخصص.',
};

const AR_SKILLS: Record<string, string> = {
  PROGRAMMING_FUNDAMENTALS: 'أساسيات البرمجة',
  PROBLEM_SOLVING: 'حل المشكلات',
  TECHNICAL_KNOWLEDGE: 'المعرفة التقنية',
  PRACTICAL_SKILLS: 'المهارات العملية',
  COMMUNICATION: 'التواصل',
  DEBUGGING: 'تتبع الأخطاء',
  GIT_GITHUB: 'Git وGitHub',
  PROJECT_DEVELOPMENT: 'تطوير المشاريع',
  COMPUTER_SCIENCE_BASICS: 'أساسيات علوم الحاسوب',
  INDEPENDENCE: 'الاستقلالية',
};

const AR_CATEGORIES: Record<string, string> = {
  PROGRAMMING_FUNDAMENTALS: 'أساسيات البرمجة',
  PROBLEM_SOLVING: 'حل المشكلات',
  TECHNICAL_KNOWLEDGE: 'المعرفة التقنية',
  PRACTICAL_SKILLS: 'المهارات العملية',
  COMMUNICATION_LEARNING: 'التواصل والتعلم',
};

const AR_KPIS: Record<string, string> = {
  CODING_PROBLEMS: 'مسائل برمجية',
  MINI_PROJECTS: 'مشاريع صغيرة',
  INDEPENDENT_TASKS: 'مهام مستقلة',
  WEEKLY_PRACTICE_HOURS: 'ساعات التدريب الأسبوعية',
  PROJECT_COMPLETION: 'إنجاز المشروع',
  PROBLEM_SOLVING: 'حل المشكلات',
  INDEPENDENCE: 'الاستقلالية',
};

const AR_KPI_UNITS: Record<string, string> = {
  problems: 'مسائل',
  projects: 'مشاريع',
  tasks: 'مهام',
  hours: 'ساعات',
  score: 'درجة',
  '%': '٪',
};

const AR_PROJECTS: Record<string, string> = {
  FIRST_WEB_PAGE: 'استوديو أول صفحة ويب',
  MOBILE_PRACTICE_SCREEN: 'شاشة تدريب للموبايل',
  DATA_STORY_NOTEBOOK: 'دفتر قصة البيانات',
  SCRATCH_ARCADE_LAB: 'مختبر أركيد Scratch',
  LEARNING_LOG_SITE: 'موقع سجل التعلّم',
};

const AR_PHRASES: Record<string, string> = {
  Web: 'الويب',
  Mobile: 'الموبايل',
  Games: 'الألعاب',
  AI: 'الذكاء الاصطناعي',
  Robotics: 'الروبوتات',
  Design: 'التصميم',
  Data: 'البيانات',
  'Competitive programming': 'البرمجة التنافسية',
  Explore: 'استكشف',
  Try: 'جرّب',
  Share: 'شارك',
  Foundations: 'الأساسيات',
  Practice: 'تدريب',
  'Mini project': 'مشروع صغير',
  'Core skills': 'المهارات الأساسية',
  Build: 'البناء',
  Review: 'المراجعة',
  Plan: 'التخطيط',
  Ship: 'التسليم',
  Reflect: 'التأمل',
  Architecture: 'البنية',
  'Independent build': 'بناء مستقل',
  Critique: 'النقد البنّاء',
  'Interests include web': 'الاهتمامات تشمل تطوير الويب',
  'Interests include mobile': 'الاهتمامات تشمل تطبيقات الموبايل',
  'Interests include data': 'الاهتمامات تشمل البيانات',
  'Interests include games': 'الاهتمامات تشمل الألعاب',
  'Interests point to broad exploration': 'الاهتمامات تشير إلى استكشاف أوسع',
  'Goal mentions web work': 'هدف التعلّم يتضمن العمل على الويب',
  'Goal mentions a mobile app': 'هدف التعلّم يتضمن تطبيق موبايل',
  'Goal mentions data or analysis': 'هدف التعلّم يتضمن البيانات أو التحليل',
  'Goal mentions games': 'هدف التعلّم يتضمن الألعاب',
  'Goal is still exploratory': 'هدف التعلّم ما زال استكشافياً',
  'Limited experience favors a general foundation': 'الخبرة المحدودة تناسب المسار العام التأسيسي',
  'Current path matches existing experience': 'المسار الحالي يتوافق مع الخبرة الحالية',
  'Strong programming fundamentals supports this path': 'قوة أساسيات البرمجة تدعم هذا المسار',
  'Strong problem solving supports this path': 'قوة حل المشكلات تدعم هذا المسار',
  'Strong technical knowledge supports this path': 'قوة المعرفة التقنية تدعم هذا المسار',
  'Strong practical skills supports this path': 'قوة المهارات العملية تدعم هذا المسار',
  'Strong communication supports this path': 'قوة التواصل تدعم هذا المسار',
  'Strong debugging supports this path': 'قوة تتبع الأخطاء تدعم هذا المسار',
  'Strong git github supports this path': 'قوة Git وGitHub تدعم هذا المسار',
  'Strong project development supports this path': 'قوة تطوير المشاريع تدعم هذا المسار',
  'Strong computer science basics supports this path': 'قوة أساسيات علوم الحاسوب تدعم هذا المسار',
  'Strong independence supports this path': 'قوة الاستقلالية تدعم هذا المسار',
};

const ROADMAP_NOUNS: Record<string, string> = {
  web: 'الويب',
  mobile: 'الموبايل',
  data: 'البيانات',
  game: 'الألعاب',
  making: 'الصناعة',
  page: 'صفحة',
  screen: 'شاشة',
  notebook: 'دفتر',
  scene: 'مشهد',
  demo: 'تجربة',
  'small website': 'موقع صغير',
  'simple app': 'تطبيق بسيط',
  'charted analysis': 'تحليل مرسوم',
  'playable loop': 'حلقة لعب',
  'shared experiment': 'تجربة مشتركة',
};

const TABLES = {
  level: { en: EMPTY, ar: AR_LEVELS },
  levelDetail: { en: EMPTY, ar: AR_LEVEL_DETAILS },
  path: { en: EMPTY, ar: AR_PATHS },
  pathDetail: { en: EMPTY, ar: AR_PATH_DETAILS },
  skill: { en: EMPTY, ar: AR_SKILLS },
  category: { en: EMPTY, ar: AR_CATEGORIES },
  kpi: { en: EMPTY, ar: AR_KPIS },
  kpiUnit: { en: EMPTY, ar: AR_KPI_UNITS },
  project: { en: EMPTY, ar: AR_PROJECTS },
  phrase: { en: EMPTY, ar: AR_PHRASES },
} as const;

export type CatalogNameKind = keyof typeof TABLES;

export function catalogLabel(
  locale: ReportLocale,
  kind: CatalogNameKind,
  code: string | undefined,
  fallback: string,
): string {
  if (!code) {
    return fallback;
  }
  return TABLES[kind][locale][code] ?? fallback;
}

export function localizeText(locale: ReportLocale, text: string): string {
  if (locale !== 'ar' || !text) {
    return text;
  }
  const direct = AR_PHRASES[text] ?? AR_LEVELS[text] ?? AR_PATHS[text] ?? AR_SKILLS[text];
  if (direct) {
    return direct;
  }
  const grade = text.match(/^Grade\s+(\d+)$/i);
  if (grade) {
    return `الصف ${grade[1]}`;
  }
  return localizeRoadmapTitle(text);
}

export function localizeList(locale: ReportLocale, values: string[], empty: string): string {
  const items = values.map((value) => localizeText(locale, value)).filter(Boolean);
  return items.join(locale === 'ar' ? '، ' : ', ') || empty;
}

export function localizeAssessmentSummary(
  locale: ReportLocale,
  overallScore: number,
  categories: Array<{ name: string; score: number }>,
  fallback: string,
): string {
  if (locale !== 'ar') {
    return fallback;
  }
  const ranked = [...categories].sort((left, right) => right.score - left.score);
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const band =
    overallScore >= 85
      ? 'نتيجة توجيه متميزة'
      : overallScore >= 70
        ? 'نتيجة توجيه قوية'
        : overallScore >= 50
          ? 'نتيجة توجيه قيد التطوير'
          : 'نتيجة توجيه ناشئة';
  const strongestText = strongest
    ? ` أقوى مجال: ${strongest.name} (${Math.round(strongest.score)}).`
    : '';
  const weakestText =
    weakest && strongest && weakest.name !== strongest.name
      ? ` التركيز التالي: ${weakest.name} (${Math.round(weakest.score)}).`
      : '';
  return `الدرجة الكلية ${Math.round(overallScore)}/100 تشير إلى ${band}.${strongestText}${weakestText}`;
}

function localizeRoadmapTitle(text: string): string {
  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^Set up the (.+) workspace$/, (match) => `إعداد بيئة ${noun(match[1])}`],
    [/^Learn the (.+) building blocks$/, (match) => `تعلّم أساسيات ${noun(match[1])}`],
    [/^Practice a (.+) pattern$/, (match) => `التدرّب على نمط ${noun(match[1])}`],
    [/^Debug a broken (.+)$/, (match) => `إصلاح ${noun(match[1])} متعطّل`],
    [/^Save the (.+) work in Git$/, (match) => `حفظ عمل ${noun(match[1])} في Git`],
    [/^Ship a (.+)$/, (match) => `تسليم ${noun(match[1])}`],
    [/^Explain the (.+) result$/, (match) => `شرح نتيجة ${noun(match[1])}`],
  ];
  for (const [pattern, build] of patterns) {
    const match = text.match(pattern);
    if (match) {
      return build(match);
    }
  }
  return text;
}

function noun(value: string): string {
  return ROADMAP_NOUNS[value] ?? value;
}
