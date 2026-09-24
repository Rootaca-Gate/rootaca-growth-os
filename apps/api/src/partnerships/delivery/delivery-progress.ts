/**
 * Delivery progress — computed only from execution entities.
 * Empty dimensions are skipped so overall is never a manual invented %.
 */
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

export type DeliveryProgressResult = {
  overallPercent: number | null;
  phasePercent: number | null;
  milestonePercent: number | null;
  taskPercent: number | null;
  sessionPercent: number | null;
  deliverablePercent: number | null;
  dimensionsUsed: string[];
};

function ratio(completed: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((completed / total) * 1000) / 10;
}

export function computeDeliveryProgress(input: DeliveryProgressInput): DeliveryProgressResult {
  const phasePercent = ratio(input.phasesCompleted, input.phasesTotal);
  const milestonePercent = ratio(input.milestonesCompleted, input.milestonesTotal);
  const taskPercent = ratio(input.tasksCompleted, input.tasksTotal);
  const sessionPercent = ratio(input.sessionsCompleted, input.sessionsTotal);
  const deliverablePercent = ratio(input.deliverablesAccepted, input.deliverablesTotal);

  const parts: Array<{ key: string; value: number }> = [];
  if (phasePercent !== null) parts.push({ key: 'phases', value: phasePercent });
  if (milestonePercent !== null) parts.push({ key: 'milestones', value: milestonePercent });
  if (taskPercent !== null) parts.push({ key: 'tasks', value: taskPercent });
  if (sessionPercent !== null) parts.push({ key: 'sessions', value: sessionPercent });
  if (deliverablePercent !== null) parts.push({ key: 'deliverables', value: deliverablePercent });

  const overallPercent =
    parts.length === 0
      ? null
      : Math.round((parts.reduce((sum, p) => sum + p.value, 0) / parts.length) * 10) / 10;

  return {
    overallPercent,
    phasePercent,
    milestonePercent,
    taskPercent,
    sessionPercent,
    deliverablePercent,
    dimensionsUsed: parts.map((p) => p.key),
  };
}

export type CompletionChecklist = {
  requiredMilestonesCompleted: boolean;
  requiredDeliverablesAccepted: boolean;
  requiredSessionsCompleted: boolean;
  finalReportReady: boolean;
  canComplete: boolean;
  details: {
    milestonesRequired: number;
    milestonesCompleted: number;
    deliverablesRequired: number;
    deliverablesAccepted: number;
    sessionsRequired: number;
    sessionsCompleted: number;
    finalReportRequired: boolean;
    finalReportPresent: boolean;
  };
};

export function buildCompletionChecklist(params: {
  milestones: Array<{ requiredForCompletion: boolean; status: string }>;
  deliverables: Array<{ requiredForCompletion: boolean; status: string }>;
  sessions: Array<{ status: string }>;
  finalReportRequired: boolean;
  hasFinalReport: boolean;
}): CompletionChecklist {
  const requiredMilestones = params.milestones.filter((m) => m.requiredForCompletion);
  const milestonesCompleted = requiredMilestones.filter((m) => m.status === 'COMPLETED').length;
  const requiredMilestonesCompleted =
    requiredMilestones.length === 0 || milestonesCompleted === requiredMilestones.length;

  const requiredDeliverables = params.deliverables.filter((d) => d.requiredForCompletion);
  const deliverablesAccepted = requiredDeliverables.filter((d) => d.status === 'ACCEPTED').length;
  const requiredDeliverablesAccepted =
    requiredDeliverables.length === 0 || deliverablesAccepted === requiredDeliverables.length;

  const sessionsRequired = params.sessions.length;
  const sessionsCompleted = params.sessions.filter((s) => s.status === 'COMPLETED').length;
  // If no sessions scheduled yet, do not block completion on sessions.
  const requiredSessionsCompleted =
    sessionsRequired === 0 || sessionsCompleted === sessionsRequired;

  const finalReportReady = !params.finalReportRequired || params.hasFinalReport;

  return {
    requiredMilestonesCompleted,
    requiredDeliverablesAccepted,
    requiredSessionsCompleted,
    finalReportReady,
    canComplete:
      requiredMilestonesCompleted &&
      requiredDeliverablesAccepted &&
      requiredSessionsCompleted &&
      finalReportReady,
    details: {
      milestonesRequired: requiredMilestones.length,
      milestonesCompleted,
      deliverablesRequired: requiredDeliverables.length,
      deliverablesAccepted,
      sessionsRequired,
      sessionsCompleted,
      finalReportRequired: params.finalReportRequired,
      finalReportPresent: params.hasFinalReport,
    },
  };
}
