/**
 * Statement of Work (SOW) frontend models — aligned with the Nest sows API.
 *
 * A SOW is always derived from an accepted Proposal. Scope offerings are frozen
 * copies of the proposal offering snapshots and are never used to mutate the
 * source Program / Offering / Proposal. Commercial figures are display-only
 * snapshots carried over from the proposal.
 */
import {
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
} from '../partnership.models';
import {
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
} from '../offerings/offering.models';
import { PartnershipProposalStatus } from '../proposals/proposal.models';

export type PartnershipSowStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PartnershipSowDeliverableStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ACCEPTED';

export type PartnershipSowMilestoneStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DELAYED'
  | 'CANCELLED';

export type PartnershipSowScopeKind = 'IN_SCOPE' | 'OUT_OF_SCOPE';

export type PartnershipSowParty = 'ROOTACA' | 'SCHOOL';

export type PartnershipSowChangeImpact = 'MINOR' | 'MAJOR';

export type PartnershipSowChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SowInstitutionSummary = {
  id: string;
  name: string;
  arabicName?: string | null;
  englishName?: string | null;
  institutionType?: string | null;
  governorate?: string | null;
  city?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
};

export type SowProposalSummary = {
  id: string;
  proposalNumber: string;
  title: string;
  status: PartnershipProposalStatus;
};

export type SowScopeOffering = {
  id: string;
  offeringId: string | null;
  sortOrder: number;
  programName: string;
  offeringName: string;
  deliveryFormat: PartnershipDeliveryFormat | null;
  targetGrades: string | null;
  recommendedLevel: PartnershipProgramLevel | null;
  duration: number | null;
  durationUnit: PartnershipDurationUnit | null;
  numberOfSessions: number | null;
  sessionDurationMinutes: number | null;
  sessionFrequency: string | null;
  deliveryMode: PartnershipDeliveryMode | null;
  groupSizeMin: number | null;
  groupSizeMax: number | null;
  numberOfGroups: number | null;
  shortDescription: string;
  curriculumJson: unknown;
  activitiesJson: unknown;
  projectsJson: unknown;
  assessmentJson: unknown;
  requirementsJson: unknown;
  outcomesJson: unknown;
  objectivesJson: unknown;
};

export type SowScopeItem = {
  id: string;
  kind: PartnershipSowScopeKind;
  text: string;
  sortOrder: number;
};

export type SowDeliverable = {
  id: string;
  name: string;
  description: string;
  owner: string;
  dueDate: string | null;
  acceptanceCriteria: string;
  status: PartnershipSowDeliverableStatus;
  sortOrder: number;
};

export type SowMilestone = {
  id: string;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  owner: string;
  status: PartnershipSowMilestoneStatus;
  sortOrder: number;
};

export type SowResponsibility = {
  id: string;
  activity: string;
  rootacaRole: string;
  schoolRole: string;
  sortOrder: number;
};

export type SowTeamMember = {
  id: string;
  party: PartnershipSowParty;
  role: string;
  name: string;
  responsibility: string;
  contact: string;
  assignedUserId: string | null;
  sortOrder: number;
};

export type SowAssessmentItem = {
  id: string;
  name: string;
  responsibleParty: string;
  frequency: string;
  format: string;
  dueDate: string | null;
  sortOrder: number;
};

export type SowChangeRequest = {
  id: string;
  changeRequestNumber: string;
  requestedBy: string;
  requestDate: string;
  description: string;
  impact: PartnershipSowChangeImpact;
  approvalStatus: PartnershipSowChangeRequestStatus;
  approvedBy: string;
  decisionDate: string | null;
  changeSummary: string;
  resultingVersion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SowVersionSummary = {
  id: string;
  version: string;
  changeSummary: string;
  createdById: string | null;
  createdAt: string;
};

export type SowListItem = {
  id: string;
  sowNumber: string;
  title: string;
  institutionId: string;
  institutionName: string;
  proposalId: string;
  proposalNumber: string | null;
  status: PartnershipSowStatus;
  sowDate: string;
  startDate: string | null;
  endDate: string | null;
  currencySnapshot: string | null;
  agreedValueSnapshot: number | null;
  version: string;
  isLocked: boolean;
  offeringCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PartnershipSow = SowListItem & {
  effectiveDate: string | null;
  preparedBy: string;
  approvedBy: string;
  purpose: string;
  targetStudents: string;
  deliveryModelNotes: string;
  activitiesNotes: string;
  projectsNotes: string;
  assessmentNotes: string;
  reportingNotes: string;
  clientName: string;
  clientAddress: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  attendanceExpectations: string;
  minimumParticipation: string;
  studentReplacementRules: string;
  makeupSessionRules: string;
  equipmentRequirements: string;
  internetRequirements: string;
  classroomLabRequirements: string;
  studentDevicesRequirements: string;
  softwareRequirements: string;
  accountsAccessRequirements: string;
  facultyLiaisonRequirements: string;
  termsAndConditions: string;
  proposalNumberSnapshot: string;
  paymentTermsSnapshot: string;
  rootacaSignatoryName: string;
  rootacaSignatoryTitle: string;
  rootacaSignedAt: string | null;
  rootacaSignatureImage: string;
  schoolSignatoryName: string;
  schoolSignatoryTitle: string;
  schoolSignedAt: string | null;
  schoolSignatureImage: string;
  archivedAt: string | null;
  institution: SowInstitutionSummary;
  proposal: SowProposalSummary;
  scopeOfferings: SowScopeOffering[];
  scopeItems: SowScopeItem[];
  deliverables: SowDeliverable[];
  milestones: SowMilestone[];
  responsibilities: SowResponsibility[];
  teamMembers: SowTeamMember[];
  assessmentItems: SowAssessmentItem[];
  changeRequests: SowChangeRequest[];
  versions: SowVersionSummary[];
};

export type SowQuery = {
  search?: string;
  institutionId?: string;
  proposalId?: string;
  status?: PartnershipSowStatus | '';
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  includeArchived?: string;
  page?: number;
  pageSize?: number;
};

export type SowScopeItemInput = {
  id?: string;
  kind: PartnershipSowScopeKind;
  text: string;
  sortOrder?: number;
};

export type SowDeliverableInput = {
  id?: string;
  name: string;
  description?: string;
  owner?: string;
  dueDate?: string | null;
  acceptanceCriteria?: string;
  status?: PartnershipSowDeliverableStatus;
  sortOrder?: number;
};

export type SowMilestoneInput = {
  id?: string;
  name: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  owner?: string;
  status?: PartnershipSowMilestoneStatus;
  sortOrder?: number;
};

export type SowResponsibilityInput = {
  id?: string;
  activity: string;
  rootacaRole?: string;
  schoolRole?: string;
  sortOrder?: number;
};

export type SowTeamMemberInput = {
  id?: string;
  party: PartnershipSowParty;
  role: string;
  name?: string;
  responsibility?: string;
  contact?: string;
  assignedUserId?: string | null;
  sortOrder?: number;
};

export type SowAssessmentItemInput = {
  id?: string;
  name: string;
  responsibleParty?: string;
  frequency?: string;
  format?: string;
  dueDate?: string | null;
  sortOrder?: number;
};

export type SowWritePayload = {
  proposalId: string;
  title?: string;
  sowDate?: string | null;
  effectiveDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  preparedBy?: string;
  approvedBy?: string;
  purpose?: string;
  targetStudents?: string;
  deliveryModelNotes?: string;
  activitiesNotes?: string;
  projectsNotes?: string;
  assessmentNotes?: string;
  reportingNotes?: string;
  clientName?: string;
  clientAddress?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  attendanceExpectations?: string;
  minimumParticipation?: string;
  studentReplacementRules?: string;
  makeupSessionRules?: string;
  equipmentRequirements?: string;
  internetRequirements?: string;
  classroomLabRequirements?: string;
  studentDevicesRequirements?: string;
  softwareRequirements?: string;
  accountsAccessRequirements?: string;
  facultyLiaisonRequirements?: string;
  termsAndConditions?: string;
  rootacaSignatoryName?: string;
  rootacaSignatoryTitle?: string;
  schoolSignatoryName?: string;
  schoolSignatoryTitle?: string;
  scopeItems?: SowScopeItemInput[];
  deliverables?: SowDeliverableInput[];
  milestones?: SowMilestoneInput[];
  responsibilities?: SowResponsibilityInput[];
  teamMembers?: SowTeamMemberInput[];
  assessmentItems?: SowAssessmentItemInput[];
};

export type SowUpdatePayload = Partial<SowWritePayload>;

export type SowChangeRequestPayload = {
  requestedBy?: string;
  requestDate?: string | null;
  description: string;
  impact?: PartnershipSowChangeImpact;
};

export type SowDecideChangeRequestPayload = {
  decision: 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  changeSummary?: string;
};
