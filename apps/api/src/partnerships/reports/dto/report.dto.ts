import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipReportRecommendationPriority,
  PartnershipReportStatus,
  PartnershipReportStudentTrackStatus,
  PartnershipReportType,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
import {
  ReportDataSnapshot,
  ReportKpis,
  PublishValidation,
} from '../report-aggregate';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export class QueryReportsDto {
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
  deliveryId?: string;

  @ApiPropertyOptional({ description: 'Filter by program name snapshot (substring).' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  programName?: string;

  @ApiPropertyOptional({ enum: PartnershipReportType })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipReportType)
  type?: PartnershipReportType;

  @ApiPropertyOptional({ enum: PartnershipReportStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipReportStatus)
  status?: PartnershipReportStatus;

  @ApiPropertyOptional({ description: 'Filter periodStart >= date (ISO date).' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter periodEnd <= date (ISO date).' })
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

export class CreateReportFromDeliveryDto {
  @ApiProperty()
  @IsUUID()
  deliveryId!: string;

  @ApiProperty({ enum: PartnershipReportType })
  @IsEnum(PartnershipReportType)
  type!: PartnershipReportType;
}

export class ReportRecommendationInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;

  @ApiPropertyOptional({ enum: PartnershipReportRecommendationPriority })
  @IsOptional()
  @IsEnum(PartnershipReportRecommendationPriority)
  priority?: PartnershipReportRecommendationPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  targetDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  periodStart?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  periodEnd?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  periodLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  preparedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  executiveSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  achievements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  nextSteps?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  renewalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  internalNotes?: string;

  @ApiPropertyOptional({ type: [ReportRecommendationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportRecommendationInputDto)
  recommendations?: ReportRecommendationInputDto[];
}

export class ChangeReportStatusDto {
  @ApiProperty({ enum: PartnershipReportStatus })
  @IsEnum(PartnershipReportStatus)
  status!: PartnershipReportStatus;
}

export class ReportRecommendationDto {
  @ApiProperty() id!: string;
  @ApiProperty() text!: string;
  @ApiProperty({ enum: PartnershipReportRecommendationPriority }) priority!: PartnershipReportRecommendationPriority;
  @ApiProperty() owner!: string;
  @ApiProperty({ nullable: true }) targetDate!: string | null;
  @ApiProperty() isInternal!: boolean;
  @ApiProperty() sortOrder!: number;
}

export class ReportVersionDto {
  @ApiProperty() id!: string;
  @ApiProperty() version!: string;
  @ApiProperty() changeNote!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ nullable: true }) createdByName!: string | null;
}

export class ReportActivityLogDto {
  @ApiProperty() id!: string;
  @ApiProperty() action!: string;
  @ApiProperty() summary!: string;
  @ApiProperty({ nullable: true }) performedByName!: string | null;
  @ApiProperty() createdAt!: string;
}

export class PublishValidationDto implements PublishValidation {
  @ApiProperty() ok!: boolean;
  @ApiProperty({ type: [String] }) errors!: string[];
  @ApiProperty({ type: [String] }) warnings!: string[];
}

export class ReportListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() reportNumber!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: PartnershipReportType }) type!: PartnershipReportType;
  @ApiProperty({ enum: PartnershipReportStatus }) status!: PartnershipReportStatus;
  @ApiProperty() institutionId!: string;
  @ApiProperty() institutionName!: string;
  @ApiProperty() deliveryId!: string;
  @ApiProperty() deliveryNumber!: string;
  @ApiProperty() programNameSnapshot!: string;
  @ApiProperty({ nullable: true }) periodStart!: string | null;
  @ApiProperty({ nullable: true }) periodEnd!: string | null;
  @ApiProperty() periodLabel!: string;
  @ApiProperty() version!: string;
  @ApiProperty() updatedAt!: string;
}

export class ReportResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() reportNumber!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: PartnershipReportType }) type!: PartnershipReportType;
  @ApiProperty({ enum: PartnershipReportStatus }) status!: PartnershipReportStatus;
  @ApiProperty() version!: string;

  @ApiProperty() institutionId!: string;
  @ApiProperty() institutionName!: string;
  @ApiProperty() deliveryId!: string;
  @ApiProperty() deliveryNumber!: string;
  @ApiProperty() sowId!: string;
  @ApiProperty() sowNumber!: string;
  @ApiProperty() proposalId!: string;
  @ApiProperty() proposalNumber!: string;
  @ApiProperty() programNameSnapshot!: string;

  @ApiProperty({ nullable: true }) periodStart!: string | null;
  @ApiProperty({ nullable: true }) periodEnd!: string | null;
  @ApiProperty() periodLabel!: string;
  @ApiProperty() preparedBy!: string;

  @ApiProperty() executiveSummary!: string;
  @ApiProperty() achievements!: string;
  @ApiProperty() nextSteps!: string;
  @ApiProperty() renewalNotes!: string;
  @ApiProperty() internalNotes!: string;

  @ApiPropertyOptional({ description: 'KPI slice from dataSnapshot when present.' })
  kpis?: ReportKpis | null;

  @ApiPropertyOptional({ description: 'Full working aggregate snapshot.' })
  dataSnapshot?: ReportDataSnapshot | null;

  @ApiPropertyOptional({ description: 'Frozen school-facing snapshot after publish.' })
  publishedSnapshot?: Record<string, unknown> | null;

  @ApiProperty({ type: [ReportRecommendationDto] })
  recommendations!: ReportRecommendationDto[];

  @ApiProperty({ type: [ReportVersionDto] })
  versions!: ReportVersionDto[];

  @ApiProperty({ type: [ReportActivityLogDto] })
  activityLogs!: ReportActivityLogDto[];

  @ApiPropertyOptional({ type: PublishValidationDto })
  publishValidation?: PublishValidationDto;

  @ApiProperty({ nullable: true }) publishedAt!: string | null;
  @ApiProperty({ nullable: true }) publishedByName!: string | null;
  @ApiProperty({ nullable: true }) archivedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class PaginatedReportsDto {
  @ApiProperty({ type: [ReportListItemDto] }) items!: ReportListItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() pageCount!: number;
}

export { PartnershipReportStudentTrackStatus };
