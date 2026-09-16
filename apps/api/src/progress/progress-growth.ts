import { clampPercent } from '../roadmap/roadmap-progress';

export const REVIEW_DIMENSIONS = [
  { key: 'technicalSkills', label: 'Technical Skills' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'projects', label: 'Projects' },
  { key: 'independence', label: 'Independence' },
  { key: 'communication', label: 'Communication' },
] as const;

export type DimensionKey = (typeof REVIEW_DIMENSIONS)[number]['key'];

export type DimensionScores = Record<DimensionKey, number>;

export type ScoreGrowth = {
  currentScore: number;
  previousScore: number | null;
  growth: number | null;
};

export function clampScore(value: number): number {
  return clampPercent(value);
}

export function overallReviewScore(scores: DimensionScores): number {
  const total = REVIEW_DIMENSIONS.reduce((sum, item) => sum + clampScore(scores[item.key]), 0);
  return clampScore(total / REVIEW_DIMENSIONS.length);
}

export function scoreGrowth(current: number, previous: number | null | undefined): ScoreGrowth {
  const currentScore = clampScore(current);
  if (previous === null || previous === undefined) {
    return { currentScore, previousScore: null, growth: null };
  }
  const previousScore = clampScore(previous);
  return {
    currentScore,
    previousScore,
    growth: currentScore - previousScore,
  };
}

export function dimensionGrowth(
  current: DimensionScores,
  previous: DimensionScores | null,
): Array<{ key: DimensionKey; label: string } & ScoreGrowth> {
  return REVIEW_DIMENSIONS.map((item) => ({
    key: item.key,
    label: item.label,
    ...scoreGrowth(current[item.key], previous ? previous[item.key] : null),
  }));
}

export function scoresFromReview(item: DimensionScores): DimensionScores {
  return {
    technicalSkills: clampScore(item.technicalSkills),
    problemSolving: clampScore(item.problemSolving),
    projects: clampScore(item.projects),
    independence: clampScore(item.independence),
    communication: clampScore(item.communication),
  };
}
