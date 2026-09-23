import type { ResearchDiscoveryConfig } from './discovery.config';
import { loadResearchDiscoveryConfig } from './discovery.config';
import {
  ManualDiscoveryProvider,
  ResearchDiscoveryProvider,
  UnconfiguredWebSearchProvider,
} from './discovery.provider';
import { OverpassClient } from './overpass/overpass.client';
import {
  loadOverpassConfig,
  OverpassDiscoveryProvider,
} from './overpass/overpass.provider';
import type { OverpassConfig } from './overpass/overpass.types';
import { WebSearchClient } from './web-search/web-search.client';
import { WebSearchDiscoveryProvider } from './web-search/web-search.provider';
import { WebsiteEnrichmentService } from './website-enrichment';
import { FreeContactLookupService } from './free-contact-lookup';

export type ResearchProviderBundle = {
  config: ResearchDiscoveryConfig;
  overpassConfig: OverpassConfig;
  manual: ManualDiscoveryProvider;
  webSearch: ResearchDiscoveryProvider;
  overpass: OverpassDiscoveryProvider;
  enrichment: WebsiteEnrichmentService;
  freeLookup: FreeContactLookupService;
};

export function createResearchProviderBundle(
  env: NodeJS.ProcessEnv = process.env,
  options?: {
    fetchImpl?: typeof fetch;
    sleep?: (ms: number) => Promise<void>;
  },
): ResearchProviderBundle {
  const config = loadResearchDiscoveryConfig(env);
  const overpassConfig = loadOverpassConfig(env);
  const manual = new ManualDiscoveryProvider();

  let webSearch: ResearchDiscoveryProvider;
  if (config.webSearchConfigured) {
    const client = new WebSearchClient(config, {
      fetchImpl: options?.fetchImpl,
      sleep: options?.sleep,
    });
    webSearch = new WebSearchDiscoveryProvider(config, client);
  } else {
    webSearch = new UnconfiguredWebSearchProvider();
  }

  const overpassClient = new OverpassClient(overpassConfig, {
    fetchImpl: options?.fetchImpl,
    sleep: options?.sleep,
  });
  const overpass = new OverpassDiscoveryProvider(overpassConfig, overpassClient);

  const enrichment = new WebsiteEnrichmentService(config, options?.fetchImpl);
  const freeLookup = new FreeContactLookupService(options?.fetchImpl);

  return { config, overpassConfig, manual, webSearch, overpass, enrichment, freeLookup };
}

export function listProviderStatuses(
  config: ResearchDiscoveryConfig,
  overpassConfig: OverpassConfig,
): Array<{
  type: string;
  configured: boolean;
  enabled: boolean;
  requiresKey?: boolean;
  provider?: string;
  role?: string;
  free?: boolean;
}> {
  const mode = config.provider;
  const overpassActive = mode === 'OVERPASS' || mode === 'HYBRID';
  const webSearchActive = mode === 'WEB_SEARCH' || mode === 'HYBRID';

  return [
    {
      type: 'MANUAL',
      configured: true,
      enabled: true,
      requiresKey: false,
      role: 'manual_entry',
    },
    {
      type: 'OPENSTREETMAP_OVERPASS',
      configured: overpassConfig.configured,
      enabled: overpassConfig.enabled && overpassActive,
      requiresKey: false,
      provider: 'OPENSTREETMAP_OVERPASS',
      role: 'discovery',
      free: true,
    },
    {
      type: 'WEB_SEARCH',
      configured: config.webSearchConfigured,
      enabled: config.webSearchConfigured && webSearchActive,
      requiresKey: true,
      provider: config.engine === 'brave' ? 'BRAVE' : 'SERPER',
      role: mode === 'HYBRID' ? 'enrichment' : 'discovery',
      free: false,
    },
  ];
}

/** Resolve job-level or env discovery mode. */
export function resolveDiscoveryMode(
  jobMode: string | null | undefined,
  envMode: ResearchDiscoveryConfig['provider'],
): 'OVERPASS' | 'WEB_SEARCH' | 'HYBRID' {
  const raw = (jobMode ?? envMode ?? 'HYBRID').toUpperCase();
  if (raw === 'OVERPASS') return 'OVERPASS';
  if (raw === 'WEB_SEARCH') return 'WEB_SEARCH';
  return 'HYBRID';
}
