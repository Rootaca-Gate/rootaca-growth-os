import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipLeadPriority,
  PartnershipLeadStatus,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export class CreateLeadDto {
  @ApiProperty()
  @IsUUID()
  institutionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryContactId?: string;

  @ApiPropertyOptional({ enum: PartnershipLeadStatus })
  @IsOptional()
  @IsEnum(PartnershipLeadStatus)
  status?: PartnershipLeadStatus;

  @ApiPropertyOptional({ enum: PartnershipLeadPriority })
  @IsOptional()
  @IsEnum(PartnershipLeadPriority)
  priority?: PartnershipLeadPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  qualificationReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedStudentCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  estimatedOpportunity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nextAction?: string;

  @ApiPropertyOptional({ example: '2026-09-25' })
  @IsOptional()
  @IsDateString()
  nextActionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryContactId?: string;

  @ApiPropertyOptional({ enum: PartnershipLeadStatus })
  @IsOptional()
  @IsEnum(PartnershipLeadStatus)
  status?: PartnershipLeadStatus;

  @ApiPropertyOptional({ enum: PartnershipLeadPriority })
  @IsOptional()
  @IsEnum(PartnershipLeadPriority)
  priority?: PartnershipLeadPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  qualificationReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedStudentCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  estimatedOpportunity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nextAction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextActionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class QueryLeadsDto {
  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({ enum: PartnershipLeadStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipLeadStatus)
  status?: PartnershipLeadStatus;

  @ApiPropertyOptional({ enum: PartnershipLeadPriority })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipLeadPriority)
  priority?: PartnershipLeadPriority;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'nextActionDate', 'status', 'priority'], default: 'updatedAt' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'nextActionDate', 'status', 'priority'])
  sortBy: 'createdAt' | 'updatedAt' | 'nextActionDate' | 'status' | 'priority' = 'updatedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}

export class LeadResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  institutionName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  primaryContactId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  primaryContactName!: string | null;

  @ApiProperty({ enum: PartnershipLeadStatus })
  status!: PartnershipLeadStatus;

  @ApiProperty({ enum: PartnershipLeadPriority })
  priority!: PartnershipLeadPriority;

  @ApiPropertyOptional({ nullable: true })
  sourceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  qualificationReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  estimatedStudentCount!: number | null;

  @ApiPropertyOptional({ nullable: true })
  estimatedOpportunity!: string | null;

  @ApiPropertyOptional({ nullable: true })
  nextAction!: string | null;

  @ApiPropertyOptional({ nullable: true })
  nextActionDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ownerId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ownerName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastActivityAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  nextFollowUpDate!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedLeadsDto {
  @ApiProperty({ type: [LeadResponseDto] })
  items!: LeadResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
