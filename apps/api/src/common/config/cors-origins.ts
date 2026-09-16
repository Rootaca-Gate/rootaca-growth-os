export const DEFAULT_CORS_ORIGINS = [
  'http://localhost:4200',
  'https://rootaca-admin.web.app',
  'https://rootaca-admin.firebaseapp.com',
] as const;

export function mergeCorsOrigins(value: string | undefined): string[] {
  const origins = new Set<string>(DEFAULT_CORS_ORIGINS);
  for (const origin of (value ?? '').split(',')) {
    const trimmed = origin.trim();
    if (trimmed) {
      origins.add(trimmed);
    }
  }
  return [...origins];
}

export function isAllowedCorsOrigin(origin: string | undefined, allowlist: string[]): boolean {
  if (!origin) {
    return true;
  }
  return allowlist.includes(origin);
}
