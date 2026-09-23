import type { DiscoveryResult, DiscoverySearchOptions, ResearchDiscoveryProvider } from '../discovery.provider';
import { OverpassClient } from './overpass.client';
import { OverpassError } from './overpass.errors';
import { mapOverpassElements } from './overpass.mapper';
import {
  buildOverpassFallbackQueries,
  buildOverpassSchoolQuery,
} from './overpass.query-builder';
import type { OverpassConfig, OverpassGeoTarget, OverpassMappedSchool } from './overpass.types';

export type OverpassSearchOptions = DiscoverySearchOptions & {
  governorate?: string | null;
  city?: string | null;
  district?: string | null;
};

/**
 * FREE OpenStreetMap / Overpass discovery provider.
 * No API key. Structured amenity=school POI discovery.
 */
export class OverpassDiscoveryProvider implements ResearchDiscoveryProvider {
  readonly kind = 'OVERPASS' as const;
  private readonly client: OverpassClient;
  private readonly cache = new Map<string, { at: number; results: DiscoveryResult[] }>();

  constructor(
    private readonly config: OverpassConfig,
    client?: OverpassClient,
  ) {
    this.client = client ?? new OverpassClient(config);
  }

  get available(): boolean {
    return this.config.enabled && this.config.configured;
  }

  /**
   * `query` is used as a cache / label key. Geographic filters come from options.
   * Prefer discoverByGeo() for structured area search.
   */
  async search(query: string, options: OverpassSearchOptions): Promise<DiscoveryResult[]> {
    if (!this.available) {
      throw new OverpassError('NOT_CONFIGURED', 'Overpass provider is disabled or not configured.');
    }

    const target: OverpassGeoTarget = {
      governorate: options.governorate ?? null,
      city: options.city ?? null,
      district: options.district ?? null,
    };

    // If no geo on options, treat query as city/governorate hint (escaped inside builder)
    if (!target.governorate && !target.city && !target.district && query.trim()) {
      target.city = query.trim();
    }

    return this.discoverByGeo(target, options.maxResults);
  }

  async discoverByGeo(
    target: OverpassGeoTarget,
    maxResults?: number,
  ): Promise<DiscoveryResult[]> {
    if (!this.available) {
      throw new OverpassError('NOT_CONFIGURED', 'Overpass provider is disabled or not configured.');
    }

    const limit = Math.min(
      Math.max(maxResults ?? this.config.maxResults, 1),
      this.config.maxResults,
    );
    const cacheKey = JSON.stringify({
      g: target.governorate ?? '',
      c: target.city ?? '',
      d: target.district ?? '',
      limit,
    });
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.at < this.config.cacheTtlMs) {
      return cached.results;
    }

    const primary = buildOverpassSchoolQuery(target, {
      timeoutSec: Math.floor(this.config.timeoutMs / 1000),
      maxResults: limit,
    });

    let schools = await this.runQuery(primary.query, limit);

    if (schools.length === 0) {
      for (const fallback of buildOverpassFallbackQueries(target, {
        timeoutSec: Math.floor(this.config.timeoutMs / 1000),
      })) {
        schools = await this.runQuery(fallback.query, limit);
        if (schools.length > 0) break;
      }
    }

    const results = schools.map((school) => this.toDiscoveryResult(school, primary.label));
    this.cache.set(cacheKey, { at: Date.now(), results });
    return results;
  }

  private async runQuery(ql: string, limit: number): Promise<OverpassMappedSchool[]> {
    const response = await this.client.query(ql);
    return mapOverpassElements(response.elements ?? [], limit);
  }

  private toDiscoveryResult(
    school: OverpassMappedSchool,
    queryLabel: string,
  ): DiscoveryResult {
    const snippetParts = [
      school.address,
      school.city,
      school.phone,
      school.website,
    ].filter(Boolean);

    return {
      provider: 'OVERPASS',
      query: queryLabel,
      title: school.name,
      url: school.osmUrl,
      snippet: snippetParts.join(' · ') || undefined,
      sourceType: 'OSM',
      discoveredAt: new Date(),
      domain: 'openstreetmap.org',
      phone: school.phone ?? undefined,
      email: school.email ?? undefined,
      address: school.address ?? undefined,
      // Extended structured fields for ingest bypass
      nameAr: school.nameAr ?? undefined,
      nameEn: school.nameEn ?? undefined,
      website: school.website ?? undefined,
      facebook: school.facebook ?? undefined,
      instagram: school.instagram ?? undefined,
      whatsapp: school.whatsapp ?? undefined,
      city: school.city ?? undefined,
      district: school.district ?? undefined,
      latitude: school.latitude ?? undefined,
      longitude: school.longitude ?? undefined,
      osmType: school.osmType,
      osmId: school.osmId,
      osmUrl: school.osmUrl,
      derivedMapsSearchUrl: school.derivedMapsSearchUrl ?? undefined,
      structured: true,
    };
  }
}

export function loadOverpassConfig(env: NodeJS.ProcessEnv = process.env): OverpassConfig {
  const enabled =
    (env.RESEARCH_OVERPASS_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
  const apiUrl =
    env.RESEARCH_OVERPASS_API_URL?.trim() || 'https://overpass-api.de/api/interpreter';
  const userAgent =
    env.RESEARCH_OVERPASS_USER_AGENT?.trim() ||
    'ROOTACA-Research/1.0 (+https://rootaca.com)';

  return {
    enabled,
    apiUrl,
    userAgent,
    timeoutMs: clampInt(env.RESEARCH_OVERPASS_TIMEOUT_MS, 30_000, 5_000, 90_000),
    maxResults: clampInt(env.RESEARCH_OVERPASS_MAX_RESULTS, 1000, 1, 2000),
    concurrency: clampInt(env.RESEARCH_OVERPASS_CONCURRENCY, 1, 1, 2),
    maxRetries: clampInt(env.RESEARCH_OVERPASS_MAX_RETRIES, 2, 0, 5),
    requestDelayMs: clampInt(env.RESEARCH_OVERPASS_REQUEST_DELAY_MS, 1500, 500, 10_000),
    cacheTtlMs: clampInt(env.RESEARCH_OVERPASS_CACHE_TTL_MS, 30 * 60_000, 0, 24 * 60 * 60_000),
    configured: enabled && Boolean(apiUrl),
  };
}

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
