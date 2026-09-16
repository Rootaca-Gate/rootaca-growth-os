export type ReportLocale = 'en' | 'ar';

export type ReportField = {
  label: string;
  value: string;
};

export type ReportScoreItem = {
  name: string;
  score: number;
  detail?: string;
};

export type ReportStudentSection = {
  id: string;
  fullName: string;
  fields: ReportField[];
};

export type ReportLevelSection = {
  name: string;
  code: string;
  description: string;
};

export type ReportAssessmentSection = {
  overallScore: number;
  completedAt: string;
  summary: string;
  categories: ReportScoreItem[];
};

export type ReportPathSection = {
  name: string;
  code: string;
  description: string;
  reasons: string[];
  alternativeName?: string | null;
  alternativeReasons: string[];
};

export type ReportRoadmapPhase = {
  title: string;
  percent: number;
  completedCount: number;
  itemCount: number;
};

export type ReportRoadmapSection = {
  pathName: string;
  levelName: string;
  overallPercent: number;
  completedCount: number;
  itemCount: number;
  inProgressCount: number;
  blockedCount: number;
  phases: ReportRoadmapPhase[];
};

export type ReportKpiItem = {
  name: string;
  actual: number;
  target: number;
  unit: string;
  progressPercent: number;
  status: string;
  statusLabel: string;
};

export type ReportKpiSection = {
  overallPercent: number;
  overallStatus: string;
  overallStatusLabel: string;
  items: ReportKpiItem[];
};

export type ReportProjectItem = {
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
};

export type ReportProjectSection = {
  overallPercent: number;
  assignedCount: number;
  completedCount: number;
  items: ReportProjectItem[];
};

export type StudentProgressReport = {
  studentId: string;
  locale: ReportLocale;
  generatedAt: string;
  title: string;
  fileName: string;
  student: ReportStudentSection;
  currentLevel: ReportLevelSection | null;
  assessment: ReportAssessmentSection | null;
  skills: ReportScoreItem[];
  recommendedPath: ReportPathSection | null;
  roadmap: ReportRoadmapSection | null;
  kpis: ReportKpiSection;
  projects: ReportProjectSection;
  achievements: string[];
  areasForImprovement: string[];
  nextGoals: string[];
};
