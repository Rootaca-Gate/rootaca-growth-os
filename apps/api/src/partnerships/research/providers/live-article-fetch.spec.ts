import { loadResearchDiscoveryConfig } from './discovery.config';
import { extractCandidatesFromDiscovery, classifyDiscoverySource } from './candidate-extract';
import { WebsiteEnrichmentService } from './website-enrichment';
import { PartnershipResearchSourceType } from '@prisma/client';

/**
 * Live network test — skipped unless RESEARCH_LIVE_FETCH=true.
 * Validates: discovery-source URL fetch → multi-institution extraction.
 */
describe('live discovery-source fetch (optional)', () => {
  const enabled = process.env.RESEARCH_LIVE_FETCH === 'true';
  const maybeIt = enabled ? it : it.skip;

  maybeIt(
    'fetches EduMarket Shorouk guide and extracts multiple schools',
    async () => {
      const config = loadResearchDiscoveryConfig({
        RESEARCH_ENRICHMENT_ENABLED: 'false',
        RESEARCH_ENRICHMENT_MAX_BYTES: '500000',
        RESEARCH_ENRICHMENT_TIMEOUT_MS: '20000',
      });
      const enrichment = new WebsiteEnrichmentService(config);
      const url =
        'https://edumarket.io/blog/%d8%af%d9%84%d9%8a%d9%84-%d9%85%d8%af%d8%a7%d8%b1%d8%b3-%d8%a7%d9%84%d8%b4%d8%b1%d9%88%d9%82/';
      const html = await enrichment.fetchPublicHtml(url);
      expect(html).toBeTruthy();
      expect(html!.length).toBeGreaterThan(10_000);

      const discovery = {
        provider: 'WEB_SEARCH',
        query: 'international schools El Shorouk Egypt',
        title: 'أفضل مدارس الشروق 2025: افضل المدارس الدولية واللغات في مدينة الشروق',
        url,
        snippet: 'دليل',
        sourceType: PartnershipResearchSourceType.PUBLIC_DIRECTORY,
        discoveredAt: new Date(),
        domain: 'edumarket.io',
      };
      expect(classifyDiscoverySource(discovery)).toBe('DISCOVERY_SOURCE');
      const drafts = extractCandidatesFromDiscovery(discovery, html);
      expect(drafts.length).toBeGreaterThanOrEqual(5);
      expect(drafts.every((d) => !/أفضل مدارس الشروق/.test(d.discoveredName))).toBe(true);
      expect(drafts.some((d) => /NIS/i.test(d.discoveredName))).toBe(true);
    },
    30_000,
  );
});
