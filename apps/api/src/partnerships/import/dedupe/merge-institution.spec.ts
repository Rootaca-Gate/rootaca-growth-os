import { PartnershipInstitution, PartnershipLeadPriority } from '@prisma/client';
import { buildMergeUpdate } from './merge-institution';

describe('buildMergeUpdate', () => {
  const existing = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Existing School',
    arabicName: null,
    englishName: 'Existing School',
    phone: '+201001112233',
    mobile: null,
    whatsapp: null,
    website: null,
    city: 'Cairo',
    governorate: null,
    generalEmail: null,
    admissionsEmail: null,
    contactEmail: null,
    facebook: null,
    instagram: null,
    linkedin: null,
    youtube: null,
    tiktok: null,
    googleMapsUrl: null,
    branchName: null,
    district: null,
    fullAddress: null,
    institutionType: null,
    institutionCategory: null,
    curriculum: null,
    educationLevel: null,
    leadPriority: PartnershipLeadPriority.UNKNOWN,
    hasCoding: false,
    hasRobotics: false,
    hasStem: false,
    hasAi: false,
    hasTechClub: false,
    hasAfterSchool: false,
    hasSummerCamp: false,
    hasMakerspace: false,
  } as unknown as PartnershipInstitution;

  it('fills missing values and preserves existing', () => {
    const update = buildMergeUpdate(existing, {
      name: 'Incoming Different Name',
      phone: '+209999999999',
      website: 'https://example.edu.eg',
      city: 'Giza',
      governorate: 'Giza',
      hasCoding: true,
    });
    expect(update.phone).toBeUndefined();
    expect(update.city).toBeUndefined();
    expect(update.website).toBe('https://example.edu.eg');
    expect(update.governorate).toBe('Giza');
    expect(update.hasCoding).toBe(true);
    expect(update.name).toBeUndefined();
  });
});
