import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipDeliveryFormat,
  PartnershipProgramDocumentType,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramStatus,
  PartnershipProgramType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class ProgramObjectiveDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ProgramCurriculumModuleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  skillsDeveloped?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ProgramActivityDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  skillsDeveloped?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ProgramSampleProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  skills?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  expectedOutput?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ProgramAssessmentMethodDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ description: 'Optional weight; not required' })
  @IsOptional()
  @Type(() => Number)
  weight?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ProgramRequirementDto {
  @ApiProperty({ enum: PartnershipProgramRequirementKind })
  @IsEnum(PartnershipProgramRequirementKind)
  kind!: PartnershipProgramRequirementKind;

  @ApiPropertyOptional({ enum: ['REQUIRED', 'RECOMMENDED'], default: 'REQUIRED' })
  @IsOptional()
  @IsEnum(['REQUIRED', 'RECOMMENDED'] as const)
  priority?: 'REQUIRED' | 'RECOMMENDED';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ProgramOutcomeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ProgramDocumentDto {
  @ApiProperty({ enum: PartnershipProgramDocumentType })
  @IsEnum(PartnershipProgramDocumentType)
  documentType!: PartnershipProgramDocumentType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_protocol: false })
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ default: '1.0' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  version?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const)
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uploadedAt?: string;
}

export class CreateProgramDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  shortDescription?: string;

  @ApiProperty({ enum: PartnershipProgramType })
  @IsEnum(PartnershipProgramType)
  programType!: PartnershipProgramType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetAge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetGrades?: string;

  @ApiPropertyOptional({ enum: PartnershipProgramLevel })
  @IsOptional()
  @IsEnum(PartnershipProgramLevel)
  recommendedLevel?: PartnershipProgramLevel;

  @ApiPropertyOptional({ enum: PartnershipProgramStatus })
  @IsOptional()
  @IsEnum(PartnershipProgramStatus)
  status?: PartnershipProgramStatus;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  schoolValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  studentValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendedStudentProfile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  finalProjectName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  finalProjectDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  finalProjectExpectedOutput?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finalProjectSkills?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  finalProjectEvaluationMethod?: string;

  @ApiPropertyOptional({ type: [ProgramObjectiveDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramObjectiveDto)
  objectives?: ProgramObjectiveDto[];

  @ApiPropertyOptional({ type: [ProgramCurriculumModuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCurriculumModuleDto)
  curriculumModules?: ProgramCurriculumModuleDto[];

  @ApiPropertyOptional({ type: [ProgramActivityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramActivityDto)
  activities?: ProgramActivityDto[];

  @ApiPropertyOptional({ type: [ProgramSampleProjectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramSampleProjectDto)
  sampleProjects?: ProgramSampleProjectDto[];

  @ApiPropertyOptional({ type: [ProgramAssessmentMethodDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramAssessmentMethodDto)
  assessmentMethods?: ProgramAssessmentMethodDto[];

  @ApiPropertyOptional({ enum: PartnershipDeliveryFormat, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PartnershipDeliveryFormat, { each: true })
  deliveryFormats?: PartnershipDeliveryFormat[];

  @ApiPropertyOptional({ type: [ProgramRequirementDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramRequirementDto)
  requirements?: ProgramRequirementDto[];

  @ApiPropertyOptional({ type: [ProgramOutcomeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramOutcomeDto)
  outcomes?: ProgramOutcomeDto[];

  @ApiPropertyOptional({ type: [ProgramDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramDocumentDto)
  documents?: ProgramDocumentDto[];
}

export class UpdateProgramDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  shortDescription?: string;

  @ApiPropertyOptional({ enum: PartnershipProgramType })
  @IsOptional()
  @IsEnum(PartnershipProgramType)
  programType?: PartnershipProgramType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetAge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetGrades?: string;

  @ApiPropertyOptional({ enum: PartnershipProgramLevel })
  @IsOptional()
  @IsEnum(PartnershipProgramLevel)
  recommendedLevel?: PartnershipProgramLevel;

  @ApiPropertyOptional({ enum: PartnershipProgramStatus })
  @IsOptional()
  @IsEnum(PartnershipProgramStatus)
  status?: PartnershipProgramStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  schoolValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  studentValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendedStudentProfile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  finalProjectName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  finalProjectDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  finalProjectExpectedOutput?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finalProjectSkills?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  finalProjectEvaluationMethod?: string;

  @ApiPropertyOptional({ type: [ProgramObjectiveDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramObjectiveDto)
  objectives?: ProgramObjectiveDto[];

  @ApiPropertyOptional({ type: [ProgramCurriculumModuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramCurriculumModuleDto)
  curriculumModules?: ProgramCurriculumModuleDto[];

  @ApiPropertyOptional({ type: [ProgramActivityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramActivityDto)
  activities?: ProgramActivityDto[];

  @ApiPropertyOptional({ type: [ProgramSampleProjectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramSampleProjectDto)
  sampleProjects?: ProgramSampleProjectDto[];

  @ApiPropertyOptional({ type: [ProgramAssessmentMethodDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramAssessmentMethodDto)
  assessmentMethods?: ProgramAssessmentMethodDto[];

  @ApiPropertyOptional({ enum: PartnershipDeliveryFormat, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PartnershipDeliveryFormat, { each: true })
  deliveryFormats?: PartnershipDeliveryFormat[];

  @ApiPropertyOptional({ type: [ProgramRequirementDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramRequirementDto)
  requirements?: ProgramRequirementDto[];

  @ApiPropertyOptional({ type: [ProgramOutcomeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramOutcomeDto)
  outcomes?: ProgramOutcomeDto[];

  @ApiPropertyOptional({ type: [ProgramDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramDocumentDto)
  documents?: ProgramDocumentDto[];
}

export class QueryProgramsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: PartnershipProgramType })
  @IsOptional()
  @IsEnum(PartnershipProgramType)
  programType?: PartnershipProgramType;

  @ApiPropertyOptional({ enum: PartnershipProgramLevel })
  @IsOptional()
  @IsEnum(PartnershipProgramLevel)
  recommendedLevel?: PartnershipProgramLevel;

  @ApiPropertyOptional({ enum: PartnershipProgramStatus })
  @IsOptional()
  @IsEnum(PartnershipProgramStatus)
  status?: PartnershipProgramStatus;

  @ApiPropertyOptional({ description: 'Filter by substring match on target grades' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetGrade?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;
}

export class ProgramObjectiveResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ProgramCurriculumModuleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  skillsDeveloped!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ProgramActivityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  skillsDeveloped!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ProgramSampleProjectResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  skills!: string;

  @ApiProperty()
  expectedOutput!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ProgramAssessmentMethodResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  weight!: number | null;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  sortOrder!: number;
}

export class ProgramRequirementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: PartnershipProgramRequirementKind })
  kind!: PartnershipProgramRequirementKind;

  @ApiProperty({ enum: ['REQUIRED', 'RECOMMENDED'] })
  priority!: 'REQUIRED' | 'RECOMMENDED';

  @ApiProperty()
  label!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ProgramOutcomeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class ProgramDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: PartnershipProgramDocumentType })
  documentType!: PartnershipProgramDocumentType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  url!: string | null;

  @ApiProperty()
  version!: string;

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] })
  status!: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @ApiProperty()
  notes!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  uploadedAt!: string;
}

export class ProgramListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: PartnershipProgramType })
  programType!: PartnershipProgramType;

  @ApiPropertyOptional({ nullable: true })
  targetGrades!: string | null;

  @ApiPropertyOptional({ enum: PartnershipProgramLevel, nullable: true })
  recommendedLevel!: PartnershipProgramLevel | null;

  @ApiProperty({ enum: PartnershipDeliveryFormat, isArray: true })
  deliveryFormats!: PartnershipDeliveryFormat[];

  @ApiProperty({ enum: PartnershipProgramStatus })
  status!: PartnershipProgramStatus;

  @ApiProperty()
  displayOrder!: number;
}

export class ProgramResponseDto extends ProgramListItemDto {
  @ApiProperty()
  shortDescription!: string;

  @ApiPropertyOptional({ nullable: true })
  targetAge!: string | null;

  @ApiProperty()
  recommendedStudentProfile!: string;

  @ApiProperty()
  internalNotes!: string;

  @ApiProperty()
  schoolValue!: string;

  @ApiProperty()
  studentValue!: string;

  @ApiPropertyOptional({ nullable: true })
  finalProjectName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalProjectDescription!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalProjectExpectedOutput!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalProjectSkills!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalProjectEvaluationMethod!: string | null;

  @ApiProperty({ type: [ProgramObjectiveResponseDto] })
  objectives!: ProgramObjectiveResponseDto[];

  @ApiProperty({ type: [ProgramCurriculumModuleResponseDto] })
  curriculumModules!: ProgramCurriculumModuleResponseDto[];

  @ApiProperty({ type: [ProgramActivityResponseDto] })
  activities!: ProgramActivityResponseDto[];

  @ApiProperty({ type: [ProgramSampleProjectResponseDto] })
  sampleProjects!: ProgramSampleProjectResponseDto[];

  @ApiProperty({ type: [ProgramAssessmentMethodResponseDto] })
  assessmentMethods!: ProgramAssessmentMethodResponseDto[];

  @ApiProperty({ type: [ProgramRequirementResponseDto] })
  requirements!: ProgramRequirementResponseDto[];

  @ApiProperty({ type: [ProgramOutcomeResponseDto] })
  outcomes!: ProgramOutcomeResponseDto[];

  @ApiProperty({ type: [ProgramDocumentResponseDto] })
  documents!: ProgramDocumentResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedProgramsDto {
  @ApiProperty({ type: [ProgramListItemDto] })
  items!: ProgramListItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
