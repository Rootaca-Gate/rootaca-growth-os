import { PartnershipResearchSourceType } from '@prisma/client';
import type { ExtractedCandidateDraft } from '../candidate-extract';
import type { DiscoveryResult } from '../discovery.provider';
import type { OverpassElement, OverpassMappedSchool, OsmElementType } from './overpass.types';

function tag(
  tags: Record<string, string> | undefined,
  ...keys: string[]
): string | null {
  if (!tags) return null;
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return null;
}

function pickEnglishName(tags: Record<string, string>): string | null {
  return tag(tags, 'name:en', 'official_name:en', 'name', 'official_name');
}

function pickArabicName(tags: Record<string, string>): string | null {
  return tag(tags, 'name:ar', 'official_name:ar', 'name', 'official_name');
}

function pickDisplayName(tags: Record<string, string>): string | null {
  return (
    tag(tags, 'name', 'official_name', 'name:en', 'name:ar', 'official_name:en', 'official_name:ar')
  );
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    tag(tags, 'addr:housenumber'),
    tag(tags, 'addr:street'),
    tag(tags, 'addr:suburb', 'addr:district', 'addr:neighbourhood'),
    tag(tags, 'addr:city'),
    tag(tags, 'addr:postcode'),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function coordinates(element: OverpassElement): { lat: number; lon: number } | null {
  if (
    element.type === 'node' &&
    typeof element.lat === 'number' &&
    typeof element.lon === 'number' &&
    Number.isFinite(element.lat) &&
    Number.isFinite(element.lon)
  ) {
    return { lat: element.lat, lon: element.lon };
  }
  if (
    element.center &&
    typeof element.center.lat === 'number' &&
    typeof element.center.lon === 'number' &&
    Number.isFinite(element.center.lat) &&
    Number.isFinite(element.center.lon)
  ) {
    return { lat: element.center.lat, lon: element.center.lon };
  }
  return null;
}

function osmUrl(type: OsmElementType, id: number): string {
  return `https://www.openstreetmap.org/${type}/${id}`;
}

function isSchoolElement(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false;
  if (tags.amenity === 'school') return true;
  // Secondary: building=school only when it also looks like a named school
  if (tags.building === 'school' && (tags.name || tags['name:en'] || tags['name:ar'])) {
    return true;
  }
  return false;
}

/**
 * Map a single Overpass element to a school record.
 * Returns null when the element is not a usable school (no name, not amenity=school).
 * Never invents missing fields.
 */
export function mapOverpassElement(element: OverpassElement): OverpassMappedSchool | null {
  const tags = element.tags ?? {};
  if (!isSchoolElement(tags)) return null;

  const name = pickDisplayName(tags);
  if (!name) return null;

  // Reject obvious non-institution noise if tagged oddly
  if (/^(faq|fees?|price|admission|logistics?)$/i.test(name.trim())) {
    return null;
  }

  const coords = coordinates(element);
  const osmType = element.type;
  const osmId = String(element.id);
  const url = osmUrl(osmType, element.id);

  const nameEn = pickEnglishName(tags);
  const nameAr = pickArabicName(tags);

  // If only one language exists, do not invent a translation —
  // keep discoveredName as OSM name; optional language fields may equal name.
  const website = tag(tags, 'website', 'contact:website', 'url');
  const phone = tag(tags, 'phone', 'contact:phone', 'contact:mobile');
  const email = tag(tags, 'email', 'contact:email');
  const facebook = tag(tags, 'contact:facebook', 'facebook');
  const instagram = tag(tags, 'contact:instagram', 'instagram');
  const whatsapp = tag(tags, 'contact:whatsapp', 'whatsapp');

  return {
    osmType,
    osmId,
    osmUrl: url,
    name,
    nameAr: nameAr && nameAr !== name ? nameAr : nameAr,
    nameEn: nameEn && nameEn !== name ? nameEn : nameEn,
    latitude: coords?.lat ?? null,
    longitude: coords?.lon ?? null,
    address: buildAddress(tags),
    city: tag(tags, 'addr:city'),
    district: tag(tags, 'addr:district', 'addr:suburb', 'addr:neighbourhood'),
    phone,
    email,
    website,
    facebook,
    instagram,
    whatsapp,
    schoolType: tag(tags, 'school', 'school:type', 'isced:level'),
    operator: tag(tags, 'operator', 'operator:type'),
    derivedMapsSearchUrl:
      coords != null
        ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`
        : null,
    sourceType: 'OSM',
    sourceName: 'OpenStreetMap',
    sourceUrl: 'https://www.openstreetmap.org/',
    tags,
  };
}

export function mapOverpassElements(
  elements: OverpassElement[],
  maxResults: number,
): OverpassMappedSchool[] {
  const seen = new Set<string>();
  const mapped: OverpassMappedSchool[] = [];

  for (const element of elements) {
    if (mapped.length >= maxResults) break;
    const school = mapOverpassElement(element);
    if (!school) continue;
    const key = `${school.osmType}/${school.osmId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mapped.push(school);
  }

  return mapped;
}

/** Build an extraction draft directly from structured Overpass discovery (no HTML parse). */
export function draftFromOverpassDiscovery(result: DiscoveryResult): ExtractedCandidateDraft {
  const osmUrl = result.osmUrl || result.url;
  const evidence: ExtractedCandidateDraft['evidence'] = [
    {
      field: 'discoverySource',
      value: 'OpenStreetMap',
      sourceUrl: osmUrl,
      sourceType: PartnershipResearchSourceType.OSM,
      confidence: 'HIGH',
    },
    {
      field: 'evidenceSource',
      value: 'OpenStreetMap',
      sourceUrl: osmUrl,
      sourceType: PartnershipResearchSourceType.OSM,
      confidence: 'HIGH',
    },
  ];

  const push = (field: string, value: string | undefined | null, confidence: 'HIGH' | 'MEDIUM' = 'HIGH') => {
    if (!value?.trim()) return;
    evidence.push({
      field,
      value: value.trim(),
      sourceUrl: osmUrl,
      sourceType: PartnershipResearchSourceType.OSM,
      confidence,
    });
  };

  push('name', result.title);
  push('nameAr', result.nameAr);
  push('nameEn', result.nameEn);
  push('phone', result.phone);
  push('email', result.email);
  push('website', result.website);
  push('address', result.address);
  push('city', result.city);
  push('district', result.district);
  push('facebook', result.facebook);
  push('instagram', result.instagram);
  push('whatsapp', result.whatsapp);
  if (result.latitude != null && result.longitude != null) {
    push('latitude', String(result.latitude));
    push('longitude', String(result.longitude));
  }
  if (result.osmId) {
    push('osmId', `${result.osmType ?? 'node'}/${result.osmId}`);
    push('osmUrl', osmUrl);
  }
  // Derived Maps URL is utility only — mark as derived, not official Google Maps evidence
  if (result.derivedMapsSearchUrl) {
    evidence.push({
      field: 'derivedMapsSearchUrl',
      value: result.derivedMapsSearchUrl,
      sourceUrl: osmUrl,
      sourceType: PartnershipResearchSourceType.OSM,
      confidence: 'MEDIUM',
    });
  }

  return {
    discoveredName: result.title,
    website: result.website,
    email: result.email,
    phone: result.phone,
    whatsapp: result.whatsapp,
    address: result.address,
    facebook: result.facebook,
    instagram: result.instagram,
    googleMapsUrl: result.derivedMapsSearchUrl,
    sourceType: PartnershipResearchSourceType.OSM,
    sourceName: 'OpenStreetMap',
    sourceUrl: osmUrl,
    snippet: result.snippet,
    domain: 'openstreetmap.org',
    confidence: 'HIGH',
    likelyOfficialWebsite: Boolean(result.website),
    skipAsInstitution: false,
    notes: [
      result.osmType && result.osmId ? `OSM ${result.osmType}/${result.osmId}` : null,
      result.latitude != null ? `lat=${result.latitude}, lon=${result.longitude}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    signals: {
      hasCoding: false,
      hasRobotics: false,
      hasStem: false,
      hasAi: false,
      hasTechClub: false,
      hasAfterSchool: false,
      hasSummerCamp: false,
      hasMakerspace: false,
    },
    evidence,
  };
}
