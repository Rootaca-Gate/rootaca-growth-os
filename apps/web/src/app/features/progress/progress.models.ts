export type ReviewKind = 'INITIAL_ASSESSMENT' | 'MONTHLY_REVIEW';

export type DimensionKey =
  'technicalSkills' | 'problemSolving' | 'projects' | 'independence' | 'communication';

export type DimensionGrowth = {
  key: DimensionKey;
  label: string;
  currentScore: number;
  previousScore: number | null;
  growth: number | null;
};

export type ReviewerSummary = {
  id: string;
  displayName: string;
};

export type ProgressReview = {
  id: string;
  studentId: string;
  kind: ReviewKind;
  reviewedAt: string;
  periodStart: string;
  periodEnd: string;
  reviewer: ReviewerSummary;
  technicalSkills: number;
  problemSolving: number;
  projects: number;
  independence: number;
  communication: number;
  overallScore: number;
  previousOverallScore: number | null;
  overallGrowth: number | null;
  kpiOverallPercent: number;
  projectOverallPercent: number;
  notes: string;
  strengths: string;
  nextFocus: string;
  dimensions: DimensionGrowth[];
  createdAt: string;
  updatedAt: string;
};

export type GrowthChartSeries = {
  key: string;
  label: string;
  points: number[];
};

export type GrowthChart = {
  title: string;
  labels: string[];
  series: GrowthChartSeries[];
};

export type StudentProgressDashboard = {
  studentId: string;
  latest: ProgressReview | null;
  dimensions: DimensionGrowth[];
  currentScore: number;
  previousScore: number | null;
  growth: number | null;
  history: ProgressReview[];
  skillGrowth: GrowthChart;
  kpiGrowth: GrowthChart;
  projectGrowth: GrowthChart;
};

export type UpsertProgressReview = {
  kind: ReviewKind;
  reviewedAt?: string;
  periodStart?: string;
  periodEnd?: string;
  technicalSkills: number;
  problemSolving: number;
  projects: number;
  independence: number;
  communication: number;
  notes?: string;
  strengths?: string;
  nextFocus?: string;
};
