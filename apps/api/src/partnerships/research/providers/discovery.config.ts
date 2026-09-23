export type ResearchDiscoveryMode = 'OVERPASS' | 'WEB_SEARCH' | 'HYBRID' | 'MANUAL' | 'NONE';

export type ResearchDiscoveryConfig = {
  /** Effective discovery mode (env RESEARCH_DISCOVERY_PROVIDER). */
  provider: ResearchDiscoveryMode;
  apiKey: string | null;
  apiUrl: string;
  engine: 'serper' | 'brave';
  /** True when WEB_SEARCH credentials are present. */
  webSearchConfigured: boolean;
  /** True when Overpass is enabled (no API key required). */
  overpassConfigured: boolean;
  /** Backward-compatible: web search credentials present AND provider wants web search. */
  configured: boolean;
  timeoutMs: number;
  maxRetries: number;
  concurrency: number;
  requestDelayMs: number;
  enrichmentEnabled: boolean;
  maxPagesPerCandidate: number;
  maxBytesPerPage: number;
  enrichmentTimeoutMs: number;
  cacheTtlMs: number;
};

const DEFAULT_SERPER_URL = 'https://google.serper.dev/search';
const DEFAULT_BRAVE_URL = 'https://api.search.brave.com/res/v1/web/search';

export function loadResearchDiscoveryConfig(
  env: NodeJS.ProcessEnv = process.env,
): ResearchDiscoveryConfig {
  const rawProvider = (env.RESEARCH_DISCOVERY_PROVIDER ?? 'HYBRID').trim().toUpperCase();
  const provider: ResearchDiscoveryMode =
    rawProvider === 'WEB_SEARCH'
      ? 'WEB_SEARCH'
      : rawProvider === 'OVERPASS'
        ? 'OVERPASS'
        : rawProvider === 'HYBRID'
          ? 'HYBRID'
          : rawProvider === 'MANUAL'
            ? 'MANUAL'
            : 'NONE';

  const engineRaw = (env.RESEARCH_DISCOVERY_ENGINE ?? 'serper').trim().toLowerCase();
  const engine = engineRaw === 'brave' ? 'brave' : 'serper';

  const apiKey = env.RESEARCH_DISCOVERY_API_KEY?.trim() || null;
  const apiUrl =
    env.RESEARCH_DISCOVERY_API_URL?.trim() ||
    (engine === 'brave' ? DEFAULT_BRAVE_URL : DEFAULT_SERPER_URL);

  const webSearchConfigured = Boolean(apiKey);
  const overpassEnabled =
    (env.RESEARCH_OVERPASS_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
  const overpassConfigured = overpassEnabled;

  const configured =
    provider === 'WEB_SEARCH'
      ? webSearchConfigured
      : provider === 'OVERPASS'
        ? overpassConfigured
        : provider === 'HYBRID'
          ? overpassConfigured || webSearchConfigured
          : false;

  return {
    provider,
    apiKey,
    apiUrl,
    engine,
    webSearchConfigured,
    overpassConfigured,
    configured,
    timeoutMs: clampInt(env.RESEARCH_DISCOVERY_TIMEOUT_MS, 15000, 3000, 60000),
    maxRetries: clampInt(env.RESEARCH_DISCOVERY_MAX_RETRIES, 2, 0, 5),
    concurrency: clampInt(env.RESEARCH_DISCOVERY_CONCURRENCY, 2, 1, 5),
    requestDelayMs: clampInt(env.RESEARCH_DISCOVERY_REQUEST_DELAY_MS, 250, 0, 5000),
    enrichmentEnabled: env.RESEARCH_ENRICHMENT_ENABLED === 'true',
    maxPagesPerCandidate: clampInt(env.RESEARCH_ENRICHMENT_MAX_PAGES, 2, 0, 5),
    maxBytesPerPage: clampInt(env.RESEARCH_ENRICHMENT_MAX_BYTES, 200_000, 10_000, 500_000),
    enrichmentTimeoutMs: clampInt(env.RESEARCH_ENRICHMENT_TIMEOUT_MS, 8000, 2000, 20000),
    cacheTtlMs: clampInt(env.RESEARCH_DISCOVERY_CACHE_TTL_MS, 15 * 60_000, 0, 24 * 60 * 60_000),
  };
}

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
