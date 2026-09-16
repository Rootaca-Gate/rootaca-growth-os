import {
  KpiStatus,
  OrientationSessionStatus,
  OrientationStage,
  PathCode,
  RoadmapItemStatus,
  StudentLevel,
} from '@prisma/client';
import { addUtcDays, startOfUtcDay, startOfUtcMonth } from '../kpi/kpi-math';

export const ATTENTION_LIMIT = 8;
export const SESSION_LIMIT = 8;
export const MONTHS_BACK = 6;
export const INACTIVITY_DAYS = 14;

export const INTAKE_LEVEL_LABELS: Record<StudentLevel, string> = {
  FOUNDATION: 'Foundation',
  JUNIOR: 'Junior',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export const PATH_LABELS: Record<PathCode, string> = {
  WEB: 'Web',
  MOBILE: 'Mobile',
  DATA: 'Data',
  GAME: 'Game',
  GENERAL: 'General',
};

export const KPI_STATUS_ORDER: KpiStatus[] = [
  KpiStatus.ON_TRACK,
  KpiStatus.AT_RISK,
  KpiStatus.BEHIND,
  KpiStatus.COMPLETED,
];

export const KPI_STATUS_LABELS: Record<KpiStatus, string> = {
  ON_TRACK: 'On track',
  AT_RISK: 'At risk',
  BEHIND: 'Behind',
  COMPLETED: 'Completed',
};

export const SESSION_STATUS_LABELS: Record<OrientationSessionStatus, string> = {
  DRAFT: 'Scheduled',
  IN_PROGRESS: 'In progress',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
};

export const STAGE_LABELS: Record<OrientationStage, string> = {
  STUDENT_PROFILE: 'Student Profile',
  TECHNICAL_CHECK: 'Technical Check',
  PROBLEM_SOLVING: 'Problem Solving',
  INTEREST_PATH: 'Interest & Path',
  SUMMARY: 'Summary',
};

export const INTAKE_LEVEL_ORDER: StudentLevel[] = [
  StudentLevel.FOUNDATION,
  StudentLevel.JUNIOR,
  StudentLevel.INTERMEDIATE,
  StudentLevel.ADVANCED,
];

export const PATH_ORDER: PathCode[] = [
  PathCode.WEB,
  PathCode.MOBILE,
  PathCode.DATA,
  PathCode.GAME,
  PathCode.GENERAL,
];

export type ChartBucket = {
  key: string;
  label: string;
  count: number;
};

export type ScoreBucket = {
  key: string;
  label: string;
  score: number;
  sampleSize: number;
};

export type MonthlyPoint = {
  month: string;
  label: string;
  average: number | null;
  reviewCount: number;
};

export type AttentionItem = {
  studentId: string;
  studentName: string;
  detail: string;
  href: string;
  inactiveDays?: number | null;
};

export type DashboardStudentRow = {
  studentId: string;
  studentName: string;
  level: string;
  path: string;
  progress: number | null;
  skillScore: number | null;
  kpiBelowCount: number;
  lastActivityAt: string | null;
  lastActivityLabel: string;
  status: string;
  href: string;
};

export type DashboardActivityItem = {
  studentId: string;
  studentName: string;
  occurredAt: string;
  title: string;
  href: string;
};

export function averageLatestProgress(
  reviews: Array<{ studentId: string; overallScore: number; reviewedAt: Date }>,
): number | null {
  const latest = new Map<string, { score: number; at: number }>();
  for (const review of reviews) {
    const at = review.reviewedAt.getTime();
    const current = latest.get(review.studentId);
    if (!current || at > current.at) {
      latest.set(review.studentId, { score: review.overallScore, at });
    }
  }
  if (latest.size === 0) {
    return null;
  }
  const total = [...latest.values()].reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / latest.size);
}

export function isTodaysSession(
  session: {
    status: OrientationSessionStatus;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  },
  todayStart: Date,
  tomorrow: Date,
): boolean {
  if (
    session.status === OrientationSessionStatus.IN_PROGRESS ||
    session.status === OrientationSessionStatus.PAUSED
  ) {
    return true;
  }
  return (
    inRange(session.startedAt, todayStart, tomorrow) ||
    inRange(session.completedAt, todayStart, tomorrow) ||
    inRange(session.createdAt, todayStart, tomorrow)
  );
}

export function monthlyProgress(
  reviews: Array<{ reviewedAt: Date; overallScore: number }>,
  now: Date,
): MonthlyPoint[] {
  const start = startOfUtcMonth(now);
  start.setUTCMonth(start.getUTCMonth() - (MONTHS_BACK - 1));
  const buckets = new Map<string, { total: number; count: number }>();
  for (const review of reviews) {
    const key = monthKey(review.reviewedAt);
    const current = buckets.get(key) ?? { total: 0, count: 0 };
    current.total += review.overallScore;
    current.count += 1;
    buckets.set(key, current);
  }
  return Array.from({ length: MONTHS_BACK }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const key = monthKey(date);
    const bucket = buckets.get(key);
    return {
      month: key,
      label: monthLabel(date),
      average: bucket && bucket.count > 0 ? Math.round(bucket.total / bucket.count) : null,
      reviewCount: bucket?.count ?? 0,
    };
  });
}

export function groupNamedCounts(
  items: Array<{ key: string; label: string; sortOrder: number }>,
): ChartBucket[] {
  const counts = new Map<string, { label: string; count: number; sortOrder: number }>();
  for (const item of items) {
    const current = counts.get(item.key);
    if (current) {
      current.count += 1;
      continue;
    }
    counts.set(item.key, { label: item.label, count: 1, sortOrder: item.sortOrder });
  }
  return [...counts.entries()]
    .sort(
      (left, right) => left[1].sortOrder - right[1].sortOrder || left[0].localeCompare(right[0]),
    )
    .map(([key, value]) => ({ key, label: value.label, count: value.count }));
}

export function kpiStatusBuckets(counts: Map<KpiStatus, number>): ChartBucket[] {
  return KPI_STATUS_ORDER.map((status) => ({
    key: status,
    label: KPI_STATUS_LABELS[status],
    count: counts.get(status) ?? 0,
  }));
}

export function roadmapBehindCounts(
  items: Array<{ dueDate: Date | null; status: RoadmapItemStatus }>,
  todayStart: Date,
): { overdue: number; blocked: number } {
  let overdue = 0;
  let blocked = 0;
  for (const item of items) {
    if (item.status === RoadmapItemStatus.BLOCKED) {
      blocked += 1;
    }
    if (
      item.dueDate &&
      item.dueDate.getTime() < todayStart.getTime() &&
      item.status !== RoadmapItemStatus.COMPLETED
    ) {
      overdue += 1;
    }
  }
  return { overdue, blocked };
}

export function lastActivityAt(dates: Array<Date | null | undefined>): Date | null {
  let latest: Date | null = null;
  for (const date of dates) {
    if (!date) {
      continue;
    }
    if (!latest || date.getTime() > latest.getTime()) {
      latest = date;
    }
  }
  return latest;
}

export function isInactive(lastActivity: Date | null, cutoff: Date): boolean {
  return lastActivity === null || lastActivity.getTime() < cutoff.getTime();
}

export function activityCutoff(now: Date): Date {
  return addUtcDays(startOfUtcDay(now), -INACTIVITY_DAYS);
}

export function weekCutoff(now: Date): Date {
  return addUtcDays(startOfUtcDay(now), -7);
}

export function daysSince(value: Date | null, now: Date): number | null {
  if (!value) {
    return null;
  }
  return Math.max(
    0,
    Math.floor((startOfUtcDay(now).getTime() - startOfUtcDay(value).getTime()) / 86_400_000),
  );
}

export function activityLabel(lastActivity: Date | null, now: Date): string {
  const days = daysSince(lastActivity, now);
  if (days === null) {
    return 'No recent activity';
  }
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  return `${days} days ago`;
}

export function averageSkillScore(scores: number[]): number | null {
  if (scores.length === 0) {
    return null;
  }
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function todayBounds(now: Date): { todayStart: Date; tomorrow: Date } {
  const todayStart = startOfUtcDay(now);
  return { todayStart, tomorrow: addUtcDays(todayStart, 1) };
}

export function capItems<T>(items: T[], limit = ATTENTION_LIMIT): T[] {
  return items.slice(0, limit);
}

function inRange(value: Date | null, start: Date, end: Date): boolean {
  return Boolean(value && value.getTime() >= start.getTime() && value.getTime() < end.getTime());
}

function monthKey(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(value: Date): string {
  return value.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
