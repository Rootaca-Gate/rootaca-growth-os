import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LevelCode,
  MilestoneKind,
  MilestoneStatus,
  PathCode,
  ProjectPurpose,
  StudentProjectStatus,
} from '@prisma/client';

export class ProjectDefinitionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  learningGoal!: string;

  @ApiProperty({ enum: ProjectPurpose, enumName: 'ProjectPurpose' })
  purpose!: ProjectPurpose;

  @ApiProperty({ enum: PathCode, enumName: 'PathCode' })
  path!: PathCode;

  @ApiProperty({ enum: LevelCode, enumName: 'LevelCode' })
  level!: LevelCode;

  @ApiProperty()
  durationDays!: number;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  assignmentCount!: number;
}

export class ProjectMilestoneDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: MilestoneKind, enumName: 'MilestoneKind' })
  kind!: MilestoneKind;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  completionPercent!: number;

  @ApiProperty({ enum: MilestoneStatus, enumName: 'MilestoneStatus' })
  status!: MilestoneStatus;

  @ApiPropertyOptional()
  dueDate?: string | null;

  @ApiProperty()
  mentorFeedback!: string;
}

export class StudentProjectDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty({ type: ProjectDefinitionDto })
  project!: ProjectDefinitionDto;

  @ApiProperty({ enum: StudentProjectStatus, enumName: 'StudentProjectStatus' })
  status!: StudentProjectStatus;

  @ApiProperty()
  progressPercent!: number;

  @ApiProperty()
  assignedAt!: string;

  @ApiPropertyOptional()
  dueDate?: string | null;

  @ApiProperty()
  notes!: string;

  @ApiProperty({ type: [ProjectMilestoneDto] })
  milestones!: ProjectMilestoneDto[];
}

export class StudentProjectSummaryDto {
  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty()
  overallPercent!: number;

  @ApiProperty()
  assignedCount!: number;

  @ApiProperty()
  inProgressCount!: number;

  @ApiProperty()
  completedCount!: number;

  @ApiProperty({ type: [StudentProjectDto] })
  items!: StudentProjectDto[];
}

export class ProjectDetailsDto extends ProjectDefinitionDto {
  @ApiProperty({ type: [StudentProjectDto] })
  assignments!: StudentProjectDto[];
}
