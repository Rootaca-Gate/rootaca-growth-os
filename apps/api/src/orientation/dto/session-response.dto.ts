import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AssessmentCategoryCode,
  OrientationSessionStatus,
  OrientationStage,
  QuestionType,
} from '@prisma/client';
import { PlacementResponseDto } from '../../placement/dto/placement-response.dto';

export class AssessmentOptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  scoreValue!: number;

  @ApiProperty()
  sortOrder!: number;
}

export class AssessmentQuestionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: AssessmentCategoryCode, enumName: 'AssessmentCategoryCode' })
  categoryCode!: AssessmentCategoryCode;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty({ enum: OrientationStage, enumName: 'OrientationStage' })
  stage!: OrientationStage;

  @ApiProperty({ enum: QuestionType, enumName: 'QuestionType' })
  type!: QuestionType;

  @ApiProperty()
  prompt!: string;

  @ApiPropertyOptional()
  helperText?: string | null;

  @ApiPropertyOptional()
  skillKey?: string | null;

  @ApiProperty()
  scored!: boolean;

  @ApiProperty()
  maxScore!: number;

  @ApiProperty()
  scaleMax!: number;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: [AssessmentOptionResponseDto] })
  options!: AssessmentOptionResponseDto[];
}

export class AssessmentAnswerResponseDto {
  @ApiProperty({ format: 'uuid' })
  questionId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  optionId?: string | null;

  @ApiPropertyOptional()
  numericValue?: number | null;

  @ApiPropertyOptional()
  textValue?: string | null;

  @ApiPropertyOptional()
  score?: number | null;
}

export class CategoryScoreDto {
  @ApiProperty({ enum: AssessmentCategoryCode, enumName: 'AssessmentCategoryCode' })
  code!: AssessmentCategoryCode;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  weightPercent!: number;

  @ApiProperty()
  score!: number;
}

export class SkillScoreDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  score!: number;
}

export class AssessmentResultResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  sessionId!: string;

  @ApiProperty()
  overallScore!: number;

  @ApiProperty({ type: [CategoryScoreDto] })
  categoryScores!: CategoryScoreDto[];

  @ApiProperty({ type: [SkillScoreDto] })
  skillScores!: SkillScoreDto[];

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  completedAt!: string;

  @ApiPropertyOptional({ type: PlacementResponseDto })
  placement?: PlacementResponseDto | null;
}

export class OrientationSessionSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ enum: OrientationSessionStatus, enumName: 'OrientationSessionStatus' })
  status!: OrientationSessionStatus;

  @ApiProperty({ enum: OrientationStage, enumName: 'OrientationStage' })
  currentStage!: OrientationStage;

  @ApiProperty()
  elapsedMs!: number;

  @ApiProperty()
  targetDurationMs!: number;

  @ApiProperty()
  remainingMs!: number;

  @ApiProperty()
  overtime!: boolean;

  @ApiProperty()
  running!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional()
  completedAt?: string | null;

  @ApiPropertyOptional()
  overallScore?: number | null;
}

export class OrientationSessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty({ format: 'uuid' })
  createdById!: string;

  @ApiProperty({ enum: OrientationSessionStatus, enumName: 'OrientationSessionStatus' })
  status!: OrientationSessionStatus;

  @ApiProperty({ enum: OrientationStage, enumName: 'OrientationStage' })
  currentStage!: OrientationStage;

  @ApiProperty()
  notes!: string;

  @ApiProperty()
  elapsedMs!: number;

  @ApiProperty()
  targetDurationMs!: number;

  @ApiProperty()
  remainingMs!: number;

  @ApiProperty()
  overtime!: boolean;

  @ApiProperty()
  running!: boolean;

  @ApiPropertyOptional()
  startedAt?: string | null;

  @ApiPropertyOptional()
  pausedAt?: string | null;

  @ApiPropertyOptional()
  completedAt?: string | null;

  @ApiPropertyOptional()
  lastResumedAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: [AssessmentQuestionResponseDto] })
  questions!: AssessmentQuestionResponseDto[];

  @ApiProperty({ type: [AssessmentAnswerResponseDto] })
  answers!: AssessmentAnswerResponseDto[];

  @ApiPropertyOptional({ type: AssessmentResultResponseDto })
  result?: AssessmentResultResponseDto | null;
}
