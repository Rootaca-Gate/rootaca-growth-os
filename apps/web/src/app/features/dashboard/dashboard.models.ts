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
  inactiveDays?: number | null;
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

export type DashboardStudentRow = {
  studentId: string;
  studentName: string;
  level: string;
  path: string;
  progress: number | null;
  skillScore: number | null;
  kpiBelowCount: number;
  lastActivityAt: string | null;
  lastActivityLabel: string;
  status: string;
  href: string;
};

export type DashboardActivityItem = {
  studentId: string;
  studentName: string;
  occurredAt: string;
  title: string;
  href: string;
};

export type DashboardCards = {
  totalStudents: number;
  activeStudents: number;
  todaysSessions: number;
  pendingAssessments: number;
  averageProgress: number | null;
  projectsCompleted: number;
  newThisWeek: number;
  averageSkillScore: number | null;
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
    orientationNotCompleted: DashboardAttentionItem[];
    assessmentInProgress: DashboardAttentionItem[];
    roadmapOverdue: DashboardAttentionItem[];
  };
  recentSessions: DashboardSessionItem[];
  upcomingSessions: DashboardSessionItem[];
  todaysSessionsList: DashboardSessionItem[];
  students: DashboardStudentRow[];
  recentActivity: DashboardActivityItem[];
};
