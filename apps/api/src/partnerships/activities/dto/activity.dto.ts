import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnershipActivityType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
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

export class CreateActivityDto {
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

  @ApiProperty({ enum: PartnershipActivityType })
  @IsEnum(PartnershipActivityType)
  activityType!: PartnershipActivityType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  activityDate?: string;
}

export class QueryActivitiesDto {
  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ enum: PartnershipActivityType })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipActivityType)
  activityType?: PartnershipActivityType;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  dateTo?: string;

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

export class ActivityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  contactId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  leadId!: string | null;

  @ApiProperty({ enum: PartnershipActivityType })
  activityType!: PartnershipActivityType;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  activityDate!: string;

  @ApiProperty()
  createdById!: string;

  @ApiPropertyOptional({ nullable: true })
  createdByName!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class PaginatedActivitiesDto {
  @ApiProperty({ type: [ActivityResponseDto] })
  items!: ActivityResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
