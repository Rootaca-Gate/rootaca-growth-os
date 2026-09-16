export type DashboardChartBucket = {
  key: string;
  label: string;
  count: number;
};

export type DashboardScoreBucket = {
  key: string;
  label: string;
  score: number;
  sampleSize: number;
};

export type DashboardMonthlyPoint = {
  month: string;
  label: string;
  average: number | null;
  reviewCount: number;
};

export type DashboardAttentionItem = {
  studentId: string;
  studentName: string;
  detail: string;
  href: string;
};

export type DashboardSessionItem = {
  id: string;
  studentId: string;
  studentName: string;
  status: string;
  statusLabel: string;
  currentStage: string;
  stageLabel: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  overallScore: number | null;
  href: string;
};

export type DashboardCards = {
  totalStudents: number;
  activeStudents: number;
  todaysSessions: number;
  pendingAssessments: number;
  averageProgress: number | null;
  projectsCompleted: number;
};

export type DashboardResponse = {
  generatedAt: string;
  cards: DashboardCards;
  charts: {
    studentsByLevel: DashboardChartBucket[];
    studentsByPath: DashboardChartBucket[];
    averageSkillScores: DashboardScoreBucket[];
    kpiStatus: DashboardChartBucket[];
    monthlyProgress: DashboardMonthlyPoint[];
  };
  attention: {
    kpiBelowTarget: DashboardAttentionItem[];
    assessmentPending: DashboardAttentionItem[];
    noRecentActivity: DashboardAttentionItem[];
    roadmapBehindSchedule: DashboardAttentionItem[];
  };
  recentSessions: DashboardSessionItem[];
  upcomingSessions: DashboardSessionItem[];
};
