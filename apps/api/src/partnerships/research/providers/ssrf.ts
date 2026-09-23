import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
]);

/**
 * SSRF-safe URL validation for optional website enrichment.
 * Allows only http/https public hosts — never localhost, private IPs, or metadata endpoints.
 */
export function assertSafePublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed');
  }

  if (url.username || url.password) {
    throw new Error('URLs with credentials are not allowed');
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) {
    throw new Error('Localhost URLs are not allowed');
  }

  if (hostname === '169.254.169.254' || hostname.startsWith('metadata.')) {
    throw new Error('Metadata endpoints are not allowed');
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Private IP addresses are not allowed');
    }
  } else if (hostname.includes(':')) {
    // IPv6 literal already handled via isIP after bracket strip
    throw new Error('Unsupported host');
  }

  return url;
}

export async function assertResolvedPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new Error('Localhost URLs are not allowed');
  }

  if (isIP(host)) {
    if (isPrivateIp(host)) {
      throw new Error('Private IP addresses are not allowed');
    }
    return;
  }

  let addresses: string[];
  try {
    const result = await lookup(host, { all: true });
    addresses = result.map((item) => item.address);
  } catch {
    throw new Error('Unable to resolve host');
  }

  for (const address of addresses) {
    if (isPrivateIp(address)) {
      throw new Error('Host resolves to a private address');
    }
  }
}

export function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const normalized = ip.toLowerCase();
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized === '::'
    );
  }

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}
