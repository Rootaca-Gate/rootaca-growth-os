import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipOpportunityExpansionKind,
  PartnershipOpportunityStatus,
  PartnershipOpportunityTimelineKind,
  PartnershipOpportunityType,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { OpportunityHistoricalSnapshot } from '../opportunity-snapshot';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export class QueryOpportunitiesDto {
  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: PartnershipOpportunityType })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipOpportunityType)
  type?: PartnershipOpportunityType;

  @ApiPropertyOptional({ enum: PartnershipOpportunityStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipOpportunityStatus)
  status?: PartnershipOpportunityStatus;

  @ApiPropertyOptional({ description: 'Filter expectedDate >= date (ISO date).' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter expectedDate <= date (ISO date).' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @Transform(emptyToUndefined)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @Transform(emptyToUndefined)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class CreateOpportunityDto {
  @ApiProperty({ enum: PartnershipOpportunityType })
  @IsEnum(PartnershipOpportunityType)
  type!: PartnershipOpportunityType;

  @ApiProperty()
  @IsUUID()
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  campusInstitutionId?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  previousProposalId?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  previousSowId?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  previousDeliveryId?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  previousReportId?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  expectedDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class OpportunityExpansionKindInputDto {
  @ApiProperty({ enum: PartnershipOpportunityExpansionKind })
  @IsEnum(PartnershipOpportunityExpansionKind)
  kind!: PartnershipOpportunityExpansionKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateOpportunityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  campusInstitutionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  previousProposalId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  previousSowId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  previousDeliveryId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  previousReportId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  ownerId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  expectedDate?: string | null;

  // --- Renewal planning fields ---------------------------------------------
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  renewalProgramIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  renewalOfferingIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  renewalGrades?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  renewalGroupsNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  renewalDurationNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  renewalDeliveryMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  renewalScopeNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  expansionScopeNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  proposedScopeNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  existingScopeNotes?: string;

  // --- Narrative / notes ----------------------------------------------------
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  schoolFeedback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  successFactors?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  challenges?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  requestedChanges?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  nextSteps?: string;

  // --- Structured school feedback ------------------------------------------
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  feedbackSummary?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Only stored when the user explicitly enters a score.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  feedbackScore?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  feedbackRequestedPrograms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  feedbackRequestedChanges?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  feedbackKeyComments?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  feedbackDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  feedbackRecordedBy?: string;

  // --- Expansion kinds (full replace when provided) ------------------------
  @ApiPropertyOptional({ type: [OpportunityExpansionKindInputDto] })
  @IsOptional()
  @IsArray()
  @Type(() => OpportunityExpansionKindInputDto)
  expansionKinds?: OpportunityExpansionKindInputDto[];
}

export class ChangeOpportunityStatusDto {
  @ApiProperty({ enum: PartnershipOpportunityStatus })
  @IsEnum(PartnershipOpportunityStatus)
  status!: PartnershipOpportunityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class CreateProposalFromOpportunityDto {
  @ApiPropertyOptional({ description: 'Optional override title for the new proposal.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title?: string;
}

export class CreateOpportunityFromDeliveryDto {
  @ApiProperty()
  @IsUUID()
  deliveryId!: string;

  @ApiPropertyOptional({ enum: PartnershipOpportunityType })
  @IsOptional()
  @IsEnum(PartnershipOpportunityType)
  type?: PartnershipOpportunityType;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  expectedDate?: string | null;
}

export class CreateOpportunityFromReportDto {
  @ApiProperty()
  @IsUUID()
  reportId!: string;

  @ApiPropertyOptional({ enum: PartnershipOpportunityType })
  @IsOptional()
  @IsEnum(PartnershipOpportunityType)
  type?: PartnershipOpportunityType;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ nullable: true })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  expectedDate?: string | null;
}

export class AddTimelineEventDto {
  @ApiProperty({ enum: PartnershipOpportunityTimelineKind })
  @IsEnum(PartnershipOpportunityTimelineKind)
  kind!: PartnershipOpportunityTimelineKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  note?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  occurredAt?: string | null;
}

// --- Response DTOs ----------------------------------------------------------

export class OpportunityLinkRefDto {
  @ApiProperty({ nullable: true }) id!: string | null;
  @ApiProperty({ nullable: true }) number!: string | null;
  @ApiProperty({ nullable: true }) title!: string | null;
}

export class OpportunityExpansionKindDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: PartnershipOpportunityExpansionKind })
  kind!: PartnershipOpportunityExpansionKind;
  @ApiProperty() notes!: string;
  @ApiProperty() sortOrder!: number;
}

export class OpportunityTimelineEventDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: PartnershipOpportunityTimelineKind })
  kind!: PartnershipOpportunityTimelineKind;
  @ApiProperty() occurredAt!: string;
  @ApiProperty() note!: string;
  @ApiProperty({ nullable: true }) performedByName!: string | null;
  @ApiProperty() createdAt!: string;
}

export class OpportunityActivityLogDto {
  @ApiProperty() id!: string;
  @ApiProperty() action!: string;
  @ApiProperty() summary!: string;
  @ApiProperty({ nullable: true }) performedByName!: string | null;
  @ApiProperty() createdAt!: string;
}

export class OpportunityListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() opportunityNumber!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: PartnershipOpportunityType }) type!: PartnershipOpportunityType;
  @ApiProperty({ enum: PartnershipOpportunityStatus }) status!: PartnershipOpportunityStatus;
  @ApiProperty() institutionId!: string;
  @ApiProperty() institutionName!: string;
  @ApiProperty({ nullable: true }) previousDeliveryNumber!: string | null;
  @ApiProperty({ nullable: true }) previousSowNumber!: string | null;
  @ApiProperty({ nullable: true }) previousReportNumber!: string | null;
  @ApiProperty({ nullable: true }) ownerId!: string | null;
  @ApiProperty({ nullable: true }) ownerName!: string | null;
  @ApiProperty({ nullable: true }) expectedDate!: string | null;
  @ApiProperty({ nullable: true }) newProposalId!: string | null;
  @ApiProperty({ nullable: true }) newSowId!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class OpportunityResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() opportunityNumber!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: PartnershipOpportunityType }) type!: PartnershipOpportunityType;
  @ApiProperty({ enum: PartnershipOpportunityStatus }) status!: PartnershipOpportunityStatus;

  @ApiProperty() institutionId!: string;
  @ApiProperty() institutionName!: string;
  @ApiProperty({ type: OpportunityLinkRefDto, nullable: true })
  campus!: OpportunityLinkRefDto | null;

  @ApiProperty({ type: OpportunityLinkRefDto, nullable: true })
  previousProposal!: OpportunityLinkRefDto | null;
  @ApiProperty({ type: OpportunityLinkRefDto, nullable: true })
  previousSow!: OpportunityLinkRefDto | null;
  @ApiProperty({ type: OpportunityLinkRefDto, nullable: true })
  previousDelivery!: OpportunityLinkRefDto | null;
  @ApiProperty({ type: OpportunityLinkRefDto, nullable: true })
  previousReport!: OpportunityLinkRefDto | null;
  @ApiProperty({ type: OpportunityLinkRefDto, nullable: true })
  newProposal!: OpportunityLinkRefDto | null;
  @ApiProperty({ type: OpportunityLinkRefDto, nullable: true })
  newSow!: OpportunityLinkRefDto | null;

  @ApiProperty({ nullable: true }) ownerId!: string | null;
  @ApiProperty({ nullable: true }) ownerName!: string | null;
  @ApiProperty({ nullable: true }) expectedDate!: string | null;

  @ApiPropertyOptional({ description: 'Read-only historical snapshot from previous partnership.' })
  historicalSnapshot?: OpportunityHistoricalSnapshot | null;

  @ApiProperty({ type: [String] }) renewalProgramIds!: string[];
  @ApiProperty({ type: [String] }) renewalOfferingIds!: string[];
  @ApiProperty() renewalGrades!: string;
  @ApiProperty() renewalGroupsNote!: string;
  @ApiProperty() renewalDurationNote!: string;
  @ApiProperty() renewalDeliveryMode!: string;
  @ApiProperty() renewalScopeNotes!: string;
  @ApiProperty() expansionScopeNotes!: string;
  @ApiProperty() proposedScopeNotes!: string;
  @ApiProperty() existingScopeNotes!: string;

  @ApiProperty() reason!: string;
  @ApiProperty() schoolFeedback!: string;
  @ApiProperty() successFactors!: string;
  @ApiProperty() challenges!: string;
  @ApiProperty() requestedChanges!: string;
  @ApiProperty() internalNotes!: string;
  @ApiProperty() nextSteps!: string;

  @ApiProperty() feedbackSummary!: string;
  @ApiProperty({ nullable: true }) feedbackScore!: number | null;
  @ApiProperty() feedbackRequestedPrograms!: string;
  @ApiProperty() feedbackRequestedChanges!: string;
  @ApiProperty() feedbackKeyComments!: string;
  @ApiProperty({ nullable: true }) feedbackDate!: string | null;
  @ApiProperty() feedbackRecordedBy!: string;

  @ApiProperty({ type: [OpportunityExpansionKindDto] })
  expansionKinds!: OpportunityExpansionKindDto[];

  @ApiProperty({ type: [OpportunityTimelineEventDto] })
  timeline!: OpportunityTimelineEventDto[];

  @ApiProperty({ type: [OpportunityActivityLogDto] })
  activityLogs!: OpportunityActivityLogDto[];

  @ApiProperty({ type: [String], description: 'Allowed next statuses from current status.' })
  allowedTransitions!: PartnershipOpportunityStatus[];

  @ApiProperty({ nullable: true }) archivedAt!: string | null;
  @ApiProperty({ nullable: true }) convertedAt!: string | null;
  @ApiProperty({ nullable: true }) closedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class OpportunityDashboardDto {
  @ApiProperty() open!: number;
  @ApiProperty() renewals!: number;
  @ApiProperty() expansions!: number;
  @ApiProperty() proposalDrafts!: number;
  @ApiProperty() converted!: number;
  @ApiProperty() upcoming!: number;
}

export class OpportunityUserOptionDto {
  @ApiProperty() id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() role!: string;
}

export class PaginatedOpportunitiesDto {
  @ApiProperty({ type: [OpportunityListItemDto] }) items!: OpportunityListItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() pageCount!: number;
}
