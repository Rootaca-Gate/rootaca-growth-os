import { DimensionKey, ReviewKind } from './progress.models';

export const REVIEW_KINDS: ReviewKind[] = ['INITIAL_ASSESSMENT', 'MONTHLY_REVIEW'];

export const REVIEW_KIND_LABELS: Record<ReviewKind, string> = {
  INITIAL_ASSESSMENT: 'Initial Assessment',
  MONTHLY_REVIEW: 'Monthly Review',
};

export const DIMENSION_KEYS: DimensionKey[] = [
  'technicalSkills',
  'problemSolving',
  'projects',
  'independence',
  'communication',
];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  technicalSkills: 'Technical Skills',
  problemSolving: 'Problem Solving',
  projects: 'Projects',
  independence: 'Independence',
  communication: 'Communication',
};

export function formatGrowth(value: number | null): string {
  if (value === null) {
    return '—';
  }
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}
