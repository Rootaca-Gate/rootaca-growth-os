import { RoadmapItemStatus } from '@prisma/client';

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function itemProgressPercent(item: {
  status: RoadmapItemStatus;
  completionPercentage: number;
}): number {
  if (item.status === RoadmapItemStatus.COMPLETED) {
    return 100;
  }
  if (item.status === RoadmapItemStatus.NOT_STARTED) {
    return 0;
  }
  return clampPercent(item.completionPercentage);
}

export function averagePercent(
  items: Array<{ status: RoadmapItemStatus; completionPercentage: number }>,
): number {
  if (items.length === 0) {
    return 0;
  }
  const total = items.reduce((sum, item) => sum + itemProgressPercent(item), 0);
  return clampPercent(total / items.length);
}

export function normalizeItemProgress(input: {
  status?: RoadmapItemStatus;
  completionPercentage?: number;
  currentStatus: RoadmapItemStatus;
  currentPercent: number;
}): { status: RoadmapItemStatus; completionPercentage: number } {
  const requested =
    input.completionPercentage === undefined
      ? input.currentPercent
      : clampPercent(input.completionPercentage);

  if (input.status === undefined && input.completionPercentage !== undefined) {
    if (input.currentStatus === RoadmapItemStatus.BLOCKED) {
      return { status: RoadmapItemStatus.BLOCKED, completionPercentage: requested };
    }
    if (requested >= 100) {
      return { status: RoadmapItemStatus.COMPLETED, completionPercentage: 100 };
    }
    if (requested <= 0) {
      return { status: RoadmapItemStatus.NOT_STARTED, completionPercentage: 0 };
    }
    return { status: RoadmapItemStatus.IN_PROGRESS, completionPercentage: requested };
  }

  const status = input.status ?? input.currentStatus;

  if (status === RoadmapItemStatus.COMPLETED) {
    return { status, completionPercentage: 100 };
  }

  if (status === RoadmapItemStatus.NOT_STARTED) {
    return { status, completionPercentage: 0 };
  }

  if (status === RoadmapItemStatus.BLOCKED) {
    return { status, completionPercentage: requested };
  }

  return {
    status: RoadmapItemStatus.IN_PROGRESS,
    completionPercentage: requested <= 0 ? 10 : requested,
  };
}

export function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string): Date {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date ${value}`);
  }
  return date;
}

export function addUtcDays(value: Date, days: number): Date {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
