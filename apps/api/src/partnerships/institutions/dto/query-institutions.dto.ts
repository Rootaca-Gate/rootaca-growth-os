import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipCurriculum,
  PartnershipEducationLevel,
  PartnershipInstitutionCategory,
  PartnershipInstitutionStatus,
  PartnershipInstitutionType,
  PartnershipLeadPriority,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  if (value === true || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === '0') {
    return false;
  }
  return value;
};

export const INSTITUTION_SORT_FIELDS = [
  'name',
  'createdAt',
  'updatedAt',
  'status',
  'leadPriority',
  'governorate',
  'city',
] as const;

export type InstitutionSortField = (typeof INSTITUTION_SORT_FIELDS)[number];

export class QueryInstitutionsDto {
  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PartnershipInstitutionStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipInstitutionStatus)
  status?: PartnershipInstitutionStatus;

  @ApiPropertyOptional({ enum: PartnershipInstitutionType })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipInstitutionType)
  institutionType?: PartnershipInstitutionType;

  @ApiPropertyOptional({ enum: PartnershipInstitutionCategory })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipInstitutionCategory)
  institutionCategory?: PartnershipInstitutionCategory;

  @ApiPropertyOptional({ enum: PartnershipCurriculum })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipCurriculum)
  curriculum?: PartnershipCurriculum;

  @ApiPropertyOptional({ enum: PartnershipEducationLevel })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipEducationLevel)
  educationLevel?: PartnershipEducationLevel;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  governorate?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: PartnershipLeadPriority })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PartnershipLeadPriority)
  leadPriority?: PartnershipLeadPriority;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasCoding?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasRobotics?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasStem?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasAi?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasTechClub?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasAfterSchool?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasSummerCamp?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasMakerspace?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasEmail?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasPhone?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasWebsite?: boolean;

  @ApiPropertyOptional()
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  hasDecisionMaker?: boolean;

  @ApiPropertyOptional({
    description: 'Include soft-deleted institutions (Admin use)',
    default: false,
  })
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, description: 'Alias: limit also accepted via pageSize' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({ enum: INSTITUTION_SORT_FIELDS, default: 'updatedAt' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(INSTITUTION_SORT_FIELDS)
  sortBy: InstitutionSortField = 'updatedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
