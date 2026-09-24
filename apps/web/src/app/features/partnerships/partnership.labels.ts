import {
  ActivityType,
  Curriculum,
  EducationLevel,
  FollowUpPriority,
  FollowUpStatus,
  InstitutionCategory,
  InstitutionGender,
  InstitutionStatus,
  InstitutionType,
  LeadPriority,
  LeadStatus,
  PartnershipDeliveryFormat,
  PartnershipProgramDocumentType,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramStatus,
  PartnershipProgramType,
  PartnershipType,
} from './partnership.models';
import {
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
  PartnershipOfferingStatus,
} from './offerings/offering.models';
import {
  PartnershipDiscountType,
  PartnershipPricingModel,
  PartnershipProposalStatus,
} from './proposals/proposal.models';
import {
  PartnershipSowDeliverableStatus,
  PartnershipSowMilestoneStatus,
  PartnershipSowStatus,
} from './sows/sow.models';
import {
  PartnershipDeliveryCheckpointKind,
  PartnershipDeliveryCheckpointStatus,
  PartnershipDeliveryCommType,
  PartnershipDeliveryDeliverableStatus,
  PartnershipDeliveryDocumentType,
  PartnershipDeliveryGroupStatus,
  PartnershipDeliveryIssueSeverity,
  PartnershipDeliveryIssueStatus,
  PartnershipDeliveryMilestoneStatus,
  PartnershipDeliveryPhaseStatus,
  PartnershipDeliveryRaidStatus,
  PartnershipDeliveryRaidType,
  PartnershipDeliveryReportStatus,
  PartnershipDeliveryReportType,
  PartnershipDeliverySessionStatus,
  PartnershipDeliveryStatus,
  PartnershipDeliveryTaskPriority,
  PartnershipDeliveryTaskStatus,
} from './delivery/delivery.models';

export const INSTITUTION_STATUSES: InstitutionStatus[] = [
  'PROSPECT',
  'ACTIVE',
  'INACTIVE',
  'DO_NOT_CONTACT',
  'ARCHIVED',
];

export const LEAD_STATUSES: LeadStatus[] = [
  'NEW',
  'QUALIFIED',
  'CONTACTED',
  'REPLIED',
  'MEETING_SCHEDULED',
  'MEETING_DONE',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'PARTNER',
  'NOT_INTERESTED',
  'NO_RESPONSE',
  'LOST',
];

export const LEAD_PRIORITIES: LeadPriority[] = ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];

export const INSTITUTION_TYPES: InstitutionType[] = [
  'SCHOOL',
  'EDUCATION_CENTER',
  'CODING_CENTER',
  'STEM_CENTER',
  'ROBOTICS_CENTER',
  'AI_CENTER',
  'LEARNING_CENTER',
  'AFTER_SCHOOL_CENTER',
  'MAKERSPACE',
  'OTHER',
];

export const INSTITUTION_CATEGORIES: InstitutionCategory[] = [
  'INTERNATIONAL',
  'MULTINATIONAL',
  'MULTI_INTERNATIONAL',
  'SEMI_INTERNATIONAL',
  'SEMI_NATIONAL',
  'NATIONAL',
  'PRIVATE',
  'LANGUAGE_SCHOOL',
  'STEM',
  'OTHER',
];

export const CURRICULA: Curriculum[] = [
  'BRITISH',
  'AMERICAN',
  'IB',
  'CANADIAN',
  'GERMAN',
  'FRENCH',
  'ITALIAN',
  'NATIONAL',
  'STEM',
  'OTHER',
  'UNKNOWN',
];

export const EDUCATION_LEVELS: EducationLevel[] = [
  'KG',
  'PRIMARY',
  'PREPARATORY',
  'SECONDARY',
  'MIXED',
  'HIGHER_EDUCATION',
  'OTHER',
  'UNKNOWN',
];

export const INSTITUTION_GENDERS: InstitutionGender[] = [
  'MALE',
  'FEMALE',
  'COED',
  'OTHER',
  'UNKNOWN',
];

export const PARTNERSHIP_TYPES: PartnershipType[] = [
  'SCHOOL_PARTNERSHIP',
  'AFTER_SCHOOL',
  'CODING_CLUB',
  'STEM_PROGRAM',
  'ROBOTICS_PROGRAM',
  'AI_PROGRAM',
  'SUMMER_CAMP',
  'WORKSHOP',
  'TECHNOLOGY_ACTIVITIES',
  'STUDENT_PROJECTS',
  'TEACHER_TRAINING',
  'PARENT_WORKSHOP',
  'ONLINE_PROGRAM',
  'HYBRID_PROGRAM',
  'OTHER',
];

export const ACTIVITY_TYPES: ActivityType[] = [
  'EMAIL',
  'PHONE_CALL',
  'WHATSAPP',
  'MEETING',
  'NOTE',
  'FOLLOW_UP',
  'RESEARCH',
  'OTHER',
];

export const FOLLOWUP_STATUSES: FollowUpStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED'];
export const FOLLOWUP_PRIORITIES: FollowUpPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

export const PROGRAM_TYPES: PartnershipProgramType[] = ['TECHNICAL', 'EDUCATIONAL'];

export const PROGRAM_STATUSES: PartnershipProgramStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

export const PROGRAM_LEVELS: PartnershipProgramLevel[] = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'BEGINNER_INTERMEDIATE',
  'INTERMEDIATE_ADVANCED',
];

export const DELIVERY_FORMATS: PartnershipDeliveryFormat[] = [
  'WORKSHOP',
  'AFTER_SCHOOL',
  'CODING_CLUB',
  'SEMESTER',
  'ANNUAL',
  'CUSTOMIZED',
];

export const PROGRAM_DOCUMENT_TYPES: PartnershipProgramDocumentType[] = [
  'PROGRAM_PROFILE',
  'CURRICULUM_PDF',
  'ASSESSMENT_TEMPLATE',
  'INSTRUCTOR_GUIDE',
  'SAMPLE_PROJECT',
  'OTHER',
];

export const REQUIREMENT_KINDS: PartnershipProgramRequirementKind[] = ['EQUIPMENT', 'SCHOOL'];

export const OFFERING_STATUSES: PartnershipOfferingStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

export const DURATION_UNITS: PartnershipDurationUnit[] = ['WEEKS', 'MONTHS', 'SEMESTER', 'ANNUAL'];

export const DELIVERY_MODES: PartnershipDeliveryMode[] = ['ON_SITE', 'ONLINE', 'HYBRID'];

export const PROPOSAL_STATUSES: PartnershipProposalStatus[] = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'ARCHIVED',
];

export const PRICING_MODELS: PartnershipPricingModel[] = [
  'PER_STUDENT',
  'PER_GROUP',
  'PER_SESSION',
  'PER_PROGRAM',
  'FIXED_PARTNERSHIP_FEE',
  'CUSTOM',
];

export const DISCOUNT_TYPES: PartnershipDiscountType[] = ['NONE', 'PERCENTAGE', 'FIXED_AMOUNT'];

export const SOW_STATUSES: PartnershipSowStatus[] = [
  'DRAFT',
  'PENDING_SIGNATURE',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
];

export const DELIVERABLE_STATUSES: PartnershipSowDeliverableStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'ACCEPTED',
];

export const MILESTONE_STATUSES: PartnershipSowMilestoneStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DELAYED',
  'CANCELLED',
];

export const DELIVERY_STATUSES: PartnershipDeliveryStatus[] = [
  'PREPARING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
];

export const DELIVERY_PHASE_STATUSES: PartnershipDeliveryPhaseStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
];

export const DELIVERY_MILESTONE_STATUSES: PartnershipDeliveryMilestoneStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
];

export const DELIVERY_TASK_PRIORITIES: PartnershipDeliveryTaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

export const DELIVERY_TASK_STATUSES: PartnershipDeliveryTaskStatus[] = [
  'TO_DO',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
];

export const DELIVERY_SESSION_STATUSES: PartnershipDeliverySessionStatus[] = [
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED',
];

export const DELIVERY_DELIVERABLE_STATUSES: PartnershipDeliveryDeliverableStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED',
];

export const DELIVERY_ISSUE_SEVERITIES: PartnershipDeliveryIssueSeverity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

export const DELIVERY_ISSUE_STATUSES: PartnershipDeliveryIssueStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

export const DELIVERY_RAID_TYPES: PartnershipDeliveryRaidType[] = [
  'RISK',
  'ASSUMPTION',
  'ISSUE',
  'DEPENDENCY',
];

export const DELIVERY_RAID_STATUSES: PartnershipDeliveryRaidStatus[] = [
  'OPEN',
  'MITIGATING',
  'RESOLVED',
  'CLOSED',
];

export const DELIVERY_COMM_TYPES: PartnershipDeliveryCommType[] = [
  'MEETING',
  'EMAIL',
  'CALL',
  'WHATSAPP',
  'OTHER',
];

export const DELIVERY_CHECKPOINT_KINDS: PartnershipDeliveryCheckpointKind[] = [
  'KICKOFF',
  'MIDPOINT_REVIEW',
  'PROJECT_REVIEW',
  'FINAL_REVIEW',
  'CUSTOM',
];

export const DELIVERY_CHECKPOINT_STATUSES: PartnershipDeliveryCheckpointStatus[] = [
  'PLANNED',
  'COMPLETED',
  'CANCELLED',
];

export const DELIVERY_REPORT_TYPES: PartnershipDeliveryReportType[] = [
  'STUDENT_PROGRESS',
  'GROUP_PROGRESS',
  'SCHOOL_SUMMARY',
  'PROGRAM_COMPLETION',
  'FINAL_PARTNERSHIP',
];

export const DELIVERY_REPORT_STATUSES: PartnershipDeliveryReportStatus[] = [
  'DRAFT',
  'GENERATED',
  'SHARED',
  'FINAL',
];

export const DELIVERY_DOCUMENT_TYPES: PartnershipDeliveryDocumentType[] = [
  'SOW',
  'PROPOSAL',
  'SESSION_MATERIAL',
  'STUDENT_REPORT',
  'PROJECT_FILE',
  'SCHOOL_REPORT',
  'FINAL_REPORT',
  'OTHER',
];

export const DELIVERY_GROUP_STATUSES: PartnershipDeliveryGroupStatus[] = [
  'PLANNED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
];

export const REQUIREMENT_PRIORITIES = ['REQUIRED', 'RECOMMENDED'] as const;

export const PROGRAM_DOCUMENT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

export const DEFAULT_PROGRAM_ASSESSMENTS = [
  {
    key: 'INITIAL',
    label: 'Initial assessment',
    description:
      'Baseline check of prior exposure, comfort with tools, and learning habits.',
    enabled: true,
    sortOrder: 0,
  },
  {
    key: 'PRACTICAL',
    label: 'Practical labs',
    description:
      'In-class exercises scored on completion, correctness, and mentor observation.',
    enabled: true,
    sortOrder: 1,
  },
  {
    key: 'ASSIGNMENTS',
    label: 'Assignments',
    description: 'Short take-home tasks reinforcing the current module.',
    enabled: true,
    sortOrder: 2,
  },
  {
    key: 'PROJECT',
    label: 'Studio projects',
    description: 'ROOTACA catalog studio projects with defined expected outputs.',
    enabled: true,
    sortOrder: 3,
  },
  {
    key: 'FINAL',
    label: 'Final capstone',
    description: 'End-of-program deliverable reviewed with a structured rubric.',
    enabled: true,
    sortOrder: 4,
  },
] as const;

export type ProgramEnumCategory =
  | 'programType'
  | 'status'
  | 'level'
  | 'deliveryFormat'
  | 'documentType'
  | 'documentStatus'
  | 'requirementKind'
  | 'requirementPriority';

export const INSTITUTION_SORT_FIELDS = [
  'name',
  'createdAt',
  'updatedAt',
  'status',
  'leadPriority',
  'governorate',
  'city',
] as const;

/** Humanize ENUM_CASE for display when i18n key missing. */
export function enumLabel(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

/** Resolve program enum labels via i18n, falling back to {@link enumLabel}. */
export function programEnumLabel(
  translate: (key: string) => string,
  category: ProgramEnumCategory,
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }
  const key = `partnerships.programEnums.${category}.${value}`;
  const translated = translate(key);
  return translated !== key ? translated : enumLabel(value);
}

export type OfferingEnumCategory = 'status' | 'durationUnit' | 'deliveryMode';

/** Resolve offering-specific enum labels via i18n, falling back to {@link enumLabel}. */
export function offeringEnumLabel(
  translate: (key: string) => string,
  category: OfferingEnumCategory,
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }
  const key = `partnerships.offeringEnums.${category}.${value}`;
  const translated = translate(key);
  return translated !== key ? translated : enumLabel(value);
}

export type ProposalEnumCategory = 'status' | 'pricingModel' | 'discountType';

/** Resolve proposal-specific enum labels via i18n, falling back to {@link enumLabel}. */
export function proposalEnumLabel(
  translate: (key: string) => string,
  category: ProposalEnumCategory,
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }
  const key = `partnerships.proposalEnums.${category}.${value}`;
  const translated = translate(key);
  return translated !== key ? translated : enumLabel(value);
}

export type SowEnumCategory =
  | 'status'
  | 'deliverableStatus'
  | 'milestoneStatus'
  | 'party'
  | 'scopeKind'
  | 'changeImpact'
  | 'changeStatus';

/** Resolve SOW-specific enum labels via i18n, falling back to {@link enumLabel}. */
export function sowEnumLabel(
  translate: (key: string) => string,
  category: SowEnumCategory,
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }
  const key = `partnerships.sowEnums.${category}.${value}`;
  const translated = translate(key);
  return translated !== key ? translated : enumLabel(value);
}

export type DeliveryEnumCategory =
  | 'status'
  | 'phaseStatus'
  | 'milestoneStatus'
  | 'taskPriority'
  | 'taskStatus'
  | 'sessionStatus'
  | 'attendanceStatus'
  | 'deliverableStatus'
  | 'issueSeverity'
  | 'issueStatus'
  | 'raidType'
  | 'raidStatus'
  | 'commType'
  | 'checkpointKind'
  | 'checkpointStatus'
  | 'reportType'
  | 'reportStatus'
  | 'documentType'
  | 'groupStatus';

/** Resolve delivery-specific enum labels via i18n, falling back to {@link enumLabel}. */
export function deliveryEnumLabel(
  translate: (key: string) => string,
  category: DeliveryEnumCategory,
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }
  const key = `partnerships.deliveryEnums.${category}.${value}`;
  const translated = translate(key);
  return translated !== key ? translated : enumLabel(value);
}

export const REPORT_TYPES = [
  'STUDENT_PROGRESS',
  'GROUP_PROGRESS',
  'SCHOOL_SUMMARY',
  'PROGRAM_COMPLETION',
  'FINAL_PARTNERSHIP',
] as const;

export const REPORT_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;

export const REPORT_RECOMMENDATION_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type ReportEnumCategory = 'type' | 'status' | 'priority' | 'trackStatus';

export function reportEnumLabel(
  translate: (key: string) => string,
  category: ReportEnumCategory,
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }
  const key = `partnerships.reportEnums.${category}.${value}`;
  const translated = translate(key);
  return translated !== key ? translated : enumLabel(value);
}
