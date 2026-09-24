/**
 * School Partnership Proposal frontend models — aligned with Nest proposals API.
 *
 * Proposal = school-specific commercial offer built from one+ Offerings.
 * Line items keep frozen offering snapshots so sent proposals never drift
 * when Programs/Offerings later change. Pricing lives only here.
 */
import {
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
} from '../partnership.models';
import {
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
} from '../offerings/offering.models';

export type PartnershipProposalStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ARCHIVED';

export type PartnershipPricingModel =
  | 'PER_STUDENT'
  | 'PER_GROUP'
  | 'PER_SESSION'
  | 'PER_PROGRAM'
  | 'FIXED_PARTNERSHIP_FEE'
  | 'CUSTOM';

export type PartnershipDiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT';

export type ProposalInstitutionSummary = {
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

export type ProposalSnapshotItem = {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  label?: string;
  skillsDeveloped?: string;
  skills?: string;
  expectedOutput?: string;
  kind?: string;
  priority?: string;
  key?: string;
  enabled?: boolean;
  sortOrder?: number;
};

export type ProposalOfferingLine = {
  id: string;
  offeringId: string;
  sortOrder: number;
  snapshotProgramName: string;
  snapshotOfferingName: string;
  snapshotDeliveryFormat: PartnershipDeliveryFormat;
  snapshotTargetGrades: string | null;
  snapshotRecommendedLevel: PartnershipProgramLevel | null;
  snapshotDuration: number | null;
  snapshotDurationUnit: PartnershipDurationUnit | null;
  snapshotNumberOfSessions: number | null;
  snapshotSessionDurationMinutes: number | null;
  snapshotSessionFrequency: string | null;
  snapshotDeliveryMode: PartnershipDeliveryMode | null;
  snapshotGroupSizeMin: number | null;
  snapshotGroupSizeMax: number | null;
  snapshotNumberOfGroups: number | null;
  snapshotShortDescription: string;
  snapshotSchoolValue: string;
  snapshotStudentValue: string;
  snapshotCurriculumJson: ProposalSnapshotItem[] | null;
  snapshotProjectsJson: ProposalSnapshotItem[] | null;
  snapshotOutcomesJson: ProposalSnapshotItem[] | null;
  snapshotRequirementsJson: ProposalSnapshotItem[] | null;
  snapshotAssessmentJson: ProposalSnapshotItem[] | null;
  snapshotObjectivesJson: ProposalSnapshotItem[] | null;
  snapshotActivitiesJson: ProposalSnapshotItem[] | null;
  snapshotCapturedAt: string;
  customizedObjectives: string;
  customizedCurriculumNotes: string;
  specialRequirements: string;
  implementationNotes: string;
  deliveryNotes: string;
  pricingModel: PartnershipPricingModel;
  quantity: number | null;
  unitPrice: number | null;
  discountType: PartnershipDiscountType;
  discountValue: number | null;
  lineSubtotal: number | null;
};

export type ProposalTimelinePhase = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
};

export type ProposalCustomOutcome = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type ProposalVersionSummary = {
  id: string;
  version: string;
  note: string;
  createdAt: string;
};

export type ProposalListItem = {
  id: string;
  proposalNumber: string;
  title: string;
  institutionId: string;
  institutionName: string;
  status: PartnershipProposalStatus;
  offeringCount: number;
  offeringNames: string[];
  currency: string | null;
  grandTotal: number | null;
  proposalDate: string;
  validUntil: string | null;
  version: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnershipProposal = ProposalListItem & {
  preparedBy: string;
  executiveSummary: string;
  schoolChallenge: string;
  schoolObjective: string;
  targetStudentGroup: string;
  successCriteria: string;
  partnershipObjective: string;
  implementationApproach: string;
  timelineNotes: string;
  paymentTerms: string;
  nextSteps: string;
  termsAndConditions: string;
  startDate: string | null;
  endDate: string | null;
  taxEnabled: boolean;
  taxRate: number | null;
  headerDiscountType: PartnershipDiscountType;
  headerDiscountValue: number | null;
  subtotal: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  shareToken: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  archivedAt: string | null;
  institution: ProposalInstitutionSummary;
  offerings: ProposalOfferingLine[];
  timelinePhases: ProposalTimelinePhase[];
  customOutcomes: ProposalCustomOutcome[];
  versions: ProposalVersionSummary[];
};

export type ProposalQuery = {
  search?: string;
  institutionId?: string;
  status?: PartnershipProposalStatus | '';
  createdFrom?: string;
  createdTo?: string;
  validUntilFrom?: string;
  validUntilTo?: string;
  page?: number;
  pageSize?: number;
};

export type ProposalOfferingLineInput = {
  id?: string;
  offeringId: string;
  sortOrder?: number;
  customizedObjectives?: string;
  customizedCurriculumNotes?: string;
  specialRequirements?: string;
  implementationNotes?: string;
  deliveryNotes?: string;
  pricingModel: PartnershipPricingModel;
  quantity?: number | null;
  unitPrice?: number | null;
  discountType?: PartnershipDiscountType;
  discountValue?: number | null;
};

export type ProposalTimelinePhaseInput = {
  id?: string;
  title: string;
  description?: string;
  sortOrder?: number;
  startDate?: string | null;
  endDate?: string | null;
};

export type ProposalOutcomeInput = {
  id?: string;
  title: string;
  description?: string;
  sortOrder?: number;
};

export type ProposalWritePayload = {
  title: string;
  institutionId: string;
  proposalDate?: string;
  validUntil?: string | null;
  preparedBy?: string;
  executiveSummary?: string;
  schoolChallenge?: string;
  schoolObjective?: string;
  targetStudentGroup?: string;
  successCriteria?: string;
  partnershipObjective?: string;
  implementationApproach?: string;
  timelineNotes?: string;
  paymentTerms?: string;
  nextSteps?: string;
  termsAndConditions?: string;
  startDate?: string | null;
  endDate?: string | null;
  currency?: string | null;
  taxEnabled?: boolean;
  taxRate?: number | null;
  headerDiscountType?: PartnershipDiscountType;
  headerDiscountValue?: number | null;
  offerings?: ProposalOfferingLineInput[];
  timelinePhases?: ProposalTimelinePhaseInput[];
  customOutcomes?: ProposalOutcomeInput[];
};

export type ProposalUpdatePayload = Partial<ProposalWritePayload>;
