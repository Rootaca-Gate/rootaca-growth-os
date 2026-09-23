import type { ResearchDiscoveryConfig } from '../discovery.config';
import { DiscoveryProviderError } from '../discovery.errors';
import type { DiscoveryResult, DiscoverySearchOptions, ResearchDiscoveryProvider } from '../discovery.provider';
import { WebSearchClient } from './web-search.client';
import { mapSearchHitToDiscoveryResult } from './web-search.mapper';

/**
 * Real WEB_SEARCH discovery provider.
 * Requires RESEARCH_DISCOVERY_API_KEY. Never invents results.
 */
export class WebSearchDiscoveryProvider implements ResearchDiscoveryProvider {
  readonly kind = 'WEB_SEARCH' as const;
  private readonly client: WebSearchClient;
  private readonly cache = new Map<string, { at: number; results: DiscoveryResult[] }>();

  constructor(
    private readonly config: ResearchDiscoveryConfig,
    client?: WebSearchClient,
  ) {
    this.client = client ?? new WebSearchClient(config);
  }

  get available(): boolean {
    return this.config.webSearchConfigured;
  }

  async search(
    query: string,
    options: DiscoverySearchOptions & { language?: string },
  ): Promise<DiscoveryResult[]> {
    if (!this.available) {
      throw new DiscoveryProviderError(
        'NOT_CONFIGURED',
        'Research discovery provider is not configured.',
      );
    }

    const cacheKey = `${this.config.engine}|${options.language ?? ''}|${query}|${options.maxResults}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.at < this.config.cacheTtlMs) {
      return cached.results;
    }

    const hits = await this.client.search(query, options.maxResults, options.language);
    const results = hits
      .map((hit) => mapSearchHitToDiscoveryResult(hit, query, 'WEB_SEARCH'))
      .filter((item): item is DiscoveryResult => item != null);

    this.cache.set(cacheKey, { at: Date.now(), results });
    return results;
  }
}
