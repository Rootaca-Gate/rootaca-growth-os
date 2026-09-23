/** Overpass / OSM discovery types — no invented fields. */

export type OsmElementType = 'node' | 'way' | 'relation';

export type OverpassElement = {
  type: OsmElementType;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type OverpassResponse = {
  version?: number;
  generator?: string;
  elements?: OverpassElement[];
  remark?: string;
};

export type OverpassGeoTarget = {
  governorate?: string | null;
  city?: string | null;
  district?: string | null;
};

export type OverpassMappedSchool = {
  osmType: OsmElementType;
  osmId: string;
  osmUrl: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  whatsapp: string | null;
  schoolType: string | null;
  operator: string | null;
  /** Derived navigation helper — NOT an official Google Maps source URL. */
  derivedMapsSearchUrl: string | null;
  sourceType: 'OSM';
  sourceName: 'OpenStreetMap';
  sourceUrl: string;
  tags: Record<string, string>;
};

export type OverpassConfig = {
  enabled: boolean;
  apiUrl: string;
  userAgent: string;
  timeoutMs: number;
  maxResults: number;
  concurrency: number;
  maxRetries: number;
  requestDelayMs: number;
  cacheTtlMs: number;
  configured: boolean;
};
