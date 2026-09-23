import { PartnershipResearchSourceType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  classifyCandidateQuality,
  normalizeInstitutionDisplayName,
} from './candidate-quality';
import {
  extractCandidatesFromDiscovery,
  extractInstitutionsFromArticleContent,
  lastExtractionQualityStats,
} from './candidate-extract';

describe('candidate quality gate', () => {
  it('Test 1 — rejects price heading', () => {
    expect(
      classifyCandidateQuality({
        name: 'المصروفات تبدأ من 110,000 ج.م (/british-school-of-elite-education/)',
      }),
    ).toBe('INVALID_NON_INSTITUTION');
  });

  it('Test 2 — rejects FAQ', () => {
    expect(classifyCandidateQuality({ name: 'Frequently Asked Questions (FAQ)' })).toBe(
      'INVALID_NON_INSTITUTION',
    );
  });

  it('Test 3 — rejects logistics article section', () => {
    expect(
      classifyCandidateQuality({
        name: 'Logistics: LRT Access, Suez Road, and School Bus Safety',
      }),
    ).toBe('INVALID_NON_INSTITUTION');
  });

  it('Test 4 — rejects article sentence / topic heading', () => {
    expect(
      classifyCandidateQuality({
        name: 'The 2026 Tech Revolution: Schools with AI & Coding Labs',
      }),
    ).toBe('INVALID_NON_INSTITUTION');
  });

  it('Test 5 — accepts valid school with contact evidence', () => {
    expect(
      classifyCandidateQuality({
        name: 'British School of Elite Education',
        email: 'admission@bsee-eg.com',
        phone: '17131',
        website: 'https://bsee-eg.com',
        address: 'El Shorouk City',
        body: 'Address: El Shorouk\nHotline: 17131\nEmail: admission@bsee-eg.com\nWebsite: bsee-eg.com\nCurriculum: British',
      }),
    ).toBe('VALID_INSTITUTION');
  });

  it('Test 6 — numbered institution valid when section has contact evidence', () => {
    const raw = '3. Nermien Ismail Schools (NIS) – Shorouk Campus';
    expect(normalizeInstitutionDisplayName(raw)).toBe(
      'Nermien Ismail Schools (NIS) – Shorouk Campus',
    );
    expect(classifyCandidateQuality({ name: raw })).toBe('INSUFFICIENT_EVIDENCE');
    expect(
      classifyCandidateQuality({
        name: raw,
        email: 'info@nis-egypt.com',
        website: 'https://nis-egypt.com',
        body: 'Email: info@nis-egypt.com\nWebsite: nis-egypt.com\nAddress: El Shorouk',
      }),
    ).toBe('VALID_INSTITUTION');
  });

  it('rejects name-only directory listing stubs (no contacts)', () => {
    expect(
      classifyCandidateQuality({
        name: 'Dover American International School (DAIS)',
      }),
    ).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('Test 7 — same-source EN/AR aliases collapse to one candidate', () => {
    const article = `
## Renaissance International School of Egypt
Website: https://www.risegypt.com
Address: El Shorouk City, Cairo
Email: info@risegypt.com
Phone: 02 12345678

## مدرسة رينيسانس الدولية
Website: https://www.risegypt.com
Address: El Shorouk City, Cairo
Email: info@risegypt.com
`;
    const items = extractInstitutionsFromArticleContent(
      article,
      'https://edumarket.io/blog/example/',
      PartnershipResearchSourceType.PUBLIC_DIRECTORY,
    );
    expect(items).toHaveLength(1);
    expect(items[0].discoveredName).toMatch(/Renaissance|رينيسانس/i);
    expect(items[0].website).toMatch(/risegypt\.com/i);
  });

  it('Test 8 — EduMarket fixture: real schools, zero noise headings', () => {
    const htmlPath = path.join(__dirname, 'fixtures', 'edumarket-shorouk.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const discovery = {
      provider: 'WEB_SEARCH',
      query: 'international schools El Shorouk Egypt',
      title: 'أفضل مدارس الشروق 2025',
      url: 'https://edumarket.io/blog/دليل-مدارس-الشروق/',
      snippet: 'دليل مدارس الشروق',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'edumarket.io',
    };

    const drafts = extractCandidatesFromDiscovery(discovery, html);
    expect(drafts.length).toBeGreaterThanOrEqual(5);
    expect(lastExtractionQualityStats.rejectedNonInstitution).toBeGreaterThan(0);

    const names = drafts.map((d) => d.discoveredName);
    expect(names.every((n) => !/faq|frequently asked/i.test(n))).toBe(true);
    expect(names.every((n) => !/المصروفات\s*تبدأ/i.test(n))).toBe(true);
    expect(names.every((n) => !/logistics/i.test(n))).toBe(true);
    expect(names.every((n) => !/tech revolution/i.test(n))).toBe(true);
    expect(names.every((n) => !/أفضل مدارس الشروق/i.test(n))).toBe(true);

    const nis = drafts.find((d) => /NIS|Nermien|نرمين/i.test(d.discoveredName));
    expect(nis).toBeDefined();
    expect(nis?.sourceUrl).toContain('edumarket.io');
    expect(nis?.website).toMatch(/nis-egypt\.com/i);
    expect(nis?.website).not.toContain('edumarket.io');
    expect(nis?.email?.toLowerCase()).toBe('info@nis-egypt.com');
  });

  it('rejects link/CTA stubs mistaken for institutions', () => {
    expect(
      classifyCandidateQuality({
        name: 'Details (https://kidsdirectory.com.eg/ad/sama-international-college/)',
      }),
    ).toBe('INVALID_NON_INSTITUTION');
  });
});
