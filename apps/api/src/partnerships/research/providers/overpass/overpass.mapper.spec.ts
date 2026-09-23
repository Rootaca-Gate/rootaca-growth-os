import { mapOverpassElement, mapOverpassElements, draftFromOverpassDiscovery } from './overpass.mapper';
import type { OverpassElement } from './overpass.types';
import type { DiscoveryResult } from '../discovery.provider';

describe('overpass.mapper', () => {
  it('maps node lat/lon and English/Arabic names', () => {
    const element: OverpassElement = {
      type: 'node',
      id: 123,
      lat: 30.15,
      lon: 31.62,
      tags: {
        amenity: 'school',
        name: 'NIS Shorouk',
        'name:en': 'NIS Shorouk Campus',
        'name:ar': 'مدارس نرمين إسماعيل - الشروق',
        phone: '01201144449',
        'contact:email': 'info@nis-eg.com',
        website: 'https://www.nis-eg.com/shorouk-campus/',
        'addr:city': 'El Shorouk',
        'addr:street': 'Campus Road',
      },
    };
    const mapped = mapOverpassElement(element);
    expect(mapped).not.toBeNull();
    expect(mapped!.osmType).toBe('node');
    expect(mapped!.osmId).toBe('123');
    expect(mapped!.osmUrl).toBe('https://www.openstreetmap.org/node/123');
    expect(mapped!.latitude).toBe(30.15);
    expect(mapped!.longitude).toBe(31.62);
    expect(mapped!.nameEn).toBe('NIS Shorouk Campus');
    expect(mapped!.nameAr).toContain('نرمين');
    expect(mapped!.phone).toBe('01201144449');
    expect(mapped!.email).toBe('info@nis-eg.com');
    expect(mapped!.website).toContain('nis-eg.com');
    expect(mapped!.address).toContain('Campus Road');
    expect(mapped!.derivedMapsSearchUrl).toContain('30.15,31.62');
    expect(mapped!.sourceType).toBe('OSM');
  });

  it('maps way center coordinates', () => {
    const element: OverpassElement = {
      type: 'way',
      id: 456,
      center: { lat: 30.1, lon: 31.5 },
      tags: { amenity: 'school', name: 'Way School' },
    };
    const mapped = mapOverpassElement(element);
    expect(mapped!.latitude).toBe(30.1);
    expect(mapped!.longitude).toBe(31.5);
    expect(mapped!.osmUrl).toBe('https://www.openstreetmap.org/way/456');
  });

  it('maps relation center coordinates', () => {
    const element: OverpassElement = {
      type: 'relation',
      id: 789,
      center: { lat: 29.9, lon: 31.2 },
      tags: { amenity: 'school', name: 'Relation School' },
    };
    const mapped = mapOverpassElement(element);
    expect(mapped!.osmUrl).toContain('/relation/789');
    expect(mapped!.latitude).toBe(29.9);
  });

  it('rejects elements without amenity=school or name', () => {
    expect(
      mapOverpassElement({ type: 'node', id: 1, lat: 1, lon: 2, tags: { amenity: 'cafe', name: 'X' } }),
    ).toBeNull();
    expect(
      mapOverpassElement({ type: 'node', id: 2, lat: 1, lon: 2, tags: { amenity: 'school' } }),
    ).toBeNull();
  });

  it('rejects FAQ-like names', () => {
    expect(
      mapOverpassElement({
        type: 'node',
        id: 3,
        lat: 1,
        lon: 2,
        tags: { amenity: 'school', name: 'FAQ' },
      }),
    ).toBeNull();
  });

  it('deduplicates OSM records by type/id', () => {
    const elements: OverpassElement[] = [
      { type: 'node', id: 1, lat: 1, lon: 2, tags: { amenity: 'school', name: 'A' } },
      { type: 'node', id: 1, lat: 1, lon: 2, tags: { amenity: 'school', name: 'A' } },
      { type: 'node', id: 2, lat: 1, lon: 2, tags: { amenity: 'school', name: 'B' } },
    ];
    expect(mapOverpassElements(elements, 10)).toHaveLength(2);
  });

  it('respects maximum results', () => {
    const elements: OverpassElement[] = Array.from({ length: 5 }, (_, i) => ({
      type: 'node' as const,
      id: i + 1,
      lat: 1,
      lon: 2,
      tags: { amenity: 'school', name: `School ${i}` },
    }));
    expect(mapOverpassElements(elements, 2)).toHaveLength(2);
  });

  it('handles malformed tags without inventing fields', () => {
    const mapped = mapOverpassElement({
      type: 'node',
      id: 9,
      lat: 30,
      lon: 31,
      tags: { amenity: 'school', name: 'Only Name' },
    });
    expect(mapped!.phone).toBeNull();
    expect(mapped!.email).toBeNull();
    expect(mapped!.website).toBeNull();
  });

  it('builds discovery draft with field-level OSM evidence', () => {
    const result: DiscoveryResult = {
      provider: 'OVERPASS',
      query: 'El Shorouk',
      title: 'Helsinki Semi International School',
      url: 'https://www.openstreetmap.org/node/1',
      sourceType: 'OSM',
      discoveredAt: new Date(),
      structured: true,
      phone: '01000000000',
      osmType: 'node',
      osmId: '1',
      osmUrl: 'https://www.openstreetmap.org/node/1',
      latitude: 30.1,
      longitude: 31.6,
    };
    const draft = draftFromOverpassDiscovery(result);
    expect(draft.sourceType).toBe('OSM');
    expect(draft.sourceName).toBe('OpenStreetMap');
    expect(draft.evidence.some((e) => e.field === 'discoverySource')).toBe(true);
    expect(draft.evidence.some((e) => e.field === 'phone' && e.value === '01000000000')).toBe(true);
    expect(draft.skipAsInstitution).toBe(false);
  });
});
