import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PartnershipCurriculum,
  PartnershipEducationLevel,
  PartnershipGender,
  PartnershipInstitutionCategory,
  PartnershipInstitutionStatus,
  PartnershipInstitutionType,
  PartnershipLeadPriority,
  PartnershipType,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null || value === undefined ? undefined : value;

export class CreateInstitutionDto {
  @ApiProperty({ example: 'ABC International School' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  arabicName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  englishName?: string;

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

  @ApiPropertyOptional({ enum: PartnershipGender })
  @IsOptional()
  @IsEnum(PartnershipGender)
  gender?: PartnershipGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ageRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  governorate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fullAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  generalEmail?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  admissionsEmail?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_protocol: false }, { message: 'website must be a valid URL or domain' })
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  youtube?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tiktok?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_protocol: false })
  @IsOptional()
  googleMapsUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasCoding?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasRobotics?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasStem?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasAi?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasTechClub?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasAfterSchool?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasSummerCamp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasMakerspace?: boolean;

  @ApiPropertyOptional({ enum: PartnershipType })
  @IsOptional()
  @IsEnum(PartnershipType)
  partnershipType?: PartnershipType;

  @ApiPropertyOptional({ enum: PartnershipLeadPriority })
  @IsOptional()
  @IsEnum(PartnershipLeadPriority)
  leadPriority?: PartnershipLeadPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  leadPriorityReason?: string;

  @ApiPropertyOptional({ enum: PartnershipInstitutionStatus })
  @IsOptional()
  @IsEnum(PartnershipInstitutionStatus)
  status?: PartnershipInstitutionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  branchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentInstitutionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceId?: string;
}

export class UpdateInstitutionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  arabicName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  englishName?: string;

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

  @ApiPropertyOptional({ enum: PartnershipGender })
  @IsOptional()
  @IsEnum(PartnershipGender)
  gender?: PartnershipGender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ageRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  governorate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fullAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  generalEmail?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  admissionsEmail?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_protocol: false })
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  youtube?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tiktok?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_protocol: false })
  @IsOptional()
  googleMapsUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasCoding?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasRobotics?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasStem?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasAi?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasTechClub?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasAfterSchool?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasSummerCamp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasMakerspace?: boolean;

  @ApiPropertyOptional({ enum: PartnershipType })
  @IsOptional()
  @IsEnum(PartnershipType)
  partnershipType?: PartnershipType;

  @ApiPropertyOptional({ enum: PartnershipLeadPriority })
  @IsOptional()
  @IsEnum(PartnershipLeadPriority)
  leadPriority?: PartnershipLeadPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  leadPriorityReason?: string;

  @ApiPropertyOptional({ enum: PartnershipInstitutionStatus })
  @IsOptional()
  @IsEnum(PartnershipInstitutionStatus)
  status?: PartnershipInstitutionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  branchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentInstitutionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  /** When true, empty strings / nulls in the payload may clear optional fields. */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowClear?: boolean;
}
