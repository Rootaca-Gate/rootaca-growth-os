import { DiscoveryProviderError } from '../discovery.errors';
import { loadResearchDiscoveryConfig } from '../discovery.config';
import { WebSearchClient } from './web-search.client';

describe('WebSearchClient', () => {
  const baseEnv = {
    RESEARCH_DISCOVERY_PROVIDER: 'WEB_SEARCH',
    RESEARCH_DISCOVERY_API_KEY: 'test-key',
    RESEARCH_DISCOVERY_ENGINE: 'serper',
    RESEARCH_DISCOVERY_MAX_RETRIES: '1',
    RESEARCH_DISCOVERY_TIMEOUT_MS: '5000',
  };

  it('maps serper organic results', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        organic: [
          { title: 'School A', link: 'https://school-a.test', snippet: 'Cairo', position: 1 },
        ],
      }),
    });
    const client = new WebSearchClient(loadResearchDiscoveryConfig(baseEnv), {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: async () => undefined,
    });
    const hits = await client.search('international schools Cairo Egypt', 10, 'en');
    expect(hits).toHaveLength(1);
    expect(hits[0].url).toBe('https://school-a.test');
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('serper'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-API-KEY': 'test-key' }),
      }),
    );
  });

  it('throws NOT_CONFIGURED without key', async () => {
    const client = new WebSearchClient(
      loadResearchDiscoveryConfig({ RESEARCH_DISCOVERY_PROVIDER: 'WEB_SEARCH' }),
    );
    await expect(client.search('q', 5)).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
  });

  it('maps 401 to AUTHENTICATION_ERROR without retry success', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    const client = new WebSearchClient(loadResearchDiscoveryConfig(baseEnv), {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: async () => undefined,
    });
    await expect(client.search('q', 5)).rejects.toBeInstanceOf(DiscoveryProviderError);
    await expect(client.search('q', 5)).rejects.toMatchObject({ code: 'AUTHENTICATION_ERROR' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries 429 then succeeds', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ organic: [{ title: 'A', link: 'https://a.test' }] }),
      });
    const client = new WebSearchClient(loadResearchDiscoveryConfig(baseEnv), {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: async () => undefined,
    });
    const hits = await client.search('q', 5);
    expect(hits).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries 503 then fails', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const client = new WebSearchClient(
      loadResearchDiscoveryConfig({ ...baseEnv, RESEARCH_DISCOVERY_MAX_RETRIES: '1' }),
      { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: async () => undefined },
    );
    await expect(client.search('q', 5)).rejects.toMatchObject({
      code: 'PROVIDER_ERROR',
      retryable: true,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry 400', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 400 });
    const client = new WebSearchClient(loadResearchDiscoveryConfig(baseEnv), {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: async () => undefined,
    });
    await expect(client.search('q', 5)).rejects.toMatchObject({ retryable: false });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed serper body', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ organic: null }),
    });
    const client = new WebSearchClient(loadResearchDiscoveryConfig(baseEnv), {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: async () => undefined,
    });
    await expect(client.search('q', 5)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('maps brave results', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        web: { results: [{ title: 'B', url: 'https://b.test', description: 'desk' }] },
      }),
    });
    const client = new WebSearchClient(
      loadResearchDiscoveryConfig({
        ...baseEnv,
        RESEARCH_DISCOVERY_ENGINE: 'brave',
        RESEARCH_DISCOVERY_API_URL: 'https://api.search.brave.com/res/v1/web/search',
      }),
      { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: async () => undefined },
    );
    const hits = await client.search('q', 5, 'ar');
    expect(hits[0].title).toBe('B');
    expect(fetchImpl.mock.calls[0][1].headers['X-Subscription-Token']).toBe('test-key');
  });
});
