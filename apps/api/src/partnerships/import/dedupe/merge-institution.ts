import { PartnershipInstitution, Prisma } from '@prisma/client';
import {
  normalizeEmail,
  normalizePhone,
  normalizeWebsiteDomain,
} from '../../common/partnership.normalize';
import { MappedImportRow } from '../mapping/row-mapper';

type FillableString =
  | 'arabicName'
  | 'englishName'
  | 'branchName'
  | 'governorate'
  | 'city'
  | 'district'
  | 'fullAddress'
  | 'phone'
  | 'mobile'
  | 'whatsapp'
  | 'generalEmail'
  | 'admissionsEmail'
  | 'contactEmail'
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'googleMapsUrl';

const STRING_FIELDS: FillableString[] = [
  'arabicName',
  'englishName',
  'branchName',
  'governorate',
  'city',
  'district',
  'fullAddress',
  'phone',
  'mobile',
  'whatsapp',
  'generalEmail',
  'admissionsEmail',
  'contactEmail',
  'website',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
  'googleMapsUrl',
];

function isEmpty(value: unknown): boolean {
  return value == null || value === '';
}

/**
 * Merge strategy: keep existing non-empty values; fill only missing fields from import.
 * Never overwrite conflicting values. Notes are handled separately (append as PartnershipNote).
 */
export function buildMergeUpdate(
  existing: PartnershipInstitution,
  incoming: MappedImportRow,
): Prisma.PartnershipInstitutionUpdateInput {
  const data: Prisma.PartnershipInstitutionUpdateInput = {};

  for (const field of STRING_FIELDS) {
    const current = existing[field];
    const next = incoming[field];
    if (isEmpty(current) && next) {
      (data as Record<string, unknown>)[field] = next;
    }
  }

  if (!existing.institutionType && incoming.institutionType) {
    data.institutionType = incoming.institutionType;
  }
  if (!existing.institutionCategory && incoming.institutionCategory) {
    data.institutionCategory = incoming.institutionCategory;
  }
  if (!existing.curriculum && incoming.curriculum) {
    data.curriculum = incoming.curriculum;
  }
  if (!existing.educationLevel && incoming.educationLevel) {
    data.educationLevel = incoming.educationLevel;
  }
  if (existing.leadPriority === 'UNKNOWN' && incoming.leadPriority) {
    data.leadPriority = incoming.leadPriority;
  }

  const boolFields = [
    'hasCoding',
    'hasRobotics',
    'hasStem',
    'hasAi',
    'hasTechClub',
    'hasAfterSchool',
    'hasSummerCamp',
    'hasMakerspace',
  ] as const;
  for (const field of boolFields) {
    if (!existing[field] && incoming[field] === true) {
      data[field] = true;
    }
  }

  const nextPhone =
    (typeof data.phone === 'string' ? data.phone : existing.phone) ??
    (typeof data.mobile === 'string' ? data.mobile : existing.mobile) ??
    (typeof data.whatsapp === 'string' ? data.whatsapp : existing.whatsapp);
  const nextWebsite =
    typeof data.website === 'string' ? data.website : existing.website;

  if (data.phone !== undefined || data.mobile !== undefined || data.whatsapp !== undefined) {
    data.normalizedPhone = normalizePhone(nextPhone);
  }
  if (data.website !== undefined) {
    data.normalizedWebsiteDomain = normalizeWebsiteDomain(nextWebsite);
  }
  if (data.generalEmail !== undefined) {
    data.generalEmail = normalizeEmail(incoming.generalEmail) ?? existing.generalEmail;
  }
  if (data.admissionsEmail !== undefined) {
    data.admissionsEmail = normalizeEmail(incoming.admissionsEmail) ?? existing.admissionsEmail;
  }
  if (data.contactEmail !== undefined) {
    data.contactEmail = normalizeEmail(incoming.contactEmail) ?? existing.contactEmail;
  }

  return data;
}
