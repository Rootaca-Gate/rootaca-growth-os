export type OpportunityType = 'RENEWAL' | 'EXPANSION' | 'RENEWAL_AND_EXPANSION';

export type OpportunityStatus =
  | 'IDENTIFIED'
  | 'PLANNING'
  | 'PROPOSAL_DRAFT'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED'
  | 'CLOSED';

export type OpportunityExpansionKind =
  | 'NEW_PROGRAM'
  | 'MORE_STUDENTS'
  | 'MORE_GROUPS'
  | 'NEW_GRADES'
  | 'NEW_CAMPUS'
  | 'NEW_DELIVERY_FORMAT'
  | 'EXTENDED_DURATION'
  | 'CUSTOMIZED_PROGRAM';

export type OpportunityTimelineKind =
  | 'OPPORTUNITY_CREATED'
  | 'PREVIOUS_REPORT_REVIEWED'
  | 'SCHOOL_CONTACTED'
  | 'MEETING'
  | 'REQUIREMENT_RECEIVED'
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONVERTED'
  | 'CLOSED'
  | 'CUSTOM';

export type OpportunityHistoricalKpis = {
  students: number | null;
  groups: number | null;
  sessions: number | null;
  sessionsCompleted: number | null;
  attendancePercent: number | null;
  completionPercent: number | null;
  deliverables: number | null;
  deliverablesAccepted: number | null;
};

export type OpportunityHistoricalSnapshot = {
  generatedAt: string;
  source: 'DELIVERY' | 'REPORT';
  deliveryId: string | null;
  deliveryNumber: string | null;
  deliveryName: string | null;
  reportId: string | null;
  reportNumber: string | null;
  institutionId: string | null;
  institutionName: string | null;
  sowId: string | null;
  sowNumber: string | null;
  proposalId: string | null;
  proposalNumber: string | null;
  programNames: string[];
  offeringNames: string[];
  periodStart: string | null;
  periodEnd: string | null;
  kpis: OpportunityHistoricalKpis;
};

export type OpportunityLinkRef = {
  id: string | null;
  number: string | null;
  title: string | null;
};

export type OpportunityExpansionKindItem = {
  id: string;
  kind: OpportunityExpansionKind;
  notes: string;
  sortOrder: number;
};

export type OpportunityTimelineEvent = {
  id: string;
  kind: OpportunityTimelineKind;
  occurredAt: string;
  note: string;
  performedByName: string | null;
  createdAt: string;
};

export type OpportunityActivityLog = {
  id: string;
  action: string;
  summary: string;
  performedByName: string | null;
  createdAt: string;
};

export type OpportunityListItem = {
  id: string;
  opportunityNumber: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  institutionId: string;
  institutionName: string;
  previousDeliveryNumber: string | null;
  previousSowNumber: string | null;
  previousReportNumber: string | null;
  ownerId: string | null;
  ownerName: string | null;
  expectedDate: string | null;
  newProposalId: string | null;
  newSowId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnershipOpportunity = {
  id: string;
  opportunityNumber: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  institutionId: string;
  institutionName: string;
  campus: OpportunityLinkRef | null;
  previousProposal: OpportunityLinkRef | null;
  previousSow: OpportunityLinkRef | null;
  previousDelivery: OpportunityLinkRef | null;
  previousReport: OpportunityLinkRef | null;
  newProposal: OpportunityLinkRef | null;
  newSow: OpportunityLinkRef | null;
  ownerId: string | null;
  ownerName: string | null;
  expectedDate: string | null;
  historicalSnapshot: OpportunityHistoricalSnapshot | null;
  renewalProgramIds: string[];
  renewalOfferingIds: string[];
  renewalGrades: string;
  renewalGroupsNote: string;
  renewalDurationNote: string;
  renewalDeliveryMode: string;
  renewalScopeNotes: string;
  expansionScopeNotes: string;
  proposedScopeNotes: string;
  existingScopeNotes: string;
  reason: string;
  schoolFeedback: string;
  successFactors: string;
  challenges: string;
  requestedChanges: string;
  internalNotes: string;
  nextSteps: string;
  feedbackSummary: string;
  feedbackScore: number | null;
  feedbackRequestedPrograms: string;
  feedbackRequestedChanges: string;
  feedbackKeyComments: string;
  feedbackDate: string | null;
  feedbackRecordedBy: string;
  expansionKinds: OpportunityExpansionKindItem[];
  timeline: OpportunityTimelineEvent[];
  activityLogs: OpportunityActivityLog[];
  allowedTransitions: OpportunityStatus[];
  archivedAt: string | null;
  convertedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityDashboard = {
  open: number;
  renewals: number;
  expansions: number;
  proposalDrafts: number;
  converted: number;
  upcoming: number;
};

export type OpportunityUserOption = {
  id: string;
  displayName: string;
  email: string;
  role: string;
};

export type OpportunityQuery = {
  search?: string;
  institutionId?: string;
  ownerId?: string;
  type?: OpportunityType;
  status?: OpportunityStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type CreateOpportunityPayload = {
  type: OpportunityType;
  institutionId: string;
  campusInstitutionId?: string;
  previousProposalId?: string;
  previousSowId?: string;
  previousDeliveryId?: string;
  previousReportId?: string;
  title?: string;
  expectedDate?: string | null;
  ownerId?: string;
};

export type OpportunityExpansionKindInput = {
  kind: OpportunityExpansionKind;
  notes?: string;
  sortOrder?: number;
};

export type UpdateOpportunityPayload = {
  title?: string;
  campusInstitutionId?: string | null;
  previousProposalId?: string | null;
  previousSowId?: string | null;
  previousDeliveryId?: string | null;
  previousReportId?: string | null;
  ownerId?: string | null;
  expectedDate?: string | null;
  renewalProgramIds?: string[];
  renewalOfferingIds?: string[];
  renewalGrades?: string;
  renewalGroupsNote?: string;
  renewalDurationNote?: string;
  renewalDeliveryMode?: string;
  renewalScopeNotes?: string;
  expansionScopeNotes?: string;
  proposedScopeNotes?: string;
  existingScopeNotes?: string;
  reason?: string;
  schoolFeedback?: string;
  successFactors?: string;
  challenges?: string;
  requestedChanges?: string;
  internalNotes?: string;
  nextSteps?: string;
  feedbackSummary?: string;
  feedbackScore?: number | null;
  feedbackRequestedPrograms?: string;
  feedbackRequestedChanges?: string;
  feedbackKeyComments?: string;
  feedbackDate?: string | null;
  feedbackRecordedBy?: string;
  expansionKinds?: OpportunityExpansionKindInput[];
};

export type CreateProposalFromOpportunityPayload = {
  title?: string;
};

export type AddTimelineEventPayload = {
  kind: OpportunityTimelineKind;
  note?: string;
  occurredAt?: string | null;
};
