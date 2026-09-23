import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnershipSourceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateSourceDto {
  @ApiProperty({ enum: PartnershipSourceType })
  @IsEnum(PartnershipSourceType)
  sourceType!: PartnershipSourceType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  sourceName!: string;

  @ApiPropertyOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_protocol: false })
  @IsOptional()
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateSourceDto {
  @ApiPropertyOptional({ enum: PartnershipSourceType })
  @IsOptional()
  @IsEnum(PartnershipSourceType)
  sourceType?: PartnershipSourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  sourceName?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_protocol: false })
  @IsOptional()
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class QuerySourcesDto {
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

export class SourceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: PartnershipSourceType })
  sourceType!: PartnershipSourceType;

  @ApiProperty()
  sourceName!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceUrl!: string | null;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedSourcesDto {
  @ApiProperty({ type: [SourceResponseDto] })
  items!: SourceResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
