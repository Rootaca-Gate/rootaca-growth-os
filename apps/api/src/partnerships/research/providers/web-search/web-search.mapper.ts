import { PartnershipResearchSourceType } from '@prisma/client';
import { normalizeWebsiteDomain } from '../../../common/partnership.normalize';
import type { DiscoveryResult } from '../discovery.provider';
import type { RawSearchHit } from './web-search.types';

const DIRECTORY_HOST_PARTS = [
  'google.',
  'bing.com',
  'yahoo.com',
  'duckduckgo.',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'tiktok.com',
  'wikipedia.org',
  'tripadvisor.',
  'yelp.',
  'yellowpages',
  'edarabia.com',
  'edumarket.',
  'kidsdirectory.',
  'whichschooladvisor.com',
  'schoolandcollegelistings',
  'bayut.com',
  'propertyfinder.',
  'hotfrog.',
  'cylex.',
];

const LISTICLE_TITLE =
  /\b(top\s+\d+|best\s+\d+|list of|ranking|compare|vs\.?|directory|guide to|school guide|schools?\s+in\b)\b|أفضل\s+مدارس|أفضل\s+مدرسة|افضل\s+مدارس|افضل\s+مدرسة|دليل\s+مدارس|دليل\s+مدرسة/i;

const DISCOVERY_PATH =
  /\/(blog|article|articles|news|category|categories|ad-category|tag|tags|guide|guides|best-|top-|listing|directory)\b/i;

/** Single school/business listing detail pages on directory hosts (not category lists). */
const DIRECTORY_DETAIL_PATH = /\/ad\/[a-z0-9][a-z0-9-]{2,}\/?$/i;

export function mapSearchHitToDiscoveryResult(
  hit: RawSearchHit,
  query: string,
  providerName: string,
): DiscoveryResult | null {
  const title = hit.title?.trim();
  const url = hit.url?.trim();
  if (!title || title.length < 2 || !url) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const domain = normalizeWebsiteDomain(url) ?? undefined;
  const sourceType = classifySourceType(domain, parsed.hostname, url, title);

  return {
    provider: providerName,
    query,
    title,
    url,
    snippet: hit.snippet?.trim() || undefined,
    sourceType,
    discoveredAt: new Date(),
    domain,
  };
}

export function classifySourceType(
  domain: string | undefined,
  hostname: string,
  url?: string,
  title?: string,
): string {
  const host = (domain ?? hostname).toLowerCase();
  if (host.includes('facebook.com') || host.includes('instagram.com') || host.includes('linkedin.com')) {
    return PartnershipResearchSourceType.PUBLIC_SOCIAL_PAGE;
  }
  if (host.includes('maps.google') || host.includes('goo.gl/maps')) {
    return PartnershipResearchSourceType.PUBLIC_MAPS_LISTING;
  }
  if (host.endsWith('.gov.eg') || host.includes('moe.gov') || host.includes('emis.')) {
    return PartnershipResearchSourceType.GOVERNMENT_LISTING;
  }
  if (
    DIRECTORY_HOST_PARTS.some((part) => host.includes(part)) ||
    (url && isDiscoverySourceUrl(url)) ||
    (title && isGenericListTitle(title))
  ) {
    return PartnershipResearchSourceType.PUBLIC_DIRECTORY;
  }
  if (host.endsWith('.edu.eg') || host.endsWith('.sch.eg') || host.includes('school')) {
    return PartnershipResearchSourceType.OFFICIAL_WEBSITE;
  }
  return PartnershipResearchSourceType.SEARCH_ENGINE;
}

export function isLikelyListicleOrAggregator(title: string, domain?: string): boolean {
  if (isGenericListTitle(title) || LISTICLE_TITLE.test(title)) return true;
  if (!domain) return false;
  return DIRECTORY_HOST_PARTS.some((part) => domain.includes(part));
}

/**
 * KidsDirectory (and similar) single-institution listing pages that contain
 * school details (phone, email, address) — not category aggregators.
 */
export function isDirectoryListingDetailUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('kidsdirectory.')) {
      return false;
    }
    return DIRECTORY_DETAIL_PATH.test(parsed.pathname);
  } catch {
    return false;
  }
}

/** Article/list/guide URL paths — discovery sources, not institution websites. */
export function isDiscoverySourceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (isDirectoryListingDetailUrl(url)) {
      return false;
    }
    if (DIRECTORY_HOST_PARTS.some((part) => parsed.hostname.includes(part))) {
      // Directory hosts: category/list paths are discovery; unknown paths default to discovery
      // except explicit single-ad detail pages (handled above).
      return true;
    }
    return DISCOVERY_PATH.test(parsed.pathname);
  } catch {
    return DISCOVERY_PATH.test(url);
  }
}

/**
 * Generic list/article titles that must never become institution names.
 */
export function isGenericListTitle(title: string): boolean {
  const t = title.trim();
  if (!t) return true;
  if (LISTICLE_TITLE.test(t)) return true;
  if (/أفضل|افضل/.test(t) && /مدارس|مدرسة/.test(t)) return true;
  if (/دليل/.test(t) && /مدارس|مدرسة/.test(t)) return true;
  if (/\b(top|best)\b/i.test(t) && /\bschools?\b/i.test(t)) return true;
  if (/^مدارس\s+(الشروق|القاهرة|الجيزة|الإسكندرية|اكتوبر|أكتوبر)\b/i.test(t) && t.length < 40) {
    return true;
  }
  if (/\bschools?\s+in\s+/i.test(t) && !/\b(international|british|american)\s+school\b/i.test(t)) {
    return true;
  }
  return false;
}

export function cleanInstitutionTitle(title: string): string {
  return title
    .replace(/\s*[\|\-–—]\s*(home|official\s*site|official\s*website|facebook|instagram|linkedin|egypt\s*directory).*$/i, '')
    .replace(/\s*[-–—]\s*Egypt Directory\s*$/i, '')
    .replace(/\s*\(\s*egypt\s*\)\s*$/i, '')
    .trim();
}
