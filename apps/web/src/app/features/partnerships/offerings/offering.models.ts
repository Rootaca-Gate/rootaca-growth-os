/**
 * School Partnership Offering frontend models — aligned with the Nest
 * offerings API (apps/api/src/partnerships/offerings/dto/offering.dto.ts).
 *
 * An offering is a live-linked package of a program: override fields fall back
 * to the program when null, curriculum/projects are narrowed via selections
 * (empty => inherit ALL), and requirements are custom-or-inherited.
 */
import {
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramRequirementPriority,
  PartnershipProgramStatus,
  PartnershipProgramType,
} from '../partnership.models';

export type PartnershipOfferingStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type PartnershipDurationUnit = 'WEEKS' | 'MONTHS' | 'SEMESTER' | 'ANNUAL';

export type PartnershipDeliveryMode = 'ON_SITE' | 'ONLINE' | 'HYBRID';

export type OfferingListItem = {
  id: string;
  name: string;
  programId: string;
  programName: string;
  deliveryFormat: PartnershipDeliveryFormat;
  status: PartnershipOfferingStatus;
  /** Resolved (override or program). */
  targetGrades: string | null;
  /** Resolved (override or program). */
  recommendedLevel: PartnershipProgramLevel | null;
  duration: number | null;
  durationUnit: PartnershipDurationUnit | null;
  numberOfSessions: number | null;
  sessionDurationMinutes: number | null;
  displayOrder: number;
  updatedAt: string;
};

export type OfferingProgramSummary = {
  id: string;
  name: string;
  programType: PartnershipProgramType;
  shortDescription: string;
  status: PartnershipProgramStatus;
  targetAge: string | null;
  targetGrades: string | null;
  recommendedLevel: PartnershipProgramLevel | null;
};

export type ResolvedObjectiveOrOutcome = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type ResolvedModule = {
  id: string;
  title: string;
  description: string;
  skillsDeveloped: string;
  sortOrder: number;
};

export type ResolvedActivity = {
  id: string;
  name: string;
  description: string;
  skillsDeveloped: string;
  sortOrder: number;
};

export type ResolvedSampleProject = {
  id: string;
  name: string;
  description: string;
  skills: string;
  expectedOutput: string;
  sortOrder: number;
};

export type ResolvedRequirement = {
  id: string;
  kind: PartnershipProgramRequirementKind;
  priority: PartnershipProgramRequirementPriority;
  label: string;
  description: string;
  sortOrder: number;
};

export type ResolvedAssessmentMethod = {
  id: string;
  key: string;
  label: string;
  description: string;
  weight: number | null;
  enabled: boolean;
  sortOrder: number;
};

/** Fully resolved (inheritance-applied) school-facing view. */
export type OfferingResolved = {
  targetAge: string | null;
  targetGrades: string | null;
  recommendedLevel: PartnershipProgramLevel | null;
  learnerProfile: string | null;
  shortDescription: string;
  schoolValue: string;
  studentValue: string;
  objectives: ResolvedObjectiveOrOutcome[];
  curriculumModules: ResolvedModule[];
  activities: ResolvedActivity[];
  sampleProjects: ResolvedSampleProject[];
  includeFinalProject: boolean;
  finalProjectName: string | null;
  finalProjectDescription: string | null;
  finalProjectExpectedOutput: string | null;
  finalProjectSkills: string | null;
  finalProjectEvaluationMethod: string | null;
  assessmentMethods: ResolvedAssessmentMethod[];
  requirements: ResolvedRequirement[];
  requirementsInherited: boolean;
  outcomes: ResolvedObjectiveOrOutcome[];
};

export type OfferingSelection = {
  selectedModuleIds: string[];
  selectedProjectIds: string[];
  inheritAllModules: boolean;
  inheritAllProjects: boolean;
};

export type OfferingRequirementInput = {
  kind: PartnershipProgramRequirementKind;
  priority?: PartnershipProgramRequirementPriority;
  label: string;
  description?: string;
  sortOrder?: number;
};

/** Full offering response (create / update / get). */
export type PartnershipOffering = OfferingListItem & {
  // raw override fields
  targetAge: string | null;
  targetGrades: string | null;
  recommendedLevel: PartnershipProgramLevel | null;
  learnerProfile: string | null;

  // raw delivery / logistics
  duration: number | null;
  durationUnit: PartnershipDurationUnit | null;
  numberOfSessions: number | null;
  sessionDurationMinutes: number | null;
  sessionFrequency: string | null;
  deliveryMode: PartnershipDeliveryMode | null;
  locationNotes: string;
  groupSizeMin: number | null;
  groupSizeMax: number | null;
  numberOfGroups: number | null;
  instructorRequirement: string;
  coordinatorRequirement: string;

  // raw customization / assessment / reporting
  curriculumCustomizationNotes: string;
  projectCustomizationNotes: string;
  includeFinalProject: boolean;
  assessmentFrequency: string;
  includeInitialAssessment: boolean;
  includeMidAssessment: boolean;
  includeFinalAssessment: boolean;
  studentProgressReport: boolean;
  schoolSummaryReport: boolean;
  internalNotes: string;
  commercialNotes: string;
  createdAt: string;

  // composed sections
  program: OfferingProgramSummary;
  resolved: OfferingResolved;
  selection: OfferingSelection;
};

export type OfferingQuery = {
  search?: string;
  programId?: string;
  deliveryFormat?: PartnershipDeliveryFormat | '';
  status?: PartnershipOfferingStatus | '';
  recommendedLevel?: PartnershipProgramLevel | '';
  targetGrades?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Create payload. Nullable override / logistics fields accept `null` to
 * intentionally clear (inherit at read time). selectedModuleIds /
 * selectedProjectIds: omit or send `[]` to inherit ALL from the program.
 */
export type OfferingWritePayload = {
  name: string;
  programId: string;
  deliveryFormat: PartnershipDeliveryFormat;
  status?: PartnershipOfferingStatus;
  targetAge?: string | null;
  targetGrades?: string | null;
  recommendedLevel?: PartnershipProgramLevel | null;
  learnerProfile?: string | null;
  duration?: number | null;
  durationUnit?: PartnershipDurationUnit | null;
  numberOfSessions?: number | null;
  sessionDurationMinutes?: number | null;
  sessionFrequency?: string | null;
  deliveryMode?: PartnershipDeliveryMode | null;
  locationNotes?: string;
  groupSizeMin?: number | null;
  groupSizeMax?: number | null;
  numberOfGroups?: number | null;
  instructorRequirement?: string;
  coordinatorRequirement?: string;
  curriculumCustomizationNotes?: string;
  projectCustomizationNotes?: string;
  includeFinalProject?: boolean;
  assessmentFrequency?: string;
  includeInitialAssessment?: boolean;
  includeMidAssessment?: boolean;
  includeFinalAssessment?: boolean;
  studentProgressReport?: boolean;
  schoolSummaryReport?: boolean;
  internalNotes?: string;
  commercialNotes?: string;
  displayOrder?: number;
  selectedModuleIds?: string[];
  selectedProjectIds?: string[];
  requirements?: OfferingRequirementInput[];
};

/** Update payload — every field optional (PATCH semantics). */
export type OfferingUpdatePayload = Partial<OfferingWritePayload>;
