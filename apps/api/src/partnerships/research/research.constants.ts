/** Egyptian governorates for research targeting (coverage targets, not completeness claims). */
export const EGYPT_GOVERNORATES = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Qalyubia',
  'Sharqia',
  'Dakahlia',
  'Gharbia',
  'Monufia',
  'Beheira',
  'Kafr El Sheikh',
  'Damietta',
  'Port Said',
  'Ismailia',
  'Suez',
  'North Sinai',
  'South Sinai',
  'Red Sea',
  'Fayoum',
  'Beni Suef',
  'Minya',
  'Assiut',
  'Sohag',
  'Qena',
  'Luxor',
  'Aswan',
  'New Valley',
] as const;

export type EgyptGovernorate = (typeof EGYPT_GOVERNORATES)[number];

export const RESEARCH_MAX_RESULTS_PER_QUERY = 50;
export const RESEARCH_MAX_QUERIES_DEFAULT = 24;
export const RESEARCH_MAX_CANDIDATES_DEFAULT = 200;
export const RESEARCH_STALE_DAYS = 180;

/** Always available; WEB_SEARCH is added when credentials are configured. */
export const RESEARCH_BASE_PROVIDERS = ['MANUAL'] as const;
