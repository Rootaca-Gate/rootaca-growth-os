import { CategoryScore } from './score-engine';

export function buildAssessmentSummary(overallScore: number, categories: CategoryScore[]): string {
  const ranked = [...categories].sort((left, right) => right.score - left.score);
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const band =
    overallScore >= 85
      ? 'an outstanding'
      : overallScore >= 70
        ? 'a strong'
        : overallScore >= 50
          ? 'a developing'
          : 'an emerging';

  const strongestText = strongest
    ? ` Strongest area: ${strongest.name} (${formatScore(strongest.score)}).`
    : '';
  const weakestText =
    weakest && strongest && weakest.code !== strongest.code
      ? ` Focus next: ${weakest.name} (${formatScore(weakest.score)}).`
      : '';

  return `Overall score ${formatScore(overallScore)}/100 indicates ${band} orientation result.${strongestText}${weakestText}`;
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
