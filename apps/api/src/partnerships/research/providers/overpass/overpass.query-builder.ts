import type { AreaNameCandidate } from './overpass.geo';
import { resolveOverpassGeoTarget } from './overpass.geo';
import type { OverpassGeoTarget } from './overpass.types';
import { assertSafeOverpassFragment } from './overpass.errors';

/** Known city bounding boxes (south,west,north,east) — OSM bbox order for Overpass. */
export const CITY_BBOX: Record<string, [number, number, number, number]> = {
  'el shorouk': [30.1, 31.55, 30.22, 31.75],
  shorouk: [30.1, 31.55, 30.22, 31.75],
  'new cairo': [30.0, 31.4, 30.1, 31.55],
  heliopolis: [30.08, 31.3, 30.12, 31.36],
  maadi: [29.95, 31.25, 30.0, 31.3],
  'nasr city': [30.04, 31.32, 30.08, 31.38],
  '6th of october': [29.93, 30.9, 30.02, 31.05],
  'sheikh zayed': [30.02, 30.95, 30.08, 31.05],
};

function escapeOverpassString(value: string): string {
  return assertSafeOverpassFragment(value, 'area name').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Build area union WITHOUT trailing semicolon after ')'.
 * Caller appends `->.searchArea;` so the assignment attaches to the union.
 */
function areaSelector(area: AreaNameCandidate): string {
  const name = escapeOverpassString(area.name);
  const parts: string[] = [];
  // Prefer English name first (ASCII-safe on all public Overpass instances)
  parts.push(`area["name"="${name}"]["boundary"="administrative"]`);
  parts.push(`area["name:en"="${name}"]["boundary"="administrative"]`);
  if (area.nameAr) {
    const ar = escapeOverpassString(area.nameAr);
    parts.push(`area["name:ar"="${ar}"]["boundary"="administrative"]`);
  }
  if (area.adminLevel) {
    const level = escapeOverpassString(area.adminLevel);
    return `(
  ${parts.map((p) => `${p}["admin_level"="${level}"]`).join(';\n  ')};
)`;
  }
  return `(
  ${parts.join(';\n  ')};
)`;
}

function schoolUnionInArea(): string {
  return `(
  node["amenity"="school"](area.searchArea);
  way["amenity"="school"](area.searchArea);
  relation["amenity"="school"](area.searchArea);
);
out center tags;`;
}

function schoolUnionInBbox(bbox: [number, number, number, number]): string {
  const [s, w, n, e] = bbox;
  return `(
  node["amenity"="school"](${s},${w},${n},${e});
  way["amenity"="school"](${s},${w},${n},${e});
  relation["amenity"="school"](${s},${w},${n},${e});
);
out center tags;`;
}

/**
 * Build Overpass QL for amenity=school (priority) within a geographic area.
 * User-provided names are escaped; never raw-concatenated.
 */
export function buildOverpassSchoolQuery(
  target: OverpassGeoTarget,
  options?: { timeoutSec?: number; maxResults?: number },
): { query: string; label: string; area: AreaNameCandidate } {
  const resolved = resolveOverpassGeoTarget(target);
  const timeoutSec = Math.min(Math.max(options?.timeoutSec ?? 25, 5), 60);

  // Prefer bbox for known cities (reliable; avoids empty/invalid area name issues)
  const cityKey = (target.city || target.district || '').trim().toLowerCase();
  const bbox = CITY_BBOX[cityKey];
  if (bbox) {
    const query = `[out:json][timeout:${timeoutSec}];
${schoolUnionInBbox(bbox)}
`;
    return { query, label: resolved.label, area: resolved.primary };
  }

  const areaBlock = areaSelector(resolved.primary);
  const query = `[out:json][timeout:${timeoutSec}];
${areaBlock}->.searchArea;
${schoolUnionInArea()}
`;

  return { query, label: resolved.label, area: resolved.primary };
}

/** Build fallback queries for alternate area names (governorate after city miss). */
export function buildOverpassFallbackQueries(
  target: OverpassGeoTarget,
  options?: { timeoutSec?: number },
): Array<{ query: string; label: string }> {
  const resolved = resolveOverpassGeoTarget(target);
  const timeoutSec = Math.min(Math.max(options?.timeoutSec ?? 25, 5), 60);
  return resolved.fallbacks.map((area) => {
    const areaBlock = areaSelector(area);
    const query = `[out:json][timeout:${timeoutSec}];
${areaBlock}->.searchArea;
${schoolUnionInArea()}
`;
    return { query, label: `${resolved.label} (fallback: ${area.name})` };
  });
}
