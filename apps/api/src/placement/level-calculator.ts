import { LevelCode } from '@prisma/client';

export type LevelRuleInput = {
  code: LevelCode;
  name: string;
  minScore: number;
  maxScore: number;
  sortOrder: number;
};

export function calculateLevel(overallScore: number, rules: LevelRuleInput[]): LevelRuleInput {
  const score = Number.isFinite(overallScore) ? overallScore : 0;
  const sorted = [...rules].sort((left, right) => right.minScore - left.minScore);
  const match = sorted.find((rule) => score >= rule.minScore);

  if (match) {
    return match;
  }

  const lowest = [...rules].sort((left, right) => left.sortOrder - right.sortOrder)[0];
  return lowest ?? fallbackExplorer();
}

function fallbackExplorer(): LevelRuleInput {
  return {
    code: LevelCode.EXPLORER,
    name: 'Explorer',
    minScore: 0,
    maxScore: 29,
    sortOrder: 1,
  };
}
