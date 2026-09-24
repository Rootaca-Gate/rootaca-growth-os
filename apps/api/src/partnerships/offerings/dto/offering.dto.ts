import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipDeliveryFormat,
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
  PartnershipOfferingStatus,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramStatus,
  PartnershipProgramType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * Custom requirement row for an offering. If an offering has ANY requirement
 * rows, they fully replace the inherited program requirements at read time.
 */
export class OfferingRequirementDto {
  @ApiProperty({ enum: PartnershipProgramRequirementKind })
  @IsEnum(PartnershipProgramRequirementKind)
  kind!: PartnershipProgramRequirementKind;

  @ApiPropertyOptional({ enum: ['REQUIRED', 'RECOMMENDED'], default: 'REQUIRED' })
  @IsOptional()
  @IsEnum(['REQUIRED', 'RECOMMENDED'] as const)
  priority?: 'REQUIRED' | 'RECOMMENDED';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

/**
 * Shared, mutable offering fields. Overrides (targetAge, targetGrades,
 * recommendedLevel, learnerProfile) are inherited from the program when null.
 * selectedModuleIds / selectedProjectIds: omit or send an empty array to
 * inherit ALL from the program; a non-empty array narrows to those IDs.
 */
export class OfferingBaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  targetAge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  targetGrades?: string;

  @ApiPropertyOptional({ enum: PartnershipProgramLevel, nullable: true })
  @IsOptional()
  @IsEnum(PartnershipProgramLevel)
  recommendedLevel?: PartnershipProgramLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  learnerProfile?: string;

  @ApiPropertyOptional({ description: 'Numeric duration; unit set separately' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ enum: PartnershipDurationUnit })
  @IsOptional()
  @IsEnum(PartnershipDurationUnit)
  durationUnit?: PartnershipDurationUnit;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  numberOfSessions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sessionDurationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  sessionFrequency?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryMode })
  @IsOptional()
  @IsEnum(PartnershipDeliveryMode)
  deliveryMode?: PartnershipDeliveryMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  locationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  groupSizeMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  groupSizeMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  numberOfGroups?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  instructorRequirement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  coordinatorRequirement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  curriculumCustomizationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  projectCustomizationNotes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeFinalProject?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  assessmentFrequency?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeInitialAssessment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeMidAssessment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeFinalAssessment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  studentProgressReport?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  schoolSummaryReport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Internal commercial note (NO pricing data)' })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  commercialNotes?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Program curriculum module IDs. Empty/omitted => inherit ALL.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  selectedModuleIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Program sample project IDs. Empty/omitted => inherit ALL.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  selectedProjectIds?: string[];

  @ApiPropertyOptional({
    type: [OfferingRequirementDto],
    description: 'Custom requirements. Any rows here replace inherited program requirements.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferingRequirementDto)
  requirements?: OfferingRequirementDto[];
}

/** Shape of the shared mutable offering fields (create & update). */
export type OfferingBaseFields = OfferingBaseDto;

export class CreateOfferingDto extends OfferingBaseDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Program this offering is packaged from (live link).' })
  @IsUUID()
  programId!: string;

  @ApiProperty({ enum: PartnershipDeliveryFormat })
  @IsEnum(PartnershipDeliveryFormat)
  deliveryFormat!: PartnershipDeliveryFormat;

  @ApiPropertyOptional({ enum: PartnershipOfferingStatus })
  @IsOptional()
  @IsEnum(PartnershipOfferingStatus)
  status?: PartnershipOfferingStatus;
}

export class UpdateOfferingDto extends OfferingBaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryFormat })
  @IsOptional()
  @IsEnum(PartnershipDeliveryFormat)
  deliveryFormat?: PartnershipDeliveryFormat;

  @ApiPropertyOptional({ enum: PartnershipOfferingStatus })
  @IsOptional()
  @IsEnum(PartnershipOfferingStatus)
  status?: PartnershipOfferingStatus;
}

export class QueryOfferingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by linked program id' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryFormat })
  @IsOptional()
  @IsEnum(PartnershipDeliveryFormat)
  deliveryFormat?: PartnershipDeliveryFormat;

  @ApiPropertyOptional({ enum: PartnershipOfferingStatus })
  @IsOptional()
  @IsEnum(PartnershipOfferingStatus)
  status?: PartnershipOfferingStatus;

  @ApiPropertyOptional({
    enum: PartnershipProgramLevel,
    description: 'Resolved level (offering override or inherited program level)',
  })
  @IsOptional()
  @IsEnum(PartnershipProgramLevel)
  recommendedLevel?: PartnershipProgramLevel;

  @ApiPropertyOptional({
    description: 'Substring match against resolved target grades (override or program)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetGrades?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;
}

// --- Response DTOs -----------------------------------------------------------

export class OfferingListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  programId!: string;

  @ApiProperty()
  programName!: string;

  @ApiProperty({ enum: PartnershipDeliveryFormat })
  deliveryFormat!: PartnershipDeliveryFormat;

  @ApiProperty({ enum: PartnershipOfferingStatus })
  status!: PartnershipOfferingStatus;

  /** Resolved target grades (offering override, else program). */
  @ApiPropertyOptional({ nullable: true })
  targetGrades!: string | null;

  /** Resolved recommended level (offering override, else program). */
  @ApiPropertyOptional({ enum: PartnershipProgramLevel, nullable: true })
  recommendedLevel!: PartnershipProgramLevel | null;

  @ApiPropertyOptional({ nullable: true })
  duration!: number | null;

  @ApiPropertyOptional({ enum: PartnershipDurationUnit, nullable: true })
  durationUnit!: PartnershipDurationUnit | null;

  @ApiPropertyOptional({ nullable: true })
  numberOfSessions!: number | null;

  @ApiPropertyOptional({ nullable: true })
  sessionDurationMinutes!: number | null;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  updatedAt!: string;
}

export class OfferingProgramSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: PartnershipProgramType })
  programType!: PartnershipProgramType;

  @ApiProperty()
  shortDescription!: string;

  @ApiProperty({ enum: PartnershipProgramStatus })
  status!: PartnershipProgramStatus;

  @ApiPropertyOptional({ nullable: true })
  targetAge!: string | null;

  @ApiPropertyOptional({ nullable: true })
  targetGrades!: string | null;

  @ApiPropertyOptional({ enum: PartnershipProgramLevel, nullable: true })
  recommendedLevel!: PartnershipProgramLevel | null;
}

export class ResolvedRequirementDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: PartnershipProgramRequirementKind })
  kind!: PartnershipProgramRequirementKind;

  @ApiProperty({ enum: ['REQUIRED', 'RECOMMENDED'] })
  priority!: 'REQUIRED' | 'RECOMMENDED';

  @ApiProperty()
  label!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ResolvedModuleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  skillsDeveloped!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ResolvedActivityDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  skillsDeveloped!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ResolvedSampleProjectDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  skills!: string;

  @ApiProperty()
  expectedOutput!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ResolvedObjectiveOrOutcomeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ResolvedAssessmentMethodDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  weight!: number | null;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  sortOrder!: number;
}

/**
 * Fully resolved view: override fields fall back to the program, curriculum /
 * projects are filtered by selections (or all if none selected), requirements
 * are custom-or-inherited, and the final project block is included only when
 * includeFinalProject is true.
 */
export class OfferingResolvedDto {
  @ApiPropertyOptional({ nullable: true })
  targetAge!: string | null;

  @ApiPropertyOptional({ nullable: true })
  targetGrades!: string | null;

  @ApiPropertyOptional({ enum: PartnershipProgramLevel, nullable: true })
  recommendedLevel!: PartnershipProgramLevel | null;

  @ApiPropertyOptional({ nullable: true })
  learnerProfile!: string | null;

  @ApiProperty()
  shortDescription!: string;

  @ApiProperty()
  schoolValue!: string;

  @ApiProperty()
  studentValue!: string;

  @ApiProperty({ type: [ResolvedObjectiveOrOutcomeDto] })
  objectives!: ResolvedObjectiveOrOutcomeDto[];

  @ApiProperty({ type: [ResolvedModuleDto] })
  curriculumModules!: ResolvedModuleDto[];

  @ApiProperty({ type: [ResolvedActivityDto] })
  activities!: ResolvedActivityDto[];

  @ApiProperty({ type: [ResolvedSampleProjectDto] })
  sampleProjects!: ResolvedSampleProjectDto[];

  @ApiProperty({ description: 'Whether the program final project is surfaced' })
  includeFinalProject!: boolean;

  @ApiPropertyOptional({ nullable: true })
  finalProjectName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalProjectDescription!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalProjectExpectedOutput!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalProjectSkills!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalProjectEvaluationMethod!: string | null;

  @ApiProperty({ type: [ResolvedAssessmentMethodDto] })
  assessmentMethods!: ResolvedAssessmentMethodDto[];

  @ApiProperty({ type: [ResolvedRequirementDto] })
  requirements!: ResolvedRequirementDto[];

  @ApiProperty({ description: 'True when requirements came from the program (inherited)' })
  requirementsInherited!: boolean;

  @ApiProperty({ type: [ResolvedObjectiveOrOutcomeDto] })
  outcomes!: ResolvedObjectiveOrOutcomeDto[];
}

export class OfferingSelectionDto {
  @ApiProperty({ type: [String] })
  selectedModuleIds!: string[];

  @ApiProperty({ type: [String] })
  selectedProjectIds!: string[];

  @ApiProperty({ description: 'True when no modules selected => inherit ALL' })
  inheritAllModules!: boolean;

  @ApiProperty({ description: 'True when no projects selected => inherit ALL' })
  inheritAllProjects!: boolean;
}

export class OfferingResponseDto extends OfferingListItemDto {
  // --- Raw offering override fields ---
  // Note: targetGrades / recommendedLevel / duration* / sessions come from
  // OfferingListItemDto. On detail responses they carry the *raw* override
  // values (null = inherit); list responses carry the *resolved* display values.
  @ApiPropertyOptional({ nullable: true })
  targetAge!: string | null;

  @ApiPropertyOptional({ nullable: true })
  learnerProfile!: string | null;

  // --- Raw delivery / logistics (beyond list summary) ---
  @ApiPropertyOptional({ nullable: true })
  sessionFrequency!: string | null;

  @ApiPropertyOptional({ enum: PartnershipDeliveryMode, nullable: true })
  deliveryMode!: PartnershipDeliveryMode | null;

  @ApiProperty()
  locationNotes!: string;

  @ApiPropertyOptional({ nullable: true })
  groupSizeMin!: number | null;

  @ApiPropertyOptional({ nullable: true })
  groupSizeMax!: number | null;

  @ApiPropertyOptional({ nullable: true })
  numberOfGroups!: number | null;

  @ApiProperty()
  instructorRequirement!: string;

  @ApiProperty()
  coordinatorRequirement!: string;

  // --- Raw customization / assessment / reporting ---
  @ApiProperty()
  curriculumCustomizationNotes!: string;

  @ApiProperty()
  projectCustomizationNotes!: string;

  @ApiProperty()
  includeFinalProject!: boolean;

  @ApiProperty()
  assessmentFrequency!: string;

  @ApiProperty()
  includeInitialAssessment!: boolean;

  @ApiProperty()
  includeMidAssessment!: boolean;

  @ApiProperty()
  includeFinalAssessment!: boolean;

  @ApiProperty()
  studentProgressReport!: boolean;

  @ApiProperty()
  schoolSummaryReport!: boolean;

  @ApiProperty()
  internalNotes!: string;

  @ApiProperty()
  commercialNotes!: string;

  @ApiProperty()
  createdAt!: string;

  // --- Composed sections ---
  @ApiProperty({ type: OfferingProgramSummaryDto })
  program!: OfferingProgramSummaryDto;

  @ApiProperty({ type: OfferingResolvedDto })
  resolved!: OfferingResolvedDto;

  @ApiProperty({ type: OfferingSelectionDto })
  selection!: OfferingSelectionDto;
}

export class PaginatedOfferingsDto {
  @ApiProperty({ type: [OfferingListItemDto] })
  items!: OfferingListItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
