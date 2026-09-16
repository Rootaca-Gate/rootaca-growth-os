export type KpiCategory =
  | 'CODING'
  | 'PROJECTS'
  | 'PRACTICE'
  | 'PROBLEM_SOLVING'
  | 'INDEPENDENCE';

export type KpiFrequency = 'WEEKLY' | 'MONTHLY';

export type KpiStatus = 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED';

export type KpiDefinition = {
  id: string;
  code: string;
  name: string;
  description: string;
  category: KpiCategory;
  target: number;
  unit: string;
  frequency: KpiFrequency;
  weight: number;
  active: boolean;
  sortOrder: number;
};

export type KpiRecord = {
  id: string;
  frequency: KpiFrequency;
  periodStart: string;
  periodEnd: string;
  target: number;
  actual: number;
  progressPercent: number;
  status: KpiStatus;
  notes: string;
  source: 'MANUAL' | 'SYSTEM';
};

export type StudentKpiItem = {
  id: string;
  kpi: KpiDefinition;
  target: number;
  actual: number;
  progressPercent: number;
  status: KpiStatus;
  current: KpiRecord;
  weekly?: KpiRecord | null;
  monthly?: KpiRecord | null;
  history: KpiRecord[];
};

export type StudentKpiDashboard = {
  studentId: string;
  overallPercent: number;
  overallStatus: KpiStatus;
  onTrackCount: number;
  atRiskCount: number;
  behindCount: number;
  completedCount: number;
  items: StudentKpiItem[];
};

export type UpsertKpiPayload = {
  code?: string;
  name: string;
  description: string;
  category: KpiCategory;
  target: number;
  unit: string;
  frequency: KpiFrequency;
  weight: number;
};

export type RecordKpiPayload = {
  actual?: number;
  target?: number;
  notes?: string;
  frequency?: KpiFrequency;
};
