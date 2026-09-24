/** Split comma/semicolon skill strings into display tags. */
export function skillTags(raw: string | null | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Admin-facing placeholder for unset / TBD fields — never invent values. */
export function programFieldDisplay(
  value: string | null | undefined,
  emptyLabel = 'TBD',
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return emptyLabel;
  }
  return trimmed;
}
