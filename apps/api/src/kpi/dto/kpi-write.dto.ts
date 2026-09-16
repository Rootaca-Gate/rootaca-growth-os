import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KpiCategory, KpiFrequency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateKpiDto {
  @ApiPropertyOptional({ example: 'PAIR_SESSIONS' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]{1,47}$/)
  code?: string;

  @ApiProperty({ example: 'Pair sessions' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ enum: KpiCategory, enumName: 'KpiCategory' })
  @IsEnum(KpiCategory)
  category!: KpiCategory;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  target!: number;

  @ApiProperty({ example: 'sessions' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  unit!: string;

  @ApiProperty({ enum: KpiFrequency, enumName: 'KpiFrequency' })
  @IsEnum(KpiFrequency)
  frequency!: KpiFrequency;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  weight!: number;
}

export class UpdateKpiDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: KpiCategory, enumName: 'KpiCategory' })
  @IsOptional()
  @IsEnum(KpiCategory)
  category?: KpiCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  target?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  unit?: string;

  @ApiPropertyOptional({ enum: KpiFrequency, enumName: 'KpiFrequency' })
  @IsOptional()
  @IsEnum(KpiFrequency)
  frequency?: KpiFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  sortOrder?: number;
}

export class RecordStudentKpiDto {
  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  actual?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  target?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ enum: KpiFrequency, enumName: 'KpiFrequency' })
  @IsOptional()
  @IsEnum(KpiFrequency)
  frequency?: KpiFrequency;
}
