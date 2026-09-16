import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportLocale } from './report-query.dto';

export class ReportFieldDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;
}

export class ReportScoreItemDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  score!: number;

  @ApiPropertyOptional()
  detail?: string;
}

export class ReportStudentSectionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ type: [ReportFieldDto] })
  fields!: ReportFieldDto[];
}

export class ReportLevelSectionDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  description!: string;
}

export class ReportAssessmentSectionDto {
  @ApiProperty()
  overallScore!: number;

  @ApiProperty()
  completedAt!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ type: [ReportScoreItemDto] })
  categories!: ReportScoreItemDto[];
}

export class ReportPathSectionDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  reasons!: string[];

  @ApiPropertyOptional()
  alternativeName?: string | null;

  @ApiProperty({ type: [String] })
  alternativeReasons!: string[];
}

export class ReportRoadmapPhaseDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  percent!: number;

  @ApiProperty()
  completedCount!: number;

  @ApiProperty()
  itemCount!: number;
}

export class ReportRoadmapSectionDto {
  @ApiProperty()
  pathName!: string;

  @ApiProperty()
  levelName!: string;

  @ApiProperty()
  overallPercent!: number;

  @ApiProperty()
  completedCount!: number;

  @ApiProperty()
  itemCount!: number;

  @ApiProperty()
  inProgressCount!: number;

  @ApiProperty()
  blockedCount!: number;

  @ApiProperty({ type: [ReportRoadmapPhaseDto] })
  phases!: ReportRoadmapPhaseDto[];
}

export class ReportKpiItemDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  actual!: number;

  @ApiProperty()
  target!: number;

  @ApiProperty()
  unit!: string;

  @ApiProperty()
  progressPercent!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  statusLabel!: string;
}

export class ReportKpiSectionDto {
  @ApiProperty()
  overallPercent!: number;

  @ApiProperty()
  overallStatus!: string;

  @ApiProperty()
  overallStatusLabel!: string;

  @ApiProperty({ type: [ReportKpiItemDto] })
  items!: ReportKpiItemDto[];
}

export class ReportProjectItemDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  statusLabel!: string;

  @ApiProperty()
  progressPercent!: number;
}

export class ReportProjectSectionDto {
  @ApiProperty()
  overallPercent!: number;

  @ApiProperty()
  assignedCount!: number;

  @ApiProperty()
  completedCount!: number;

  @ApiProperty({ type: [ReportProjectItemDto] })
  items!: ReportProjectItemDto[];
}

export class StudentProgressReportDto {
  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ enum: ['en', 'ar'] })
  locale!: ReportLocale;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty({ type: ReportStudentSectionDto })
  student!: ReportStudentSectionDto;

  @ApiPropertyOptional({ type: ReportLevelSectionDto, nullable: true })
  currentLevel!: ReportLevelSectionDto | null;

  @ApiPropertyOptional({ type: ReportAssessmentSectionDto, nullable: true })
  assessment!: ReportAssessmentSectionDto | null;

  @ApiProperty({ type: [ReportScoreItemDto] })
  skills!: ReportScoreItemDto[];

  @ApiPropertyOptional({ type: ReportPathSectionDto, nullable: true })
  recommendedPath!: ReportPathSectionDto | null;

  @ApiPropertyOptional({ type: ReportRoadmapSectionDto, nullable: true })
  roadmap!: ReportRoadmapSectionDto | null;

  @ApiProperty({ type: ReportKpiSectionDto })
  kpis!: ReportKpiSectionDto;

  @ApiProperty({ type: ReportProjectSectionDto })
  projects!: ReportProjectSectionDto;

  @ApiProperty({ type: [String] })
  achievements!: string[];

  @ApiProperty({ type: [String] })
  areasForImprovement!: string[];

  @ApiProperty({ type: [String] })
  nextGoals!: string[];
}
