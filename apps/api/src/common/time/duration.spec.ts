import { parseDurationToMs, parseDurationToSeconds } from './duration';

describe('duration', () => {
  it('parses minute and day units', () => {
    expect(parseDurationToMs('15m')).toBe(15 * 60_000);
    expect(parseDurationToSeconds('7d')).toBe(7 * 24 * 60 * 60);
  });

  it('rejects invalid values', () => {
    expect(() => parseDurationToMs('soon')).toThrow(/Invalid duration/);
  });
});
