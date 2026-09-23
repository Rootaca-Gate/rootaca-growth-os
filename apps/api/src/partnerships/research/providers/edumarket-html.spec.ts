import * as fs from 'fs';
import * as path from 'path';
import {
  classifyDiscoverySource,
  extractCandidatesFromDiscovery,
} from './candidate-extract';
import { PartnershipResearchSourceType } from '@prisma/client';

describe('EduMarket real HTML fixture', () => {
  const htmlPath = path.join(__dirname, 'fixtures', 'edumarket-shorouk.html');
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

  it('extracts many schools from real EduMarket Shorouk guide HTML', () => {
    expect(html.length).toBeGreaterThan(10_000);

    const discovery = {
      provider: 'WEB_SEARCH',
      query: 'international schools El Shorouk Egypt',
      title: 'أفضل مدارس الشروق 2025: افضل المدارس الدولية واللغات في مدينة الشروق',
      url: 'https://edumarket.io/blog/دليل-مدارس-الشروق/',
      snippet: 'دليل مدارس الشروق',
      sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
      discoveredAt: new Date(),
      domain: 'edumarket.io',
    };

    expect(classifyDiscoverySource(discovery)).toBe('DISCOVERY_SOURCE');
    const drafts = extractCandidatesFromDiscovery(discovery, html);

    // Must NOT be a single fake article-title candidate
    expect(drafts.every((d) => !/أفضل مدارس الشروق/.test(d.discoveredName))).toBe(true);
    expect(drafts.every((d) => !/FAQ|Frequently Asked|المصروفات تبدأ|Logistics|Tech Revolution/i.test(d.discoveredName))).toBe(true);
    expect(drafts.length).toBeGreaterThanOrEqual(5);

    const nis = drafts.find((d) => /NIS|Nermien|نرمين/i.test(d.discoveredName));
    const ips = drafts.find((d) => /IPS/i.test(d.discoveredName));
    const dover = drafts.find((d) => /Dover/i.test(d.discoveredName));

    expect(nis).toBeDefined();
    expect(ips).toBeDefined();
    expect(dover).toBeDefined();

    expect(nis?.email?.toLowerCase()).toBe('info@nis-egypt.com');
    expect(nis?.website).toMatch(/nis-egypt\.com/i);
    expect(nis?.sourceUrl).toContain('edumarket.io');
    expect(nis?.website).not.toContain('edumarket.io');

    expect(ips?.email?.toLowerCase()).toBe('ipselsherouk@gmail.com');
    expect(nis?.email).not.toBe(ips?.email);
  });
});
