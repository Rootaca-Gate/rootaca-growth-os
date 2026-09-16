const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationToMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());

  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid duration "${value}". Use values like 15m, 7d, or 3600s.`);
  }

  return Number(match[1]) * UNIT_TO_MS[match[2]];
}

export function parseDurationToSeconds(value: string): number {
  return Math.floor(parseDurationToMs(value) / 1000);
}
