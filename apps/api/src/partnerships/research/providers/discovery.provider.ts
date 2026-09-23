import { PartnershipResearchDataQuality } from '@prisma/client';

export type DiscoveryResult = {
  provider: string;
  query: string;
  title: string;
  url: string;
  snippet?: string;
  sourceType: string;
  discoveredAt: Date;
  domain?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Structured OSM / Overpass fields — only when explicitly mapped from source. */
  nameAr?: string;
  nameEn?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  osmType?: string;
  osmId?: string;
  osmUrl?: string;
  /** Derived Maps search URL from coordinates — not official source evidence. */
  derivedMapsSearchUrl?: string;
  structured?: boolean;
};

export type DiscoverySearchOptions = {
  maxResults: number;
  language?: string;
  governorate?: string | null;
  city?: string | null;
  district?: string | null;
};

export type DiscoveryProviderKind = 'MANUAL' | 'WEB_SEARCH' | 'DIRECTORY' | 'OVERPASS';

export interface ResearchDiscoveryProvider {
  readonly kind: DiscoveryProviderKind;
  readonly available: boolean;
  search(query: string, options: DiscoverySearchOptions): Promise<DiscoveryResult[]>;
}

/** Manual provider — no automated discovery; used for human-entered candidates. */
export class ManualDiscoveryProvider implements ResearchDiscoveryProvider {
  readonly kind = 'MANUAL' as const;
  readonly available = true;

  async search(): Promise<DiscoveryResult[]> {
    return [];
  }
}

/**
 * @deprecated Prefer WebSearchDiscoveryProvider from web-search/. Kept for compatibility.
 */
export class UnconfiguredWebSearchProvider implements ResearchDiscoveryProvider {
  readonly kind = 'WEB_SEARCH' as const;
  readonly available = false;

  async search(): Promise<DiscoveryResult[]> {
    throw new Error(
      'Automated discovery provider not configured. Use MANUAL candidate entry or configure a supported public search API.',
    );
  }
}

export function computeDataQuality(fields: {
  name: boolean;
  location: boolean;
  website: boolean;
  contact: boolean;
  evidenceCount: number;
}): PartnershipResearchDataQuality {
  let score = 0;
  if (fields.name) score += 1;
  if (fields.location) score += 1;
  if (fields.website) score += 1;
  if (fields.contact) score += 1;
  if (fields.evidenceCount > 0) score += 1;
  if (score >= 4) return PartnershipResearchDataQuality.HIGH;
  if (score >= 2) return PartnershipResearchDataQuality.MEDIUM;
  return PartnershipResearchDataQuality.LOW;
}

export function computeVerificationStatus(fields: {
  name: boolean;
  location: boolean;
  websiteOrContact: boolean;
  evidenceCount: number;
}): 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' {
  if (fields.name && fields.location && fields.websiteOrContact && fields.evidenceCount > 0) {
    return 'VERIFIED';
  }
  if (fields.name && (fields.location || fields.websiteOrContact)) {
    return 'PARTIALLY_VERIFIED';
  }
  return 'UNVERIFIED';
}
