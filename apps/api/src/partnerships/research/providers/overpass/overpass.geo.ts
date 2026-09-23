/**
 * Safe geographic name aliases for Egypt Overpass area resolution.
 * Reuses English governorate names from research.constants; adds Arabic OSM aliases.
 * Never used for Nominatim bulk crawling.
 */
import { EGYPT_GOVERNORATES } from '../../research.constants';
import type { OverpassGeoTarget } from './overpass.types';
import { assertSafeOverpassFragment } from './overpass.errors';

export type AreaNameCandidate = {
  name: string;
  nameAr?: string;
  adminLevel?: string;
};

/** English + common Arabic OSM names for Egyptian governorates. */
export const GOVERNORATE_OSM_ALIASES: Record<string, AreaNameCandidate> = {
  Cairo: { name: 'Cairo', nameAr: 'القاهرة', adminLevel: '4' },
  Giza: { name: 'Giza', nameAr: 'الجيزة', adminLevel: '4' },
  Alexandria: { name: 'Alexandria', nameAr: 'الإسكندرية', adminLevel: '4' },
  Qalyubia: { name: 'Qalyubia', nameAr: 'القليوبية', adminLevel: '4' },
  Sharqia: { name: 'Sharqia', nameAr: 'الشرقية', adminLevel: '4' },
  Dakahlia: { name: 'Dakahlia', nameAr: 'الدقهلية', adminLevel: '4' },
  Gharbia: { name: 'Gharbia', nameAr: 'الغربية', adminLevel: '4' },
  Monufia: { name: 'Monufia', nameAr: 'المنوفية', adminLevel: '4' },
  Beheira: { name: 'Beheira', nameAr: 'البحيرة', adminLevel: '4' },
  'Kafr El Sheikh': { name: 'Kafr el-Sheikh', nameAr: 'كفر الشيخ', adminLevel: '4' },
  Damietta: { name: 'Damietta', nameAr: 'دمياط', adminLevel: '4' },
  'Port Said': { name: 'Port Said', nameAr: 'بورسعيد', adminLevel: '4' },
  Ismailia: { name: 'Ismailia', nameAr: 'الإسماعيلية', adminLevel: '4' },
  Suez: { name: 'Suez', nameAr: 'السويس', adminLevel: '4' },
  'North Sinai': { name: 'North Sinai', nameAr: 'شمال سيناء', adminLevel: '4' },
  'South Sinai': { name: 'South Sinai', nameAr: 'جنوب سيناء', adminLevel: '4' },
  'Red Sea': { name: 'Red Sea', nameAr: 'البحر الأحمر', adminLevel: '4' },
  Fayoum: { name: 'Faiyum', nameAr: 'الفيوم', adminLevel: '4' },
  'Beni Suef': { name: 'Beni Suef', nameAr: 'بني سويف', adminLevel: '4' },
  Minya: { name: 'Minya', nameAr: 'المنيا', adminLevel: '4' },
  Assiut: { name: 'Asyut', nameAr: 'أسيوط', adminLevel: '4' },
  Sohag: { name: 'Sohag', nameAr: 'سوهاج', adminLevel: '4' },
  Qena: { name: 'Qena', nameAr: 'قنا', adminLevel: '4' },
  Luxor: { name: 'Luxor', nameAr: 'الأقصر', adminLevel: '4' },
  Aswan: { name: 'Aswan', nameAr: 'أسوان', adminLevel: '4' },
  'New Valley': { name: 'New Valley', nameAr: 'الوادي الجديد', adminLevel: '4' },
};

/** Common city / district aliases (El Shorouk etc.). */
export const CITY_OSM_ALIASES: Record<string, AreaNameCandidate> = {
  'el shorouk': { name: 'El Shorouk', nameAr: 'الشروق' },
  shorouk: { name: 'El Shorouk', nameAr: 'الشروق' },
  'new cairo': { name: 'New Cairo', nameAr: 'القاهرة الجديدة' },
  '6th of october': { name: '6th of October', nameAr: 'السادس من أكتوبر' },
  'october': { name: '6th of October', nameAr: 'السادس من أكتوبر' },
  heliopolis: { name: 'Heliopolis', nameAr: 'مصر الجديدة' },
  maadi: { name: 'Maadi', nameAr: 'المعادي' },
  nasr: { name: 'Nasr City', nameAr: 'مدينة نصر' },
  'nasr city': { name: 'Nasr City', nameAr: 'مدينة نصر' },
  zamalek: { name: 'Zamalek', nameAr: 'الزمالك' },
  dokki: { name: 'Dokki', nameAr: 'الدقي' },
  mohandessin: { name: 'Mohandessin', nameAr: 'المهندسين' },
  'sheikh zayed': { name: 'Sheikh Zayed City', nameAr: 'الشيخ زايد' },
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveGovernorateAlias(
  governorate: string | null | undefined,
): AreaNameCandidate | null {
  if (!governorate?.trim()) return null;
  const key = governorate.trim();
  if (GOVERNORATE_OSM_ALIASES[key]) return GOVERNORATE_OSM_ALIASES[key];
  const found = EGYPT_GOVERNORATES.find((g) => normalizeKey(g) === normalizeKey(key));
  if (found && GOVERNORATE_OSM_ALIASES[found]) return GOVERNORATE_OSM_ALIASES[found];
  return { name: assertSafeOverpassFragment(key, 'governorate') };
}

export function resolveCityAlias(city: string | null | undefined): AreaNameCandidate | null {
  if (!city?.trim()) return null;
  const key = normalizeKey(city);
  if (CITY_OSM_ALIASES[key]) return CITY_OSM_ALIASES[key];
  return { name: assertSafeOverpassFragment(city, 'city') };
}

export function resolveDistrictAlias(
  district: string | null | undefined,
): AreaNameCandidate | null {
  if (!district?.trim()) return null;
  const key = normalizeKey(district);
  if (CITY_OSM_ALIASES[key]) return CITY_OSM_ALIASES[key];
  return { name: assertSafeOverpassFragment(district, 'district') };
}

export function resolveOverpassGeoTarget(target: OverpassGeoTarget): {
  primary: AreaNameCandidate;
  fallbacks: AreaNameCandidate[];
  label: string;
} {
  const district = resolveDistrictAlias(target.district);
  const city = resolveCityAlias(target.city);
  const governorate = resolveGovernorateAlias(target.governorate);

  if (district) {
    return {
      primary: district,
      fallbacks: [city, governorate].filter(Boolean) as AreaNameCandidate[],
      label: [target.district, target.city, target.governorate].filter(Boolean).join(', '),
    };
  }
  if (city) {
    return {
      primary: city,
      fallbacks: governorate ? [governorate] : [],
      label: [target.city, target.governorate].filter(Boolean).join(', '),
    };
  }
  if (governorate) {
    return {
      primary: governorate,
      fallbacks: [],
      label: target.governorate ?? governorate.name,
    };
  }

  // Egypt-wide fallback — still a real administrative area, not invented data
  return {
    primary: { name: 'Egypt', nameAr: 'مصر', adminLevel: '2' },
    fallbacks: [],
    label: 'Egypt',
  };
}
