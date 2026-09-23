import { DiscoveryProviderError, type DiscoveryErrorCode } from '../discovery.errors';

export class OverpassError extends DiscoveryProviderError {
  constructor(
    code: DiscoveryErrorCode,
    message: string,
    options?: { retryable?: boolean; statusCode?: number; cause?: unknown },
  ) {
    super(code, message, options);
    this.name = 'OverpassError';
  }
}

export function assertSafeOverpassFragment(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new OverpassError('PROVIDER_ERROR', `${field} cannot be empty`);
  }
  if (/["\\\n\r\t]/.test(trimmed) || /[;{}[\]]/.test(trimmed)) {
    throw new OverpassError('PROVIDER_ERROR', `Invalid characters in ${field}`);
  }
  if (trimmed.length > 120) {
    throw new OverpassError('PROVIDER_ERROR', `${field} is too long`);
  }
  return trimmed;
}
