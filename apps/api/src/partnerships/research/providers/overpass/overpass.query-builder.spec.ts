import { buildOverpassSchoolQuery, buildOverpassFallbackQueries } from './overpass.query-builder';
import { assertSafeOverpassFragment } from './overpass.errors';

describe('overpass.query-builder', () => {
  it('builds a safe amenity=school area query for El Shorouk / Cairo', () => {
    const { query, label } = buildOverpassSchoolQuery({
      governorate: 'Cairo',
      city: 'El Shorouk',
    });
    expect(label.toLowerCase()).toContain('shorouk');
    expect(query).toContain('amenity"="school"');
    expect(query).toContain('out center tags');
    // El Shorouk uses known bbox (reliable for public Overpass)
    expect(query).toMatch(/30\.1/);
    expect(query).not.toMatch(/;\s*El Shorouk/);
  });

  it('escapes and rejects invalid query input', () => {
    expect(() => assertSafeOverpassFragment('bad"name', 'city')).toThrow();
    expect(() => assertSafeOverpassFragment('bad;drop', 'city')).toThrow();
    expect(() =>
      buildOverpassSchoolQuery({ city: 'evil";out;' }),
    ).toThrow();
  });

  it('provides governorate fallbacks when city is set', () => {
    const fallbacks = buildOverpassFallbackQueries({
      governorate: 'Cairo',
      city: 'El Shorouk',
    });
    expect(fallbacks.length).toBeGreaterThan(0);
    expect(fallbacks[0].query).toContain('amenity"="school"');
  });
});
