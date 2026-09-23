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

export class PotentialDuplicateDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  city!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty({ type: [String] })
  matchedOn!: string[];
}

export class InstitutionPrimaryContactDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  jobTitle!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  mobile!: string | null;

  @ApiPropertyOptional({ nullable: true })
  whatsapp!: string | null;
}

export class InstitutionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  arabicName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  englishName!: string | null;

  @ApiPropertyOptional({ enum: PartnershipInstitutionType, nullable: true })
  institutionType!: PartnershipInstitutionType | null;

  @ApiPropertyOptional({ enum: PartnershipInstitutionCategory, nullable: true })
  institutionCategory!: PartnershipInstitutionCategory | null;

  @ApiPropertyOptional({ enum: PartnershipCurriculum, nullable: true })
  curriculum!: PartnershipCurriculum | null;

  @ApiPropertyOptional({ enum: PartnershipEducationLevel, nullable: true })
  educationLevel!: PartnershipEducationLevel | null;

  @ApiPropertyOptional({ enum: PartnershipGender, nullable: true })
  gender!: PartnershipGender | null;

  @ApiPropertyOptional({ nullable: true })
  ageRange!: string | null;

  @ApiPropertyOptional({ nullable: true })
  governorate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  city!: string | null;

  @ApiPropertyOptional({ nullable: true })
  district!: string | null;

  @ApiPropertyOptional({ nullable: true })
  fullAddress!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  mobile!: string | null;

  @ApiPropertyOptional({ nullable: true })
  whatsapp!: string | null;

  @ApiPropertyOptional({ nullable: true })
  generalEmail!: string | null;

  @ApiPropertyOptional({ nullable: true })
  admissionsEmail!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactEmail!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ nullable: true })
  facebook!: string | null;

  @ApiPropertyOptional({ nullable: true })
  instagram!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkedin!: string | null;

  @ApiPropertyOptional({ nullable: true })
  youtube!: string | null;

  @ApiPropertyOptional({ nullable: true })
  tiktok!: string | null;

  @ApiPropertyOptional({ nullable: true })
  googleMapsUrl!: string | null;

  @ApiProperty()
  hasCoding!: boolean;

  @ApiProperty()
  hasRobotics!: boolean;

  @ApiProperty()
  hasStem!: boolean;

  @ApiProperty()
  hasAi!: boolean;

  @ApiProperty()
  hasTechClub!: boolean;

  @ApiProperty()
  hasAfterSchool!: boolean;

  @ApiProperty()
  hasSummerCamp!: boolean;

  @ApiProperty()
  hasMakerspace!: boolean;

  @ApiPropertyOptional({ enum: PartnershipType, nullable: true })
  partnershipType!: PartnershipType | null;

  @ApiProperty({ enum: PartnershipLeadPriority })
  leadPriority!: PartnershipLeadPriority;

  @ApiPropertyOptional({ nullable: true })
  leadPriorityReason!: string | null;

  @ApiProperty({ enum: PartnershipInstitutionStatus })
  status!: PartnershipInstitutionStatus;

  @ApiProperty()
  notes!: string;

  @ApiPropertyOptional({ nullable: true })
  branchName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  parentInstitutionId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sourceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastVerifiedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  deletedById!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [PotentialDuplicateDto] })
  potentialDuplicates?: PotentialDuplicateDto[];

  @ApiPropertyOptional({ type: () => InstitutionPrimaryContactDto, nullable: true })
  primaryContact!: InstitutionPrimaryContactDto | null;

  @ApiPropertyOptional({ nullable: true, description: 'ISO timestamp of latest PartnershipActivity.activityDate' })
  lastActivityAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ISO date of earliest PENDING follow-up dueDate (includes overdue)',
  })
  nextFollowUpAt!: string | null;

  @ApiProperty({ description: 'Count of PENDING follow-ups' })
  openFollowUpsCount!: number;

  @ApiProperty({
    description:
      'Count of leads not in PARTNER / NOT_INTERESTED / NO_RESPONSE / LOST',
  })
  activeLeadsCount!: number;
}

export class PaginatedInstitutionsDto {
  @ApiProperty({ type: [InstitutionResponseDto] })
  items!: InstitutionResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
