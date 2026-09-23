import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipFollowUpPriority,
  PartnershipFollowUpStatus,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
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
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return value;
};

export class CreateFollowUpDto {
  @ApiProperty()
  @IsUUID()
  institutionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: '2026-09-25' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ enum: PartnershipFollowUpPriority })
  @IsOptional()
  @IsEnum(PartnershipFollowUpPriority)
  priority?: PartnershipFollowUpPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateFollowUpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: PartnershipFollowUpPriority })
  @IsOptional()
  @IsEnum(PartnershipFollowUpPriority)
  priority?: PartnershipFollowUpPriority;

  @ApiPropertyOptional({ enum: PartnershipFollowUpStatus })
  @IsOptional()
  @IsEnum(PartnershipFollowUpStatus)
  status?: PartnershipFollowUpStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Shortcut to complete follow-up' })
  @IsOptional()
  @IsBoolean()
  complete?: boolean;
}

export class QueryFollowUpsDto {
  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({ enum: PartnershipFollowUpStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipFollowUpStatus)
  status?: PartnershipFollowUpStatus;

  @ApiPropertyOptional({ enum: PartnershipFollowUpPriority })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipFollowUpPriority)
  priority?: PartnershipFollowUpPriority;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  overdue?: boolean;

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
}

export class FollowUpResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  contactId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  leadId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  dueDate!: string;

  @ApiProperty({ enum: PartnershipFollowUpPriority })
  priority!: PartnershipFollowUpPriority;

  @ApiProperty({ enum: PartnershipFollowUpStatus })
  status!: PartnershipFollowUpStatus;

  @ApiPropertyOptional({ nullable: true })
  assignedToId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedFollowUpsDto {
  @ApiProperty({ type: [FollowUpResponseDto] })
  items!: FollowUpResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
