/**
 * Deterministic CRM field keys for CSV column mapping.
 * Unsupported CSV concepts (documented): country (no schema field).
 */
export const IMPORT_CRM_FIELDS = [
  'name',
  'englishName',
  'arabicName',
  'branchName',
  'institutionType',
  'institutionCategory',
  'curriculum',
  'educationLevel',
  'governorate',
  'city',
  'district',
  'fullAddress',
  'contactName',
  'contactJobTitle',
  'contactEmail',
  'admissionsEmail',
  'generalEmail',
  'phone',
  'mobile',
  'whatsapp',
  'website',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
  'googleMapsUrl',
  'hasCoding',
  'hasRobotics',
  'hasStem',
  'hasAi',
  'hasTechClub',
  'hasAfterSchool',
  'hasSummerCamp',
  'hasMakerspace',
  'sourceName',
  'sourceUrl',
  'leadPriority',
  'notes',
] as const;

export type ImportCrmField = (typeof IMPORT_CRM_FIELDS)[number];

/** Header aliases → CRM field (normalized header key = lowercase, non-alnum → underscore). */
export const FIELD_ALIASES: Record<string, ImportCrmField> = {
  name: 'name',
  school: 'name',
  school_name: 'name',
  schoolname: 'name',
  institution: 'name',
  institution_name: 'name',
  institutionname: 'name',
  organization: 'name',
  organization_name: 'name',
  center_name: 'name',
  centre_name: 'name',
  academy_name: 'name',

  name_en: 'englishName',
  nameen: 'englishName',
  english_name: 'englishName',
  englishname: 'englishName',
  name_english: 'englishName',

  name_ar: 'arabicName',
  namear: 'arabicName',
  arabic_name: 'arabicName',
  arabicname: 'arabicName',
  name_arabic: 'arabicName',

  branch: 'branchName',
  branch_name: 'branchName',
  branchname: 'branchName',

  type: 'institutionType',
  institution_type: 'institutionType',
  institutiontype: 'institutionType',
  school_type: 'institutionType',

  category: 'institutionCategory',
  institution_category: 'institutionCategory',
  institutioncategory: 'institutionCategory',
  school_category: 'institutionCategory',

  curriculum: 'curriculum',
  curricula: 'curriculum',

  education_level: 'educationLevel',
  educationlevel: 'educationLevel',
  education_levels: 'educationLevel',
  level: 'educationLevel',
  stage: 'educationLevel',

  description: 'notes',
  notes: 'notes',
  note: 'notes',
  comments: 'notes',

  governorate: 'governorate',
  gov: 'governorate',
  state: 'governorate',
  province: 'governorate',

  city: 'city',
  town: 'city',

  district: 'district',
  area: 'district',
  neighborhood: 'district',
  neighbourhood: 'district',

  address: 'fullAddress',
  full_address: 'fullAddress',
  fulladdress: 'fullAddress',
  street_address: 'fullAddress',
  location_address: 'fullAddress',

  contact_name: 'contactName',
  contactname: 'contactName',
  contact: 'contactName',
  principal: 'contactName',
  principal_name: 'contactName',
  director: 'contactName',
  director_name: 'contactName',
  person_name: 'contactName',
  full_name: 'contactName',
  fullname: 'contactName',

  contact_job_title: 'contactJobTitle',
  contactjobtitle: 'contactJobTitle',
  job_title: 'contactJobTitle',
  jobtitle: 'contactJobTitle',
  title: 'contactJobTitle',
  position: 'contactJobTitle',
  role: 'contactJobTitle',

  email: 'contactEmail',
  contact_email: 'contactEmail',
  contactemail: 'contactEmail',
  principal_email: 'contactEmail',
  e_mail: 'contactEmail',

  admissions_email: 'admissionsEmail',
  admissionsemail: 'admissionsEmail',
  admission_email: 'admissionsEmail',

  general_email: 'generalEmail',
  generalemail: 'generalEmail',
  info_email: 'generalEmail',
  infoemail: 'generalEmail',

  phone: 'phone',
  telephone: 'phone',
  tel: 'phone',
  phone_number: 'phone',
  phonenumber: 'phone',
  landline: 'phone',

  mobile: 'mobile',
  mobile_number: 'mobile',
  mobilenumber: 'mobile',
  cell: 'mobile',
  cellphone: 'mobile',
  cell_phone: 'mobile',

  whatsapp: 'whatsapp',
  whats_app: 'whatsapp',
  wa: 'whatsapp',

  website: 'website',
  web: 'website',
  url: 'website',
  site: 'website',
  homepage: 'website',
  home_page: 'website',
  web_site: 'website',

  facebook: 'facebook',
  fb: 'facebook',
  facebook_url: 'facebook',

  instagram: 'instagram',
  ig: 'instagram',
  instagram_url: 'instagram',

  linkedin: 'linkedin',
  linked_in: 'linkedin',
  linkedin_url: 'linkedin',

  youtube: 'youtube',
  yt: 'youtube',
  youtube_url: 'youtube',

  tiktok: 'tiktok',
  tik_tok: 'tiktok',
  tiktok_url: 'tiktok',

  google_maps_url: 'googleMapsUrl',
  googlemapsurl: 'googleMapsUrl',
  google_maps: 'googleMapsUrl',
  maps_url: 'googleMapsUrl',
  map_url: 'googleMapsUrl',
  maps: 'googleMapsUrl',

  coding: 'hasCoding',
  programming: 'hasCoding',
  has_coding: 'hasCoding',
  hascoding: 'hasCoding',
  code: 'hasCoding',

  robotics: 'hasRobotics',
  has_robotics: 'hasRobotics',
  hasrobotics: 'hasRobotics',
  robot: 'hasRobotics',

  stem: 'hasStem',
  has_stem: 'hasStem',
  hasstem: 'hasStem',
  technology: 'hasStem',
  tech: 'hasStem',

  ai: 'hasAi',
  has_ai: 'hasAi',
  hasai: 'hasAi',
  artificial_intelligence: 'hasAi',

  tech_club: 'hasTechClub',
  techclub: 'hasTechClub',
  has_tech_club: 'hasTechClub',
  technology_club: 'hasTechClub',

  after_school: 'hasAfterSchool',
  afterschool: 'hasAfterSchool',
  has_after_school: 'hasAfterSchool',

  summer_program: 'hasSummerCamp',
  summer_camp: 'hasSummerCamp',
  summercamp: 'hasSummerCamp',
  has_summer_camp: 'hasSummerCamp',
  summer: 'hasSummerCamp',

  makerspace: 'hasMakerspace',
  maker_space: 'hasMakerspace',
  has_makerspace: 'hasMakerspace',

  source: 'sourceName',
  source_name: 'sourceName',
  sourcename: 'sourceName',
  lead_source: 'sourceName',

  source_url: 'sourceUrl',
  sourceurl: 'sourceUrl',
  source_link: 'sourceUrl',

  priority: 'leadPriority',
  lead_priority: 'leadPriority',
  leadpriority: 'leadPriority',
};

export function normalizeHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/**
 * Auto-map CSV headers to CRM fields. First matching alias wins per field
 * (deterministic: headers scanned left-to-right; each CRM field mapped once).
 */
export function autoMapHeaders(headers: string[]): Record<string, ImportCrmField | null> {
  const mapping: Record<string, ImportCrmField | null> = {};
  const usedFields = new Set<ImportCrmField>();

  for (const header of headers) {
    const key = normalizeHeaderKey(header);
    const field = FIELD_ALIASES[key] ?? null;
    if (field && !usedFields.has(field)) {
      mapping[header] = field;
      usedFields.add(field);
    } else {
      mapping[header] = null;
    }
  }

  return mapping;
}

export function invertMapping(
  mapping: Record<string, ImportCrmField | null | undefined>,
): Partial<Record<ImportCrmField, string>> {
  const inverted: Partial<Record<ImportCrmField, string>> = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (!field || inverted[field]) {
      continue;
    }
    inverted[field] = header;
  }
  return inverted;
}
