export type PartnershipReportType =
  | 'STUDENT_PROGRESS'
  | 'GROUP_PROGRESS'
  | 'SCHOOL_SUMMARY'
  | 'PROGRAM_COMPLETION'
  | 'FINAL_PARTNERSHIP';

export type PartnershipReportStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type PartnershipReportRecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type PartnershipReportStudentTrackStatus =
  | 'ON_TRACK'
  | 'NEEDS_ATTENTION'
  | 'COMPLETED'
  | 'NOT_ASSESSED';

export type ReportKpis = {
  students: number | null;
  groups: number | null;
  sessions: number | null;
  sessionsCompleted: number | null;
  attendancePercent: number | null;
  completionPercent: number | null;
  progressPercent: number | null;
  projects: number | null;
  deliverables: number | null;
  deliverablesAccepted: number | null;
};

export type ReportDataSnapshot = {
  generatedAt: string;
  deliveryId: string;
  deliveryNumber: string;
  deliveryName: string;
  institutionName: string;
  programNames: string[];
  kpis: ReportKpis;
  students: Array<{
    studentId: string;
    studentName: string;
    groupName: string;
    attendancePercent: number | null;
    trackStatus: PartnershipReportStudentTrackStatus;
  }>;
  groups: Array<{
    groupId: string;
    groupName: string;
    studentsCount: number;
    attendancePercent: number | null;
    sessionsCompleted: number;
    sessionsTotal: number;
    progressPercent: number | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    completionPercent: number | null;
  }>;
  challenges: Array<{
    id: string;
    kind: string;
    title: string;
    status: string;
  }>;
  assessment: {
    available: boolean;
    emptyReason: string;
  };
};

export type ReportRecommendation = {
  id: string;
  text: string;
  priority: PartnershipReportRecommendationPriority;
  owner: string;
  targetDate: string | null;
  isInternal: boolean;
  sortOrder: number;
};

export type ReportRecommendationInput = {
  text?: string;
  priority?: PartnershipReportRecommendationPriority;
  owner?: string;
  targetDate?: string | null;
  isInternal?: boolean;
  sortOrder?: number;
};

export type PublishValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export type ReportListItem = {
  id: string;
  reportNumber: string;
  title: string;
  type: PartnershipReportType;
  status: PartnershipReportStatus;
  institutionId: string;
  institutionName: string;
  deliveryId: string;
  deliveryNumber: string;
  programNameSnapshot: string;
  periodStart: string | null;
  periodEnd: string | null;
  periodLabel: string;
  version: string;
  updatedAt: string;
};

export type PartnershipReport = {
  id: string;
  reportNumber: string;
  title: string;
  type: PartnershipReportType;
  status: PartnershipReportStatus;
  version: string;
  institutionId: string;
  institutionName: string;
  deliveryId: string;
  deliveryNumber: string;
  sowId: string;
  sowNumber: string;
  proposalId: string;
  proposalNumber: string;
  programNameSnapshot: string;
  periodStart: string | null;
  periodEnd: string | null;
  periodLabel: string;
  preparedBy: string;
  executiveSummary: string;
  achievements: string;
  nextSteps: string;
  renewalNotes: string;
  internalNotes: string;
  kpis: ReportKpis | null;
  dataSnapshot: ReportDataSnapshot | null;
  publishedSnapshot: Record<string, unknown> | null;
  recommendations: ReportRecommendation[];
  versions: Array<{
    id: string;
    version: string;
    changeNote: string;
    createdAt: string;
    createdByName: string | null;
  }>;
  activityLogs: Array<{
    id: string;
    action: string;
    summary: string;
    performedByName: string | null;
    createdAt: string;
  }>;
  publishValidation?: PublishValidation;
  publishedAt: string | null;
  publishedByName: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportQuery = {
  search?: string;
  institutionId?: string;
  deliveryId?: string;
  programName?: string;
  type?: PartnershipReportType;
  status?: PartnershipReportStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type CreateReportFromDeliveryPayload = {
  deliveryId: string;
  type: PartnershipReportType;
};

export type ReportUpdatePayload = {
  title?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  periodLabel?: string;
  preparedBy?: string;
  executiveSummary?: string;
  achievements?: string;
  nextSteps?: string;
  renewalNotes?: string;
  internalNotes?: string;
  recommendations?: ReportRecommendationInput[];
};
