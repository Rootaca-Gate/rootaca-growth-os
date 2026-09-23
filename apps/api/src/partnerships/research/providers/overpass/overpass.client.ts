import type { OverpassConfig, OverpassResponse } from './overpass.types';
import { OverpassError } from './overpass.errors';

export type OverpassClientOptions = {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * HTTP client for the public Overpass API.
 * No API key. Rate-limited, cached at provider layer, concurrency = 1 by default.
 */
export class OverpassClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private lastRequestAt = 0;

  constructor(
    private readonly config: OverpassConfig,
    options: OverpassClientOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep =
      options.sleep ??
      ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async query(ql: string): Promise<OverpassResponse> {
    if (!this.config.enabled) {
      throw new OverpassError('NOT_CONFIGURED', 'Overpass provider is disabled.');
    }

    let attempt = 0;
    let lastError: OverpassError | undefined;

    while (attempt <= this.config.maxRetries) {
      try {
        await this.throttle();
        return await this.executeOnce(ql);
      } catch (error) {
        const mapped = this.mapError(error);
        lastError = mapped;
        if (!mapped.retryable || attempt >= this.config.maxRetries) {
          throw mapped;
        }
        const backoff = Math.min(15_000, 1000 * 2 ** attempt);
        await this.sleep(backoff);
        attempt += 1;
      }
    }

    throw lastError ?? new OverpassError('PROVIDER_ERROR', 'Overpass query failed');
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    const delay = Math.max(0, this.config.requestDelayMs - elapsed);
    if (delay > 0) {
      await this.sleep(delay);
    }
    this.lastRequestAt = Date.now();
  }

  private async executeOnce(ql: string): Promise<OverpassResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const body = new URLSearchParams({ data: ql });
      const response = await this.fetchImpl(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': this.config.userAgent,
        },
        body,
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new OverpassError('RATE_LIMITED', 'Overpass rate limit reached', {
          retryable: true,
          statusCode: 429,
        });
      }
      if (response.status === 504 || response.status === 408) {
        throw new OverpassError('TIMEOUT', 'Overpass request timed out', {
          retryable: true,
          statusCode: response.status,
        });
      }
      if (!response.ok) {
        throw new OverpassError(
          'PROVIDER_ERROR',
          `Overpass HTTP ${response.status}`,
          { retryable: response.status >= 500, statusCode: response.status },
        );
      }

      const json = (await response.json()) as OverpassResponse;
      if (!json || !Array.isArray(json.elements)) {
        throw new OverpassError('INVALID_RESPONSE', 'Overpass returned invalid JSON');
      }
      return json;
    } catch (error) {
      if (error instanceof OverpassError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OverpassError('TIMEOUT', 'Overpass request timed out', {
          retryable: true,
        });
      }
      throw new OverpassError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Overpass network error',
        { retryable: true, cause: error },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private mapError(error: unknown): OverpassError {
    if (error instanceof OverpassError) return error;
    return new OverpassError(
      'PROVIDER_ERROR',
      error instanceof Error ? error.message : 'Overpass error',
      { retryable: true, cause: error },
    );
  }
}
