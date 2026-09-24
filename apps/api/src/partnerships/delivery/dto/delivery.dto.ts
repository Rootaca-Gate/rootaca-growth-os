import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipDeliveryAttendanceStatus,
  PartnershipDeliveryCheckpointKind,
  PartnershipDeliveryCheckpointStatus,
  PartnershipDeliveryCommType,
  PartnershipDeliveryDeliverableStatus,
  PartnershipDeliveryDocumentType,
  PartnershipDeliveryGroupStatus,
  PartnershipDeliveryIssueSeverity,
  PartnershipDeliveryIssueStatus,
  PartnershipDeliveryMilestoneStatus,
  PartnershipDeliveryPhaseStatus,
  PartnershipDeliveryRaidStatus,
  PartnershipDeliveryRaidType,
  PartnershipDeliveryReportStatus,
  PartnershipDeliveryReportType,
  PartnershipDeliverySessionStatus,
  PartnershipDeliveryStatus,
  PartnershipDeliveryTaskPriority,
  PartnershipDeliveryTaskStatus,
  Role,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
  ValidateNested,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

// -----------------------------------------------------------------------------
// Nested input DTOs (delivery children — editable plan)
// -----------------------------------------------------------------------------

export class DeliveryPhaseInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryPhaseStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryPhaseStatus)
  status?: PartnershipDeliveryPhaseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class DeliveryMilestoneInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Client-side phase reference (index or existing phase id).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  phaseRef?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryMilestoneStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryMilestoneStatus)
  status?: PartnershipDeliveryMilestoneStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiredForCompletion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class DeliveryTaskInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  phaseRef?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  milestoneRef?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @ApiPropertyOptional({ enum: PartnershipDeliveryTaskPriority })
  @IsOptional()
  @IsEnum(PartnershipDeliveryTaskPriority)
  priority?: PartnershipDeliveryTaskPriority;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ enum: PartnershipDeliveryTaskStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryTaskStatus)
  status?: PartnershipDeliveryTaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class DeliveryGroupInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  level?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  instructorId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  schedule?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryGroupStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryGroupStatus)
  status?: PartnershipDeliveryGroupStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Existing student ids to link. Unknown ids are ignored.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  studentIds?: string[];
}

export class DeliveryTeamMemberInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  role!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  responsibilities?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  availability?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class DeliveryDeliverableInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  acceptanceCriteria?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryDeliverableStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryDeliverableStatus)
  status?: PartnershipDeliveryDeliverableStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiredForCompletion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class DeliveryIssueInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  category?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryIssueSeverity })
  @IsOptional()
  @IsEnum(PartnershipDeliveryIssueSeverity)
  severity?: PartnershipDeliveryIssueSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ enum: PartnershipDeliveryIssueStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryIssueStatus)
  status?: PartnershipDeliveryIssueStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  resolution?: string;
}

export class DeliveryRaidInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: PartnershipDeliveryRaidType })
  @IsEnum(PartnershipDeliveryRaidType)
  type!: PartnershipDeliveryRaidType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  impact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  probability?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  mitigation?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ enum: PartnershipDeliveryRaidStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryRaidStatus)
  status?: PartnershipDeliveryRaidStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class DeliveryCommInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: PartnershipDeliveryCommType })
  @IsEnum(PartnershipDeliveryCommType)
  type!: PartnershipDeliveryCommType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  occurredAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  participants?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  actionItems?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  owner?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  followUpDate?: string | null;
}

export class DeliveryCheckpointInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryCheckpointKind })
  @IsOptional()
  @IsEnum(PartnershipDeliveryCheckpointKind)
  kind?: PartnershipDeliveryCheckpointKind;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  checkpointDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  participants?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  discussion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  decisions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  actionItems?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryCheckpointStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryCheckpointStatus)
  status?: PartnershipDeliveryCheckpointStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class DeliveryDocumentInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryDocumentType })
  @IsOptional()
  @IsEnum(PartnershipDeliveryDocumentType)
  type?: PartnershipDeliveryDocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  uploadedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  fileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

export class DeliverySessionInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  groupId?: string | null;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionNumber!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  sessionDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  endTime?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationMinutes?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  instructorId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  instructorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  topic?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliverySessionStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliverySessionStatus)
  status?: PartnershipDeliverySessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  learningObjectives?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  activities?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  projects?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  homework?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  instructorNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  sessionOutcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  issuesNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  nextSessionPrep?: string;
}

export class AttendanceEntryDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty({ enum: PartnershipDeliveryAttendanceStatus })
  @IsEnum(PartnershipDeliveryAttendanceStatus)
  status!: PartnershipDeliveryAttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class SetAttendanceDto {
  @ApiProperty({ type: [AttendanceEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries!: AttendanceEntryDto[];
}

export class SubmitDeliverableDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  fileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  submittedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;
}

export class DecideDeliverableDto {
  @ApiProperty({
    enum: [
      PartnershipDeliveryDeliverableStatus.ACCEPTED,
      PartnershipDeliveryDeliverableStatus.REJECTED,
    ],
  })
  @IsEnum(PartnershipDeliveryDeliverableStatus)
  decision!: PartnershipDeliveryDeliverableStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rejectionReason?: string;
}

export class CreateReportDto {
  @ApiProperty({ enum: PartnershipDeliveryReportType })
  @IsEnum(PartnershipDeliveryReportType)
  type!: PartnershipDeliveryReportType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  periodLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  author?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryReportStatus })
  @IsOptional()
  @IsEnum(PartnershipDeliveryReportStatus)
  status?: PartnershipDeliveryReportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  fileUrl?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  contentSnapshot?: unknown;
}

// -----------------------------------------------------------------------------
// Create / update DTOs
// -----------------------------------------------------------------------------

export class CreateDeliveryFromSowDto {
  @ApiProperty({ description: 'Source SOW — delivery is always derived from an ACTIVE SOW.' })
  @IsUUID()
  sowId!: string;
}

export class UpdateDeliveryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  finalReportRequired?: boolean;

  // Bulk-replace plan children (SOW-style). Sessions, attendance, deliverable
  // submissions and reports are managed through dedicated endpoints to avoid
  // destroying sub-records.
  @ApiPropertyOptional({ type: [DeliveryPhaseInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryPhaseInputDto)
  phases?: DeliveryPhaseInputDto[];

  @ApiPropertyOptional({ type: [DeliveryMilestoneInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryMilestoneInputDto)
  milestones?: DeliveryMilestoneInputDto[];

  @ApiPropertyOptional({ type: [DeliveryTaskInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryTaskInputDto)
  tasks?: DeliveryTaskInputDto[];

  @ApiPropertyOptional({ type: [DeliveryTeamMemberInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryTeamMemberInputDto)
  teamMembers?: DeliveryTeamMemberInputDto[];

  @ApiPropertyOptional({ type: [DeliveryDeliverableInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryDeliverableInputDto)
  deliverables?: DeliveryDeliverableInputDto[];

  @ApiPropertyOptional({ type: [DeliveryIssueInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryIssueInputDto)
  issues?: DeliveryIssueInputDto[];

  @ApiPropertyOptional({ type: [DeliveryRaidInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryRaidInputDto)
  raidItems?: DeliveryRaidInputDto[];

  @ApiPropertyOptional({ type: [DeliveryCommInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryCommInputDto)
  communications?: DeliveryCommInputDto[];

  @ApiPropertyOptional({ type: [DeliveryCheckpointInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryCheckpointInputDto)
  checkpoints?: DeliveryCheckpointInputDto[];

  @ApiPropertyOptional({ type: [DeliveryDocumentInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryDocumentInputDto)
  documents?: DeliveryDocumentInputDto[];
}

export class QueryDeliveriesDto {
  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  sowId?: string;

  @ApiPropertyOptional({ enum: PartnershipDeliveryStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipDeliveryStatus)
  status?: PartnershipDeliveryStatus;

  @ApiPropertyOptional({ description: 'Filter by assigned instructor (session or group).' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @ApiPropertyOptional({ description: 'Filter by scope snapshot program name (substring).' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  programName?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  endDateTo?: string;

  @ApiPropertyOptional({ description: 'Include archived deliveries (excluded by default).' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  includeArchived?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  pageSize = 50;
}

export class ChangeDeliveryStatusDto {
  @ApiProperty({ enum: PartnershipDeliveryStatus })
  @IsEnum(PartnershipDeliveryStatus)
  status!: PartnershipDeliveryStatus;
}

// -----------------------------------------------------------------------------
// Response DTOs
// -----------------------------------------------------------------------------

export class ProgressDimensionDto {
  @ApiProperty() completed!: number;
  @ApiProperty() total!: number;
  @ApiPropertyOptional({ nullable: true }) ratio!: number | null;
}

export class DeliveryProgressDto {
  @ApiProperty({ type: ProgressDimensionDto }) phaseProgress!: ProgressDimensionDto;
  @ApiProperty({ type: ProgressDimensionDto }) milestoneProgress!: ProgressDimensionDto;
  @ApiProperty({ type: ProgressDimensionDto }) taskProgress!: ProgressDimensionDto;
  @ApiProperty({ type: ProgressDimensionDto }) sessionProgress!: ProgressDimensionDto;
  @ApiProperty({ type: ProgressDimensionDto }) deliverableProgress!: ProgressDimensionDto;
  @ApiProperty() overall!: number;
  @ApiProperty() overallPercent!: number;
  @ApiProperty({ type: [String] }) dimensionsCounted!: string[];
}

export class CompletionChecklistItemDto {
  @ApiProperty() key!: string;
  @ApiProperty() label!: string;
  @ApiProperty() required!: boolean;
  @ApiProperty() satisfied!: boolean;
  @ApiProperty() detail!: string;
}

export class CompletionChecklistDto {
  @ApiProperty({ type: [CompletionChecklistItemDto] })
  items!: CompletionChecklistItemDto[];
  @ApiProperty() allRequiredSatisfied!: boolean;
}

export class DeliveryKpisDto {
  @ApiProperty() sessionsCompleted!: number;
  @ApiProperty() sessionsTotal!: number;
  @ApiProperty() studentsUnique!: number;
  @ApiProperty() groupsCount!: number;
  @ApiProperty() deliverablesAccepted!: number;
  @ApiProperty() deliverablesTotal!: number;
  @ApiProperty() milestonesCompleted!: number;
  @ApiProperty() milestonesTotal!: number;
}

export class DeliveryInstitutionSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) arabicName!: string | null;
  @ApiPropertyOptional({ nullable: true }) englishName!: string | null;
  @ApiPropertyOptional({ nullable: true }) governorate!: string | null;
  @ApiPropertyOptional({ nullable: true }) city!: string | null;
}

export class DeliverySowSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() sowNumber!: string;
  @ApiProperty() title!: string;
  @ApiProperty() status!: string;
}

export class DeliveryPhaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiProperty() owner!: string;
  @ApiProperty({ enum: PartnershipDeliveryPhaseStatus })
  status!: PartnershipDeliveryPhaseStatus;
  @ApiProperty() sortOrder!: number;
}

export class DeliveryMilestoneDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) phaseId!: string | null;
  @ApiPropertyOptional({ nullable: true }) sourceSowMilestoneId!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiProperty() owner!: string;
  @ApiProperty({ enum: PartnershipDeliveryMilestoneStatus })
  status!: PartnershipDeliveryMilestoneStatus;
  @ApiProperty() requiredForCompletion!: boolean;
  @ApiProperty() sortOrder!: number;
}

export class DeliveryTaskDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) phaseId!: string | null;
  @ApiPropertyOptional({ nullable: true }) milestoneId!: string | null;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() owner!: string;
  @ApiPropertyOptional({ nullable: true }) assigneeId!: string | null;
  @ApiProperty({ enum: PartnershipDeliveryTaskPriority })
  priority!: PartnershipDeliveryTaskPriority;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) dueDate!: string | null;
  @ApiProperty({ enum: PartnershipDeliveryTaskStatus })
  status!: PartnershipDeliveryTaskStatus;
  @ApiProperty() sortOrder!: number;
}

export class DeliveryGroupStudentDto {
  @ApiProperty() id!: string;
  @ApiProperty() studentId!: string;
  @ApiProperty() joinedAt!: string;
}

export class DeliveryGroupDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() grade!: string;
  @ApiProperty() level!: string;
  @ApiPropertyOptional({ nullable: true }) instructorId!: string | null;
  @ApiProperty() schedule!: string;
  @ApiProperty({ enum: PartnershipDeliveryGroupStatus })
  status!: PartnershipDeliveryGroupStatus;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ type: [DeliveryGroupStudentDto] })
  students!: DeliveryGroupStudentDto[];
}

export class DeliveryTeamMemberDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) userId!: string | null;
  @ApiProperty() role!: string;
  @ApiProperty() name!: string;
  @ApiProperty() responsibilities!: string;
  @ApiProperty() availability!: string;
  @ApiProperty() sortOrder!: number;
}

export class DeliveryAttendanceDto {
  @ApiProperty() id!: string;
  @ApiProperty() studentId!: string;
  @ApiProperty({ enum: PartnershipDeliveryAttendanceStatus })
  status!: PartnershipDeliveryAttendanceStatus;
  @ApiProperty() notes!: string;
}

export class DeliverySessionDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) groupId!: string | null;
  @ApiProperty() sessionNumber!: number;
  @ApiPropertyOptional({ nullable: true }) sessionDate!: string | null;
  @ApiProperty() startTime!: string;
  @ApiProperty() endTime!: string;
  @ApiPropertyOptional({ nullable: true }) durationMinutes!: number | null;
  @ApiPropertyOptional({ nullable: true }) instructorId!: string | null;
  @ApiProperty() instructorName!: string;
  @ApiProperty() topic!: string;
  @ApiProperty({ enum: PartnershipDeliverySessionStatus })
  status!: PartnershipDeliverySessionStatus;
  @ApiProperty() learningObjectives!: string;
  @ApiProperty() activities!: string;
  @ApiProperty() projects!: string;
  @ApiProperty() homework!: string;
  @ApiProperty() instructorNotes!: string;
  @ApiProperty() sessionOutcome!: string;
  @ApiProperty() issuesNotes!: string;
  @ApiProperty() nextSessionPrep!: string;
  @ApiProperty({ type: [DeliveryAttendanceDto] })
  attendances!: DeliveryAttendanceDto[];
}

export class DeliveryDeliverableSubmissionDto {
  @ApiProperty() id!: string;
  @ApiProperty() description!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() fileUrl!: string;
  @ApiProperty() submittedBy!: string;
  @ApiProperty() submittedAt!: string;
  @ApiProperty() version!: string;
  @ApiProperty({ enum: PartnershipDeliveryDeliverableStatus })
  status!: PartnershipDeliveryDeliverableStatus;
  @ApiProperty() rejectionReason!: string;
}

export class DeliveryDeliverableDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) sourceSowDeliverableId!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty() owner!: string;
  @ApiPropertyOptional({ nullable: true }) dueDate!: string | null;
  @ApiProperty() acceptanceCriteria!: string;
  @ApiProperty({ enum: PartnershipDeliveryDeliverableStatus })
  status!: PartnershipDeliveryDeliverableStatus;
  @ApiProperty() requiredForCompletion!: boolean;
  @ApiProperty() rejectionReason!: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ type: [DeliveryDeliverableSubmissionDto] })
  submissions!: DeliveryDeliverableSubmissionDto[];
}

export class DeliveryIssueDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() category!: string;
  @ApiProperty({ enum: PartnershipDeliveryIssueSeverity })
  severity!: PartnershipDeliveryIssueSeverity;
  @ApiProperty() owner!: string;
  @ApiPropertyOptional({ nullable: true }) dueDate!: string | null;
  @ApiProperty({ enum: PartnershipDeliveryIssueStatus })
  status!: PartnershipDeliveryIssueStatus;
  @ApiProperty() resolution!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class DeliveryRaidDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: PartnershipDeliveryRaidType })
  type!: PartnershipDeliveryRaidType;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() owner!: string;
  @ApiProperty() impact!: string;
  @ApiProperty() probability!: string;
  @ApiProperty() mitigation!: string;
  @ApiPropertyOptional({ nullable: true }) dueDate!: string | null;
  @ApiProperty({ enum: PartnershipDeliveryRaidStatus })
  status!: PartnershipDeliveryRaidStatus;
  @ApiProperty() sortOrder!: number;
}

export class DeliveryCommDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: PartnershipDeliveryCommType })
  type!: PartnershipDeliveryCommType;
  @ApiProperty() occurredAt!: string;
  @ApiProperty() participants!: string;
  @ApiProperty() subject!: string;
  @ApiProperty() summary!: string;
  @ApiProperty() actionItems!: string;
  @ApiProperty() owner!: string;
  @ApiPropertyOptional({ nullable: true }) followUpDate!: string | null;
}

export class DeliveryCheckpointDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: PartnershipDeliveryCheckpointKind })
  kind!: PartnershipDeliveryCheckpointKind;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) checkpointDate!: string | null;
  @ApiProperty() participants!: string;
  @ApiProperty() discussion!: string;
  @ApiProperty() decisions!: string;
  @ApiProperty() actionItems!: string;
  @ApiProperty({ enum: PartnershipDeliveryCheckpointStatus })
  status!: PartnershipDeliveryCheckpointStatus;
  @ApiProperty() sortOrder!: number;
}

export class DeliveryReportDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: PartnershipDeliveryReportType })
  type!: PartnershipDeliveryReportType;
  @ApiProperty() title!: string;
  @ApiProperty() periodLabel!: string;
  @ApiProperty() author!: string;
  @ApiProperty({ enum: PartnershipDeliveryReportStatus })
  status!: PartnershipDeliveryReportStatus;
  @ApiPropertyOptional({ nullable: true }) generatedAt!: string | null;
  @ApiProperty() fileName!: string;
  @ApiProperty() fileUrl!: string;
  @ApiPropertyOptional({ nullable: true }) contentSnapshot!: unknown;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class DeliveryDocumentDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: PartnershipDeliveryDocumentType })
  type!: PartnershipDeliveryDocumentType;
  @ApiProperty() version!: string;
  @ApiProperty() uploadedBy!: string;
  @ApiProperty() fileUrl!: string;
  @ApiProperty() notes!: string;
  @ApiProperty() uploadedAt!: string;
}

export class DeliveryActivityLogDto {
  @ApiProperty() id!: string;
  @ApiProperty() action!: string;
  @ApiProperty() summary!: string;
  @ApiPropertyOptional({ nullable: true }) metadata!: unknown;
  @ApiPropertyOptional({ nullable: true }) performedById!: string | null;
  @ApiProperty() createdAt!: string;
}

export class DeliveryListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() deliveryNumber!: string;
  @ApiProperty() name!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() institutionName!: string;
  @ApiProperty() sowId!: string;
  @ApiPropertyOptional({ nullable: true }) sowNumber!: string | null;
  @ApiProperty({ enum: PartnershipDeliveryStatus }) status!: PartnershipDeliveryStatus;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiProperty() overallPercent!: number;
  @ApiProperty() sessionsCompleted!: number;
  @ApiProperty() sessionsTotal!: number;
  @ApiProperty() groupsCount!: number;
  @ApiPropertyOptional({ nullable: true }) archivedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class DeliveryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() deliveryNumber!: string;
  @ApiProperty() name!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() sowId!: string;
  @ApiProperty() proposalId!: string;
  @ApiProperty({ enum: PartnershipDeliveryStatus }) status!: PartnershipDeliveryStatus;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiProperty() sowNumberSnapshot!: string;
  @ApiProperty() proposalNumberSnapshot!: string;
  @ApiPropertyOptional({ nullable: true }) scopeSnapshot!: unknown;
  @ApiPropertyOptional({ nullable: true }) responsibilitiesSnapshot!: unknown;
  @ApiPropertyOptional({ nullable: true }) requirementsSnapshot!: unknown;
  @ApiProperty() finalReportRequired!: boolean;
  @ApiPropertyOptional({ nullable: true }) archivedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  @ApiProperty({ type: DeliveryInstitutionSummaryDto })
  institution!: DeliveryInstitutionSummaryDto;
  @ApiProperty({ type: DeliverySowSummaryDto }) sow!: DeliverySowSummaryDto;

  @ApiProperty({ type: [DeliveryPhaseDto] }) phases!: DeliveryPhaseDto[];
  @ApiProperty({ type: [DeliveryMilestoneDto] }) milestones!: DeliveryMilestoneDto[];
  @ApiProperty({ type: [DeliveryTaskDto] }) tasks!: DeliveryTaskDto[];
  @ApiProperty({ type: [DeliverySessionDto] }) sessions!: DeliverySessionDto[];
  @ApiProperty({ type: [DeliveryGroupDto] }) groups!: DeliveryGroupDto[];
  @ApiProperty({ type: [DeliveryTeamMemberDto] }) teamMembers!: DeliveryTeamMemberDto[];
  @ApiProperty({ type: [DeliveryDeliverableDto] }) deliverables!: DeliveryDeliverableDto[];
  @ApiProperty({ type: [DeliveryIssueDto] }) issues!: DeliveryIssueDto[];
  @ApiProperty({ type: [DeliveryRaidDto] }) raidItems!: DeliveryRaidDto[];
  @ApiProperty({ type: [DeliveryCommDto] }) communications!: DeliveryCommDto[];
  @ApiProperty({ type: [DeliveryCheckpointDto] }) checkpoints!: DeliveryCheckpointDto[];
  @ApiProperty({ type: [DeliveryReportDto] }) reports!: DeliveryReportDto[];
  @ApiProperty({ type: [DeliveryDocumentDto] }) documents!: DeliveryDocumentDto[];
  @ApiProperty({ type: [DeliveryActivityLogDto] }) activityLogs!: DeliveryActivityLogDto[];

  @ApiProperty({ type: DeliveryProgressDto }) progress!: DeliveryProgressDto;
  @ApiProperty({ type: DeliveryKpisDto }) kpis!: DeliveryKpisDto;
  @ApiProperty({ type: CompletionChecklistDto }) completionChecklist!: CompletionChecklistDto;
}

export class PaginatedDeliveriesDto {
  @ApiProperty({ type: [DeliveryListItemDto] }) items!: DeliveryListItemDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() pageCount!: number;
}

export class DeliveryUserOptionDto {
  @ApiProperty() id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: Role }) role!: Role;
}
