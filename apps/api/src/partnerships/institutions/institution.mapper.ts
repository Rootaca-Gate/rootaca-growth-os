import { PartnershipInstitution } from '@prisma/client';
import {
  InstitutionPrimaryContactDto,
  InstitutionResponseDto,
  PotentialDuplicateDto,
} from './dto/institution-response.dto';

export type InstitutionListEnrichment = {
  primaryContact: InstitutionPrimaryContactDto | null;
  lastActivityAt: string | null;
  nextFollowUpAt: string | null;
  openFollowUpsCount: number;
  activeLeadsCount: number;
};

export const EMPTY_INSTITUTION_ENRICHMENT: InstitutionListEnrichment = {
  primaryContact: null,
  lastActivityAt: null,
  nextFollowUpAt: null,
  openFollowUpsCount: 0,
  activeLeadsCount: 0,
};

export function toInstitutionResponse(
  row: PartnershipInstitution,
  potentialDuplicates?: PotentialDuplicateDto[],
  enrichment: InstitutionListEnrichment = EMPTY_INSTITUTION_ENRICHMENT,
): InstitutionResponseDto {
  return {
    id: row.id,
    name: row.name,
    arabicName: row.arabicName,
    englishName: row.englishName,
    institutionType: row.institutionType,
    institutionCategory: row.institutionCategory,
    curriculum: row.curriculum,
    educationLevel: row.educationLevel,
    gender: row.gender,
    ageRange: row.ageRange,
    governorate: row.governorate,
    city: row.city,
    district: row.district,
    fullAddress: row.fullAddress,
    phone: row.phone,
    mobile: row.mobile,
    whatsapp: row.whatsapp,
    generalEmail: row.generalEmail,
    admissionsEmail: row.admissionsEmail,
    contactEmail: row.contactEmail,
    website: row.website,
    facebook: row.facebook,
    instagram: row.instagram,
    linkedin: row.linkedin,
    youtube: row.youtube,
    tiktok: row.tiktok,
    googleMapsUrl: row.googleMapsUrl,
    hasCoding: row.hasCoding,
    hasRobotics: row.hasRobotics,
    hasStem: row.hasStem,
    hasAi: row.hasAi,
    hasTechClub: row.hasTechClub,
    hasAfterSchool: row.hasAfterSchool,
    hasSummerCamp: row.hasSummerCamp,
    hasMakerspace: row.hasMakerspace,
    partnershipType: row.partnershipType,
    leadPriority: row.leadPriority,
    leadPriorityReason: row.leadPriorityReason,
    status: row.status,
    notes: row.notes,
    branchName: row.branchName,
    parentInstitutionId: row.parentInstitutionId,
    sourceId: row.sourceId,
    lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    deletedById: row.deletedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    primaryContact: enrichment.primaryContact,
    lastActivityAt: enrichment.lastActivityAt,
    nextFollowUpAt: enrichment.nextFollowUpAt,
    openFollowUpsCount: enrichment.openFollowUpsCount,
    activeLeadsCount: enrichment.activeLeadsCount,
    ...(potentialDuplicates ? { potentialDuplicates } : {}),
  };
}
