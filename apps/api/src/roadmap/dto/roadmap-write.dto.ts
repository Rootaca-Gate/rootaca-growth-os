import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoadmapItemStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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

export class CreateRoadmapPhaseDto {
  @ApiProperty({ example: 'Practice' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title!: string;

  @ApiProperty({ example: 'Short exercises with a visible outcome.' })
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  description!: string;
}

export class UpdateRoadmapPhaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  description?: string;
}

export class UpsertRoadmapItemDto {
  @ApiPropertyOptional({ example: 'Ship a small website' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  skillId?: string | null;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  durationDays?: number;

  @ApiPropertyOptional({ example: '2026-09-16' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2026-09-23' })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ enum: RoadmapItemStatus, enumName: 'RoadmapItemStatus' })
  @IsOptional()
  @IsEnum(RoadmapItemStatus)
  status?: RoadmapItemStatus;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  phaseId?: string;
}

export class CreateRoadmapItemDto {
  @ApiProperty({ example: 'Ship a small website' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  skillId?: string | null;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  durationDays?: number;

  @ApiPropertyOptional({ example: '2026-09-16' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2026-09-23' })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ enum: RoadmapItemStatus, enumName: 'RoadmapItemStatus' })
  @IsOptional()
  @IsEnum(RoadmapItemStatus)
  status?: RoadmapItemStatus;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ReorderDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ids!: string[];
}
