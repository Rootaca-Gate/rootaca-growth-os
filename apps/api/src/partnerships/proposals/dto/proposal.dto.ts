import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  PartnershipDeliveryFormat,
  PartnershipDeliveryMode,
  PartnershipDiscountType,
  PartnershipDurationUnit,
  PartnershipPricingModel,
  PartnershipProgramLevel,
  PartnershipProposalStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProposalLineInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  offeringId!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  customizedObjectives?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  customizedCurriculumNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  specialRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  implementationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  deliveryNotes?: string;

  @ApiProperty({ enum: PartnershipPricingModel })
  @IsEnum(PartnershipPricingModel)
  pricingModel!: PartnershipPricingModel;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number | null;

  @ApiPropertyOptional({ enum: PartnershipDiscountType })
  @IsOptional()
  @IsEnum(PartnershipDiscountType)
  discountType?: PartnershipDiscountType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number | null;
}

export class ProposalTimelinePhaseInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

export class ProposalOutcomeInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class CreateProposalDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiProperty()
  @IsUUID()
  institutionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proposalDate?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  preparedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(12000)
  executiveSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  schoolChallenge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  schoolObjective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  targetStudentGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  successCriteria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  partnershipObjective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(12000)
  implementationApproach?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  timelineNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  nextSteps?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16000)
  termsAndConditions?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'No default currency — omit if unset' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number | null;

  @ApiPropertyOptional({ enum: PartnershipDiscountType })
  @IsOptional()
  @IsEnum(PartnershipDiscountType)
  headerDiscountType?: PartnershipDiscountType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  headerDiscountValue?: number | null;

  @ApiPropertyOptional({ type: [ProposalLineInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposalLineInputDto)
  offerings?: ProposalLineInputDto[];

  @ApiPropertyOptional({ type: [ProposalTimelinePhaseInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposalTimelinePhaseInputDto)
  timelinePhases?: ProposalTimelinePhaseInputDto[];

  @ApiPropertyOptional({ type: [ProposalOutcomeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposalOutcomeInputDto)
  customOutcomes?: ProposalOutcomeInputDto[];
}

export class UpdateProposalDto extends PartialType(CreateProposalDto) {}

export class QueryProposalsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({ enum: PartnershipProposalStatus })
  @IsOptional()
  @IsEnum(PartnershipProposalStatus)
  status?: PartnershipProposalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntilFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntilTo?: string;

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

export class ChangeProposalStatusDto {
  @ApiProperty({ enum: PartnershipProposalStatus })
  @IsEnum(PartnershipProposalStatus)
  status!: PartnershipProposalStatus;
}

export class ProposalListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() proposalNumber!: string;
  @ApiProperty() title!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() institutionName!: string;
  @ApiProperty({ enum: PartnershipProposalStatus }) status!: PartnershipProposalStatus;
  @ApiProperty() offeringCount!: number;
  @ApiProperty({ type: [String] }) offeringNames!: string[];
  @ApiPropertyOptional({ nullable: true }) currency!: string | null;
  @ApiPropertyOptional({ nullable: true }) grandTotal!: number | null;
  @ApiProperty() proposalDate!: string;
  @ApiPropertyOptional({ nullable: true }) validUntil!: string | null;
  @ApiProperty() version!: string;
  @ApiProperty() isLocked!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class ProposalInstitutionSummaryDto {
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

export class ProposalOfferingLineDto {
  @ApiProperty() id!: string;
  @ApiProperty() offeringId!: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() snapshotProgramName!: string;
  @ApiProperty() snapshotOfferingName!: string;
  @ApiProperty({ enum: PartnershipDeliveryFormat }) snapshotDeliveryFormat!: PartnershipDeliveryFormat;
  @ApiPropertyOptional({ nullable: true }) snapshotTargetGrades!: string | null;
  @ApiPropertyOptional({ enum: PartnershipProgramLevel, nullable: true })
  snapshotRecommendedLevel!: PartnershipProgramLevel | null;
  @ApiPropertyOptional({ nullable: true }) snapshotDuration!: number | null;
  @ApiPropertyOptional({ enum: PartnershipDurationUnit, nullable: true })
  snapshotDurationUnit!: PartnershipDurationUnit | null;
  @ApiPropertyOptional({ nullable: true }) snapshotNumberOfSessions!: number | null;
  @ApiPropertyOptional({ nullable: true }) snapshotSessionDurationMinutes!: number | null;
  @ApiPropertyOptional({ nullable: true }) snapshotSessionFrequency!: string | null;
  @ApiPropertyOptional({ enum: PartnershipDeliveryMode, nullable: true })
  snapshotDeliveryMode!: PartnershipDeliveryMode | null;
  @ApiPropertyOptional({ nullable: true }) snapshotGroupSizeMin!: number | null;
  @ApiPropertyOptional({ nullable: true }) snapshotGroupSizeMax!: number | null;
  @ApiPropertyOptional({ nullable: true }) snapshotNumberOfGroups!: number | null;
  @ApiProperty() snapshotShortDescription!: string;
  @ApiProperty() snapshotSchoolValue!: string;
  @ApiProperty() snapshotStudentValue!: string;
  @ApiPropertyOptional({ nullable: true }) snapshotCurriculumJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) snapshotProjectsJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) snapshotOutcomesJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) snapshotRequirementsJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) snapshotAssessmentJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) snapshotObjectivesJson!: unknown;
  @ApiPropertyOptional({ nullable: true }) snapshotActivitiesJson!: unknown;
  @ApiProperty() snapshotCapturedAt!: string;
  @ApiProperty() customizedObjectives!: string;
  @ApiProperty() customizedCurriculumNotes!: string;
  @ApiProperty() specialRequirements!: string;
  @ApiProperty() implementationNotes!: string;
  @ApiProperty() deliveryNotes!: string;
  @ApiProperty({ enum: PartnershipPricingModel }) pricingModel!: PartnershipPricingModel;
  @ApiPropertyOptional({ nullable: true }) quantity!: number | null;
  @ApiPropertyOptional({ nullable: true }) unitPrice!: number | null;
  @ApiProperty({ enum: PartnershipDiscountType }) discountType!: PartnershipDiscountType;
  @ApiPropertyOptional({ nullable: true }) discountValue!: number | null;
  @ApiPropertyOptional({ nullable: true }) lineSubtotal!: number | null;
}

export class ProposalResponseDto extends ProposalListItemDto {
  @ApiProperty() preparedBy!: string;
  @ApiProperty() executiveSummary!: string;
  @ApiProperty() schoolChallenge!: string;
  @ApiProperty() schoolObjective!: string;
  @ApiProperty() targetStudentGroup!: string;
  @ApiProperty() successCriteria!: string;
  @ApiProperty() partnershipObjective!: string;
  @ApiProperty() implementationApproach!: string;
  @ApiProperty() timelineNotes!: string;
  @ApiProperty() paymentTerms!: string;
  @ApiProperty() nextSteps!: string;
  @ApiProperty() termsAndConditions!: string;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiProperty() taxEnabled!: boolean;
  @ApiPropertyOptional({ nullable: true }) taxRate!: number | null;
  @ApiProperty({ enum: PartnershipDiscountType }) headerDiscountType!: PartnershipDiscountType;
  @ApiPropertyOptional({ nullable: true }) headerDiscountValue!: number | null;
  @ApiPropertyOptional({ nullable: true }) subtotal!: number | null;
  @ApiPropertyOptional({ nullable: true }) discountAmount!: number | null;
  @ApiPropertyOptional({ nullable: true }) taxAmount!: number | null;
  @ApiPropertyOptional({ nullable: true }) shareToken!: string | null;
  @ApiPropertyOptional({ nullable: true }) sentAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) viewedAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) archivedAt!: string | null;
  @ApiProperty({ type: ProposalInstitutionSummaryDto }) institution!: ProposalInstitutionSummaryDto;
  @ApiProperty({ type: [ProposalOfferingLineDto] }) offerings!: ProposalOfferingLineDto[];
  @ApiProperty() timelinePhases!: ProposalTimelinePhaseInputDto[];
  @ApiProperty() customOutcomes!: ProposalOutcomeInputDto[];
  @ApiProperty() versions!: Array<{ id: string; version: string; note: string; createdAt: string }>;
}

export class PaginatedProposalsDto {
  @ApiProperty({ type: [ProposalListItemDto] }) items!: ProposalListItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() pageCount!: number;
}
