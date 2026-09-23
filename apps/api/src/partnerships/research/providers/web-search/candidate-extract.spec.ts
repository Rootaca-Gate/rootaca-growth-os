import { PartnershipResearchSourceType } from '@prisma/client';
import {
  classifyDiscoverySource,
  extractCandidatesFromDiscovery,
  extractInstitutionsFromArticleContent,
} from '../candidate-extract';
import type { DiscoveryResult } from '../discovery.provider';
import {
  cleanInstitutionTitle,
  isGenericListTitle,
  isLikelyListicleOrAggregator,
  mapSearchHitToDiscoveryResult,
} from './web-search.mapper';

const EDUMARKET_FIXTURE = `
## مدارس الدكتور نرمين إسماعيل في الشروق NIS
مدرسة دولية في الشروق.
### معلومات التواصل مع NIS
- الموقع الإلكتروني: nis-egypt.com/enis
- الإيميل: info@nis-egypt.com

## مدرسة IPS El Shorouk – International Public School
مدرسة دولية.
### معلومات التواصل مع IPS
- الهاتف: 01128976508
- الإيميل: ipselsherouk@gmail.com

## مدرسة Helsinki Semi International School
- الهاتف: 01201144449
- الإيميل: Hr@helsinkischools.net

## The British School of Elite Education
- الإيميل: admission@bsee-eg.com
- الخط الساخن: 17131
- الموقع الإلكتروني: bsee-eg.com

## Dover International School
- الهاتف: 01000028264
- الإيميل: Admissions@daisegy.com
- الموقع الإلكتروني: daisegy.com
`;

describe('candidate extraction / mapper', () => {
  it('maps valid hit', () => {
    const result = mapSearchHitToDiscoveryResult(
      { title: 'Cairo British School', url: 'https://cbs.edu.eg', snippet: 'IB' },
      'British schools Cairo Egypt',
      'WEB_SEARCH',
    );
    expect(result?.domain).toBe('cbs.edu.eg');
    expect(result?.sourceType).toBe(PartnershipResearchSourceType.OFFICIAL_WEBSITE);
  });

  it('rejects missing title/url and malformed url', () => {
    expect(
      mapSearchHitToDiscoveryResult({ title: '', url: 'https://a.test' }, 'q', 'WEB_SEARCH'),
    ).toBeNull();
    expect(
      mapSearchHitToDiscoveryResult({ title: 'A', url: 'not-a-url' }, 'q', 'WEB_SEARCH'),
    ).toBeNull();
  });

  it('detects listicle and directory including Arabic', () => {
    expect(isLikelyListicleOrAggregator('Top 10 International Schools in Cairo')).toBe(true);
    expect(isGenericListTitle('أفضل مدارس الشروق 2025: افضل المدارس الدولية واللغات في مدينة الشروق')).toBe(
      true,
    );
    expect(isLikelyListicleOrAggregator('Some School', 'edarabia.com')).toBe(true);
    expect(isLikelyListicleOrAggregator('Cairo School', 'cairo-school.edu.eg')).toBe(false);
  });

  it('cleans title noise', () => {
    expect(cleanInstitutionTitle('Example School | Official Site')).toBe('Example School');
    expect(cleanInstitutionTitle('Alpha Language Schools - Egypt Directory')).toBe(
      'Alpha Language Schools',
    );
  });

  it('treats kidsdirectory /ad/ pages as directory listing profiles', () => {
    const discovery: DiscoveryResult = {
      provider: 'WEB_SEARCH',
      query: 'schools El Obour Egypt',
      title: 'Alpha Language Schools - Egypt Directory',
      url: 'https://kidsdirectory.com.eg/ad/alpha-language-schools-in-el-obour/',
      snippet: 'Alpha Language Schools in El Obour',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'kidsdirectory.com.eg',
    };
    expect(classifyDiscoverySource(discovery)).toBe('DIRECTORY_LISTING');

    const html = `
      <h1>Alpha Language Schools</h1>
      <h3>Call us</h3><a href="tel:01068842221">01068842221</a>
      <h3>E-mail</h3><a href="mailto:agibrahim00@gmail.com">agibrahim00@gmail.com</a>
      <h3>City/Area</h3><li>Cairo , El Obour</li>
      <h3>Website</h3><a href="https://www.facebook.com/alphaschools.education/">fb</a>
    `;
    const drafts = extractCandidatesFromDiscovery(discovery, html);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].discoveredName).toBe('Alpha Language Schools');
    expect(drafts[0].email).toBe('agibrahim00@gmail.com');
    expect(drafts[0].phone).toContain('01068842221');
    expect(drafts[0].sourceUrl).toContain('kidsdirectory.com.eg/ad/');
    // Directory page must NOT become the school website
    expect(drafts[0].website ?? '').not.toContain('kidsdirectory.com.eg');
    expect(drafts[0].facebook).toMatch(/facebook\.com\/alphaschools/i);
  });

  it('keeps kidsdirectory category pages as discovery sources', () => {
    const discovery: DiscoveryResult = {
      provider: 'WEB_SEARCH',
      query: 'schools El Shorouk',
      title: 'Schools in El Shorouk city',
      url: 'https://kidsdirectory.com.eg/ad-category/schools/in-el-shrouk-city/',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'kidsdirectory.com.eg',
    };
    expect(classifyDiscoverySource(discovery)).toBe('DISCOVERY_SOURCE');
  });

  it('extracts institution candidate with evidence and tech signals', () => {
    const discovery: DiscoveryResult = {
      provider: 'WEB_SEARCH',
      query: 'STEM schools Cairo Egypt',
      title: 'Example International School | Home',
      url: 'https://example-school.test/about',
      snippet: 'Coding robotics STEM AI programs',
      sourceType: PartnershipResearchSourceType.OFFICIAL_WEBSITE,
      discoveredAt: new Date(),
      domain: 'example-school.test',
    };
    const drafts = extractCandidatesFromDiscovery(discovery);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].discoveredName).toBe('Example International School');
    expect(drafts[0].website).toContain('example-school.test');
    expect(drafts[0].signals.hasStem).toBe(true);
    expect(drafts[0].signals.hasCoding).toBe(true);
    expect(drafts[0].evidence.some((e) => e.field === 'name')).toBe(true);
    expect(drafts[0].skipAsInstitution).toBe(false);
  });

  it('does not create an institution from a generic article title alone', () => {
    const discovery: DiscoveryResult = {
      provider: 'WEB_SEARCH',
      query: 'international schools El Shorouk',
      title: 'أفضل مدارس الشروق 2025: افضل المدارس الدولية واللغات في مدينة الشروق',
      url: 'https://edumarket.io/blog/best-schools-shorouk',
      snippet: 'دليل مدارس',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'edumarket.io',
    };
    expect(classifyDiscoverySource(discovery)).toBe('DISCOVERY_SOURCE');
    const drafts = extractCandidatesFromDiscovery(discovery);
    expect(drafts).toHaveLength(0);
  });

  it('extracts multiple institutions from EduMarket-style article content', () => {
    const sourceUrl = 'https://edumarket.io/blog/best-schools-shorouk-2025';
    const institutions = extractInstitutionsFromArticleContent(
      EDUMARKET_FIXTURE,
      sourceUrl,
      PartnershipResearchSourceType.PUBLIC_DIRECTORY,
    );
    expect(institutions.length).toBeGreaterThanOrEqual(5);

    const nis = institutions.find((i) => /NIS/i.test(i.discoveredName));
    const ips = institutions.find((i) => /IPS/i.test(i.discoveredName));
    const dover = institutions.find((i) => /Dover/i.test(i.discoveredName));

    expect(nis?.email).toBe('info@nis-egypt.com');
    expect(nis?.website).toMatch(/nis-egypt\.com/i);
    expect(ips?.email).toBe('ipselsherouk@gmail.com');
    expect(ips?.phone).toContain('01128976508');
    expect(dover?.email?.toLowerCase()).toBe('admissions@daisegy.com');

    // Contact association: NIS email must not equal IPS email
    expect(nis?.email).not.toBe(ips?.email);
  });

  it('keeps sourceUrl distinct from institution website', () => {
    const sourceUrl = 'https://edumarket.io/blog/example';
    const discovery: DiscoveryResult = {
      provider: 'WEB_SEARCH',
      query: 'schools',
      title: 'أفضل مدارس الشروق 2025',
      url: sourceUrl,
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'edumarket.io',
    };
    const drafts = extractCandidatesFromDiscovery(discovery, EDUMARKET_FIXTURE);
    expect(drafts.length).toBeGreaterThanOrEqual(5);
    for (const draft of drafts) {
      expect(draft.sourceUrl).toBe(sourceUrl);
      if (draft.website) {
        expect(draft.website).not.toBe(sourceUrl);
        expect(draft.website).not.toMatch(/edumarket\.io/i);
      }
    }
    const nis = drafts.find((d) => /NIS/i.test(d.discoveredName));
    expect(nis?.website).toMatch(/nis-egypt\.com/i);
  });

  it('drops name-only listing stubs without contacts (insufficient evidence)', () => {
    const text = `
## NIS International School
A short description.

## IPS El Shorouk School
Another school.

## Dover International School
Third school.
`;
    const institutions = extractInstitutionsFromArticleContent(
      text,
      'https://kidsdirectory.com.eg/ad-category/schools/in-el-shrouk-city/',
    );
    expect(institutions).toHaveLength(0);
  });

  it('does not carry contacts across section boundaries', () => {
    const text = `
## Alpha British School
- الإيميل: alpha@school.test
- الهاتف: 01000000001

## Beta American School
- الإيميل: beta@school.test
- الهاتف: 01000000002
`;
    const institutions = extractInstitutionsFromArticleContent(
      text,
      'https://example.com/blog/list',
    );
    expect(institutions).toHaveLength(2);
    expect(institutions[0].email).toBe('alpha@school.test');
    expect(institutions[1].email).toBe('beta@school.test');
    expect(institutions[0].phone).toContain('01000000001');
    expect(institutions[1].phone).toContain('01000000002');
  });
});
