import { ProgressReview, User } from '@prisma/client';
import { toDateOnly } from '../roadmap/roadmap-progress';
import { DimensionGrowthDto, ProgressReviewDto } from './dto/progress-response.dto';
import {
  DimensionScores,
  dimensionGrowth,
  overallReviewScore,
  REVIEW_DIMENSIONS,
  scoreGrowth,
  scoresFromReview,
} from './progress-growth';

export const progressReviewInclude = {
  reviewer: { select: { id: true, displayName: true } },
};

export type ProgressReviewRecord = ProgressReview & {
  reviewer: Pick<User, 'id' | 'displayName'>;
};

export function toScores(item: DimensionScores): DimensionScores {
  return scoresFromReview(item);
}

export function toProgressReviewDto(
  item: ProgressReviewRecord,
  previous: ProgressReviewRecord | null,
): ProgressReviewDto {
  const currentScores = toScores(item);
  const previousScores = previous ? toScores(previous) : null;
  const overall = scoreGrowth(item.overallScore, previous?.overallScore);
  return {
    id: item.id,
    studentId: item.studentId,
    kind: item.kind,
    reviewedAt: toDateOnly(item.reviewedAt),
    periodStart: toDateOnly(item.periodStart),
    periodEnd: toDateOnly(item.periodEnd),
    reviewer: {
      id: item.reviewer.id,
      displayName: item.reviewer.displayName,
    },
    technicalSkills: currentScores.technicalSkills,
    problemSolving: currentScores.problemSolving,
    projects: currentScores.projects,
    independence: currentScores.independence,
    communication: currentScores.communication,
    overallScore: overall.currentScore,
    previousOverallScore: overall.previousScore,
    overallGrowth: overall.growth,
    kpiOverallPercent: item.kpiOverallPercent,
    projectOverallPercent: item.projectOverallPercent,
    notes: item.notes,
    strengths: item.strengths,
    nextFocus: item.nextFocus,
    dimensions: dimensionGrowth(currentScores, previousScores) as DimensionGrowthDto[],
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function withGrowth(items: ProgressReviewRecord[]): ProgressReviewDto[] {
  const chronological = [...items].sort(
    (left, right) => left.reviewedAt.getTime() - right.reviewedAt.getTime(),
  );
  return chronological.map((item, index) =>
    toProgressReviewDto(item, index === 0 ? null : chronological[index - 1]),
  );
}

export function storedOverall(item: DimensionScores): number {
  return overallReviewScore(toScores(item));
}

export function skillSeries(history: ProgressReviewDto[]) {
  const chronological = [...history].sort((left, right) =>
    left.reviewedAt.localeCompare(right.reviewedAt),
  );
  return {
    title: 'Skill Growth',
    labels: chronological.map((item) => item.reviewedAt),
    series: REVIEW_DIMENSIONS.map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      points: chronological.map((item) => item[dimension.key]),
    })),
  };
}
