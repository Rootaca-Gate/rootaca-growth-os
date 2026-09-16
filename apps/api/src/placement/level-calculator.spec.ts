import { LevelCode } from '@prisma/client';
import { LEVEL_CATALOG } from './catalog/placement-catalog';
import { calculateLevel } from './level-calculator';

const rules = LEVEL_CATALOG.map((level) => ({
  code: level.code,
  name: level.name,
  minScore: level.minScore,
  maxScore: level.maxScore,
  sortOrder: level.sortOrder,
}));

describe('level calculator', () => {
  it('keeps thresholds database-shaped and contiguous', () => {
    expect(rules.map((rule) => [rule.minScore, rule.maxScore])).toEqual([
      [0, 29],
      [30, 49],
      [50, 69],
      [70, 84],
      [85, 100],
    ]);
  });

  it.each([
    [0, LevelCode.EXPLORER],
    [29, LevelCode.EXPLORER],
    [29.9, LevelCode.EXPLORER],
    [30, LevelCode.BEGINNER],
    [49, LevelCode.BEGINNER],
    [50, LevelCode.FOUNDATION],
    [69, LevelCode.FOUNDATION],
    [70, LevelCode.INTERMEDIATE],
    [84, LevelCode.INTERMEDIATE],
    [85, LevelCode.ADVANCED],
    [100, LevelCode.ADVANCED],
  ])('maps %s to %s', (score, code) => {
    expect(calculateLevel(score, rules).code).toBe(code);
  });

  it('falls back to explorer below the lowest rule', () => {
    expect(calculateLevel(-10, rules).code).toBe(LevelCode.EXPLORER);
  });

  it('falls back to advanced above the highest rule', () => {
    expect(calculateLevel(140, rules).code).toBe(LevelCode.ADVANCED);
  });
});
