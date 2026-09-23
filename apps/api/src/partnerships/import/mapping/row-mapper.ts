import {
  PartnershipCurriculum,
  PartnershipEducationLevel,
  PartnershipInstitutionCategory,
  PartnershipInstitutionType,
  PartnershipLeadPriority,
} from '@prisma/client';
import {
  isValidEmailFormat,
  isValidUrlFormat,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeWebsiteDomain,
  sanitizeSpreadsheetValue,
} from '../../common/partnership.normalize';
import { ImportCrmField, invertMapping } from '../mapping/field-aliases';

export type MappedImportRow = {
  name?: string;
  englishName?: string;
  arabicName?: string;
  branchName?: string;
  institutionType?: PartnershipInstitutionType;
  institutionCategory?: PartnershipInstitutionCategory;
  curriculum?: PartnershipCurriculum;
  educationLevel?: PartnershipEducationLevel;
  governorate?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
  contactName?: string;
  contactJobTitle?: string;
  contactEmail?: string;
  admissionsEmail?: string;
  generalEmail?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  googleMapsUrl?: string;
  hasCoding?: boolean;
  hasRobotics?: boolean;
  hasStem?: boolean;
  hasAi?: boolean;
  hasTechClub?: boolean;
  hasAfterSchool?: boolean;
  hasSummerCamp?: boolean;
  hasMakerspace?: boolean;
  sourceName?: string;
  sourceUrl?: string;
  leadPriority?: PartnershipLeadPriority;
  notes?: string;
};

export type NormalizedImportRow = MappedImportRow & {
  normalizedName: string | null;
  normalizedPhone: string | null;
  normalizedWebsiteDomain: string | null;
  normalizedContactEmail: string | null;
  normalizedCity: string | null;
  normalizedGovernorate: string | null;
};

export type FieldValidationError = {
  field: string;
  reason: string;
};

function parseBoolean(raw: string): boolean | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (['1', 'true', 'yes', 'y', 'نعم', 'ايوه', 'أيوه'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'لا'].includes(v)) return false;
  return undefined;
}

function parseEnum<T extends string>(
  raw: string,
  values: readonly T[],
): T | undefined {
  const normalized = raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (!normalized) return undefined;
  return values.find((value) => value === normalized);
}

function firstToken(raw: string): string {
  return raw.split(/[,;/|]/)[0]?.trim() ?? raw.trim();
}

export function applyMapping(
  raw: Record<string, string>,
  mapping: Record<string, ImportCrmField | null | undefined>,
): { mapped: MappedImportRow; errors: FieldValidationError[] } {
  const byField = invertMapping(mapping);
  const errors: FieldValidationError[] = [];
  const mapped: MappedImportRow = {};

  const take = (field: ImportCrmField): string | undefined => {
    const header = byField[field];
    if (!header) return undefined;
    const sanitized = sanitizeSpreadsheetValue(raw[header] ?? '');
    return sanitized ?? undefined;
  };

  const name = take('name');
  if (name) mapped.name = name;

  const englishName = take('englishName');
  if (englishName) mapped.englishName = englishName;

  const arabicName = take('arabicName');
  if (arabicName) mapped.arabicName = arabicName;

  const branchName = take('branchName');
  if (branchName) mapped.branchName = branchName;

  const typeRaw = take('institutionType');
  if (typeRaw) {
    const parsed = parseEnum(typeRaw, Object.values(PartnershipInstitutionType));
    if (!parsed) errors.push({ field: 'institutionType', reason: 'Invalid enum value' });
    else mapped.institutionType = parsed;
  }

  const categoryRaw = take('institutionCategory');
  if (categoryRaw) {
    const parsed = parseEnum(categoryRaw, Object.values(PartnershipInstitutionCategory));
    if (!parsed) errors.push({ field: 'institutionCategory', reason: 'Invalid enum value' });
    else mapped.institutionCategory = parsed;
  }

  const curriculumRaw = take('curriculum');
  if (curriculumRaw) {
    const parsed = parseEnum(firstToken(curriculumRaw), Object.values(PartnershipCurriculum));
    if (!parsed) errors.push({ field: 'curriculum', reason: 'Invalid enum value' });
    else mapped.curriculum = parsed;
  }

  const levelRaw = take('educationLevel');
  if (levelRaw) {
    const parsed = parseEnum(firstToken(levelRaw), Object.values(PartnershipEducationLevel));
    if (!parsed) errors.push({ field: 'educationLevel', reason: 'Invalid enum value' });
    else mapped.educationLevel = parsed;
  }

  for (const field of [
    'governorate',
    'city',
    'district',
    'fullAddress',
    'contactName',
    'contactJobTitle',
    'phone',
    'mobile',
    'whatsapp',
    'facebook',
    'instagram',
    'linkedin',
    'youtube',
    'tiktok',
    'sourceName',
    'notes',
  ] as const) {
    const value = take(field);
    if (value) mapped[field] = value;
  }

  for (const field of ['contactEmail', 'admissionsEmail', 'generalEmail'] as const) {
    const value = take(field);
    if (!value) continue;
    if (!isValidEmailFormat(value)) {
      errors.push({ field, reason: 'Invalid email' });
    } else {
      mapped[field] = value;
    }
  }

  for (const field of ['website', 'googleMapsUrl', 'sourceUrl'] as const) {
    const value = take(field);
    if (!value) continue;
    if (!isValidUrlFormat(value)) {
      errors.push({ field, reason: 'Invalid URL format' });
    } else {
      mapped[field] = value;
    }
  }

  for (const field of [
    'hasCoding',
    'hasRobotics',
    'hasStem',
    'hasAi',
    'hasTechClub',
    'hasAfterSchool',
    'hasSummerCamp',
    'hasMakerspace',
  ] as const) {
    const value = take(field);
    if (value == null) continue;
    const parsed = parseBoolean(value);
    if (parsed === undefined) {
      errors.push({ field, reason: 'Invalid boolean (use true/false or yes/no)' });
    } else {
      mapped[field] = parsed;
    }
  }

  const priorityRaw = take('leadPriority');
  if (priorityRaw) {
    const parsed = parseEnum(priorityRaw, Object.values(PartnershipLeadPriority));
    if (!parsed) errors.push({ field: 'leadPriority', reason: 'Invalid enum value' });
    else mapped.leadPriority = parsed;
  }

  return { mapped, errors };
}

export function normalizeMappedRow(mapped: MappedImportRow): NormalizedImportRow {
  const phone = mapped.phone ?? mapped.mobile ?? mapped.whatsapp ?? null;
  return {
    ...mapped,
    normalizedName: normalizeName(mapped.name),
    normalizedPhone: normalizePhone(phone),
    normalizedWebsiteDomain: normalizeWebsiteDomain(mapped.website),
    normalizedContactEmail: normalizeEmail(
      mapped.contactEmail ?? mapped.generalEmail ?? mapped.admissionsEmail,
    ),
    normalizedCity: normalizeName(mapped.city),
    normalizedGovernorate: normalizeName(mapped.governorate),
  };
}

export function validateMappedRow(
  mapped: MappedImportRow,
  mappingErrors: FieldValidationError[],
): FieldValidationError[] {
  const errors = [...mappingErrors];
  if (!mapped.name || mapped.name.trim().length < 2) {
    errors.push({ field: 'name', reason: 'Name is required (min 2 characters)' });
  }
  return errors;
}

export function splitContactName(fullName: string): { firstName: string; lastName: string; fullName: string } {
  const cleaned = fullName.trim().replace(/\s+/g, ' ');
  const parts = cleaned.split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: '', fullName: cleaned };
  }
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(' '),
    fullName: cleaned,
  };
}

export function hasContactData(mapped: MappedImportRow): boolean {
  return Boolean(
    mapped.contactName ||
      mapped.contactJobTitle ||
      mapped.contactEmail ||
      mapped.phone ||
      mapped.mobile ||
      mapped.whatsapp,
  );
}
