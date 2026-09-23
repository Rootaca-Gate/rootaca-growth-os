import { PartnershipImportMatchConfidence } from '@prisma/client';
import { detectDuplicates, defaultDecisionForMatch } from './duplicate-detect';
import { NormalizedImportRow } from '../mapping/row-mapper';

function row(partial: Partial<NormalizedImportRow> & { name: string }): NormalizedImportRow {
  return {
    name: partial.name,
    normalizedName: partial.normalizedName ?? partial.name.toLowerCase(),
    normalizedPhone: partial.normalizedPhone ?? null,
    normalizedWebsiteDomain: partial.normalizedWebsiteDomain ?? null,
    normalizedContactEmail: partial.normalizedContactEmail ?? null,
    normalizedCity: partial.normalizedCity ?? null,
    normalizedGovernorate: partial.normalizedGovernorate ?? null,
    city: partial.city,
    governorate: partial.governorate,
    website: partial.website,
    phone: partial.phone,
    generalEmail: partial.generalEmail,
    contactEmail: partial.contactEmail,
    admissionsEmail: partial.admissionsEmail,
  };
}

describe('duplicate-detect', () => {
  it('detects exact match by website domain', () => {
    const match = detectDuplicates({
      rowNumber: 1,
      row: row({
        name: 'Alsson',
        normalizedWebsiteDomain: 'alsson.edu.eg',
        website: 'https://alsson.edu.eg',
      }),
      dbCandidates: [
        {
          id: 'inst-1',
          name: 'Alsson International School',
          normalizedName: 'alsson international school',
          normalizedPhone: null,
          normalizedWebsiteDomain: 'alsson.edu.eg',
          city: 'New Cairo',
          governorate: 'Cairo',
          generalEmail: null,
          contactEmail: null,
          admissionsEmail: null,
        },
      ],
      priorCsvRows: [],
    });
    expect(match.confidence).toBe(PartnershipImportMatchConfidence.EXACT);
    expect(match.reasons).toContain('Same normalized website domain');
    expect(match.matchedInstitutionId).toBe('inst-1');
  });

  it('detects exact match by phone', () => {
    const match = detectDuplicates({
      rowNumber: 1,
      row: row({ name: 'A', normalizedPhone: '+201001112233', phone: '+201001112233' }),
      dbCandidates: [
        {
          id: 'inst-2',
          name: 'B',
          normalizedName: 'b',
          normalizedPhone: '+201001112233',
          normalizedWebsiteDomain: null,
          city: null,
          governorate: null,
          generalEmail: null,
          contactEmail: null,
          admissionsEmail: null,
        },
      ],
      priorCsvRows: [],
    });
    expect(match.confidence).toBe(PartnershipImportMatchConfidence.EXACT);
  });

  it('detects exact match by name + city', () => {
    const match = detectDuplicates({
      rowNumber: 1,
      row: row({
        name: 'Example School',
        normalizedName: 'example school',
        city: 'New Cairo',
      }),
      dbCandidates: [
        {
          id: 'inst-3',
          name: 'Example School',
          normalizedName: 'example school',
          normalizedPhone: null,
          normalizedWebsiteDomain: null,
          city: 'New Cairo',
          governorate: 'Cairo',
          generalEmail: null,
          contactEmail: null,
          admissionsEmail: null,
        },
      ],
      priorCsvRows: [],
    });
    expect(match.confidence).toBe(PartnershipImportMatchConfidence.EXACT);
    expect(match.reasons).toEqual(expect.arrayContaining(['Same normalized name', 'Same city']));
  });

  it('detects possible match by name only', () => {
    const match = detectDuplicates({
      rowNumber: 1,
      row: row({ name: 'Example School', normalizedName: 'example school', city: 'Maadi' }),
      dbCandidates: [
        {
          id: 'inst-4',
          name: 'Example School',
          normalizedName: 'example school',
          normalizedPhone: null,
          normalizedWebsiteDomain: null,
          city: 'New Cairo',
          governorate: 'Cairo',
          generalEmail: null,
          contactEmail: null,
          admissionsEmail: null,
        },
      ],
      priorCsvRows: [],
    });
    expect(match.confidence).toBe(PartnershipImportMatchConfidence.POSSIBLE);
  });

  it('detects CSV-internal duplicates', () => {
    const match = detectDuplicates({
      rowNumber: 2,
      row: row({
        name: 'Example School',
        normalizedName: 'example school',
        city: 'New Cairo',
      }),
      dbCandidates: [],
      priorCsvRows: [
        {
          rowNumber: 1,
          name: 'Example School',
          row: row({
            name: 'Example School',
            normalizedName: 'example school',
            city: 'New Cairo',
          }),
        },
      ],
    });
    expect(match.confidence).toBe(PartnershipImportMatchConfidence.EXACT);
    expect(match.csvDuplicateOfRow).toBe(1);
  });

  it('returns NONE when no duplicate', () => {
    const match = detectDuplicates({
      rowNumber: 1,
      row: row({ name: 'Unique School', normalizedName: 'unique school' }),
      dbCandidates: [],
      priorCsvRows: [],
    });
    expect(match.confidence).toBe(PartnershipImportMatchConfidence.NONE);
  });

  it('defaults decisions safely', () => {
    expect(defaultDecisionForMatch(PartnershipImportMatchConfidence.EXACT, true, null)).toBe(
      'SKIP',
    );
    expect(defaultDecisionForMatch(PartnershipImportMatchConfidence.POSSIBLE, true, null)).toBe(
      'SKIP',
    );
    expect(defaultDecisionForMatch(PartnershipImportMatchConfidence.NONE, true, null)).toBe(
      'IMPORT',
    );
    expect(defaultDecisionForMatch(PartnershipImportMatchConfidence.NONE, false, null)).toBe(
      'SKIP',
    );
  });
});
