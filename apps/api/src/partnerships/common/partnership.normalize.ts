/**
 * Partnership CRM normalization helpers.
 * Used on create/update (and later import/research). Never invent missing values.
 */

export function normalizeName(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return null;
  }

  return trimmed
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Keep digits (and leading + for international). Strip spaces/dashes/parens.
 * Returns null for empty input — does not invent country codes.
 */
export function normalizePhone(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  return hasPlus ? `+${digits}` : digits;
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

/**
 * Extract hostname without protocol/www/path/query.
 * Accepts bare domains and full URLs.
 */
export function normalizeWebsiteDomain(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const host = new URL(withProtocol).hostname.replace(/^www\./, '');
    return host || null;
  } catch {
    const fallback = trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split(/[/?#]/)[0]
      ?.replace(/\/+$/, '');
    return fallback || null;
  }
}

export function isValidEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidUrlFormat(value: string): boolean {
  try {
    const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
    const url = new URL(withProtocol);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

/** Apply defined patch keys only; skip undefined. Optionally skip empty strings. */
export function pickDefined<T extends Record<string, unknown>>(
  input: T,
  options?: { skipEmptyStrings?: boolean },
): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      continue;
    }
    if (options?.skipEmptyStrings && value === '') {
      continue;
    }
    result[key as keyof T] = value as T[keyof T];
  }
  return result;
}

/**
 * Mitigate spreadsheet formula injection when storing CSV cell values.
 * Preserves leading `+` for international phone numbers.
 */
export function sanitizeSpreadsheetValue(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^[=@\t\r]/.test(trimmed)) {
    return trimmed.replace(/^[=@\t\r]+/, '').trim() || null;
  }
  return trimmed;
}
