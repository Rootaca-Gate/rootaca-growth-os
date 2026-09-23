import { PartnershipResearchLanguage } from '@prisma/client';
import { generateResearchQueries } from './query-generator';

describe('generateResearchQueries', () => {
  it('generates deterministic English and Arabic queries', () => {
    const queries = generateResearchQueries({
      governorate: 'Giza',
      city: '6th of October',
      institutionType: 'SCHOOL',
      curriculum: 'BRITISH',
      language: PartnershipResearchLanguage.BOTH,
      technology: { hasCoding: true, hasRobotics: true, hasStem: true },
      maxQueries: 24,
    });

    expect(queries.length).toBeGreaterThan(3);
    expect(queries.some((q) => q.language === 'en')).toBe(true);
    expect(queries.some((q) => q.language === 'ar')).toBe(true);
    expect(queries[0]?.text).toContain('6th of October');
    // Deterministic order across runs
    const again = generateResearchQueries({
      governorate: 'Giza',
      city: '6th of October',
      institutionType: 'SCHOOL',
      curriculum: 'BRITISH',
      language: PartnershipResearchLanguage.BOTH,
      technology: { hasCoding: true, hasRobotics: true, hasStem: true },
      maxQueries: 24,
    });
    expect(again.map((q) => q.text)).toEqual(queries.map((q) => q.text));
  });

  it('respects maxQueries cap', () => {
    const queries = generateResearchQueries({
      governorate: 'Cairo',
      city: 'New Cairo',
      institutionType: 'SCHOOL',
      language: PartnershipResearchLanguage.BOTH,
      technology: {
        hasCoding: true,
        hasRobotics: true,
        hasStem: true,
        hasAi: true,
        hasTechClub: true,
        hasAfterSchool: true,
        hasSummerCamp: true,
        hasMakerspace: true,
      },
      maxQueries: 5,
    });
    expect(queries).toHaveLength(5);
  });

  it('supports English-only language mode', () => {
    const queries = generateResearchQueries({
      governorate: 'Alexandria',
      institutionType: 'CODING_CENTER',
      language: PartnershipResearchLanguage.EN,
      technology: { hasCoding: true },
    });
    expect(queries.every((q) => q.language === 'en')).toBe(true);
  });
});
