import { OverpassClient } from './overpass.client';
import type { OverpassConfig } from './overpass.types';
import { OverpassError } from './overpass.errors';

const baseConfig: OverpassConfig = {
  enabled: true,
  apiUrl: 'https://overpass-api.de/api/interpreter',
  userAgent: 'ROOTACA-Test/1.0',
  timeoutMs: 5000,
  maxResults: 100,
  concurrency: 1,
  maxRetries: 1,
  requestDelayMs: 0,
  cacheTtlMs: 60_000,
  configured: true,
};

describe('OverpassClient', () => {
  it('posts Overpass QL and returns elements', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ elements: [{ type: 'node', id: 1, lat: 1, lon: 2, tags: {} }] }),
    });
    const client = new OverpassClient(baseConfig, { fetchImpl: fetchImpl as never, sleep: async () => undefined });
    const result = await client.query('[out:json];out;');
    expect(result.elements).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalled();
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(String(init.headers && (init.headers as Record<string, string>)['User-Agent'])).toContain('ROOTACA');
  });

  it('retries on timeout then succeeds', async () => {
    let calls = 0;
    const fetchImpl = jest.fn().mockImplementation(async () => {
      calls += 1;
      if (calls === 1) {
        const err = new Error('aborted');
        err.name = 'AbortError';
        throw err;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ elements: [] }),
      };
    });
    const client = new OverpassClient(
      { ...baseConfig, maxRetries: 1 },
      { fetchImpl: fetchImpl as never, sleep: async () => undefined },
    );
    await expect(client.query('q')).resolves.toEqual({ elements: [] });
    expect(calls).toBe(2);
  });

  it('maps 429 to RATE_LIMITED', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 429 });
    const client = new OverpassClient(
      { ...baseConfig, maxRetries: 0 },
      { fetchImpl: fetchImpl as never, sleep: async () => undefined },
    );
    await expect(client.query('q')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('throws when disabled', async () => {
    const client = new OverpassClient(
      { ...baseConfig, enabled: false },
      { fetchImpl: jest.fn() as never },
    );
    await expect(client.query('q')).rejects.toBeInstanceOf(OverpassError);
  });
});
