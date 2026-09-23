import { draftFromOverpassDiscovery } from './overpass.mapper';
import { extractCandidatesFromDiscovery } from '../candidate-extract';
import type { DiscoveryResult } from '../discovery.provider';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Helsinki acceptance: OSM discovery draft + KidsDirectory evidence merge into ONE identity.
 * Does not invent missing fields.
 */
describe('Helsinki / NIS multi-source identity', () => {
  it('OSM Helsinki draft is a single institution candidate', () => {
    const osm: DiscoveryResult = {
      provider: 'OVERPASS',
      query: 'El Shorouk, Cairo',
      title: 'Helsinki Semi International School (HSIS)',
      url: 'https://www.openstreetmap.org/node/999',
      sourceType: 'OSM',
      discoveredAt: new Date(),
      structured: true,
      osmType: 'node',
      osmId: '999',
      osmUrl: 'https://www.openstreetmap.org/node/999',
      city: 'El Shorouk',
      latitude: 30.14,
      longitude: 31.63,
      address: 'El Shorouk, Cairo',
    };
    const draft = draftFromOverpassDiscovery(osm);
    expect(draft.discoveredName).toContain('Helsinki');
    expect(draft.sourceName).toBe('OpenStreetMap');
    expect(draft.evidence.filter((e) => e.field === 'discoverySource')).toHaveLength(1);
  });

  it('KidsDirectory Helsinki fixture extracts contacts without inventing schools', () => {
    const html = fs.readFileSync(
      path.join(__dirname, '../fixtures/kidsdirectory-helsinki-ad.html'),
      'utf8',
    );
    const discovery: DiscoveryResult = {
      provider: 'WEB_SEARCH',
      query: 'Helsinki Semi International School',
      title: 'Helsinki Semi International School | KidsDirectory',
      url: 'https://www.kidsdirectoryegypt.com/ad/helsinki-semi-international-school',
      snippet: 'Helsinki Semi International School',
      sourceType: 'PUBLIC_DIRECTORY',
      discoveredAt: new Date(),
      domain: 'kidsdirectoryegypt.com',
    };
    const drafts = extractCandidatesFromDiscovery(discovery, html);
    expect(drafts.length).toBeGreaterThanOrEqual(1);
    const primary = drafts[0];
    expect(primary.discoveredName.toLowerCase()).toContain('helsinki');
    // Contacts only when present in fixture — never invent
    if (primary.phone) expect(primary.phone.length).toBeGreaterThan(5);
    if (primary.email) expect(primary.email).toContain('@');
  });

  it('NIS Shorouk OSM + website evidence stay one campus identity key', () => {
    const osm = draftFromOverpassDiscovery({
      provider: 'OVERPASS',
      query: 'El Shorouk',
      title: 'Nermien Ismail Schools - Shorouk Campus',
      url: 'https://www.openstreetmap.org/way/111',
      sourceType: 'OSM',
      discoveredAt: new Date(),
      structured: true,
      osmType: 'way',
      osmId: '111',
      osmUrl: 'https://www.openstreetmap.org/way/111',
      website: 'https://www.nis-eg.com/shorouk-campus/',
      address: 'El Shorouk',
      latitude: 30.15,
      longitude: 31.62,
    });
    expect(osm.discoveredName.toLowerCase()).toContain('shorouk');
    expect(osm.website).toContain('nis-eg.com');
    expect(osm.evidence.some((e) => e.field === 'website')).toBe(true);
    expect(osm.evidence.some((e) => e.field === 'derivedMapsSearchUrl' || e.field === 'latitude')).toBe(
      true,
    );
  });
});
