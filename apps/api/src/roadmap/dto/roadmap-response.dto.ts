import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PathCode, LevelCode, RoadmapItemStatus, SkillCode } from '@prisma/client';

export class RoadmapSkillDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: SkillCode, enumName: 'SkillCode' })
  code!: SkillCode;

  @ApiProperty()
  name!: string;
}

export class RoadmapItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  phaseId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ type: RoadmapSkillDto })
  skill?: RoadmapSkillDto | null;

  @ApiProperty()
  durationDays!: number;

  @ApiPropertyOptional()
  startDate?: string | null;

  @ApiPropertyOptional()
  dueDate?: string | null;

  @ApiProperty({ enum: RoadmapItemStatus, enumName: 'RoadmapItemStatus' })
  status!: RoadmapItemStatus;

  @ApiProperty()
  completionPercentage!: number;

  @ApiPropertyOptional({ format: 'uuid' })
  projectId?: string | null;

  @ApiProperty()
  notes!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class PhaseProgressDto {
  @ApiProperty({ format: 'uuid' })
  phaseId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  percent!: number;

  @ApiProperty()
  completedCount!: number;

  @ApiProperty()
  itemCount!: number;

  @ApiProperty()
  blockedCount!: number;
}

export class RoadmapProgressDto {
  @ApiProperty()
  overallPercent!: number;

  @ApiProperty()
  itemCount!: number;

  @ApiProperty()
  completedCount!: number;

  @ApiProperty()
  inProgressCount!: number;

  @ApiProperty()
  blockedCount!: number;

  @ApiProperty({ type: [PhaseProgressDto] })
  phases!: PhaseProgressDto[];

  @ApiProperty({ type: [RoadmapItemResponseDto] })
  blockedItems!: RoadmapItemResponseDto[];
}

export class RoadmapPhaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  progressPercent!: number;

  @ApiProperty({ type: [RoadmapItemResponseDto] })
  items!: RoadmapItemResponseDto[];
}

export class RoadmapResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  pathId!: string;

  @ApiProperty({ enum: PathCode, enumName: 'PathCode' })
  pathCode!: PathCode;

  @ApiProperty()
  pathName!: string;

  @ApiProperty({ format: 'uuid' })
  levelId!: string;

  @ApiProperty({ enum: LevelCode, enumName: 'LevelCode' })
  levelCode!: LevelCode;

  @ApiProperty()
  levelName!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  templateId?: string | null;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty({ type: RoadmapProgressDto })
  progress!: RoadmapProgressDto;

  @ApiProperty({ type: [RoadmapPhaseResponseDto] })
  phases!: RoadmapPhaseResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class RoadmapTemplateItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: RoadmapSkillDto })
  skill!: RoadmapSkillDto;

  @ApiProperty()
  durationDays!: number;

  @ApiProperty()
  sortOrder!: number;
}

export class RoadmapTemplatePhaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: [RoadmapTemplateItemResponseDto] })
  items!: RoadmapTemplateItemResponseDto[];
}

export class RoadmapTemplateResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  pathId!: string;

  @ApiProperty({ enum: PathCode, enumName: 'PathCode' })
  pathCode!: PathCode;

  @ApiProperty()
  pathName!: string;

  @ApiProperty({ format: 'uuid' })
  levelId!: string;

  @ApiProperty({ enum: LevelCode, enumName: 'LevelCode' })
  levelCode!: LevelCode;

  @ApiProperty()
  levelName!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [RoadmapTemplatePhaseResponseDto] })
  phases!: RoadmapTemplatePhaseResponseDto[];
}
