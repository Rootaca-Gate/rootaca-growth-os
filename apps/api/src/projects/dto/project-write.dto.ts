import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LevelCode, MilestoneStatus, PathCode, StudentProjectStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateProjectDto {
  @ApiPropertyOptional({ example: 'CLASSROOM_BLOG' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]{1,47}$/)
  code?: string;

  @ApiProperty({ example: 'Classroom blog lab' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  @MaxLength(2000)
  description!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  learningGoal!: string;

  @ApiProperty({ enum: PathCode, enumName: 'PathCode' })
  @IsEnum(PathCode)
  path!: PathCode;

  @ApiProperty({ enum: LevelCode, enumName: 'LevelCode' })
  @IsEnum(LevelCode)
  level!: LevelCode;

  @ApiProperty({ example: 38 })
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(180)
  durationDays!: number;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  learningGoal?: string;

  @ApiPropertyOptional({ enum: PathCode, enumName: 'PathCode' })
  @IsOptional()
  @IsEnum(PathCode)
  path?: PathCode;

  @ApiPropertyOptional({ enum: LevelCode, enumName: 'LevelCode' })
  @IsOptional()
  @IsEnum(LevelCode)
  level?: LevelCode;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(180)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AssignProjectDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateStudentProjectDto {
  @ApiPropertyOptional({ enum: StudentProjectStatus, enumName: 'StudentProjectStatus' })
  @IsOptional()
  @IsEnum(StudentProjectStatus)
  status?: StudentProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateMilestoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercent?: number;

  @ApiPropertyOptional({ enum: MilestoneStatus, enumName: 'MilestoneStatus' })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mentorFeedback?: string;
}
