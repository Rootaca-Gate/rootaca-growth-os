import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  PartnershipDeliveryFormat,
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
  PartnershipProgramLevel,
  PartnershipProposalStatus,
  PartnershipSowChangeImpact,
  PartnershipSowChangeRequestStatus,
  PartnershipSowDeliverableStatus,
  PartnershipSowMilestoneStatus,
  PartnershipSowParty,
  PartnershipSowScopeKind,
  PartnershipSowStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
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

// -----------------------------------------------------------------------------
// Nested input DTOs (editable narrative children).
// Scope offerings are copied from the proposal snapshots and are immutable after
// create, except they may be fully replaced while the SOW is a DRAFT.
// -----------------------------------------------------------------------------

export class SowScopeItemInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: PartnershipSowScopeKind })
  @IsEnum(PartnershipSowScopeKind)
  kind!: PartnershipSowScopeKind;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class SowDeliverableInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  acceptanceCriteria?: string;

  @ApiPropertyOptional({ enum: PartnershipSowDeliverableStatus })
  @IsOptional()
  @IsEnum(PartnershipSowDeliverableStatus)
  status?: PartnershipSowDeliverableStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class SowMilestoneInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ enum: PartnershipSowMilestoneStatus })
  @IsOptional()
  @IsEnum(PartnershipSowMilestoneStatus)
  status?: PartnershipSowMilestoneStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class SowResponsibilityInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  activity!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rootacaRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  schoolRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class SowTeamMemberInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: PartnershipSowParty })
  @IsEnum(PartnershipSowParty)
  party!: PartnershipSowParty;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  responsibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  contact?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class SowAssessmentItemInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  responsibleParty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  format?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

/**
 * Scope offerings are frozen copies of the proposal offering snapshots.
 * They are immutable after create, but the whole set may be replaced while the
 * SOW is still a DRAFT. Never used to mutate the source Proposal/Offering.
 */
export class SowScopeOfferingInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  offeringId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  programName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  offeringName!: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryFormat, nullable: true })
  @IsOptional()
  @IsEnum(PartnershipDeliveryFormat)
  deliveryFormat?: PartnershipDeliveryFormat | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetGrades?: string | null;

  @ApiPropertyOptional({ enum: PartnershipProgramLevel, nullable: true })
  @IsOptional()
  @IsEnum(PartnershipProgramLevel)
  recommendedLevel?: PartnershipProgramLevel | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  duration?: number | null;

  @ApiPropertyOptional({ enum: PartnershipDurationUnit, nullable: true })
  @IsOptional()
  @IsEnum(PartnershipDurationUnit)
  durationUnit?: PartnershipDurationUnit | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numberOfSessions?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sessionDurationMinutes?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  sessionFrequency?: string | null;

  @ApiPropertyOptional({ enum: PartnershipDeliveryMode, nullable: true })
  @IsOptional()
  @IsEnum(PartnershipDeliveryMode)
  deliveryMode?: PartnershipDeliveryMode | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  groupSizeMin?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  groupSizeMax?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numberOfGroups?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  shortDescription?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  curriculumJson?: unknown;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  activitiesJson?: unknown;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  projectsJson?: unknown;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  assessmentJson?: unknown;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  requirementsJson?: unknown;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  outcomesJson?: unknown;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  objectivesJson?: unknown;
}

// -----------------------------------------------------------------------------
// Create / update DTOs
// -----------------------------------------------------------------------------

export class CreateSowDto {
  @ApiProperty({ description: 'Source proposal — SOW is always derived from a proposal.' })
  @IsUUID()
  proposalId!: string;

  @ApiPropertyOptional({ description: 'Defaults to the proposal title if omitted.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  sowDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  preparedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  approvedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(12000)
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  targetStudents?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  deliveryModelNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  activitiesNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  projectsNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  assessmentNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  reportingNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  clientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  clientAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  primaryContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  primaryContactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryContactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  attendanceExpectations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  minimumParticipation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  studentReplacementRules?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  makeupSessionRules?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  equipmentRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internetRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  classroomLabRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  studentDevicesRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  softwareRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  accountsAccessRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  facultyLiaisonRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16000)
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  rootacaSignatoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  rootacaSignatoryTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  schoolSignatoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  schoolSignatoryTitle?: string;

  @ApiPropertyOptional({ type: [SowScopeItemInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SowScopeItemInputDto)
  scopeItems?: SowScopeItemInputDto[];

  @ApiPropertyOptional({ type: [SowDeliverableInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SowDeliverableInputDto)
  deliverables?: SowDeliverableInputDto[];

  @ApiPropertyOptional({ type: [SowMilestoneInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SowMilestoneInputDto)
  milestones?: SowMilestoneInputDto[];

  @ApiPropertyOptional({ type: [SowResponsibilityInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SowResponsibilityInputDto)
  responsibilities?: SowResponsibilityInputDto[];

  @ApiPropertyOptional({ type: [SowTeamMemberInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SowTeamMemberInputDto)
  teamMembers?: SowTeamMemberInputDto[];

  @ApiPropertyOptional({ type: [SowAssessmentItemInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SowAssessmentItemInputDto)
  assessmentItems?: SowAssessmentItemInputDto[];

  @ApiPropertyOptional({
    type: [SowScopeOfferingInputDto],
    description: 'Optional override; when omitted, offerings are copied from the proposal snapshots.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SowScopeOfferingInputDto)
  scopeOfferings?: SowScopeOfferingInputDto[];
}

export class UpdateSowDto extends PartialType(CreateSowDto) {}

// -----------------------------------------------------------------------------
// Query / status / change-request DTOs
// -----------------------------------------------------------------------------

export class QuerySowsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @ApiPropertyOptional({ enum: PartnershipSowStatus })
  @IsOptional()
  @IsEnum(PartnershipSowStatus)
  status?: PartnershipSowStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Include archived SOWs (excluded by default).' })
  @IsOptional()
  @IsString()
  includeArchived?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  pageSize = 50;
}

export class ChangeSowStatusDto {
  @ApiProperty({ enum: PartnershipSowStatus })
  @IsEnum(PartnershipSowStatus)
  status!: PartnershipSowStatus;
}

export class CreateChangeRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  requestedBy?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  requestDate?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  description!: string;

  @ApiPropertyOptional({ enum: PartnershipSowChangeImpact })
  @IsOptional()
  @IsEnum(PartnershipSowChangeImpact)
  impact?: PartnershipSowChangeImpact;
}

export class DecideChangeRequestDto {
  @ApiProperty({
    enum: [
      PartnershipSowChangeRequestStatus.APPROVED,
      PartnershipSowChangeRequestStatus.REJECTED,
    ],
  })
  @IsEnum(PartnershipSowChangeRequestStatus)
  decision!: PartnershipSowChangeRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  approvedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  changeSummary?: string;
}

export class CreateSowFromProposalDto {
  @ApiProperty()
  @IsUUID()
  proposalId!: string;
}

// -----------------------------------------------------------------------------
// Response DTOs
// -----------------------------------------------------------------------------

export class SowListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() sowNumber!: string;
  @ApiProperty() title!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() institutionName!: string;
  @ApiProperty() proposalId!: string;
  @ApiPropertyOptional({ nullable: true }) proposalNumber!: string | null;
  @ApiProperty({ enum: PartnershipSowStatus }) status!: PartnershipSowStatus;
  @ApiProperty() sowDate!: string;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) currencySnapshot!: string | null;
  @ApiPropertyOptional({ nullable: true }) agreedValueSnapshot!: number | null;
  @ApiProperty() version!: string;
  @ApiProperty() isLocked!: boolean;
  @ApiProperty() offeringCount!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class SowInstitutionSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) arabicName!: string | null;
  @ApiPropertyOptional({ nullable: true }) englishName!: string | null;
  @ApiPropertyOptional({ nullable: true }) institutionType!: string | null;
  @ApiPropertyOptional({ nullable: true }) governorate!: string | null;
  @ApiPropertyOptional({ nullable: true }) city!: string | null;
  @ApiPropertyOptional({ nullable: true }) primaryContactName!: string | null;
  @ApiPropertyOptional({ nullable: true }) primaryContactEmail!: string | null;
}

export class SowProposalSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() proposalNumber!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: PartnershipProposalStatus }) status!: PartnershipProposalStatus;
}

export class SowScopeOfferingDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) offeringId!: string | null;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() programName!: string;
  @ApiProperty() offeringName!: string;
  @ApiPropertyOptional({ enum: PartnershipDeliveryFormat, nullable: true })
  deliveryFormat!: PartnershipDeliveryFormat | null;
  @ApiPropertyOptional({ nullable: true }) targetGrades!: string | null;
  @ApiPropertyOptional({ enum: PartnershipProgramLevel, nullable: true })
  recommendedLevel!: PartnershipProgramLevel | null;
  @ApiPropertyOptional({ nullable: true }) duration!: number | null;
  @ApiPropertyOptional({ enum: PartnershipDurationUnit, nullable: true })
  durationUnit!: PartnershipDurationUnit | null;
  @ApiPropertyOptional({ nullable: true }) numberOfSessions!: number | null;
  @ApiPropertyOptional({ nullable: true }) sessionDurationMinutes!: number | null;
  @ApiPropertyOptional({ nullable: true }) sessionFrequency!: string | null;
  @ApiPropertyOptional({ enum: PartnershipDeliveryMode, nullable: true })
  deliveryMode!: PartnershipDeliveryMode | null;
  @ApiPropertyOptional({ nullable: true }) groupSizeMin!: number | null;
  @ApiPropertyOptional({ nullable: true }) groupSizeMax!: number | null;
  @ApiPropertyOptional({ nullable: true }) numberOfGroups!: number | null;
  @ApiProperty() shortDescription!: string;
  @ApiPropertyOptional({ nullable: true }) curriculumJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) activitiesJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) projectsJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) assessmentJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) requirementsJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) outcomesJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) objectivesJson!: unknown;
}

export class SowScopeItemDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: PartnershipSowScopeKind }) kind!: PartnershipSowScopeKind;
  @ApiProperty() text!: string;
  @ApiProperty() sortOrder!: number;
}

export class SowDeliverableDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty() owner!: string;
  @ApiPropertyOptional({ nullable: true }) dueDate!: string | null;
  @ApiProperty() acceptanceCriteria!: string;
  @ApiProperty({ enum: PartnershipSowDeliverableStatus })
  status!: PartnershipSowDeliverableStatus;
  @ApiProperty() sortOrder!: number;
}

export class SowMilestoneDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiProperty() owner!: string;
  @ApiProperty({ enum: PartnershipSowMilestoneStatus })
  status!: PartnershipSowMilestoneStatus;
  @ApiProperty() sortOrder!: number;
}

export class SowResponsibilityDto {
  @ApiProperty() id!: string;
  @ApiProperty() activity!: string;
  @ApiProperty() rootacaRole!: string;
  @ApiProperty() schoolRole!: string;
  @ApiProperty() sortOrder!: number;
}

export class SowTeamMemberDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: PartnershipSowParty }) party!: PartnershipSowParty;
  @ApiProperty() role!: string;
  @ApiProperty() name!: string;
  @ApiProperty() responsibility!: string;
  @ApiProperty() contact!: string;
  @ApiPropertyOptional({ nullable: true }) assignedUserId!: string | null;
  @ApiProperty() sortOrder!: number;
}

export class SowAssessmentItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() responsibleParty!: string;
  @ApiProperty() frequency!: string;
  @ApiProperty() format!: string;
  @ApiPropertyOptional({ nullable: true }) dueDate!: string | null;
  @ApiProperty() sortOrder!: number;
}

export class SowChangeRequestDto {
  @ApiProperty() id!: string;
  @ApiProperty() changeRequestNumber!: string;
  @ApiProperty() requestedBy!: string;
  @ApiProperty() requestDate!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: PartnershipSowChangeImpact }) impact!: PartnershipSowChangeImpact;
  @ApiProperty({ enum: PartnershipSowChangeRequestStatus })
  approvalStatus!: PartnershipSowChangeRequestStatus;
  @ApiProperty() approvedBy!: string;
  @ApiPropertyOptional({ nullable: true }) decisionDate!: string | null;
  @ApiProperty() changeSummary!: string;
  @ApiPropertyOptional({ nullable: true }) resultingVersion!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class SowVersionDto {
  @ApiProperty() id!: string;
  @ApiProperty() version!: string;
  @ApiProperty() changeSummary!: string;
  @ApiPropertyOptional({ nullable: true }) createdById!: string | null;
  @ApiProperty() createdAt!: string;
}

export class SowResponseDto extends SowListItemDto {
  @ApiPropertyOptional({ nullable: true }) effectiveDate!: string | null;
  @ApiProperty() preparedBy!: string;
  @ApiProperty() approvedBy!: string;
  @ApiProperty() purpose!: string;
  @ApiProperty() targetStudents!: string;
  @ApiProperty() deliveryModelNotes!: string;
  @ApiProperty() activitiesNotes!: string;
  @ApiProperty() projectsNotes!: string;
  @ApiProperty() assessmentNotes!: string;
  @ApiProperty() reportingNotes!: string;
  @ApiProperty() clientName!: string;
  @ApiProperty() clientAddress!: string;
  @ApiProperty() primaryContactName!: string;
  @ApiProperty() primaryContactEmail!: string;
  @ApiProperty() primaryContactPhone!: string;
  @ApiProperty() attendanceExpectations!: string;
  @ApiProperty() minimumParticipation!: string;
  @ApiProperty() studentReplacementRules!: string;
  @ApiProperty() makeupSessionRules!: string;
  @ApiProperty() equipmentRequirements!: string;
  @ApiProperty() internetRequirements!: string;
  @ApiProperty() classroomLabRequirements!: string;
  @ApiProperty() studentDevicesRequirements!: string;
  @ApiProperty() softwareRequirements!: string;
  @ApiProperty() accountsAccessRequirements!: string;
  @ApiProperty() facultyLiaisonRequirements!: string;
  @ApiProperty() termsAndConditions!: string;
  @ApiProperty() proposalNumberSnapshot!: string;
  @ApiProperty() paymentTermsSnapshot!: string;
  @ApiProperty() rootacaSignatoryName!: string;
  @ApiProperty() rootacaSignatoryTitle!: string;
  @ApiPropertyOptional({ nullable: true }) rootacaSignedAt!: string | null;
  @ApiProperty() rootacaSignatureImage!: string;
  @ApiProperty() schoolSignatoryName!: string;
  @ApiProperty() schoolSignatoryTitle!: string;
  @ApiPropertyOptional({ nullable: true }) schoolSignedAt!: string | null;
  @ApiProperty() schoolSignatureImage!: string;
  @ApiPropertyOptional({ nullable: true }) archivedAt!: string | null;
  @ApiProperty({ type: SowInstitutionSummaryDto })
  institution!: SowInstitutionSummaryDto;
  @ApiProperty({ type: SowProposalSummaryDto }) proposal!: SowProposalSummaryDto;
  @ApiProperty({ type: [SowScopeOfferingDto] }) scopeOfferings!: SowScopeOfferingDto[];
  @ApiProperty({ type: [SowScopeItemDto] }) scopeItems!: SowScopeItemDto[];
  @ApiProperty({ type: [SowDeliverableDto] }) deliverables!: SowDeliverableDto[];
  @ApiProperty({ type: [SowMilestoneDto] }) milestones!: SowMilestoneDto[];
  @ApiProperty({ type: [SowResponsibilityDto] }) responsibilities!: SowResponsibilityDto[];
  @ApiProperty({ type: [SowTeamMemberDto] }) teamMembers!: SowTeamMemberDto[];
  @ApiProperty({ type: [SowAssessmentItemDto] }) assessmentItems!: SowAssessmentItemDto[];
  @ApiProperty({ type: [SowChangeRequestDto] }) changeRequests!: SowChangeRequestDto[];
  @ApiProperty({ type: [SowVersionDto] }) versions!: SowVersionDto[];
}

export class PaginatedSowsDto {
  @ApiProperty({ type: [SowListItemDto] }) items!: SowListItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() pageCount!: number;
}
