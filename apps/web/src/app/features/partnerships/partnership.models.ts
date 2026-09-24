/** Partnership CRM frontend models — aligned with Nest PARTNERSHIP_API.md */

export type InstitutionStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'DO_NOT_CONTACT' | 'ARCHIVED';

export type LeadStatus =
  | 'NEW'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_DONE'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'PARTNER'
  | 'NOT_INTERESTED'
  | 'NO_RESPONSE'
  | 'LOST';

export type LeadPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type InstitutionType =
  | 'SCHOOL'
  | 'EDUCATION_CENTER'
  | 'CODING_CENTER'
  | 'STEM_CENTER'
  | 'ROBOTICS_CENTER'
  | 'AI_CENTER'
  | 'LEARNING_CENTER'
  | 'AFTER_SCHOOL_CENTER'
  | 'MAKERSPACE'
  | 'OTHER';

export type InstitutionCategory =
  | 'INTERNATIONAL'
  | 'MULTINATIONAL'
  | 'MULTI_INTERNATIONAL'
  | 'SEMI_INTERNATIONAL'
  | 'SEMI_NATIONAL'
  | 'NATIONAL'
  | 'PRIVATE'
  | 'LANGUAGE_SCHOOL'
  | 'STEM'
  | 'OTHER';

export type Curriculum =
  | 'BRITISH'
  | 'AMERICAN'
  | 'IB'
  | 'CANADIAN'
  | 'GERMAN'
  | 'FRENCH'
  | 'ITALIAN'
  | 'NATIONAL'
  | 'STEM'
  | 'OTHER'
  | 'UNKNOWN';

export type EducationLevel =
  | 'KG'
  | 'PRIMARY'
  | 'PREPARATORY'
  | 'SECONDARY'
  | 'MIXED'
  | 'HIGHER_EDUCATION'
  | 'OTHER'
  | 'UNKNOWN';

export type InstitutionGender = 'MALE' | 'FEMALE' | 'COED' | 'OTHER' | 'UNKNOWN';

export type PartnershipType =
  | 'SCHOOL_PARTNERSHIP'
  | 'AFTER_SCHOOL'
  | 'CODING_CLUB'
  | 'STEM_PROGRAM'
  | 'ROBOTICS_PROGRAM'
  | 'AI_PROGRAM'
  | 'SUMMER_CAMP'
  | 'WORKSHOP'
  | 'TECHNOLOGY_ACTIVITIES'
  | 'STUDENT_PROJECTS'
  | 'TEACHER_TRAINING'
  | 'PARENT_WORKSHOP'
  | 'ONLINE_PROGRAM'
  | 'HYBRID_PROGRAM'
  | 'OTHER';

export type ActivityType =
  | 'EMAIL'
  | 'PHONE_CALL'
  | 'WHATSAPP'
  | 'MEETING'
  | 'NOTE'
  | 'FOLLOW_UP'
  | 'RESEARCH'
  | 'OTHER';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type FollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type SourceType =
  | 'OFFICIAL_WEBSITE'
  | 'FACEBOOK'
  | 'GOOGLE_MAPS'
  | 'LINKEDIN'
  | 'EDUCATION_DIRECTORY'
  | 'MANUAL_RESEARCH'
  | 'IMPORT'
  | 'OTHER';

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type PotentialDuplicate = {
  id: string;
  name: string;
  city: string | null;
  website: string | null;
  phone: string | null;
  matchedOn: string[];
};

export type InstitutionPrimaryContact = {
  id: string;
  name: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
};

export type Institution = {
  id: string;
  name: string;
  arabicName: string | null;
  englishName: string | null;
  institutionType: InstitutionType | null;
  institutionCategory: InstitutionCategory | null;
  curriculum: Curriculum | null;
  educationLevel: EducationLevel | null;
  gender: InstitutionGender | null;
  ageRange: string | null;
  governorate: string | null;
  city: string | null;
  district: string | null;
  fullAddress: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  generalEmail: string | null;
  admissionsEmail: string | null;
  contactEmail: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  googleMapsUrl: string | null;
  hasCoding: boolean;
  hasRobotics: boolean;
  hasStem: boolean;
  hasAi: boolean;
  hasTechClub: boolean;
  hasAfterSchool: boolean;
  hasSummerCamp: boolean;
  hasMakerspace: boolean;
  partnershipType: PartnershipType | null;
  leadPriority: LeadPriority;
  leadPriorityReason: string | null;
  status: InstitutionStatus;
  notes: string;
  branchName: string | null;
  parentInstitutionId: string | null;
  sourceId: string | null;
  lastVerifiedAt: string | null;
  deletedAt: string | null;
  deletedById: string | null;
  createdAt: string;
  updatedAt: string;
  primaryContact: InstitutionPrimaryContact | null;
  lastActivityAt: string | null;
  nextFollowUpAt: string | null;
  openFollowUpsCount: number;
  activeLeadsCount: number;
  potentialDuplicates?: PotentialDuplicate[];
};

export type InstitutionWritePayload = Partial<
  Omit<
    Institution,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'deletedById'
    | 'lastVerifiedAt'
    | 'potentialDuplicates'
    | 'primaryContact'
    | 'lastActivityAt'
    | 'nextFollowUpAt'
    | 'openFollowUpsCount'
    | 'activeLeadsCount'
  >
> & { name: string; allowClear?: boolean };

export type InstitutionQuery = {
  search?: string;
  status?: InstitutionStatus | '';
  institutionType?: InstitutionType | '';
  institutionCategory?: InstitutionCategory | '';
  curriculum?: Curriculum | '';
  educationLevel?: EducationLevel | '';
  governorate?: string;
  city?: string;
  leadPriority?: LeadPriority | '';
  hasCoding?: boolean;
  hasRobotics?: boolean;
  hasStem?: boolean;
  hasAi?: boolean;
  hasTechClub?: boolean;
  hasAfterSchool?: boolean;
  hasSummerCamp?: boolean;
  hasMakerspace?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
  hasDecisionMaker?: boolean;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status' | 'leadPriority' | 'governorate' | 'city';
  sortOrder?: 'asc' | 'desc';
};

export type Contact = {
  id: string;
  institutionId: string;
  institutionName: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  isPublicContact: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactWritePayload = {
  institutionId: string;
  firstName: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  linkedin?: string;
  isPrimary?: boolean;
  isDecisionMaker?: boolean;
  isPublicContact?: boolean;
  notes?: string;
  allowClear?: boolean;
};

export type ContactQuery = {
  institutionId?: string;
  jobTitle?: string;
  isDecisionMaker?: boolean;
  isPrimary?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'fullName' | 'createdAt' | 'updatedAt' | 'jobTitle';
  sortOrder?: 'asc' | 'desc';
};

export type Lead = {
  id: string;
  institutionId: string;
  institutionName: string | null;
  primaryContactId: string | null;
  primaryContactName: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  sourceId: string | null;
  qualificationReason: string | null;
  estimatedStudentCount: number | null;
  estimatedOpportunity: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  ownerId: string | null;
  ownerName: string | null;
  lastActivityAt: string | null;
  nextFollowUpDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadWritePayload = {
  institutionId: string;
  primaryContactId?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  sourceId?: string;
  qualificationReason?: string;
  estimatedStudentCount?: number;
  estimatedOpportunity?: string;
  nextAction?: string;
  nextActionDate?: string;
  ownerId?: string;
};

export type LeadUpdatePayload = Omit<Partial<LeadWritePayload>, 'institutionId'>;

export type LeadQuery = {
  institutionId?: string;
  status?: LeadStatus | '';
  priority?: LeadPriority | '';
  ownerId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'nextActionDate' | 'status' | 'priority';
  sortOrder?: 'asc' | 'desc';
};

export type Activity = {
  id: string;
  institutionId: string;
  contactId: string | null;
  leadId: string | null;
  activityType: ActivityType;
  subject: string;
  description: string;
  activityDate: string;
  createdById: string;
  createdByName: string | null;
  createdAt: string;
};

export type ActivityWritePayload = {
  institutionId: string;
  contactId?: string;
  leadId?: string;
  activityType: ActivityType;
  subject: string;
  description?: string;
  activityDate?: string;
};

export type ActivityQuery = {
  institutionId?: string;
  contactId?: string;
  leadId?: string;
  activityType?: ActivityType | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type FollowUp = {
  id: string;
  institutionId: string;
  contactId: string | null;
  leadId: string | null;
  title: string;
  description: string;
  dueDate: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  assignedToId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FollowUpWritePayload = {
  institutionId: string;
  contactId?: string;
  leadId?: string;
  title: string;
  description?: string;
  dueDate: string;
  priority?: FollowUpPriority;
  assignedToId?: string;
};

export type FollowUpUpdatePayload = Partial<FollowUpWritePayload> & {
  status?: FollowUpStatus;
  complete?: boolean;
};

export type FollowUpQuery = {
  institutionId?: string;
  status?: FollowUpStatus | '';
  priority?: FollowUpPriority | '';
  assignedToId?: string;
  dueDate?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
};

export type Note = {
  id: string;
  institutionId: string;
  contactId: string | null;
  leadId: string | null;
  content: string;
  createdById: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteWritePayload = {
  content: string;
  contactId?: string;
  leadId?: string;
};

export type TimelineItem = {
  id: string;
  type: string;
  date: string;
  title: string;
  description: string;
  createdBy: string | null;
  metadata: Record<string, unknown> | null;
};

export type NamedCount = { key: string; count: number };

export type PartnershipDashboard = {
  totalInstitutions: number;
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  repliedLeads: number;
  meetings: number;
  proposals: number;
  partners: number;
  notInterested: number;
  noResponse: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
  proposalsTotal: number;
  proposalsAccepted: number;
  sowsActive: number;
  deliveriesActive: number;
  reportsPublished: number;
  renewalsOpen: number;
  attentionProposalFollowUp: number;
  attentionSowPendingSignature: number;
  attentionDeliveryPaused: number;
  attentionReportInReview: number;
  attentionRenewalPlanning: number;
  institutionsByGovernorate: NamedCount[];
  institutionsByType: NamedCount[];
  leadsByStatus: NamedCount[];
  leadsByPriority: NamedCount[];
};

export type PartnershipSearchHit = {
  id: string;
  label: string;
  subtitle: string;
  path: string;
};

export type PartnershipSearchGroup = {
  group:
    | 'institutions'
    | 'contacts'
    | 'leads'
    | 'proposals'
    | 'sows'
    | 'deliveries'
    | 'reports'
    | 'renewals'
    | string;
  items: PartnershipSearchHit[];
};

export type PartnershipSearchResult = {
  query: string;
  groups: PartnershipSearchGroup[];
};

export type Source = {
  id: string;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ImportStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

export type ImportRowDecision = 'PENDING' | 'SKIP' | 'MERGE' | 'IMPORT' | 'IMPORT_ANYWAY';
export type ImportMatchConfidence = 'NONE' | 'POSSIBLE' | 'EXACT';
export type ImportRowResult =
  | 'PENDING'
  | 'IMPORTED'
  | 'MERGED'
  | 'SKIPPED'
  | 'FAILED'
  | 'INVALID';

export type ImportSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newInstitutions: number;
  exactDuplicates: number;
  possibleDuplicates: number;
  csvDuplicates: number;
  needsReview: number;
};

export type ImportResultCounts = {
  imported: number;
  merged: number;
  skipped: number;
  failed: number;
  invalid: number;
};

export type ImportJob = {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedById: string;
  uploadedByName: string | null;
  status: ImportStatus;
  headers: string[];
  mapping: Record<string, string | null>;
  summary: ImportSummary | null;
  result: ImportResultCounts | null;
  errorMessage: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type ImportPreviewRow = {
  rowNumber: number;
  name: string | null;
  governorate: string | null;
  city: string | null;
  website: string | null;
  phone: string | null;
  isValid: boolean;
  validationErrors: Array<{ field: string; reason: string }>;
  matchConfidence: ImportMatchConfidence;
  matchReasons: string[];
  matchedInstitutionId: string | null;
  matchedInstitutionName: string | null;
  csvDuplicateOfRow: number | null;
  decision: ImportRowDecision;
  resultStatus: ImportRowResult;
  resultError: string | null;
  resultInstitutionId: string | null;
};

export type ImportPreviewResponse = {
  job: ImportJob;
  suggestedMapping: Record<string, string | null>;
  crmFields: string[];
  rows: ImportPreviewRow[];
  rowsTotal: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ImportRowFilter = 'all' | 'valid' | 'invalid' | 'duplicates' | 'new' | 'needs_review';

export type ResearchJobStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ResearchStatus =
  | 'DISCOVERED'
  | 'ENRICHING'
  | 'READY_FOR_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'IMPORTED'
  | 'STALE';

export type ResearchVerificationStatus = 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'STALE';
export type ResearchDuplicateStatus = 'NEW' | 'EXACT_MATCH' | 'POSSIBLE_MATCH' | 'REVIEWED_DUPLICATE';
export type ResearchSourceType =
  | 'SEARCH_ENGINE'
  | 'OFFICIAL_WEBSITE'
  | 'PUBLIC_DIRECTORY'
  | 'PUBLIC_MAPS_LISTING'
  | 'PUBLIC_SOCIAL_PAGE'
  | 'GOVERNMENT_LISTING'
  | 'OSM'
  | 'MANUAL'
  | 'OTHER';
export type ResearchDiscoveryMode = 'OVERPASS' | 'WEB_SEARCH' | 'HYBRID';
export type ResearchLanguage = 'EN' | 'AR' | 'BOTH';
export type ResearchDataQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export type ResearchTechnology = {
  hasCoding?: boolean;
  hasRobotics?: boolean;
  hasStem?: boolean;
  hasAi?: boolean;
  hasTechClub?: boolean;
  hasAfterSchool?: boolean;
  hasSummerCamp?: boolean;
  hasMakerspace?: boolean;
};

export type ResearchEvidence = {
  id: string;
  field: string;
  value: string;
  sourceUrl: string | null;
  sourceType: ResearchSourceType | null;
  discoveredAt: string;
  confidence: ResearchDataQuality;
};

export type ResearchCandidate = {
  id: string;
  jobId: string | null;
  discoveredName: string;
  discoveredNameAr: string | null;
  discoveredNameEn: string | null;
  governorate: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  osmType: string | null;
  osmId: string | null;
  osmUrl: string | null;
  institutionType: InstitutionType | null;
  institutionCategory: InstitutionCategory | null;
  curriculum: Curriculum | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  whatsapp: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  googleMapsUrl: string | null;
  hasCoding: boolean;
  hasRobotics: boolean;
  hasStem: boolean;
  hasAi: boolean;
  hasTechClub: boolean;
  hasAfterSchool: boolean;
  hasSummerCamp: boolean;
  hasMakerspace: boolean;
  sourceType: ResearchSourceType;
  sourceName: string | null;
  sourceUrl: string | null;
  officialWebsite?: string | null;
  discoverySource?: { label: string; url: string | null; type: string };
  evidenceSources?: Array<{ label: string; url: string | null; type: string | null }>;
  enrichmentAttempted?: boolean;
  discoveredAt: string;
  lastCheckedAt: string | null;
  researchStatus: ResearchStatus;
  verificationStatus: ResearchVerificationStatus;
  dataQuality: ResearchDataQuality;
  duplicateStatus: ResearchDuplicateStatus;
  duplicateOfCandidateId: string | null;
  matchedInstitutionId: string | null;
  notes: string;
  evidence?: ResearchEvidence[];
  matchReasons?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ResearchJob = {
  id: string;
  name: string;
  governorate: string | null;
  city: string | null;
  district: string | null;
  institutionType: InstitutionType | null;
  institutionCategory: InstitutionCategory | null;
  curriculum: Curriculum | null;
  language: ResearchLanguage;
  technology: ResearchTechnology;
  queries: Array<{ language: string; template: string; text: string }>;
  maxResultsPerQuery: number;
  maxQueries: number;
  maxCandidates: number;
  discoveryMode: string | null;
  status: ResearchJobStatus;
  statistics: Record<string, number> | null;
  errorMessage: string | null;
  providerNote: string | null;
  requestedById: string;
  requestedByName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResearchDashboard = {
  activeJobs: number;
  candidates: number;
  needsReview: number;
  possibleDuplicates: number;
  verified: number;
  imported: number;
  rejected: number;
  stale: number;
  availableProviders: string[];
  automatedDiscoveryConfigured: boolean;
  governorates: string[];
  providers?: Array<{
    type: string;
    configured: boolean;
    enabled: boolean;
    requiresApiKey?: boolean;
    provider?: string;
    role?: string;
    free?: boolean;
  }>;
};

export type ResearchProvidersStatus = {
  providers: Array<{
    type: string;
    configured: boolean;
    enabled: boolean;
    requiresKey?: boolean;
    provider?: string;
    role?: string;
    free?: boolean;
  }>;
  automatedDiscoveryConfigured: boolean;
  engine: string;
  enrichmentEnabled: boolean;
  discoveryMode?: string;
  overpass?: {
    enabled: boolean;
    configured: boolean;
    requiresKey: boolean;
    provider: string;
  };
  serper?: {
    enabled: boolean;
    configured: boolean;
    requiresKey: boolean;
    provider: string;
  };
};

export type ResearchJobWritePayload = {
  name: string;
  governorate?: string;
  city?: string;
  district?: string;
  institutionType?: InstitutionType;
  institutionCategory?: InstitutionCategory;
  curriculum?: Curriculum;
  language?: ResearchLanguage;
  technology?: ResearchTechnology;
  maxResultsPerQuery?: number;
  maxQueries?: number;
  maxCandidates?: number;
  discoveryMode?: ResearchDiscoveryMode;
};

export type PartnershipProgramType = 'TECHNICAL' | 'EDUCATIONAL';

export type PartnershipProgramStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type PartnershipProgramLevel =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'BEGINNER_INTERMEDIATE'
  | 'INTERMEDIATE_ADVANCED';

export type PartnershipDeliveryFormat =
  | 'WORKSHOP'
  | 'AFTER_SCHOOL'
  | 'CODING_CLUB'
  | 'SEMESTER'
  | 'ANNUAL'
  | 'CUSTOMIZED';

export type PartnershipProgramRequirementKind = 'EQUIPMENT' | 'SCHOOL';

export type PartnershipProgramRequirementPriority = 'REQUIRED' | 'RECOMMENDED';

export type PartnershipProgramDocumentType =
  | 'CURRICULUM_PDF'
  | 'PROGRAM_PROFILE'
  | 'INSTRUCTOR_GUIDE'
  | 'SAMPLE_PROJECT'
  | 'ASSESSMENT_TEMPLATE'
  | 'OTHER';

export type PartnershipProgramDocumentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type ProgramObjective = {
  id?: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type ProgramCurriculumModule = {
  id?: string;
  title: string;
  description: string;
  skillsDeveloped: string;
  sortOrder: number;
};

export type ProgramActivityItem = {
  id?: string;
  name: string;
  description: string;
  skillsDeveloped: string;
  sortOrder: number;
};

export type ProgramSampleProject = {
  id?: string;
  name: string;
  description: string;
  skills: string;
  expectedOutput: string;
  sortOrder: number;
};

export type ProgramAssessmentMethod = {
  id?: string;
  key: string;
  label: string;
  description: string;
  weight: number | null;
  enabled: boolean;
  sortOrder: number;
};

export type ProgramRequirement = {
  id?: string;
  kind: PartnershipProgramRequirementKind;
  priority: PartnershipProgramRequirementPriority;
  label: string;
  description: string;
  sortOrder: number;
};

export type ProgramOutcome = {
  id?: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type ProgramDocument = {
  id?: string;
  documentType: PartnershipProgramDocumentType;
  title: string;
  url: string | null;
  version: string;
  status: PartnershipProgramDocumentStatus;
  notes: string;
  sortOrder: number;
  uploadedAt: string;
};

export type ProgramListItem = {
  id: string;
  name: string;
  programType: PartnershipProgramType;
  targetGrades: string | null;
  recommendedLevel: PartnershipProgramLevel | null;
  deliveryFormats: PartnershipDeliveryFormat[];
  status: PartnershipProgramStatus;
  displayOrder: number;
};

export type PartnershipProgram = ProgramListItem & {
  shortDescription: string;
  targetAge: string | null;
  recommendedStudentProfile: string;
  internalNotes: string;
  schoolValue: string;
  studentValue: string;
  finalProjectName: string | null;
  finalProjectDescription: string | null;
  finalProjectExpectedOutput: string | null;
  finalProjectSkills: string | null;
  finalProjectEvaluationMethod: string | null;
  objectives: ProgramObjective[];
  curriculumModules: ProgramCurriculumModule[];
  activities: ProgramActivityItem[];
  sampleProjects: ProgramSampleProject[];
  assessmentMethods: ProgramAssessmentMethod[];
  requirements: ProgramRequirement[];
  outcomes: ProgramOutcome[];
  documents: ProgramDocument[];
  createdAt: string;
  updatedAt: string;
};

export type ProgramQuery = {
  search?: string;
  programType?: PartnershipProgramType | '';
  recommendedLevel?: PartnershipProgramLevel | '';
  status?: PartnershipProgramStatus | '';
  targetGrade?: string;
  page?: number;
  pageSize?: number;
};

export type ProgramWritePayload = {
  name: string;
  shortDescription?: string;
  programType: PartnershipProgramType;
  targetAge?: string;
  targetGrades?: string;
  recommendedLevel?: PartnershipProgramLevel | null;
  recommendedStudentProfile?: string;
  status?: PartnershipProgramStatus;
  displayOrder?: number;
  internalNotes?: string;
  schoolValue?: string;
  studentValue?: string;
  finalProjectName?: string;
  finalProjectDescription?: string;
  finalProjectExpectedOutput?: string;
  finalProjectSkills?: string;
  finalProjectEvaluationMethod?: string;
  objectives?: Array<{
    title: string;
    description?: string;
    sortOrder?: number;
  }>;
  curriculumModules?: Array<{
    title: string;
    description?: string;
    skillsDeveloped?: string;
    sortOrder?: number;
  }>;
  activities?: Array<{
    name: string;
    description?: string;
    skillsDeveloped?: string;
    sortOrder?: number;
  }>;
  sampleProjects?: Array<{
    name: string;
    description?: string;
    skills?: string;
    expectedOutput?: string;
    sortOrder?: number;
  }>;
  assessmentMethods?: Array<{
    key: string;
    label: string;
    description?: string;
    weight?: number | null;
    enabled?: boolean;
    sortOrder?: number;
  }>;
  deliveryFormats?: PartnershipDeliveryFormat[];
  requirements?: Array<{
    kind: PartnershipProgramRequirementKind;
    priority?: PartnershipProgramRequirementPriority;
    label: string;
    description?: string;
    sortOrder?: number;
  }>;
  outcomes?: Array<{
    title: string;
    description?: string;
    sortOrder?: number;
  }>;
  documents?: Array<{
    documentType: PartnershipProgramDocumentType;
    title: string;
    url?: string;
    version?: string;
    status?: PartnershipProgramDocumentStatus;
    notes?: string;
    sortOrder?: number;
    uploadedAt?: string;
  }>;
};

export type ProgramUpdatePayload = Partial<Omit<ProgramWritePayload, 'name'>> & { name?: string };

export type ResearchCandidateWritePayload = {
  discoveredName: string;
  discoveredNameAr?: string;
  discoveredNameEn?: string;
  jobId?: string;
  governorate?: string;
  city?: string;
  district?: string;
  address?: string;
  institutionType?: InstitutionType;
  institutionCategory?: InstitutionCategory;
  curriculum?: Curriculum;
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  website?: string;
  sourceType?: ResearchSourceType;
  sourceName?: string;
  sourceUrl?: string;
  notes?: string;
  hasCoding?: boolean;
  hasRobotics?: boolean;
  hasStem?: boolean;
  hasAi?: boolean;
};
