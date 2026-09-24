/**
 * Frontend mirror of the API equal-weight, empty-skip progress calculation
 * (apps/api/src/partnerships/delivery/delivery-progress.ts).
 *
 * Used only for live display while editing the plan before the server
 * recomputes authoritative values. Empty dimensions are skipped so the overall
 * figure is never an invented percentage.
 */
import {
  DeliveryProgress,
  ProgressDimension,
} from './delivery.models';

export type DeliveryProgressInput = {
  phasesTotal: number;
  phasesCompleted: number;
  milestonesTotal: number;
  milestonesCompleted: number;
  tasksTotal: number;
  tasksCompleted: number;
  sessionsTotal: number;
  sessionsCompleted: number;
  deliverablesTotal: number;
  deliverablesAccepted: number;
};

function dimension(completed: number, total: number): ProgressDimension {
  const ratio = total > 0 ? Math.round((completed / total) * 1000) / 10 : null;
  return { completed, total, ratio };
}

/**
 * Compute the equal-weight, empty-skip delivery progress from raw counts.
 * Mirrors the server logic so the UI stays consistent before a save round-trip.
 */
export function computeDeliveryProgress(input: DeliveryProgressInput): DeliveryProgress {
  const phaseProgress = dimension(input.phasesCompleted, input.phasesTotal);
  const milestoneProgress = dimension(input.milestonesCompleted, input.milestonesTotal);
  const taskProgress = dimension(input.tasksCompleted, input.tasksTotal);
  const sessionProgress = dimension(input.sessionsCompleted, input.sessionsTotal);
  const deliverableProgress = dimension(input.deliverablesAccepted, input.deliverablesTotal);

  const parts: Array<{ key: string; value: number }> = [];
  if (phaseProgress.ratio !== null) parts.push({ key: 'phases', value: phaseProgress.ratio });
  if (milestoneProgress.ratio !== null)
    parts.push({ key: 'milestones', value: milestoneProgress.ratio });
  if (taskProgress.ratio !== null) parts.push({ key: 'tasks', value: taskProgress.ratio });
  if (sessionProgress.ratio !== null) parts.push({ key: 'sessions', value: sessionProgress.ratio });
  if (deliverableProgress.ratio !== null)
    parts.push({ key: 'deliverables', value: deliverableProgress.ratio });

  const overallPercent =
    parts.length === 0
      ? 0
      : Math.round((parts.reduce((sum, p) => sum + p.value, 0) / parts.length) * 10) / 10;

  return {
    phaseProgress,
    milestoneProgress,
    taskProgress,
    sessionProgress,
    deliverableProgress,
    overall: Math.round(overallPercent) / 100,
    overallPercent,
    dimensionsCounted: parts.map((p) => p.key),
  };
}
