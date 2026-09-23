import { OverpassDiscoveryProvider, loadOverpassConfig } from './overpass.provider';
import type { OverpassConfig } from './overpass.types';
import { OverpassClient } from './overpass.client';

describe('OverpassDiscoveryProvider', () => {
  const config: OverpassConfig = {
    enabled: true,
    apiUrl: 'https://overpass-api.de/api/interpreter',
    userAgent: 'ROOTACA-Test/1.0',
    timeoutMs: 5000,
    maxResults: 50,
    concurrency: 1,
    maxRetries: 0,
    requestDelayMs: 0,
    cacheTtlMs: 60_000,
    configured: true,
  };

  it('is unavailable when disabled', () => {
    const provider = new OverpassDiscoveryProvider({ ...config, enabled: false, configured: false });
    expect(provider.available).toBe(false);
  });

  it('maps Overpass elements to DiscoveryResult with structured fields', async () => {
    const client = {
      query: jest.fn().mockResolvedValue({
        elements: [
          {
            type: 'node',
            id: 42,
            lat: 30.15,
            lon: 31.62,
            tags: {
              amenity: 'school',
              name: 'Helsinki Semi International School',
              phone: '010123',
            },
          },
        ],
      }),
    } as unknown as OverpassClient;

    const provider = new OverpassDiscoveryProvider(config, client);
    const results = await provider.discoverByGeo(
      { governorate: 'Cairo', city: 'El Shorouk' },
      10,
    );
    expect(results).toHaveLength(1);
    expect(results[0].provider).toBe('OVERPASS');
    expect(results[0].structured).toBe(true);
    expect(results[0].sourceType).toBe('OSM');
    expect(results[0].title).toContain('Helsinki');
    expect(results[0].osmId).toBe('42');
    expect(results[0].latitude).toBe(30.15);
  });

  it('caches identical geographic queries', async () => {
    const client = {
      query: jest.fn().mockResolvedValue({
        elements: [
          {
            type: 'node',
            id: 1,
            lat: 30,
            lon: 31,
            tags: { amenity: 'school', name: 'Cached School' },
          },
        ],
      }),
    } as unknown as OverpassClient;
    const provider = new OverpassDiscoveryProvider(config, client);
    await provider.discoverByGeo({ city: 'El Shorouk', governorate: 'Cairo' }, 5);
    await provider.discoverByGeo({ city: 'El Shorouk', governorate: 'Cairo' }, 5);
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('loads config defaults without API key', () => {
    const loaded = loadOverpassConfig({ RESEARCH_OVERPASS_ENABLED: 'true' });
    expect(loaded.configured).toBe(true);
    expect(loaded.apiUrl).toContain('overpass');
    expect(loaded.concurrency).toBe(1);
  });
});
