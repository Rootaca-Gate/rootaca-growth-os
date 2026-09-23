import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipImportMatchConfidence,
  PartnershipImportRowDecision,
  PartnershipImportRowResult,
  PartnershipImportStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IMPORT_CRM_FIELDS, ImportCrmField } from '../mapping/field-aliases';

export class ImportMappingDto {
  @ApiProperty({
    description: 'Map of CSV header → CRM field key (or null to ignore)',
    example: { 'School Name': 'name', Website: 'website' },
  })
  @IsObject()
  mapping!: Record<string, ImportCrmField | null>;
}

export class ImportRowDecisionItemDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  rowNumber!: number;

  @ApiProperty({ enum: PartnershipImportRowDecision })
  @IsEnum(PartnershipImportRowDecision)
  decision!: PartnershipImportRowDecision;

  @ApiPropertyOptional({ description: 'Required for MERGE when overriding matched id' })
  @IsOptional()
  @IsUUID()
  mergeTargetId?: string;
}

export class UpdateImportDecisionsDto {
  @ApiPropertyOptional({ type: [ImportRowDecisionItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10_000)
  @ValidateNested({ each: true })
  @Type(() => ImportRowDecisionItemDto)
  decisions?: ImportRowDecisionItemDto[];

  @ApiPropertyOptional({
    enum: ['SKIP_ALL_EXACT', 'IMPORT_ALL_NEW'],
    description: 'Safe bulk actions only (no merge-all)',
  })
  @IsOptional()
  @IsEnum(['SKIP_ALL_EXACT', 'IMPORT_ALL_NEW'] as const)
  bulk?: 'SKIP_ALL_EXACT' | 'IMPORT_ALL_NEW';
}

export class QueryImportRowsDto {
  @ApiPropertyOptional({
    enum: ['all', 'valid', 'invalid', 'duplicates', 'new', 'needs_review'],
  })
  @IsOptional()
  @IsString()
  filter?: 'all' | 'valid' | 'invalid' | 'duplicates' | 'new' | 'needs_review';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}

export class QueryImportHistoryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class ImportValidationErrorDto {
  @ApiProperty()
  field!: string;

  @ApiProperty()
  reason!: string;
}

export class ImportPreviewRowDto {
  @ApiProperty()
  rowNumber!: number;

  @ApiPropertyOptional({ nullable: true })
  name!: string | null;

  @ApiPropertyOptional({ nullable: true })
  governorate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  city!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty()
  isValid!: boolean;

  @ApiProperty({ type: [ImportValidationErrorDto] })
  validationErrors!: ImportValidationErrorDto[];

  @ApiProperty({ enum: PartnershipImportMatchConfidence })
  matchConfidence!: PartnershipImportMatchConfidence;

  @ApiProperty({ type: [String] })
  matchReasons!: string[];

  @ApiPropertyOptional({ nullable: true })
  matchedInstitutionId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  matchedInstitutionName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  csvDuplicateOfRow!: number | null;

  @ApiProperty({ enum: PartnershipImportRowDecision })
  decision!: PartnershipImportRowDecision;

  @ApiProperty({ enum: PartnershipImportRowResult })
  resultStatus!: PartnershipImportRowResult;

  @ApiPropertyOptional({ nullable: true })
  resultError!: string | null;

  @ApiPropertyOptional({ nullable: true })
  resultInstitutionId!: string | null;
}

export class ImportSummaryDto {
  @ApiProperty()
  totalRows!: number;

  @ApiProperty()
  validRows!: number;

  @ApiProperty()
  invalidRows!: number;

  @ApiProperty()
  newInstitutions!: number;

  @ApiProperty()
  exactDuplicates!: number;

  @ApiProperty()
  possibleDuplicates!: number;

  @ApiProperty()
  csvDuplicates!: number;

  @ApiProperty()
  needsReview!: number;
}

export class ImportResultCountsDto {
  @ApiProperty()
  imported!: number;

  @ApiProperty()
  merged!: number;

  @ApiProperty()
  skipped!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty()
  invalid!: number;
}

export class ImportJobDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  fileSizeBytes!: number;

  @ApiProperty()
  uploadedById!: string;

  @ApiPropertyOptional({ nullable: true })
  uploadedByName!: string | null;

  @ApiProperty({ enum: PartnershipImportStatus })
  status!: PartnershipImportStatus;

  @ApiProperty({ type: [String] })
  headers!: string[];

  @ApiProperty({ description: 'CSV header → CRM field' })
  mapping!: Record<string, string | null>;

  @ApiPropertyOptional({ type: ImportSummaryDto, nullable: true })
  summary!: ImportSummaryDto | null;

  @ApiPropertyOptional({ type: ImportResultCountsDto, nullable: true })
  result!: ImportResultCountsDto | null;

  @ApiPropertyOptional({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: string | null;
}

export class ImportPreviewResponseDto {
  @ApiProperty({ type: ImportJobDto })
  job!: ImportJobDto;

  @ApiProperty({ description: 'Auto-suggested mapping before user edits' })
  suggestedMapping!: Record<string, string | null>;

  @ApiProperty({ type: [String], enum: IMPORT_CRM_FIELDS })
  crmFields!: readonly string[];

  @ApiProperty({ type: [ImportPreviewRowDto] })
  rows!: ImportPreviewRowDto[];

  @ApiProperty()
  rowsTotal!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}

export class PaginatedImportJobsDto {
  @ApiProperty({ type: [ImportJobDto] })
  items!: ImportJobDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}

export class PaginatedImportRowsDto {
  @ApiProperty({ type: [ImportPreviewRowDto] })
  items!: ImportPreviewRowDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
