import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewKind } from '@prisma/client';

export class ReviewerSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;
}

export class DimensionGrowthDto {
  @ApiProperty({
    enum: ['technicalSkills', 'problemSolving', 'projects', 'independence', 'communication'],
  })
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  currentScore!: number;

  @ApiPropertyOptional({ nullable: true, type: Number })
  previousScore!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  growth!: number | null;
}

export class ProgressReviewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ enum: ReviewKind, enumName: 'ReviewKind' })
  kind!: ReviewKind;

  @ApiProperty()
  reviewedAt!: string;

  @ApiProperty()
  periodStart!: string;

  @ApiProperty()
  periodEnd!: string;

  @ApiProperty({ type: ReviewerSummaryDto })
  reviewer!: ReviewerSummaryDto;

  @ApiProperty()
  technicalSkills!: number;

  @ApiProperty()
  problemSolving!: number;

  @ApiProperty()
  projects!: number;

  @ApiProperty()
  independence!: number;

  @ApiProperty()
  communication!: number;

  @ApiProperty()
  overallScore!: number;

  @ApiPropertyOptional({ nullable: true, type: Number })
  previousOverallScore!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  overallGrowth!: number | null;

  @ApiProperty()
  kpiOverallPercent!: number;

  @ApiProperty()
  projectOverallPercent!: number;

  @ApiProperty()
  notes!: string;

  @ApiProperty()
  strengths!: string;

  @ApiProperty()
  nextFocus!: string;

  @ApiProperty({ type: [DimensionGrowthDto] })
  dimensions!: DimensionGrowthDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class GrowthChartSeriesDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ type: [Number] })
  points!: number[];
}

export class GrowthChartDto {
  @ApiProperty()
  title!: string;

  @ApiProperty({ type: [String] })
  labels!: string[];

  @ApiProperty({ type: [GrowthChartSeriesDto] })
  series!: GrowthChartSeriesDto[];
}

export class StudentProgressDashboardDto {
  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiPropertyOptional({ type: ProgressReviewDto, nullable: true })
  latest!: ProgressReviewDto | null;

  @ApiProperty({ type: [DimensionGrowthDto] })
  dimensions!: DimensionGrowthDto[];

  @ApiProperty()
  currentScore!: number;

  @ApiPropertyOptional({ nullable: true, type: Number })
  previousScore!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  growth!: number | null;

  @ApiProperty({ type: [ProgressReviewDto] })
  history!: ProgressReviewDto[];

  @ApiProperty({ type: GrowthChartDto })
  skillGrowth!: GrowthChartDto;

  @ApiProperty({ type: GrowthChartDto })
  kpiGrowth!: GrowthChartDto;

  @ApiProperty({ type: GrowthChartDto })
  projectGrowth!: GrowthChartDto;
}
