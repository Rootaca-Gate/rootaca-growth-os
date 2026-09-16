import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewKind } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProgressReviewDto {
  @ApiProperty({ enum: ReviewKind, enumName: 'ReviewKind' })
  @IsEnum(ReviewKind)
  kind!: ReviewKind;

  @ApiPropertyOptional({ example: '2026-09-16' })
  @IsOptional()
  @IsDateString()
  reviewedAt?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  technicalSkills!: number;

  @ApiProperty({ example: 38 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  problemSolving!: number;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  projects!: number;

  @ApiProperty({ example: 35 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  independence!: number;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  communication!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nextFocus?: string;
}

export class UpdateProgressReviewDto {
  @ApiPropertyOptional({ enum: ReviewKind, enumName: 'ReviewKind' })
  @IsOptional()
  @IsEnum(ReviewKind)
  kind?: ReviewKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  reviewedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  technicalSkills?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  problemSolving?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  projects?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  independence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  communication?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nextFocus?: string;
}
