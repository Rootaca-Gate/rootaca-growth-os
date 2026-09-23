import { DiscoveryProviderError } from '../discovery.errors';
import type { ResearchDiscoveryConfig } from '../discovery.config';
import type {
  BraveSearchResponse,
  RawSearchHit,
  SerperSearchResponse,
} from './web-search.types';

export type WebSearchClientOptions = {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * HTTP client for configured WEB_SEARCH engines (Serper / Brave).
 * Never logs or returns the API key.
 */
export class WebSearchClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly config: ResearchDiscoveryConfig,
    options: WebSearchClientOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep =
      options.sleep ??
      ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async search(query: string, maxResults: number, language?: string): Promise<RawSearchHit[]> {
    if (!this.config.apiKey) {
      throw new DiscoveryProviderError(
        'NOT_CONFIGURED',
        'Research discovery provider is not configured.',
      );
    }

    let attempt = 0;
    let lastError: DiscoveryProviderError | undefined;

    while (attempt <= this.config.maxRetries) {
      try {
        return await this.executeOnce(query, maxResults, language);
      } catch (error) {
        const mapped = this.mapError(error);
        lastError = mapped;
        if (!mapped.retryable || attempt >= this.config.maxRetries) {
          throw mapped;
        }
        const backoff = Math.min(8000, 400 * 2 ** attempt);
        await this.sleep(backoff);
        attempt += 1;
      }
    }

    throw lastError ?? new DiscoveryProviderError('PROVIDER_ERROR', 'Search failed');
  }

  private async executeOnce(
    query: string,
    maxResults: number,
    language?: string,
  ): Promise<RawSearchHit[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      if (this.config.engine === 'brave') {
        return await this.searchBrave(query, maxResults, language, controller.signal);
      }
      return await this.searchSerper(query, maxResults, language, controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }

  private async searchSerper(
    query: string,
    maxResults: number,
    language: string | undefined,
    signal: AbortSignal,
  ): Promise<RawSearchHit[]> {
    const response = await this.fetchImpl(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.config.apiKey!,
      },
      body: JSON.stringify({
        q: query,
        num: Math.min(Math.max(maxResults, 1), 50),
        gl: 'eg',
        hl: language === 'ar' ? 'ar' : 'en',
      }),
      signal,
    });

    await this.assertOk(response);
    const body = (await response.json()) as SerperSearchResponse;
    if (!body || !Array.isArray(body.organic)) {
      throw new DiscoveryProviderError(
        'INVALID_RESPONSE',
        'Serper response missing organic results',
        { statusCode: response.status },
      );
    }

    return body.organic
      .filter((item) => item.title && item.link)
      .slice(0, maxResults)
      .map((item, index) => ({
        title: String(item.title).trim(),
        url: String(item.link).trim(),
        snippet: item.snippet?.trim() || undefined,
        rank: item.position ?? index + 1,
      }));
  }

  private async searchBrave(
    query: string,
    maxResults: number,
    language: string | undefined,
    signal: AbortSignal,
  ): Promise<RawSearchHit[]> {
    const url = new URL(this.config.apiUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(Math.min(Math.max(maxResults, 1), 20)));
    if (language === 'ar') {
      url.searchParams.set('search_lang', 'ar');
    }
    url.searchParams.set('country', 'EG');

    const response = await this.fetchImpl(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': this.config.apiKey!,
      },
      signal,
    });

    await this.assertOk(response);
    const body = (await response.json()) as BraveSearchResponse;
    const results = body?.web?.results;
    if (!Array.isArray(results)) {
      throw new DiscoveryProviderError(
        'INVALID_RESPONSE',
        'Brave response missing web.results',
        { statusCode: response.status },
      );
    }

    return results
      .filter((item) => item.title && item.url)
      .slice(0, maxResults)
      .map((item, index) => ({
        title: String(item.title).trim(),
        url: String(item.url).trim(),
        snippet: item.description?.trim() || undefined,
        rank: index + 1,
      }));
  }

  private async assertOk(response: Response): Promise<void> {
    if (response.ok) return;

    const status = response.status;
    if (status === 401 || status === 403) {
      throw new DiscoveryProviderError(
        'AUTHENTICATION_ERROR',
        'Provider authentication failed',
        { statusCode: status },
      );
    }
    if (status === 429) {
      throw new DiscoveryProviderError('RATE_LIMITED', 'Provider rate limited', {
        statusCode: status,
        retryable: true,
      });
    }
    if (status === 502 || status === 503 || status === 504) {
      throw new DiscoveryProviderError('PROVIDER_ERROR', `Provider HTTP ${status}`, {
        statusCode: status,
        retryable: true,
      });
    }
    if (status >= 400 && status < 500) {
      throw new DiscoveryProviderError('PROVIDER_ERROR', `Provider HTTP ${status}`, {
        statusCode: status,
        retryable: false,
      });
    }
    throw new DiscoveryProviderError('PROVIDER_ERROR', `Provider HTTP ${status}`, {
      statusCode: status,
      retryable: true,
    });
  }

  private mapError(error: unknown): DiscoveryProviderError {
    if (error instanceof DiscoveryProviderError) return error;
    if (error instanceof Error && error.name === 'AbortError') {
      return new DiscoveryProviderError('TIMEOUT', 'Request timed out', { retryable: true });
    }
    return new DiscoveryProviderError('NETWORK_ERROR', 'Network error talking to provider', {
      retryable: true,
      cause: error,
    });
  }
}
