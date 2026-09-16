import { ReportLocale } from './dto/report-query.dto';

export type ReportCopy = {
  locale: ReportLocale;
  title: string;
  brand: string;
  brandTag: string;
  confidential: string;
  page: (current: number, total: number) => string;
  generatedOn: (iso: string) => string;
  empty: string;
  sections: {
    student: string;
    currentLevel: string;
    assessment: string;
    skills: string;
    recommendedPath: string;
    roadmap: string;
    kpis: string;
    projects: string;
    achievements: string;
    areasForImprovement: string;
    nextGoals: string;
  };
  labels: {
    fullName: string;
    dateOfBirth: string;
    schoolGrade: string;
    phone: string;
    parentContact: string;
    status: string;
    english: string;
    experience: string;
    hours: string;
    languages: string;
    interests: string;
    learningGoal: string;
    overallScore: string;
    completedAt: string;
    reasons: string;
    alternative: string;
    overall: string;
    completed: string;
    inProgress: string;
    blocked: string;
    assigned: string;
    actual: string;
    target: string;
    notYet: string;
  };
  status: Record<string, string>;
  kpiStatus: Record<string, string>;
  projectStatus: Record<string, string>;
  roadmapStatus: Record<string, string>;
  emptySections: {
    level: string;
    assessment: string;
    skills: string;
    path: string;
    roadmap: string;
    kpis: string;
    projects: string;
    achievements: string;
    areasForImprovement: string;
    nextGoals: string;
  };
  insights: {
    skillHigh: (name: string, score: number) => string;
    skillLow: (name: string, score: number) => string;
    assessmentHigh: (name: string, score: number) => string;
    assessmentLow: (name: string, score: number) => string;
    kpiCompleted: (name: string) => string;
    kpiBehind: (name: string) => string;
    projectCompleted: (name: string) => string;
    projectBehind: (name: string, percent: number) => string;
    roadmapCompleted: (count: number) => string;
    roadmapBlocked: (title: string) => string;
    roadmapContinue: (title: string) => string;
    reviewStrength: (text: string) => string;
    reviewFocus: (text: string) => string;
    learningGoal: (text: string) => string;
  };
};

const EN: ReportCopy = {
  locale: 'en',
  title: 'Student Progress Report',
  brand: 'ROOTACA',
  brandTag: 'ACADEMY',
  confidential: 'Confidential student record',
  page: (current, total) => `Page ${current} of ${total}`,
  generatedOn: (iso) => `Generated ${iso.slice(0, 10)}`,
  empty: '—',
  sections: {
    student: 'Student Information',
    currentLevel: 'Current Level',
    assessment: 'Assessment Score',
    skills: 'Skills',
    recommendedPath: 'Recommended Path',
    roadmap: 'Roadmap',
    kpis: 'KPIs',
    projects: 'Projects',
    achievements: 'Achievements',
    areasForImprovement: 'Areas for Improvement',
    nextGoals: 'Next Goals',
  },
  labels: {
    fullName: 'Full name',
    dateOfBirth: 'Date of birth',
    schoolGrade: 'School grade',
    phone: 'Phone',
    parentContact: 'Parent contact',
    status: 'Status',
    english: 'English',
    experience: 'Programming experience',
    hours: 'Hours / week',
    languages: 'Languages',
    interests: 'Interests',
    learningGoal: 'Learning goal',
    overallScore: 'Overall score',
    completedAt: 'Completed',
    reasons: 'Why this path',
    alternative: 'Alternative path',
    overall: 'Overall',
    completed: 'Completed',
    inProgress: 'In progress',
    blocked: 'Blocked',
    assigned: 'Assigned',
    actual: 'Actual',
    target: 'Target',
    notYet: 'Not yet',
  },
  status: {
    INTAKE: 'Intake',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    COMPLETED: 'Completed',
    WITHDRAWN: 'Withdrawn',
    NONE: 'None',
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
    FLUENT: 'Fluent',
    FOUNDATION: 'Foundation',
    JUNIOR: 'Junior',
  },
  kpiStatus: {
    ON_TRACK: 'On track',
    AT_RISK: 'At risk',
    BEHIND: 'Behind',
    COMPLETED: 'Completed',
  },
  projectStatus: {
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On hold',
  },
  roadmapStatus: {
    NOT_STARTED: 'Not started',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    BLOCKED: 'Blocked',
  },
  emptySections: {
    level: 'Level is not calculated until an assessment is completed.',
    assessment: 'No orientation assessment has been completed yet.',
    skills: 'No skill scores have been recorded yet.',
    path: 'A learning path is recommended after placement.',
    roadmap: 'A roadmap is generated after a path and level are set.',
    kpis: 'No KPI records for this period yet.',
    projects: 'No classroom projects have been assigned yet.',
    achievements: 'Achievements will appear as skills, KPIs, and projects complete.',
    areasForImprovement: 'No improvement areas are flagged yet.',
    nextGoals: 'Next goals will appear from reviews, roadmap items, and the learning goal.',
  },
  insights: {
    skillHigh: (name, score) => `${name} is a strength at ${score}/100.`,
    skillLow: (name, score) => `${name} needs practice (${score}/100).`,
    assessmentHigh: (name, score) => `Strong assessment result in ${name} (${score}/100).`,
    assessmentLow: (name, score) => `Assessment gap in ${name} (${score}/100).`,
    kpiCompleted: (name) => `Completed KPI: ${name}.`,
    kpiBehind: (name) => `${name} is behind target.`,
    projectCompleted: (name) => `Completed classroom project: ${name}.`,
    projectBehind: (name, percent) => `${name} is at ${percent}% and needs follow-through.`,
    roadmapCompleted: (count) => `${count} roadmap items completed.`,
    roadmapBlocked: (title) => `Unblock roadmap item: ${title}.`,
    roadmapContinue: (title) => `Continue roadmap item: ${title}.`,
    reviewStrength: (text) => text,
    reviewFocus: (text) => text,
    learningGoal: (text) => `Stay aligned with the learning goal: ${text}`,
  },
};

const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const AR: ReportCopy = {
  locale: 'ar',
  title: 'تقرير تقدم الطالب',
  brand: 'ROOTACA',
  brandTag: 'ACADEMY',
  confidential: 'سجل سرّي خاص بالطالب',
  page: (current, total) => `صفحة ${current} من ${total}`,
  generatedOn: (iso) => `تاريخ الإصدار ${formatArDate(iso)}`,
  empty: '—',
  sections: {
    student: 'بيانات الطالب',
    currentLevel: 'المستوى الحالي',
    assessment: 'نتيجة التقييم',
    skills: 'المهارات',
    recommendedPath: 'المسار الموصى به',
    roadmap: 'خارطة الطريق',
    kpis: 'مؤشرات الأداء',
    projects: 'المشاريع',
    achievements: 'الإنجازات',
    areasForImprovement: 'مجالات التحسين',
    nextGoals: 'الأهداف التالية',
  },
  labels: {
    fullName: 'الاسم الكامل',
    dateOfBirth: 'تاريخ الميلاد',
    schoolGrade: 'الصف الدراسي',
    phone: 'الهاتف',
    parentContact: 'رقم ولي الأمر',
    status: 'الحالة',
    english: 'الإنجليزية',
    experience: 'خبرة البرمجة',
    hours: 'ساعات أسبوعياً',
    languages: 'اللغات',
    interests: 'الاهتمامات',
    learningGoal: 'هدف التعلّم',
    overallScore: 'الدرجة الكلية',
    completedAt: 'تاريخ الإكمال',
    reasons: 'سبب التوصية',
    alternative: 'مسار بديل',
    overall: 'الإجمالي',
    completed: 'مكتمل',
    inProgress: 'قيد التنفيذ',
    blocked: 'متعذّر',
    assigned: 'مُسند',
    actual: 'الفعلي',
    target: 'المستهدف',
    notYet: 'غير متوفر بعد',
  },
  status: {
    INTAKE: 'تسجيل أولي',
    ACTIVE: 'نشط',
    PAUSED: 'متوقف مؤقتاً',
    COMPLETED: 'مكتمل',
    WITHDRAWN: 'منسحب',
    NONE: 'لا توجد',
    BEGINNER: 'مبتدئ',
    INTERMEDIATE: 'متوسط',
    ADVANCED: 'متقدم',
    FLUENT: 'بطلاقة',
    FOUNDATION: 'تأسيسي',
    JUNIOR: 'ناشئ',
  },
  kpiStatus: {
    ON_TRACK: 'على المسار',
    AT_RISK: 'يحتاج متابعة',
    BEHIND: 'متأخر',
    COMPLETED: 'مكتمل',
  },
  projectStatus: {
    ASSIGNED: 'مُسند',
    IN_PROGRESS: 'قيد التنفيذ',
    COMPLETED: 'مكتمل',
    ON_HOLD: 'معلّق',
  },
  roadmapStatus: {
    NOT_STARTED: 'لم يبدأ',
    IN_PROGRESS: 'قيد التنفيذ',
    COMPLETED: 'مكتمل',
    BLOCKED: 'متعذّر',
  },
  emptySections: {
    level: 'يُحسب المستوى بعد إكمال التقييم.',
    assessment: 'لم يُكمل الطالب تقييم التوجيه بعد.',
    skills: 'لا توجد درجات مهارات مسجّلة بعد.',
    path: 'يُوصى بمسار التعلّم بعد تحديد المستوى.',
    roadmap: 'تُنشأ خارطة الطريق بعد تحديد المسار والمستوى.',
    kpis: 'لا توجد مؤشرات أداء لهذه الفترة بعد.',
    projects: 'لم تُسند مشاريع تعليمية بعد.',
    achievements: 'ستظهر الإنجازات مع اكتمال المهارات والمؤشرات والمشاريع.',
    areasForImprovement: 'لا توجد مجالات تحسين محددة بعد.',
    nextGoals: 'ستظهر الأهداف التالية من المراجعات وخارطة الطريق وهدف التعلّم.',
  },
  insights: {
    skillHigh: (name, score) => `${name} نقطة قوة بدرجة ${score}/100.`,
    skillLow: (name, score) => `هناك حاجة لمزيد من التدريب في ${name} (${score}/100).`,
    assessmentHigh: (name, score) => `نتيجة تقييم قوية في ${name} (${score}/100).`,
    assessmentLow: (name, score) => `فجوة في تقييم ${name} (${score}/100).`,
    kpiCompleted: (name) => `اكتمل مؤشر الأداء: ${name}.`,
    kpiBehind: (name) => `${name} متأخر عن المستهدف.`,
    projectCompleted: (name) => `اكتمل المشروع التعليمي: ${name}.`,
    projectBehind: (name, percent) => `${name} عند ${percent}٪ ويحتاج متابعة.`,
    roadmapCompleted: (count) => `تم إنجاز ${count} من عناصر خارطة الطريق.`,
    roadmapBlocked: (title) => `إزالة التعذّر عن: ${title}.`,
    roadmapContinue: (title) => `متابعة عنصر خارطة الطريق: ${title}.`,
    reviewStrength: (text) => text,
    reviewFocus: (text) => text,
    learningGoal: (text) => `الاستمرار وفق هدف التعلّم: ${text}`,
  },
};

function formatArDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  const monthName = AR_MONTHS[Number(month) - 1];
  if (!year || !monthName || !day) {
    return iso.slice(0, 10);
  }
  return `${Number(day)} ${monthName} ${year}`;
}

export function reportCopy(locale: ReportLocale): ReportCopy {
  return locale === 'ar' ? AR : EN;
}

export function labeled(map: Record<string, string>, code: string, fallback = code): string {
  return map[code] ?? fallback;
}
