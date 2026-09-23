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
  PartnershipType,
} from './partnership.models';

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
