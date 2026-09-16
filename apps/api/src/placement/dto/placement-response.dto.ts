import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LevelCode, PathCode, SkillCode } from '@prisma/client';

export class LevelRuleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  minScore!: number;

  @ApiProperty()
  maxScore!: number;

  @ApiProperty()
  source!: string;
}

export class LevelResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: LevelCode, enumName: 'LevelCode' })
  code!: LevelCode;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiPropertyOptional({ type: [LevelRuleResponseDto] })
  rules?: LevelRuleResponseDto[];
}

export class SkillResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: SkillCode, enumName: 'SkillCode' })
  code!: SkillCode;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class PathSkillResponseDto {
  @ApiProperty({ format: 'uuid' })
  skillId!: string;

  @ApiProperty({ enum: SkillCode, enumName: 'SkillCode' })
  skillCode!: SkillCode;

  @ApiProperty()
  skillName!: string;

  @ApiProperty()
  weightPercent!: number;
}

export class LearningPathResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: PathCode, enumName: 'PathCode' })
  code!: PathCode;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiPropertyOptional({ type: [PathSkillResponseDto] })
  skills?: PathSkillResponseDto[];
}

export class StudentSkillResponseDto {
  @ApiProperty({ format: 'uuid' })
  skillId!: string;

  @ApiProperty({ enum: SkillCode, enumName: 'SkillCode' })
  code!: SkillCode;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  score!: number;
}

export class ActorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;
}

export class PlacementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  assessmentResultId!: string;

  @ApiProperty({ type: LevelResponseDto })
  systemLevel!: LevelResponseDto;

  @ApiProperty({ type: LevelResponseDto })
  finalLevel!: LevelResponseDto;

  @ApiProperty({ type: LearningPathResponseDto })
  systemPath!: LearningPathResponseDto;

  @ApiProperty({ type: LearningPathResponseDto })
  finalPath!: LearningPathResponseDto;

  @ApiProperty({ type: LearningPathResponseDto })
  alternativePath!: LearningPathResponseDto;

  @ApiProperty({ type: [String] })
  recommendationReasons!: string[];

  @ApiProperty({ type: [String] })
  alternativeReasons!: string[];

  @ApiPropertyOptional({ type: ActorResponseDto })
  levelChangedBy?: ActorResponseDto | null;

  @ApiPropertyOptional({ type: ActorResponseDto })
  pathChangedBy?: ActorResponseDto | null;

  @ApiPropertyOptional()
  levelOverrideReason?: string | null;

  @ApiPropertyOptional()
  pathOverrideReason?: string | null;

  @ApiPropertyOptional()
  levelChangedAt?: string | null;

  @ApiPropertyOptional()
  pathChangedAt?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
