import * as fs from 'fs';
import * as path from 'path';
import { PartnershipResearchSourceType } from '@prisma/client';
import {
  classifyDiscoverySource,
  extractCandidatesFromDiscovery,
} from './candidate-extract';
import { classifyCandidateQuality } from './candidate-quality';
import {
  applyEnrichmentPatches,
  classifyEnrichmentSource,
  generateEnrichmentQueries,
  listMissingEnrichmentFields,
  matchesSameInstitution,
} from './missing-field-enrichment';

describe('multi-source enrichment', () => {
  const helsinkiHtml = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'kidsdirectory-helsinki-ad.html'),
    'utf8',
  );

  it('Test 1 — discovery source differs from evidence source', () => {
    const discovery = {
      provider: 'WEB_SEARCH',
      query: 'Helsinki school Shorouk',
      title: 'Helsinki Semi International School HSIS - Egypt Directory',
      url: 'https://kidsdirectory.com.eg/ad/helsinki-semi-international-school-hsis-in-el-shorouk/',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'kidsdirectory.com.eg',
    };
    const drafts = extractCandidatesFromDiscovery(discovery, helsinkiHtml);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].sourceName).toBe('WEB_SEARCH');
    expect(drafts[0].evidence.some((e) => e.field === 'discoverySource')).toBe(true);
    expect(drafts[0].evidence.some((e) => e.field === 'evidenceSource' && e.value === 'KidsDirectory')).toBe(
      true,
    );
  });

  it('Test 2 — official website differs from sourceUrl', () => {
    const discovery = {
      provider: 'WEB_SEARCH',
      query: 'HSIS Shorouk',
      title: 'Helsinki Semi International School HSIS - Egypt Directory',
      url: 'https://kidsdirectory.com.eg/ad/helsinki-semi-international-school-hsis-in-el-shorouk/',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'kidsdirectory.com.eg',
    };
    const drafts = extractCandidatesFromDiscovery(discovery, helsinkiHtml);
    expect(drafts[0].sourceUrl).toContain('kidsdirectory.com.eg/ad/');
    expect(drafts[0].website).toMatch(/hsis\.skoleraerp\.com/i);
    expect(drafts[0].website).not.toBe(drafts[0].sourceUrl);
  });

  it('Test 3 — Helsinki directory extraction', () => {
    const discovery = {
      provider: 'WEB_SEARCH',
      query: 'HSIS',
      title: 'Helsinki Semi International School HSIS - Egypt Directory',
      url: 'https://kidsdirectory.com.eg/ad/helsinki-semi-international-school-hsis-in-el-shorouk/',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'kidsdirectory.com.eg',
    };
    expect(classifyDiscoverySource(discovery)).toBe('DIRECTORY_LISTING');
    const drafts = extractCandidatesFromDiscovery(discovery, helsinkiHtml);
    expect(drafts).toHaveLength(1);
    const d = drafts[0];
    expect(d.discoveredName).toMatch(/Helsinki/i);
    expect(d.phone).toContain('01201144449');
    expect(d.email?.toLowerCase()).toBe('hr@helsinkischools.net');
    expect(d.whatsapp).toContain('01201144449');
    expect(d.website).toMatch(/hsis\.skoleraerp\.com/i);
    expect(d.address).toMatch(/Cairo|Shorouk/i);
    expect(d.googleMapsUrl).toMatch(/maps\.google/i);
    expect(d.facebook).toMatch(/facebook\.com/i);
  });

  it('Test 4 — directory does not become a second institution', () => {
    const discovery = {
      provider: 'WEB_SEARCH',
      query: 'HSIS',
      title: 'Helsinki Semi International School HSIS - Egypt Directory',
      url: 'https://kidsdirectory.com.eg/ad/helsinki-semi-international-school-hsis-in-el-shorouk/',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'kidsdirectory.com.eg',
    };
    const drafts = extractCandidatesFromDiscovery(discovery, helsinkiHtml);
    expect(drafts).toHaveLength(1);
    expect(drafts.every((d) => !/Kids Directory|Bambino Nursery|mental health/i.test(d.discoveredName))).toBe(
      true,
    );
  });

  it('Test 5 — enrichment keeps existing candidate id conceptually (patch merge)', () => {
    const existing = {
      id: 'cand-1',
      discoveredName: 'Helsinki Semi International School (HSIS)',
      city: 'El Shorouk',
      governorate: 'Cairo',
      phone: null,
      email: null,
      website: null,
    };
    const patches = applyEnrichmentPatches(
      existing,
      { phone: '01201144449', email: 'hr@helsinkischools.net' },
      {
        sourceUrl: 'https://kidsdirectory.com.eg/ad/helsinki/',
        sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
        sourceName: 'KidsDirectory',
      },
    );
    expect(existing.id).toBe('cand-1');
    expect(patches.filter((p) => p.action === 'SET')).toHaveLength(2);
  });

  it('Test 6 — conflicting phones are not silently overwritten', () => {
    const patches = applyEnrichmentPatches(
      {
        id: 'c1',
        discoveredName: 'HSIS',
        phone: '01201144449',
      },
      { phone: '01099999999' },
      {
        sourceUrl: 'https://example.com',
        sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
        sourceName: 'Other',
      },
    );
    expect(patches[0].action).toBe('CONFLICT');
  });

  it('Test 7 — missing fields trigger enrichment queries', () => {
    const missing = listMissingEnrichmentFields({
      id: 'c1',
      discoveredName: 'Nermien Ismail Schools',
      city: 'El Shorouk',
      governorate: 'Cairo',
    });
    expect(missing.length).toBeGreaterThan(0);
    const queries = generateEnrichmentQueries(
      {
        id: 'c1',
        discoveredName: 'Nermien Ismail Schools',
        city: 'El Shorouk',
        governorate: 'Cairo',
      },
      missing,
    );
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.length).toBeLessThanOrEqual(5);
    expect(queries.some((q) => /phone|contact|email|website|address/i.test(q))).toBe(true);
  });

  it('Test 8 — no invented enrichment data (empty incoming yields no patches)', () => {
    const patches = applyEnrichmentPatches(
      { id: 'c1', discoveredName: 'HSIS' },
      { phone: undefined, email: '  ' },
      {
        sourceUrl: 'https://kidsdirectory.com.eg/ad/x/',
        sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
        sourceName: 'KidsDirectory',
      },
    );
    expect(patches).toHaveLength(0);
  });

  it('same-institution matching accepts campus alias with city', () => {
    expect(
      matchesSameInstitution(
        {
          id: 'c1',
          discoveredName: 'Nermien Ismail Schools (NIS)',
          city: 'El Shorouk',
          governorate: 'Cairo',
        },
        {
          name: 'NIS Shorouk Campus',
          phone: '01000000000',
          city: 'El Shorouk',
        },
      ),
    ).toBe(true);
  });

  it('classifies kidsdirectory /ad/ as DIRECTORY not institution host', () => {
    expect(
      classifyEnrichmentSource({
        url: 'https://kidsdirectory.com.eg/ad/helsinki-semi-international-school-hsis-in-el-shorouk/',
        title: 'Helsinki Semi International School HSIS',
        sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
        domain: 'kidsdirectory.com.eg',
      }),
    ).toBe('DIRECTORY');
  });

  it('Test 10 — quality gate still rejects noise', () => {
    expect(classifyCandidateQuality({ name: 'Frequently Asked Questions (FAQ)' })).toBe(
      'INVALID_NON_INSTITUTION',
    );
    expect(classifyCandidateQuality({ name: 'المصروفات تبدأ من 110,000 ج.م' })).toBe(
      'INVALID_NON_INSTITUTION',
    );
    expect(
      classifyCandidateQuality({
        name: 'Logistics: LRT Access, Suez Road, and School Bus Safety',
      }),
    ).toBe('INVALID_NON_INSTITUTION');
  });
});
