import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  PartnershipCurriculum,
  PartnershipEducationLevel,
  PartnershipInstitutionCategory,
  PartnershipInstitutionType,
  PartnershipResearchDataQuality,
  PartnershipResearchDuplicateStatus,
  PartnershipResearchJobStatus,
  PartnershipResearchLanguage,
  PartnershipResearchSourceType,
  PartnershipResearchStatus,
  PartnershipResearchVerificationStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class ResearchTechnologyDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasCoding?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasRobotics?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasStem?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasAi?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasTechClub?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasAfterSchool?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasSummerCamp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasMakerspace?: boolean;
}

export class CreateResearchJobDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(200) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) governorate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) district?: string;
  @ApiPropertyOptional({ enum: PartnershipInstitutionType })
  @IsOptional()
  @IsEnum(PartnershipInstitutionType)
  institutionType?: PartnershipInstitutionType;
  @ApiPropertyOptional({ enum: PartnershipInstitutionCategory })
  @IsOptional()
  @IsEnum(PartnershipInstitutionCategory)
  institutionCategory?: PartnershipInstitutionCategory;
  @ApiPropertyOptional({ enum: PartnershipCurriculum })
  @IsOptional()
  @IsEnum(PartnershipCurriculum)
  curriculum?: PartnershipCurriculum;
  @ApiPropertyOptional({ enum: PartnershipResearchLanguage })
  @IsOptional()
  @IsEnum(PartnershipResearchLanguage)
  language?: PartnershipResearchLanguage;
  @ApiPropertyOptional({ type: ResearchTechnologyDto })
  @IsOptional()
  @Type(() => ResearchTechnologyDto)
  technology?: ResearchTechnologyDto;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxResultsPerQuery?: number;
  @ApiPropertyOptional({ default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  maxQueries?: number;
  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  maxCandidates?: number;

  @ApiPropertyOptional({
    enum: ['OVERPASS', 'WEB_SEARCH', 'HYBRID'],
    default: 'HYBRID',
    description: 'Discovery mode for this job. OVERPASS is free (no API key).',
  })
  @IsOptional()
  @IsIn(['OVERPASS', 'WEB_SEARCH', 'HYBRID'])
  discoveryMode?: 'OVERPASS' | 'WEB_SEARCH' | 'HYBRID';
}

export class QueryResearchJobsDto {
  @ApiPropertyOptional({ enum: PartnershipResearchJobStatus })
  @IsOptional()
  @IsEnum(PartnershipResearchJobStatus)
  status?: PartnershipResearchJobStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() governorate?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class CreateResearchCandidateDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(200) discoveredName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discoveredNameAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discoveredNameEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() jobId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() governorate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() osmType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() osmId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() osmUrl?: string;
  @ApiPropertyOptional({ enum: PartnershipInstitutionType })
  @IsOptional()
  @IsEnum(PartnershipInstitutionType)
  institutionType?: PartnershipInstitutionType;
  @ApiPropertyOptional({ enum: PartnershipInstitutionCategory })
  @IsOptional()
  @IsEnum(PartnershipInstitutionCategory)
  institutionCategory?: PartnershipInstitutionCategory;
  @ApiPropertyOptional({ enum: PartnershipCurriculum })
  @IsOptional()
  @IsEnum(PartnershipCurriculum)
  curriculum?: PartnershipCurriculum;
  @ApiPropertyOptional({ enum: PartnershipEducationLevel })
  @IsOptional()
  @IsEnum(PartnershipEducationLevel)
  educationLevel?: PartnershipEducationLevel;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mobile?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatsapp?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() facebook?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() instagram?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() linkedin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() youtube?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tiktok?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() googleMapsUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasCoding?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasRobotics?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasStem?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasAi?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasTechClub?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasAfterSchool?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasSummerCamp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasMakerspace?: boolean;
  @ApiPropertyOptional({ enum: PartnershipResearchSourceType })
  @IsOptional()
  @IsEnum(PartnershipResearchSourceType)
  sourceType?: PartnershipResearchSourceType;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_tld: false })
  sourceUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  evidence?: Array<{
    field: string;
    value: string;
    sourceUrl?: string;
    sourceType?: PartnershipResearchSourceType;
    confidence?: PartnershipResearchDataQuality;
  }>;
}

export class UpdateResearchCandidateDto extends PartialType(CreateResearchCandidateDto) {}

export class QueryResearchCandidatesDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() jobId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() governorate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional({ enum: PartnershipInstitutionType })
  @IsOptional()
  @IsEnum(PartnershipInstitutionType)
  institutionType?: PartnershipInstitutionType;
  @ApiPropertyOptional({ enum: PartnershipResearchStatus })
  @IsOptional()
  @IsEnum(PartnershipResearchStatus)
  researchStatus?: PartnershipResearchStatus;
  @ApiPropertyOptional({ enum: PartnershipResearchVerificationStatus })
  @IsOptional()
  @IsEnum(PartnershipResearchVerificationStatus)
  verificationStatus?: PartnershipResearchVerificationStatus;
  @ApiPropertyOptional({ enum: PartnershipResearchDuplicateStatus })
  @IsOptional()
  @IsEnum(PartnershipResearchDuplicateStatus)
  duplicateStatus?: PartnershipResearchDuplicateStatus;
  @ApiPropertyOptional({ enum: PartnershipResearchSourceType })
  @IsOptional()
  @IsEnum(PartnershipResearchSourceType)
  sourceType?: PartnershipResearchSourceType;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @Type(() => Boolean) hasCoding?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @Type(() => Boolean) hasRobotics?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @Type(() => Boolean) hasStem?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @Type(() => Boolean) hasAi?: boolean;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class MarkDuplicateDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() duplicateOfCandidateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() matchedInstitutionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ResearchEvidenceDto {
  @ApiProperty() id!: string;
  @ApiProperty() field!: string;
  @ApiProperty() value!: string;
  @ApiPropertyOptional({ nullable: true }) sourceUrl!: string | null;
  @ApiPropertyOptional({ nullable: true, enum: PartnershipResearchSourceType })
  sourceType!: PartnershipResearchSourceType | null;
  @ApiProperty() discoveredAt!: string;
  @ApiProperty({ enum: PartnershipResearchDataQuality }) confidence!: PartnershipResearchDataQuality;
}

export class ResearchCandidateDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) jobId!: string | null;
  @ApiProperty() discoveredName!: string;
  @ApiPropertyOptional({ nullable: true }) discoveredNameAr!: string | null;
  @ApiPropertyOptional({ nullable: true }) discoveredNameEn!: string | null;
  @ApiPropertyOptional({ nullable: true }) governorate!: string | null;
  @ApiPropertyOptional({ nullable: true }) city!: string | null;
  @ApiPropertyOptional({ nullable: true }) district!: string | null;
  @ApiPropertyOptional({ nullable: true }) address!: string | null;
  @ApiPropertyOptional({ nullable: true }) latitude!: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude!: number | null;
  @ApiPropertyOptional({ nullable: true }) osmType!: string | null;
  @ApiPropertyOptional({ nullable: true }) osmId!: string | null;
  @ApiPropertyOptional({ nullable: true }) osmUrl!: string | null;
  @ApiPropertyOptional({ nullable: true, enum: PartnershipInstitutionType })
  institutionType!: PartnershipInstitutionType | null;
  @ApiPropertyOptional({ nullable: true, enum: PartnershipInstitutionCategory })
  institutionCategory!: PartnershipInstitutionCategory | null;
  @ApiPropertyOptional({ nullable: true, enum: PartnershipCurriculum })
  curriculum!: PartnershipCurriculum | null;
  @ApiPropertyOptional({ nullable: true }) email!: string | null;
  @ApiPropertyOptional({ nullable: true }) phone!: string | null;
  @ApiPropertyOptional({ nullable: true }) mobile!: string | null;
  @ApiPropertyOptional({ nullable: true }) whatsapp!: string | null;
  @ApiPropertyOptional({ nullable: true }) website!: string | null;
  @ApiPropertyOptional({ nullable: true }) facebook!: string | null;
  @ApiPropertyOptional({ nullable: true }) instagram!: string | null;
  @ApiPropertyOptional({ nullable: true }) linkedin!: string | null;
  @ApiPropertyOptional({ nullable: true }) youtube!: string | null;
  @ApiPropertyOptional({ nullable: true }) tiktok!: string | null;
  @ApiPropertyOptional({ nullable: true }) googleMapsUrl!: string | null;
  @ApiProperty() hasCoding!: boolean;
  @ApiProperty() hasRobotics!: boolean;
  @ApiProperty() hasStem!: boolean;
  @ApiProperty() hasAi!: boolean;
  @ApiProperty() hasTechClub!: boolean;
  @ApiProperty() hasAfterSchool!: boolean;
  @ApiProperty() hasSummerCamp!: boolean;
  @ApiProperty() hasMakerspace!: boolean;
  @ApiProperty({ enum: PartnershipResearchSourceType }) sourceType!: PartnershipResearchSourceType;
  @ApiPropertyOptional({ nullable: true }) sourceName!: string | null;
  @ApiPropertyOptional({ nullable: true }) sourceUrl!: string | null;
  @ApiPropertyOptional({
    description: 'Official institution website (distinct from discovery sourceUrl)',
    nullable: true,
  })
  officialWebsite!: string | null;
  @ApiPropertyOptional({
    description: 'How the candidate was discovered (provider / search)',
  })
  discoverySource!: { label: string; url: string | null; type: string };
  @ApiPropertyOptional({
    description: 'Distinct evidence source labels derived from field provenance',
    type: [Object],
  })
  evidenceSources!: Array<{ label: string; url: string | null; type: string | null }>;
  @ApiProperty() enrichmentAttempted!: boolean;
  @ApiProperty() discoveredAt!: string;
  @ApiPropertyOptional({ nullable: true }) lastCheckedAt!: string | null;
  @ApiProperty({ enum: PartnershipResearchStatus }) researchStatus!: PartnershipResearchStatus;
  @ApiProperty({ enum: PartnershipResearchVerificationStatus })
  verificationStatus!: PartnershipResearchVerificationStatus;
  @ApiProperty({ enum: PartnershipResearchDataQuality }) dataQuality!: PartnershipResearchDataQuality;
  @ApiProperty({ enum: PartnershipResearchDuplicateStatus })
  duplicateStatus!: PartnershipResearchDuplicateStatus;
  @ApiPropertyOptional({ nullable: true }) duplicateOfCandidateId!: string | null;
  @ApiPropertyOptional({ nullable: true }) matchedInstitutionId!: string | null;
  @ApiProperty() notes!: string;
  @ApiPropertyOptional({ type: [ResearchEvidenceDto] }) evidence?: ResearchEvidenceDto[];
  @ApiPropertyOptional({ type: [String] }) matchReasons?: string[];
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class ResearchJobDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) governorate!: string | null;
  @ApiPropertyOptional({ nullable: true }) city!: string | null;
  @ApiPropertyOptional({ nullable: true }) district!: string | null;
  @ApiPropertyOptional({ nullable: true, enum: PartnershipInstitutionType })
  institutionType!: PartnershipInstitutionType | null;
  @ApiPropertyOptional({ nullable: true, enum: PartnershipInstitutionCategory })
  institutionCategory!: PartnershipInstitutionCategory | null;
  @ApiPropertyOptional({ nullable: true, enum: PartnershipCurriculum })
  curriculum!: PartnershipCurriculum | null;
  @ApiProperty({ enum: PartnershipResearchLanguage }) language!: PartnershipResearchLanguage;
  @ApiProperty() technology!: ResearchTechnologyDto;
  @ApiProperty({ type: [Object] }) queries!: unknown[];
  @ApiProperty() maxResultsPerQuery!: number;
  @ApiProperty() maxQueries!: number;
  @ApiProperty() maxCandidates!: number;
  @ApiPropertyOptional({ nullable: true }) discoveryMode!: string | null;
  @ApiProperty({ enum: PartnershipResearchJobStatus }) status!: PartnershipResearchJobStatus;
  @ApiPropertyOptional({ nullable: true }) statistics!: Record<string, number> | null;
  @ApiPropertyOptional({ nullable: true }) errorMessage!: string | null;
  @ApiPropertyOptional({ nullable: true }) providerNote!: string | null;
  @ApiProperty() requestedById!: string;
  @ApiPropertyOptional({ nullable: true }) requestedByName!: string | null;
  @ApiPropertyOptional({ nullable: true }) startedAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) completedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class ResearchDashboardDto {
  @ApiProperty() activeJobs!: number;
  @ApiProperty() candidates!: number;
  @ApiProperty() needsReview!: number;
  @ApiProperty() possibleDuplicates!: number;
  @ApiProperty() verified!: number;
  @ApiProperty() imported!: number;
  @ApiProperty() rejected!: number;
  @ApiProperty() stale!: number;
  @ApiProperty({ type: [String] }) availableProviders!: string[];
  @ApiProperty() automatedDiscoveryConfigured!: boolean;
  @ApiProperty({ type: [String] }) governorates!: readonly string[];
  @ApiPropertyOptional({ type: [Object] })
  providers?: Array<{ type: string; configured: boolean; enabled: boolean }>;
}

export class ResearchProvidersStatusDto {
  @ApiProperty({ type: [Object] })
  providers!: Array<{
    type: string;
    configured: boolean;
    enabled: boolean;
    requiresKey?: boolean;
    provider?: string;
    role?: string;
    free?: boolean;
  }>;
  @ApiProperty() automatedDiscoveryConfigured!: boolean;
  @ApiProperty() engine!: string;
  @ApiProperty() enrichmentEnabled!: boolean;
  @ApiPropertyOptional() discoveryMode?: string;
  @ApiPropertyOptional({ type: Object })
  overpass?: {
    enabled: boolean;
    configured: boolean;
    requiresKey: boolean;
    provider: string;
  };
  @ApiPropertyOptional({ type: Object })
  serper?: {
    enabled: boolean;
    configured: boolean;
    requiresKey: boolean;
    provider: string;
  };
}

export class ClearResearchResultsDto {
  @ApiPropertyOptional({
    description:
      'When true (default), keep candidates already imported to CRM. When false, delete all research candidates.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  keepImported?: boolean = true;
}

export class ClearResearchResultsResultDto {
  @ApiProperty() deletedCandidates!: number;
  @ApiProperty() deletedJobs!: number;
  @ApiProperty() keptImported!: number;
}

export class ReEnrichContactsResultDto {
  @ApiProperty() scanned!: number;
  @ApiProperty() updated!: number;
  @ApiProperty() institutionsUpdated!: number;
}

export class PaginatedResearchJobsDto {
  @ApiProperty({ type: [ResearchJobDto] }) items!: ResearchJobDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() pageCount!: number;
}

export class PaginatedResearchCandidatesDto {
  @ApiProperty({ type: [ResearchCandidateDto] }) items!: ResearchCandidateDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() pageCount!: number;
}
