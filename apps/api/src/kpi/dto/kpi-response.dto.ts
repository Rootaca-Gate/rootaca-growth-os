import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KpiCategory, KpiFrequency, KpiRecordSource, KpiStatus } from '@prisma/client';

export class KpiDefinitionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: KpiCategory, enumName: 'KpiCategory' })
  category!: KpiCategory;

  @ApiProperty()
  target!: number;

  @ApiProperty()
  unit!: string;

  @ApiProperty({ enum: KpiFrequency, enumName: 'KpiFrequency' })
  frequency!: KpiFrequency;

  @ApiProperty()
  weight!: number;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class KpiRecordDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: KpiFrequency, enumName: 'KpiFrequency' })
  frequency!: KpiFrequency;

  @ApiProperty()
  periodStart!: string;

  @ApiProperty()
  periodEnd!: string;

  @ApiProperty()
  target!: number;

  @ApiProperty()
  actual!: number;

  @ApiProperty()
  progressPercent!: number;

  @ApiProperty({ enum: KpiStatus, enumName: 'KpiStatus' })
  status!: KpiStatus;

  @ApiProperty()
  notes!: string;

  @ApiProperty({ enum: KpiRecordSource, enumName: 'KpiRecordSource' })
  source!: KpiRecordSource;
}

export class StudentKpiItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: KpiDefinitionDto })
  kpi!: KpiDefinitionDto;

  @ApiProperty()
  target!: number;

  @ApiProperty()
  actual!: number;

  @ApiProperty()
  progressPercent!: number;

  @ApiProperty({ enum: KpiStatus, enumName: 'KpiStatus' })
  status!: KpiStatus;

  @ApiProperty({ type: KpiRecordDto })
  current!: KpiRecordDto;

  @ApiPropertyOptional({ type: KpiRecordDto })
  weekly?: KpiRecordDto | null;

  @ApiPropertyOptional({ type: KpiRecordDto })
  monthly?: KpiRecordDto | null;

  @ApiProperty({ type: [KpiRecordDto] })
  history!: KpiRecordDto[];
}

export class StudentKpiDashboardDto {
  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty()
  overallPercent!: number;

  @ApiProperty({ enum: KpiStatus, enumName: 'KpiStatus' })
  overallStatus!: KpiStatus;

  @ApiProperty()
  onTrackCount!: number;

  @ApiProperty()
  atRiskCount!: number;

  @ApiProperty()
  behindCount!: number;

  @ApiProperty()
  completedCount!: number;

  @ApiProperty({ type: [StudentKpiItemDto] })
  items!: StudentKpiItemDto[];
}
