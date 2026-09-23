import { PartnershipResearchSourceType } from '@prisma/client';
import { normalizeWebsiteDomain } from '../../common/partnership.normalize';
import type { DiscoveryResult } from './discovery.provider';
import { assertResolvedPublicHost, assertSafePublicHttpUrl } from './ssrf';
import { isDirectoryListingDetailUrl } from './web-search/web-search.mapper';

export type FreeLookupHit = {
  title: string;
  url: string;
};

/**
 * Free public-page lookup for missing contacts when Serper is not configured.
 * Uses KidsDirectory search + DuckDuckGo HTML — never invents results.
 */
export class FreeContactLookupService {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = 10_000,
  ) {}

  async findCandidatePages(
    name: string,
    city?: string | null,
  ): Promise<DiscoveryResult[]> {
    const queryName = name.trim();
    if (queryName.length < 3) return [];

    const place = city?.trim() || 'Egypt';
    const hits: FreeLookupHit[] = [];

    try {
      const kd = await this.searchKidsDirectory(`${queryName} ${place}`);
      hits.push(...kd);
    } catch {
      // best-effort
    }
    // City on OSM records is often wrong/noisy — also search by name alone.
    try {
      const kdNameOnly = await this.searchKidsDirectory(queryName);
      hits.push(...kdNameOnly);
    } catch {
      // best-effort
    }

    try {
      const ddg = await this.searchDuckDuckGo(
        `"${queryName}" Egypt school (phone OR email OR website OR contact)`,
      );
      hits.push(...ddg);
    } catch {
      // best-effort
    }
    if (place && place.toLowerCase() !== 'egypt') {
      try {
        const ddgPlace = await this.searchDuckDuckGo(
          `"${queryName}" ${place} school (phone OR email OR website)`,
        );
        hits.push(...ddgPlace);
      } catch {
        // best-effort
      }
    }

    const seen = new Set<string>();
    const results: DiscoveryResult[] = [];
    const ranked = [...hits].sort(
      (a, b) => scoreNameOverlap(queryName, b.title) - scoreNameOverlap(queryName, a.title),
    );
    for (const hit of ranked) {
      let safe: URL;
      try {
        safe = assertSafePublicHttpUrl(hit.url);
        await assertResolvedPublicHost(safe.hostname);
      } catch {
        continue;
      }
      // Skip weak directory matches (e.g. unrelated ads on the same search page)
      if (
        isDirectoryListingDetailUrl(safe.toString()) &&
        scoreNameOverlap(queryName, hit.title) < 0.35
      ) {
        continue;
      }
      const key = safe.toString().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        provider: 'WEB_SEARCH',
        query: queryName,
        title: hit.title || queryName,
        url: safe.toString(),
        sourceType: isDirectoryListingDetailUrl(safe.toString())
          ? PartnershipResearchSourceType.PUBLIC_DIRECTORY
          : PartnershipResearchSourceType.SEARCH_ENGINE,
        discoveredAt: new Date(),
        domain: normalizeWebsiteDomain(safe.toString()) ?? undefined,
      });
      if (results.length >= 8) break;
    }
    return results;
  }

  private async searchKidsDirectory(query: string): Promise<FreeLookupHit[]> {
    const url = `https://kidsdirectory.com.eg/?s=${encodeURIComponent(query)}`;
    const html = await this.fetchText(url);
    if (!html) return [];
    const hits: FreeLookupHit[] = [];
    const seen = new Set<string>();

    const pushAd = (rawUrl: string, titleHint?: string) => {
      let absolute = rawUrl;
      if (rawUrl.startsWith('/')) {
        absolute = `https://kidsdirectory.com.eg${rawUrl}`;
      }
      if (!/\/ad\/[^/]+/i.test(absolute)) return;
      const key = absolute.toLowerCase().replace(/\/$/, '');
      if (seen.has(key)) return;
      seen.add(key);
      hits.push({
        url: absolute.endsWith('/') ? absolute : `${absolute}/`,
        title: (titleHint?.trim() || titleFromKidsDirectoryAdUrl(absolute)).trim(),
      });
    };

    const re =
      /href=["'](https?:\/\/(?:www\.)?kidsdirectory\.com\.eg\/ad\/[^"'#?]+\/?)["'][^>]*>\s*([^<]{0,160})/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) != null) {
      pushAd(match[1], match[2].replace(/\s+/g, ' '));
    }
    const rel = /href=["'](\/ad\/[^"'#?]+\/?)["'][^>]*>?\s*([^<]{0,160})?/gi;
    while ((match = rel.exec(html)) != null) {
      pushAd(match[1], match[2]?.replace(/\s+/g, ' '));
    }
    return hits;
  }

  private async searchDuckDuckGo(query: string): Promise<FreeLookupHit[]> {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const html = await this.fetchText(url);
    if (!html) return [];
    const hits: FreeLookupHit[] = [];
    // DDG HTML wraps redirects as //duckduckgo.com/l/?uddg=<encoded>
    const re =
      /uddg=([^&"']+)[^>]*>[\s\S]*?class="result__a"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) != null) {
      try {
        const target = decodeURIComponent(match[1]);
        const title = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (/^https?:\/\//i.test(target)) {
          hits.push({ url: target, title: title || target });
        }
      } catch {
        // skip bad encodings
      }
    }
    if (hits.length === 0) {
      const plain = /class="result__a"\s+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      while ((match = plain.exec(html)) != null) {
        hits.push({
          url: match[1],
          title: match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        });
      }
    }
    return hits;
  }

  private async fetchText(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const safe = assertSafePublicHttpUrl(url);
      await assertResolvedPublicHost(safe.hostname);
      const response = await this.fetchImpl(safe.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          Accept: 'text/html',
          'User-Agent': 'RootacaResearchBot/1.0 (+https://rootaca.com; institutional research)',
        },
      });
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      const slice = buffer.byteLength > 400_000 ? buffer.slice(0, 400_000) : buffer;
      return new TextDecoder('utf-8', { fatal: false }).decode(slice);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function titleFromKidsDirectoryAdUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const slug = path.match(/\/ad\/([^/]+)/i)?.[1];
    if (!slug) return 'KidsDirectory';
    return decodeURIComponent(slug)
      .replace(/-/g, ' ')
      .replace(/\b(in|el|al|the)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return 'KidsDirectory';
  }
}

/** Rough token overlap in [0,1] for ranking free-lookup hits. */
export function scoreNameOverlap(a: string, b: string): number {
  const tokens = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !['school', 'schools', 'international', 'language', 'مصر', 'مدرسة'].includes(t));
  const left = new Set(tokens(a));
  const right = tokens(b);
  if (left.size === 0 || right.length === 0) return 0;
  let hit = 0;
  for (const token of right) {
    if (left.has(token)) hit += 1;
  }
  return hit / Math.max(left.size, 1);
}
