import {
  PartnershipResearchDataQuality,
  PartnershipResearchSourceType,
} from '@prisma/client';
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeWebsiteDomain,
} from '../../common/partnership.normalize';
import { aliasGroupId, normalizeInstitutionKey } from './candidate-quality';
import {
  extractPublicListingFields,
  sourceDisplayName,
} from './candidate-extract';
import type { DiscoveryResult } from './discovery.provider';
import {
  isDirectoryListingDetailUrl,
  isDiscoverySourceUrl,
  isGenericListTitle,
} from './web-search/web-search.mapper';

export type EnrichmentCandidateSnapshot = {
  id: string;
  discoveredName: string;
  governorate?: string | null;
  city?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  googleMapsUrl?: string | null;
};

export type EnrichmentFieldPatch = {
  field: string;
  value: string;
  sourceUrl: string;
  sourceType: PartnershipResearchSourceType;
  sourceName: string;
  confidence: PartnershipResearchDataQuality;
  action: 'SET' | 'CONFLICT' | 'SKIP';
};

export type EnrichmentSourceClass =
  | 'OFFICIAL_WEBSITE'
  | 'DIRECTORY'
  | 'PUBLIC_SOCIAL'
  | 'SEARCH_RESULT'
  | 'ARTICLE'
  | 'OTHER_PUBLIC_SOURCE';

const MAX_ENRICHMENT_QUERIES = 5;
const CONTACT_FIELDS = [
  'phone',
  'email',
  'whatsapp',
  'address',
  'website',
  'facebook',
  'instagram',
  'googleMapsUrl',
] as const;

export function listMissingEnrichmentFields(
  candidate: EnrichmentCandidateSnapshot,
): string[] {
  const missing: string[] = [];
  if (!candidate.phone && !candidate.mobile) missing.push('phone');
  if (!candidate.email) missing.push('email');
  if (!candidate.whatsapp) missing.push('whatsapp');
  if (!candidate.address) missing.push('address');
  if (!candidate.website) missing.push('website');
  if (!candidate.facebook) missing.push('facebook');
  if (!candidate.instagram) missing.push('instagram');
  if (!candidate.googleMapsUrl) missing.push('googleMapsUrl');
  return missing;
}

/**
 * Deterministic enrichment queries for missing contacts — capped.
 */
export function generateEnrichmentQueries(
  candidate: EnrichmentCandidateSnapshot,
  missing: string[],
): string[] {
  const name = candidate.discoveredName.trim();
  if (!name) return [];
  const place = [candidate.city, candidate.governorate].filter(Boolean).join(' ').trim();
  const quoted = `"${name}"`;
  const queries: string[] = [];
  const push = (q: string) => {
    if (queries.length >= MAX_ENRICHMENT_QUERIES) return;
    const cleaned = q.replace(/\s+/g, ' ').trim();
    if (!cleaned || queries.includes(cleaned)) return;
    queries.push(cleaned);
  };

  if (missing.includes('phone') || missing.includes('whatsapp')) {
    push(`${quoted} ${place} phone`);
    push(`${quoted} ${place} contact`);
  }
  if (missing.includes('email')) {
    push(`${quoted} ${place} email`);
  }
  if (missing.includes('address')) {
    push(`${quoted} ${place} address`);
  }
  if (missing.includes('website')) {
    push(`${quoted} ${place} website`);
  }
  // Prefer known public Egypt school directories when contacts are missing
  if (missing.includes('phone') || missing.includes('email') || missing.includes('address')) {
    push(`site:kidsdirectory.com.eg ${quoted}`);
  }

  const acronym = name.match(/\b(NIS|HSIS|BSEE|IPS|BCCIS|GIS|DAIS)\b/)?.[1];
  if (acronym && queries.length < MAX_ENRICHMENT_QUERIES) {
    push(`"${acronym}" ${place} phone`.trim());
    push(`site:kidsdirectory.com.eg ${acronym} ${place}`.trim());
  }

  if (queries.length === 0) {
    push(`${quoted} ${place} contact`);
  }

  if (/[\u0600-\u06FF]/.test(name) && queries.length < MAX_ENRICHMENT_QUERIES) {
    push(`${quoted} هاتف`);
  }

  return queries.slice(0, MAX_ENRICHMENT_QUERIES);
}

export function classifyEnrichmentSource(
  result: Pick<DiscoveryResult, 'url' | 'title' | 'sourceType' | 'domain'>,
): EnrichmentSourceClass {
  const url = result.url ?? '';
  if (isDirectoryListingDetailUrl(url)) {
    return 'DIRECTORY';
  }
  if (/kidsdirectory\.|edarabia\./i.test(url)) {
    return isDiscoverySourceUrl(url) ? 'ARTICLE' : 'DIRECTORY';
  }
  if (/facebook\.com|instagram\.com|linkedin\.com|youtube\.com|tiktok\.com/i.test(url)) {
    return 'PUBLIC_SOCIAL';
  }
  if (isDiscoverySourceUrl(url) || isGenericListTitle(result.title)) {
    return 'ARTICLE';
  }
  if (
    result.sourceType === PartnershipResearchSourceType.OFFICIAL_WEBSITE ||
    /\.edu\.eg$|\.sch\.eg$|school|academy/i.test(result.domain ?? '')
  ) {
    return 'OFFICIAL_WEBSITE';
  }
  if (result.sourceType === PartnershipResearchSourceType.SEARCH_ENGINE) {
    return 'SEARCH_RESULT';
  }
  return 'OTHER_PUBLIC_SOURCE';
}

export function matchesSameInstitution(
  candidate: EnrichmentCandidateSnapshot,
  hit: {
    name?: string;
    website?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    address?: string | null;
    title?: string;
  },
): boolean {
  const candDomain = normalizeWebsiteDomain(candidate.website ?? undefined);
  const hitDomain = normalizeWebsiteDomain(hit.website ?? undefined);
  if (candDomain && hitDomain && candDomain === hitDomain) return true;

  const candPhone = normalizePhone(candidate.phone ?? candidate.mobile ?? undefined);
  const hitPhone = normalizePhone(hit.phone ?? undefined);
  if (
    candPhone &&
    hitPhone &&
    candPhone.replace(/\D/g, '').length >= 8 &&
    candPhone === hitPhone
  ) {
    return true;
  }

  const candEmail = normalizeEmail(candidate.email ?? undefined);
  const hitEmail = normalizeEmail(hit.email ?? undefined);
  if (candEmail && hitEmail && candEmail === hitEmail) return true;

  const candName = normalizeInstitutionKey(candidate.discoveredName);
  const hitName = normalizeInstitutionKey(hit.name || hit.title || '');
  if (!candName || !hitName) return false;

  const candAlias = aliasGroupId(candidate.discoveredName);
  const hitAlias = aliasGroupId(hit.name || hit.title || '');
  const sameAlias = Boolean(candAlias && hitAlias && candAlias === hitAlias);
  const nameOverlap =
    candName === hitName ||
    candName.includes(hitName) ||
    hitName.includes(candName) ||
    sameAlias;

  if (!nameOverlap) return false;

  const candCity = normalizeName(candidate.city ?? undefined);
  const hitCity = normalizeName(hit.city ?? undefined);
  if (candCity && hitCity && candCity === hitCity) return true;

  if (nameOverlap && (hit.phone || hit.email || hit.website || hit.address)) {
    return true;
  }

  return nameOverlap && sameAlias;
}

/**
 * Apply enrichment values without inventing data or silently overwriting conflicts.
 */
export function applyEnrichmentPatches(
  candidate: EnrichmentCandidateSnapshot,
  incoming: Record<string, string | undefined>,
  meta: {
    sourceUrl: string;
    sourceType: PartnershipResearchSourceType;
    sourceName: string;
    confidence?: PartnershipResearchDataQuality;
  },
): EnrichmentFieldPatch[] {
  const patches: EnrichmentFieldPatch[] = [];
  const confidence = meta.confidence ?? PartnershipResearchDataQuality.HIGH;
  const currentMap = candidate as unknown as Record<string, string | null | undefined>;

  for (const field of CONTACT_FIELDS) {
    const raw = incoming[field]?.trim();
    if (!raw) continue;

    const current = currentMap[field];
    if (!current) {
      patches.push({
        field,
        value: raw,
        sourceUrl: meta.sourceUrl,
        sourceType: meta.sourceType,
        sourceName: meta.sourceName,
        confidence,
        action: 'SET',
      });
      continue;
    }

    const same =
      field === 'phone' || field === 'whatsapp'
        ? normalizePhone(current) === normalizePhone(raw)
        : field === 'email'
          ? normalizeEmail(current) === normalizeEmail(raw)
          : field === 'website'
            ? normalizeWebsiteDomain(current) === normalizeWebsiteDomain(raw)
            : current.trim().toLowerCase() === raw.toLowerCase();

    if (same) {
      patches.push({
        field,
        value: raw,
        sourceUrl: meta.sourceUrl,
        sourceType: meta.sourceType,
        sourceName: meta.sourceName,
        confidence,
        action: 'SKIP',
      });
    } else {
      patches.push({
        field,
        value: raw,
        sourceUrl: meta.sourceUrl,
        sourceType: meta.sourceType,
        sourceName: meta.sourceName,
        confidence: PartnershipResearchDataQuality.MEDIUM,
        action: 'CONFLICT',
      });
    }
  }

  return patches;
}

export function enrichmentSourceTypeFromClass(
  klass: EnrichmentSourceClass,
): PartnershipResearchSourceType {
  switch (klass) {
    case 'OFFICIAL_WEBSITE':
      return PartnershipResearchSourceType.OFFICIAL_WEBSITE;
    case 'DIRECTORY':
    case 'ARTICLE':
      return PartnershipResearchSourceType.PUBLIC_DIRECTORY;
    case 'PUBLIC_SOCIAL':
      return PartnershipResearchSourceType.PUBLIC_SOCIAL_PAGE;
    default:
      return PartnershipResearchSourceType.SEARCH_ENGINE;
  }
}

export function extractFieldsFromEnrichmentPage(
  html: string,
  result: DiscoveryResult,
): Record<string, string | undefined> {
  const fields = extractPublicListingFields(html, result.url);
  const klass = classifyEnrichmentSource(result);
  const website = klass === 'OFFICIAL_WEBSITE' ? result.url : fields.website;
  return sanitizeEnrichmentContactFields({
    phone: fields.phone,
    email: fields.email,
    whatsapp: fields.whatsapp,
    address: fields.address,
    website,
    facebook: fields.facebook,
    instagram: fields.instagram,
    googleMapsUrl: fields.googleMapsUrl,
  });
}

/** Drop directory chrome / asset false-positives from scraped contacts. */
export function sanitizeEnrichmentContactFields(
  fields: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const out = { ...fields };
  if (
    out.website &&
    /gmpg\.org|fonts\.googleapis|fonts\.gstatic|facebook\.com|instagram\.com|w3\.org|schema\.org|\.css(?:\?|$)|googletagmanager/i.test(
      out.website,
    )
  ) {
    out.website = undefined;
  }
  if (out.facebook && /EgyptDirectory|egypt.?kids.?directory|KidsDirectory/i.test(out.facebook)) {
    out.facebook = undefined;
  }
  if (out.instagram && /egypt.?kids.?directory|KidsDirectory/i.test(out.instagram)) {
    out.instagram = undefined;
  }
  return out;
}

export { sourceDisplayName, isDirectoryListingDetailUrl };
