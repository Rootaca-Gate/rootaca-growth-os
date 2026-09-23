import { PartnershipResearchSourceType } from '@prisma/client';
import { isValidEmailFormat, normalizeEmail } from '../../common/partnership.normalize';
import { extractPublicListingFields } from './candidate-extract';
import type { ResearchDiscoveryConfig } from './discovery.config';
import { assertResolvedPublicHost, assertSafePublicHttpUrl } from './ssrf';

export type WebsiteEnrichment = {
  email?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  signals: {
    hasCoding?: boolean;
    hasRobotics?: boolean;
    hasStem?: boolean;
    hasAi?: boolean;
    hasTechClub?: boolean;
    hasAfterSchool?: boolean;
    hasSummerCamp?: boolean;
    hasMakerspace?: boolean;
  };
  evidence: Array<{
    field: string;
    value: string;
    sourceUrl: string;
    sourceType: PartnershipResearchSourceType;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
};

const CONTACT_PATHS = [
  '/',
  '/contact',
  '/contact-us',
  '/contactus',
  '/admissions',
  '/about',
  '/about-us',
  '/en/contact',
  '/ar/contact',
];

const JUNK_EMAIL_RE =
  /(?:noreply|no-reply|donotreply|privacy|sentry|wixpress|example\.com|cloudflare|schema\.org|wordpress|sentry\.io)/i;

/**
 * Controlled public-page enrichment.
 * Official-website contact scrape is always available for known URLs.
 * Multi-path crawl still respects RESEARCH_ENRICHMENT_ENABLED when used via enrich().
 */
export class WebsiteEnrichmentService {
  constructor(
    private readonly config: ResearchDiscoveryConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  /**
   * SSRF-safe public HTML fetch for discovery-source article parsing.
   * Always available (not gated by RESEARCH_ENRICHMENT_ENABLED).
   */
  async fetchPublicHtml(url: string): Promise<string | null> {
    try {
      const safe = assertSafePublicHttpUrl(url);
      await assertResolvedPublicHost(safe.hostname);
      // Discovery articles are often larger than contact pages — allow up to 500KB.
      return await this.fetchText(safe.toString(), Math.max(this.config.maxBytesPerPage, 500_000));
    } catch {
      return null;
    }
  }

  /**
   * Always-on contact scrape for a known official website.
   * Tries homepage + common contact paths. Never invents values.
   */
  async enrichOfficialContacts(websiteUrl: string): Promise<WebsiteEnrichment | null> {
    let base: URL;
    try {
      base = assertSafePublicHttpUrl(websiteUrl);
      await assertResolvedPublicHost(base.hostname);
    } catch {
      return null;
    }

    const enrichment: WebsiteEnrichment = { signals: {}, evidence: [] };
    const maxPages = Math.max(2, this.config.maxPagesPerCandidate || 2);
    const paths = CONTACT_PATHS.slice(0, Math.min(maxPages, CONTACT_PATHS.length));

    for (const path of paths) {
      if (enrichment.email && enrichment.phone) break;
      const target = new URL(path, base);
      try {
        assertSafePublicHttpUrl(target.toString());
        await assertResolvedPublicHost(target.hostname);
        const html = await this.fetchText(target.toString());
        if (!html) continue;
        this.applyHtml(html, target.toString(), enrichment);
      } catch {
        // Skip failed pages; enrichment is best-effort.
      }
    }

    return enrichment.evidence.length > 0 || enrichment.email || enrichment.phone
      ? enrichment
      : null;
  }

  async enrich(websiteUrl: string): Promise<WebsiteEnrichment | null> {
    // Prefer always-on official contact scrape; gated flag only expands path budget historically.
    if (!this.config.enrichmentEnabled && this.config.maxPagesPerCandidate <= 0) {
      return this.enrichOfficialContacts(websiteUrl);
    }
    return this.enrichOfficialContacts(websiteUrl);
  }

  private async fetchText(url: string, maxBytes = this.config.maxBytesPerPage): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.enrichmentTimeoutMs);
    try {
      const response = await this.fetchImpl(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'RootacaResearchBot/1.0 (+https://rootaca.com; institutional research)',
        },
      });
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type') ?? '';
      if (
        contentType &&
        !contentType.includes('text/html') &&
        !contentType.includes('xhtml') &&
        !contentType.includes('text/plain')
      ) {
        return null;
      }
      const buffer = await response.arrayBuffer();
      // Truncate oversized pages instead of discarding — contact info is usually near the top/footer.
      const slice = buffer.byteLength > maxBytes ? buffer.slice(0, maxBytes) : buffer;
      return new TextDecoder('utf-8', { fatal: false }).decode(slice);
    } finally {
      clearTimeout(timer);
    }
  }

  private applyHtml(html: string, sourceUrl: string, out: WebsiteEnrichment): void {
    const listing = extractPublicListingFields(html, sourceUrl);

    if (!out.email && listing.email) {
      const email = normalizeEmail(listing.email);
      if (email && isValidEmailFormat(email) && !JUNK_EMAIL_RE.test(email)) {
        out.email = email;
        out.evidence.push({
          field: 'email',
          value: email,
          sourceUrl,
          sourceType: PartnershipResearchSourceType.OFFICIAL_WEBSITE,
          confidence: 'HIGH',
        });
      }
    }

    if (!out.phone && listing.phone) {
      const cleaned = listing.phone.replace(/\s+/g, ' ').trim();
      if (cleaned.replace(/\D/g, '').length >= 8) {
        out.phone = cleaned;
        out.evidence.push({
          field: 'phone',
          value: cleaned,
          sourceUrl,
          sourceType: PartnershipResearchSourceType.OFFICIAL_WEBSITE,
          confidence: 'HIGH',
        });
      }
    }

    if (!out.facebook && listing.facebook) {
      out.facebook = listing.facebook;
      out.evidence.push({
        field: 'facebook',
        value: listing.facebook,
        sourceUrl,
        sourceType: PartnershipResearchSourceType.PUBLIC_SOCIAL_PAGE,
        confidence: 'MEDIUM',
      });
    }
    if (!out.instagram && listing.instagram) {
      out.instagram = listing.instagram;
      out.evidence.push({
        field: 'instagram',
        value: listing.instagram,
        sourceUrl,
        sourceType: PartnershipResearchSourceType.PUBLIC_SOCIAL_PAGE,
        confidence: 'MEDIUM',
      });
    }

    const lower = html.toLowerCase();
    const signalMap: Array<[keyof WebsiteEnrichment['signals'], RegExp]> = [
      ['hasCoding', /coding|programming|برمجة/],
      ['hasRobotics', /robotics?|روبوت/],
      ['hasStem', /\bstem\b/],
      ['hasAi', /artificial intelligence|\bai\b|ذكاء اصطناعي/],
      ['hasTechClub', /tech club|technology club/],
      ['hasAfterSchool', /after[\s-]?school/],
      ['hasSummerCamp', /summer camp|summer program/],
      ['hasMakerspace', /makerspace|fab lab/],
    ];
    for (const [key, re] of signalMap) {
      if (re.test(lower) && !out.signals[key]) {
        out.signals[key] = true;
        out.evidence.push({
          field: key,
          value: 'true',
          sourceUrl,
          sourceType: PartnershipResearchSourceType.OFFICIAL_WEBSITE,
          confidence: 'MEDIUM',
        });
      }
    }
  }
}
