export type DiscoveryErrorCode =
  | 'NOT_CONFIGURED'
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'PROVIDER_ERROR'
  | 'INVALID_RESPONSE'
  | 'NETWORK_ERROR';

export class DiscoveryProviderError extends Error {
  readonly code: DiscoveryErrorCode;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(
    code: DiscoveryErrorCode,
    message: string,
    options?: { retryable?: boolean; statusCode?: number; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = 'DiscoveryProviderError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.statusCode = options?.statusCode;
  }

  /** Safe message for API / job.errorMessage — never includes secrets. */
  toPublicMessage(): string {
    switch (this.code) {
      case 'NOT_CONFIGURED':
        return 'Research discovery provider is not configured.';
      case 'AUTHENTICATION_ERROR':
        return 'Research discovery provider authentication failed. Check API credentials.';
      case 'RATE_LIMITED':
        return 'Research discovery provider rate limit reached. Retry later.';
      case 'TIMEOUT':
        return 'Research discovery provider request timed out.';
      case 'INVALID_RESPONSE':
        return 'Research discovery provider returned an invalid response.';
      case 'NETWORK_ERROR':
        return 'Research discovery provider network error.';
      default:
        return 'Research discovery provider error.';
    }
  }
}
