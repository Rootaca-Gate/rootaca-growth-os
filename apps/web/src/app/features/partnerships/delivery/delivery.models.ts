/**
 * Partnership Delivery frontend models — aligned with the Nest delivery API
 * (apps/api/src/partnerships/delivery/dto/delivery.dto.ts) and the Prisma
 * PartnershipDelivery* models.
 *
 * A Delivery is always derived from an ACTIVE SOW. Scope, responsibilities and
 * requirements are frozen snapshots taken from the SOW at create time — they
 * are never used to mutate the source Program / Offering / Proposal / SOW.
 * Progress is COMPUTED from execution entities (phases, milestones, tasks,
 * sessions, deliverables) — never an invented percentage.
 */

// -----------------------------------------------------------------------------
// Status enums
// -----------------------------------------------------------------------------

export type PartnershipDeliveryStatus =
  | 'PREPARING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PartnershipDeliveryPhaseStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED';

export type PartnershipDeliveryMilestoneStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED';

export type PartnershipDeliveryTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PartnershipDeliveryTaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export type PartnershipDeliverySessionStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type PartnershipDeliveryAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type PartnershipDeliveryDeliverableStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED';

export type PartnershipDeliveryIssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PartnershipDeliveryIssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type PartnershipDeliveryRaidType = 'RISK' | 'ASSUMPTION' | 'ISSUE' | 'DEPENDENCY';

export type PartnershipDeliveryRaidStatus = 'OPEN' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';

export type PartnershipDeliveryCommType = 'MEETING' | 'EMAIL' | 'CALL' | 'WHATSAPP' | 'OTHER';

export type PartnershipDeliveryCheckpointKind =
  | 'KICKOFF'
  | 'MIDPOINT_REVIEW'
  | 'PROJECT_REVIEW'
  | 'FINAL_REVIEW'
  | 'CUSTOM';

export type PartnershipDeliveryCheckpointStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export type PartnershipDeliveryReportType =
  | 'STUDENT_PROGRESS'
  | 'GROUP_PROGRESS'
  | 'SCHOOL_SUMMARY'
  | 'PROGRAM_COMPLETION'
  | 'FINAL_PARTNERSHIP';

export type PartnershipDeliveryReportStatus = 'DRAFT' | 'GENERATED' | 'SHARED' | 'FINAL';

export type PartnershipDeliveryDocumentType =
  | 'SOW'
  | 'PROPOSAL'
  | 'SESSION_MATERIAL'
  | 'STUDENT_REPORT'
  | 'PROJECT_FILE'
  | 'SCHOOL_REPORT'
  | 'FINAL_REPORT'
  | 'OTHER';

export type PartnershipDeliveryGroupStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// -----------------------------------------------------------------------------
// Nested read models (children of a Delivery)
// -----------------------------------------------------------------------------

export type DeliveryInstitutionSummary = {
  id: string;
  name: string;
  arabicName?: string | null;
  englishName?: string | null;
  governorate?: string | null;
  city?: string | null;
};

export type DeliverySowSummary = {
  id: string;
  sowNumber: string;
  title: string;
  status: string;
};

export type DeliveryPhase = {
  id: string;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  owner: string;
  status: PartnershipDeliveryPhaseStatus;
  sortOrder: number;
};

export type DeliveryMilestone = {
  id: string;
  phaseId: string | null;
  sourceSowMilestoneId: string | null;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  owner: string;
  status: PartnershipDeliveryMilestoneStatus;
  requiredForCompletion: boolean;
  sortOrder: number;
};

export type DeliveryTask = {
  id: string;
  phaseId: string | null;
  milestoneId: string | null;
  title: string;
  description: string;
  owner: string;
  assigneeId: string | null;
  priority: PartnershipDeliveryTaskPriority;
  startDate: string | null;
  dueDate: string | null;
  status: PartnershipDeliveryTaskStatus;
  sortOrder: number;
};

export type DeliveryGroupStudent = {
  id: string;
  studentId: string;
  joinedAt: string;
};

export type DeliveryGroup = {
  id: string;
  name: string;
  grade: string;
  level: string;
  instructorId: string | null;
  schedule: string;
  status: PartnershipDeliveryGroupStatus;
  sortOrder: number;
  students: DeliveryGroupStudent[];
};

export type DeliveryTeamMember = {
  id: string;
  userId: string | null;
  role: string;
  name: string;
  responsibilities: string;
  availability: string;
  sortOrder: number;
};

export type DeliveryAttendance = {
  id: string;
  studentId: string;
  status: PartnershipDeliveryAttendanceStatus;
  notes: string;
};

export type DeliverySession = {
  id: string;
  groupId: string | null;
  sessionNumber: number;
  sessionDate: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  instructorId: string | null;
  instructorName: string;
  topic: string;
  status: PartnershipDeliverySessionStatus;
  learningObjectives: string;
  activities: string;
  projects: string;
  homework: string;
  instructorNotes: string;
  sessionOutcome: string;
  issuesNotes: string;
  nextSessionPrep: string;
  attendances: DeliveryAttendance[];
};

export type DeliveryDeliverableSubmission = {
  id: string;
  description: string;
  fileName: string;
  fileUrl: string;
  submittedBy: string;
  submittedAt: string;
  version: string;
  status: PartnershipDeliveryDeliverableStatus;
  rejectionReason: string;
};

export type DeliveryDeliverable = {
  id: string;
  sourceSowDeliverableId: string | null;
  name: string;
  description: string;
  owner: string;
  dueDate: string | null;
  acceptanceCriteria: string;
  status: PartnershipDeliveryDeliverableStatus;
  requiredForCompletion: boolean;
  rejectionReason: string;
  sortOrder: number;
  submissions: DeliveryDeliverableSubmission[];
};

export type DeliveryIssue = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: PartnershipDeliveryIssueSeverity;
  owner: string;
  dueDate: string | null;
  status: PartnershipDeliveryIssueStatus;
  resolution: string;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryRaidItem = {
  id: string;
  type: PartnershipDeliveryRaidType;
  title: string;
  description: string;
  owner: string;
  impact: string;
  probability: string;
  mitigation: string;
  dueDate: string | null;
  status: PartnershipDeliveryRaidStatus;
  sortOrder: number;
};

export type DeliveryCommunication = {
  id: string;
  type: PartnershipDeliveryCommType;
  occurredAt: string;
  participants: string;
  subject: string;
  summary: string;
  actionItems: string;
  owner: string;
  followUpDate: string | null;
};

export type DeliveryCheckpoint = {
  id: string;
  kind: PartnershipDeliveryCheckpointKind;
  name: string;
  checkpointDate: string | null;
  participants: string;
  discussion: string;
  decisions: string;
  actionItems: string;
  status: PartnershipDeliveryCheckpointStatus;
  sortOrder: number;
};

export type DeliveryReport = {
  id: string;
  type: PartnershipDeliveryReportType;
  title: string;
  periodLabel: string;
  author: string;
  status: PartnershipDeliveryReportStatus;
  generatedAt: string | null;
  fileName: string;
  fileUrl: string;
  contentSnapshot: unknown;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryDocument = {
  id: string;
  name: string;
  type: PartnershipDeliveryDocumentType;
  version: string;
  uploadedBy: string;
  fileUrl: string;
  notes: string;
  uploadedAt: string;
};

export type DeliveryActivityLog = {
  id: string;
  action: string;
  summary: string;
  metadata: unknown;
  performedById: string | null;
  createdAt: string;
};

// -----------------------------------------------------------------------------
// Computed read models — progress / KPIs / completion checklist
// -----------------------------------------------------------------------------

export type ProgressDimension = {
  completed: number;
  total: number;
  ratio: number | null;
};

export type DeliveryProgress = {
  phaseProgress: ProgressDimension;
  milestoneProgress: ProgressDimension;
  taskProgress: ProgressDimension;
  sessionProgress: ProgressDimension;
  deliverableProgress: ProgressDimension;
  overall: number;
  overallPercent: number;
  dimensionsCounted: string[];
};

export type DeliveryKpis = {
  sessionsCompleted: number;
  sessionsTotal: number;
  studentsUnique: number;
  groupsCount: number;
  deliverablesAccepted: number;
  deliverablesTotal: number;
  milestonesCompleted: number;
  milestonesTotal: number;
};

export type CompletionChecklistItem = {
  key: string;
  label: string;
  required: boolean;
  satisfied: boolean;
  detail: string;
};

export type CompletionChecklist = {
  items: CompletionChecklistItem[];
  allRequiredSatisfied: boolean;
};

// -----------------------------------------------------------------------------
// List item + full delivery
// -----------------------------------------------------------------------------

export type DeliveryListItem = {
  id: string;
  deliveryNumber: string;
  name: string;
  institutionId: string;
  institutionName: string;
  sowId: string;
  sowNumber: string | null;
  status: PartnershipDeliveryStatus;
  startDate: string | null;
  endDate: string | null;
  overallPercent: number;
  sessionsCompleted: number;
  sessionsTotal: number;
  groupsCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnershipDelivery = {
  id: string;
  deliveryNumber: string;
  name: string;
  institutionId: string;
  sowId: string;
  proposalId: string;
  status: PartnershipDeliveryStatus;
  startDate: string | null;
  endDate: string | null;
  sowNumberSnapshot: string;
  proposalNumberSnapshot: string;
  scopeSnapshot: unknown;
  responsibilitiesSnapshot: unknown;
  requirementsSnapshot: unknown;
  finalReportRequired: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;

  institution: DeliveryInstitutionSummary;
  sow: DeliverySowSummary;

  phases: DeliveryPhase[];
  milestones: DeliveryMilestone[];
  tasks: DeliveryTask[];
  sessions: DeliverySession[];
  groups: DeliveryGroup[];
  teamMembers: DeliveryTeamMember[];
  deliverables: DeliveryDeliverable[];
  issues: DeliveryIssue[];
  raidItems: DeliveryRaidItem[];
  communications: DeliveryCommunication[];
  checkpoints: DeliveryCheckpoint[];
  reports: DeliveryReport[];
  documents: DeliveryDocument[];
  activityLogs: DeliveryActivityLog[];

  progress: DeliveryProgress;
  kpis: DeliveryKpis;
  completionChecklist: CompletionChecklist;
};

// -----------------------------------------------------------------------------
// Query + user options
// -----------------------------------------------------------------------------

export type DeliveryQuery = {
  search?: string;
  institutionId?: string;
  sowId?: string;
  status?: PartnershipDeliveryStatus | '';
  instructorId?: string;
  programName?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  includeArchived?: string;
  page?: number;
  pageSize?: number;
};

export type DeliveryUserOption = {
  id: string;
  displayName: string;
  email: string;
  role: string;
};

// -----------------------------------------------------------------------------
// Write payloads (bulk-replace plan children — SOW-style)
// -----------------------------------------------------------------------------

export type DeliveryPhaseInput = {
  id?: string;
  name: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  owner?: string;
  status?: PartnershipDeliveryPhaseStatus;
  sortOrder?: number;
};

export type DeliveryMilestoneInput = {
  id?: string;
  phaseRef?: string | null;
  name: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  owner?: string;
  status?: PartnershipDeliveryMilestoneStatus;
  requiredForCompletion?: boolean;
  sortOrder?: number;
};

export type DeliveryTaskInput = {
  id?: string;
  phaseRef?: string | null;
  milestoneRef?: string | null;
  title: string;
  description?: string;
  owner?: string;
  assigneeId?: string | null;
  priority?: PartnershipDeliveryTaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  status?: PartnershipDeliveryTaskStatus;
  sortOrder?: number;
};

export type DeliveryTeamMemberInput = {
  id?: string;
  userId?: string | null;
  role: string;
  name?: string;
  responsibilities?: string;
  availability?: string;
  sortOrder?: number;
};

export type DeliveryDeliverableInput = {
  id?: string;
  name: string;
  description?: string;
  owner?: string;
  dueDate?: string | null;
  acceptanceCriteria?: string;
  status?: PartnershipDeliveryDeliverableStatus;
  requiredForCompletion?: boolean;
  sortOrder?: number;
};

export type DeliveryIssueInput = {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  severity?: PartnershipDeliveryIssueSeverity;
  owner?: string;
  dueDate?: string | null;
  status?: PartnershipDeliveryIssueStatus;
  resolution?: string;
};

export type DeliveryRaidInput = {
  id?: string;
  type: PartnershipDeliveryRaidType;
  title: string;
  description?: string;
  owner?: string;
  impact?: string;
  probability?: string;
  mitigation?: string;
  dueDate?: string | null;
  status?: PartnershipDeliveryRaidStatus;
  sortOrder?: number;
};

export type DeliveryCommInput = {
  id?: string;
  type: PartnershipDeliveryCommType;
  occurredAt?: string | null;
  participants?: string;
  subject?: string;
  summary?: string;
  actionItems?: string;
  owner?: string;
  followUpDate?: string | null;
};

export type DeliveryCheckpointInput = {
  id?: string;
  kind?: PartnershipDeliveryCheckpointKind;
  name: string;
  checkpointDate?: string | null;
  participants?: string;
  discussion?: string;
  decisions?: string;
  actionItems?: string;
  status?: PartnershipDeliveryCheckpointStatus;
  sortOrder?: number;
};

export type DeliveryDocumentInput = {
  id?: string;
  name: string;
  type?: PartnershipDeliveryDocumentType;
  version?: string;
  uploadedBy?: string;
  fileUrl?: string;
  notes?: string;
};

export type DeliverySessionInput = {
  id?: string;
  groupId?: string | null;
  sessionNumber: number;
  sessionDate?: string | null;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number | null;
  instructorId?: string | null;
  instructorName?: string;
  topic?: string;
  status?: PartnershipDeliverySessionStatus;
  learningObjectives?: string;
  activities?: string;
  projects?: string;
  homework?: string;
  instructorNotes?: string;
  sessionOutcome?: string;
  issuesNotes?: string;
  nextSessionPrep?: string;
};

export type DeliveryUpdatePayload = {
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
  finalReportRequired?: boolean;
  phases?: DeliveryPhaseInput[];
  milestones?: DeliveryMilestoneInput[];
  tasks?: DeliveryTaskInput[];
  teamMembers?: DeliveryTeamMemberInput[];
  deliverables?: DeliveryDeliverableInput[];
  issues?: DeliveryIssueInput[];
  raidItems?: DeliveryRaidInput[];
  communications?: DeliveryCommInput[];
  checkpoints?: DeliveryCheckpointInput[];
  documents?: DeliveryDocumentInput[];
};
