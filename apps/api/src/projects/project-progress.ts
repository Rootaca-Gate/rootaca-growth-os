import { MilestoneStatus, StudentProjectStatus } from '@prisma/client';
import { clampPercent } from '../roadmap/roadmap-progress';

export function milestoneProgressPercent(item: {
  status: MilestoneStatus;
  completionPercent: number;
}): number {
  if (item.status === MilestoneStatus.COMPLETED) {
    return 100;
  }
  if (item.status === MilestoneStatus.NOT_STARTED) {
    return 0;
  }
  return clampPercent(item.completionPercent);
}

export function projectOverallPercent(
  milestones: Array<{ status: MilestoneStatus; completionPercent: number }>,
): number {
  if (milestones.length === 0) {
    return 0;
  }
  const total = milestones.reduce((sum, item) => sum + milestoneProgressPercent(item), 0);
  return clampPercent(total / milestones.length);
}

export function deriveStudentProjectStatus(input: {
  current: StudentProjectStatus;
  requested?: StudentProjectStatus;
  overallPercent: number;
}): StudentProjectStatus {
  if (input.requested) {
    return input.requested;
  }
  if (input.current === StudentProjectStatus.ON_HOLD) {
    return StudentProjectStatus.ON_HOLD;
  }
  if (input.overallPercent >= 100) {
    return StudentProjectStatus.COMPLETED;
  }
  if (input.overallPercent > 0) {
    return StudentProjectStatus.IN_PROGRESS;
  }
  return StudentProjectStatus.ASSIGNED;
}

export function normalizeMilestoneProgress(input: {
  status?: MilestoneStatus;
  completionPercent?: number;
  currentStatus: MilestoneStatus;
  currentPercent: number;
}): { status: MilestoneStatus; completionPercent: number } {
  const requested =
    input.completionPercent === undefined
      ? input.currentPercent
      : clampPercent(input.completionPercent);

  if (input.status === undefined && input.completionPercent !== undefined) {
    if (input.currentStatus === MilestoneStatus.BLOCKED) {
      return { status: MilestoneStatus.BLOCKED, completionPercent: requested };
    }
    if (requested >= 100) {
      return { status: MilestoneStatus.COMPLETED, completionPercent: 100 };
    }
    if (requested <= 0) {
      return { status: MilestoneStatus.NOT_STARTED, completionPercent: 0 };
    }
    return { status: MilestoneStatus.IN_PROGRESS, completionPercent: requested };
  }

  const status = input.status ?? input.currentStatus;

  if (status === MilestoneStatus.COMPLETED) {
    return { status, completionPercent: 100 };
  }
  if (status === MilestoneStatus.NOT_STARTED) {
    return { status, completionPercent: 0 };
  }
  if (status === MilestoneStatus.BLOCKED) {
    return { status, completionPercent: requested };
  }
  return {
    status: MilestoneStatus.IN_PROGRESS,
    completionPercent: requested <= 0 ? 10 : requested,
  };
}
