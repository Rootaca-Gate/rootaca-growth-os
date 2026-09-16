import { ReportLocale } from './report.models';

export type ReportSectionKey =
  | 'student'
  | 'currentLevel'
  | 'assessment'
  | 'skills'
  | 'recommendedPath'
  | 'roadmap'
  | 'kpis'
  | 'projects'
  | 'achievements'
  | 'areasForImprovement'
  | 'nextGoals';

type ReportUiCopy = {
  previewTitle: string;
  generatePdf: string;
  downloadPdf: string;
  generating: string;
  openFull: string;
  emptyTitle: string;
  notFound: string;
  loadError: string;
  empty: Record<ReportSectionKey, string>;
  sections: Record<ReportSectionKey, string>;
  overall: string;
  completed: string;
  inProgress: string;
  blocked: string;
  assigned: string;
  reasons: string;
  alternative: string;
};

const EN: ReportUiCopy = {
  previewTitle: 'Report preview',
  generatePdf: 'Generate PDF',
  downloadPdf: 'Download PDF',
  generating: 'Generating…',
  openFull: 'Open report',
  emptyTitle: 'No report yet',
  notFound: 'Student not found.',
  loadError: 'Unable to load the student progress report.',
  overall: 'Overall',
  completed: 'Completed',
  inProgress: 'In progress',
  blocked: 'Blocked',
  assigned: 'Assigned',
  reasons: 'Why this path',
  alternative: 'Alternative path',
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
  empty: {
    student: '',
    currentLevel: 'Level is not calculated until an assessment is completed.',
    assessment: 'No orientation assessment has been completed yet.',
    skills: 'No skill scores have been recorded yet.',
    recommendedPath: 'A learning path is recommended after placement.',
    roadmap: 'A roadmap is generated after a path and level are set.',
    kpis: 'No KPI records for this period yet.',
    projects: 'No classroom projects have been assigned yet.',
    achievements: 'Achievements will appear as skills, KPIs, and projects complete.',
    areasForImprovement: 'No improvement areas are flagged yet.',
    nextGoals: 'Next goals will appear from reviews, roadmap items, and the learning goal.',
  },
};

const AR: ReportUiCopy = {
  previewTitle: 'معاينة التقرير',
  generatePdf: 'إنشاء ملف PDF',
  downloadPdf: 'تنزيل ملف PDF',
  generating: 'جارٍ الإنشاء…',
  openFull: 'فتح التقرير كاملاً',
  emptyTitle: 'لا يوجد تقرير بعد',
  notFound: 'الطالب غير موجود.',
  loadError: 'تعذّر تحميل تقرير تقدم الطالب.',
  overall: 'الإجمالي',
  completed: 'مكتمل',
  inProgress: 'قيد التنفيذ',
  blocked: 'متعذّر',
  assigned: 'مُسند',
  reasons: 'سبب التوصية',
  alternative: 'مسار بديل',
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
  empty: {
    student: '',
    currentLevel: 'يُحسب المستوى بعد إكمال التقييم.',
    assessment: 'لم يُكمل الطالب تقييم التوجيه بعد.',
    skills: 'لا توجد درجات مهارات مسجّلة بعد.',
    recommendedPath: 'يُوصى بمسار التعلّم بعد تحديد المستوى.',
    roadmap: 'تُنشأ خارطة الطريق بعد تحديد المسار والمستوى.',
    kpis: 'لا توجد مؤشرات أداء لهذه الفترة بعد.',
    projects: 'لم تُسند مشاريع تعليمية بعد.',
    achievements: 'ستظهر الإنجازات مع اكتمال المهارات والمؤشرات والمشاريع.',
    areasForImprovement: 'لا توجد مجالات تحسين محددة بعد.',
    nextGoals: 'ستظهر الأهداف التالية من المراجعات وخارطة الطريق وهدف التعلّم.',
  },
};

export function reportUi(locale: ReportLocale): ReportUiCopy {
  return locale === 'ar' ? AR : EN;
}
