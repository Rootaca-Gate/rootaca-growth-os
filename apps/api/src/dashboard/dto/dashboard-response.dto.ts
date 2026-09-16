import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardCardDto {
  @ApiProperty()
  totalStudents!: number;

  @ApiProperty()
  activeStudents!: number;

  @ApiProperty()
  todaysSessions!: number;

  @ApiProperty()
  pendingAssessments!: number;

  @ApiPropertyOptional({ nullable: true, type: Number })
  averageProgress!: number | null;

  @ApiProperty()
  projectsCompleted!: number;

  @ApiProperty()
  newThisWeek!: number;

  @ApiPropertyOptional({ nullable: true, type: Number })
  averageSkillScore!: number | null;
}

export class DashboardChartBucketDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  count!: number;
}

export class DashboardScoreBucketDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  score!: number;

  @ApiProperty()
  sampleSize!: number;
}

export class DashboardMonthlyPointDto {
  @ApiProperty()
  month!: string;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional({ nullable: true, type: Number })
  average!: number | null;

  @ApiProperty()
  reviewCount!: number;
}

export class DashboardChartsDto {
  @ApiProperty({ type: [DashboardChartBucketDto] })
  studentsByLevel!: DashboardChartBucketDto[];

  @ApiProperty({ type: [DashboardChartBucketDto] })
  studentsByPath!: DashboardChartBucketDto[];

  @ApiProperty({ type: [DashboardScoreBucketDto] })
  averageSkillScores!: DashboardScoreBucketDto[];

  @ApiProperty({ type: [DashboardChartBucketDto] })
  kpiStatus!: DashboardChartBucketDto[];

  @ApiProperty({ type: [DashboardMonthlyPointDto] })
  monthlyProgress!: DashboardMonthlyPointDto[];
}

export class DashboardAttentionItemDto {
  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty()
  detail!: string;

  @ApiProperty()
  href!: string;

  @ApiPropertyOptional({ nullable: true, type: Number })
  inactiveDays?: number | null;
}

export class DashboardAttentionDto {
  @ApiProperty({ type: [DashboardAttentionItemDto] })
  kpiBelowTarget!: DashboardAttentionItemDto[];

  @ApiProperty({ type: [DashboardAttentionItemDto] })
  assessmentPending!: DashboardAttentionItemDto[];

  @ApiProperty({ type: [DashboardAttentionItemDto] })
  noRecentActivity!: DashboardAttentionItemDto[];

  @ApiProperty({ type: [DashboardAttentionItemDto] })
  roadmapBehindSchedule!: DashboardAttentionItemDto[];

  @ApiProperty({ type: [DashboardAttentionItemDto] })
  orientationNotCompleted!: DashboardAttentionItemDto[];

  @ApiProperty({ type: [DashboardAttentionItemDto] })
  assessmentInProgress!: DashboardAttentionItemDto[];

  @ApiProperty({ type: [DashboardAttentionItemDto] })
  roadmapOverdue!: DashboardAttentionItemDto[];
}

export class DashboardSessionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  statusLabel!: string;

  @ApiProperty()
  currentStage!: string;

  @ApiProperty()
  stageLabel!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  startedAt!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  completedAt!: string | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  overallScore!: number | null;

  @ApiProperty()
  href!: string;
}

export class DashboardStudentRowDto {
  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty()
  path!: string;

  @ApiPropertyOptional({ nullable: true, type: Number })
  progress!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  skillScore!: number | null;

  @ApiProperty()
  kpiBelowCount!: number;

  @ApiPropertyOptional({ nullable: true, type: String })
  lastActivityAt!: string | null;

  @ApiProperty()
  lastActivityLabel!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  href!: string;
}

export class DashboardActivityItemDto {
  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty()
  occurredAt!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  href!: string;
}

export class DashboardResponseDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty({ type: DashboardCardDto })
  cards!: DashboardCardDto;

  @ApiProperty({ type: DashboardChartsDto })
  charts!: DashboardChartsDto;

  @ApiProperty({ type: DashboardAttentionDto })
  attention!: DashboardAttentionDto;

  @ApiProperty({ type: [DashboardSessionItemDto] })
  recentSessions!: DashboardSessionItemDto[];

  @ApiProperty({ type: [DashboardSessionItemDto] })
  upcomingSessions!: DashboardSessionItemDto[];

  @ApiProperty({ type: [DashboardSessionItemDto] })
  todaysSessionsList!: DashboardSessionItemDto[];

  @ApiProperty({ type: [DashboardStudentRowDto] })
  students!: DashboardStudentRowDto[];

  @ApiProperty({ type: [DashboardActivityItemDto] })
  recentActivity!: DashboardActivityItemDto[];
}
