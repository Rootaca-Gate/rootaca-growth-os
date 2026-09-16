import { KpiStatus, OrientationSessionStatus, RoadmapItemStatus } from '@prisma/client';
import {
  averageLatestProgress,
  isInactive,
  isTodaysSession,
  kpiStatusBuckets,
  lastActivityAt,
  monthlyProgress,
  roadmapBehindCounts,
  todayBounds,
} from './dashboard.math';

describe('dashboard math', () => {
  const now = new Date('2026-09-16T12:00:00.000Z');

  it('averages each student latest overall score', () => {
    expect(
      averageLatestProgress([
        { studentId: 'a', overallScore: 40, reviewedAt: new Date('2026-08-01T00:00:00.000Z') },
        { studentId: 'a', overallScore: 70, reviewedAt: new Date('2026-09-01T00:00:00.000Z') },
        { studentId: 'b', overallScore: 50, reviewedAt: new Date('2026-09-10T00:00:00.000Z') },
      ]),
    ).toBe(60);
    expect(averageLatestProgress([])).toBeNull();
  });

  it('counts live and same-day orientation sessions', () => {
    const { todayStart, tomorrow } = todayBounds(now);
    expect(
      isTodaysSession(
        {
          status: OrientationSessionStatus.IN_PROGRESS,
          startedAt: new Date('2026-09-01T00:00:00.000Z'),
          completedAt: null,
          createdAt: new Date('2026-09-01T00:00:00.000Z'),
        },
        todayStart,
        tomorrow,
      ),
    ).toBe(true);
    expect(
      isTodaysSession(
        {
          status: OrientationSessionStatus.COMPLETED,
          startedAt: new Date('2026-09-16T08:00:00.000Z'),
          completedAt: new Date('2026-09-16T09:00:00.000Z'),
          createdAt: new Date('2026-09-15T00:00:00.000Z'),
        },
        todayStart,
        tomorrow,
      ),
    ).toBe(true);
    expect(
      isTodaysSession(
        {
          status: OrientationSessionStatus.DRAFT,
          startedAt: null,
          completedAt: null,
          createdAt: new Date('2026-09-15T00:00:00.000Z'),
        },
        todayStart,
        tomorrow,
      ),
    ).toBe(false);
  });

  it('builds six UTC months of real review averages', () => {
    const points = monthlyProgress(
      [
        { reviewedAt: new Date('2026-04-10T00:00:00.000Z'), overallScore: 40 },
        { reviewedAt: new Date('2026-04-20T00:00:00.000Z'), overallScore: 60 },
        { reviewedAt: new Date('2026-09-16T00:00:00.000Z'), overallScore: 80 },
      ],
      now,
    );
    expect(points).toHaveLength(6);
    expect(points[0]).toEqual({
      month: '2026-04',
      label: 'Apr 2026',
      average: 50,
      reviewCount: 2,
    });
    expect(points[5]).toEqual({
      month: '2026-09',
      label: 'Sep 2026',
      average: 80,
      reviewCount: 1,
    });
    expect(points[1].average).toBeNull();
  });

  it('flags overdue and blocked roadmap items', () => {
    const todayStart = new Date('2026-09-16T00:00:00.000Z');
    expect(
      roadmapBehindCounts(
        [
          { dueDate: new Date('2026-09-01T00:00:00.000Z'), status: RoadmapItemStatus.IN_PROGRESS },
          { dueDate: new Date('2026-09-01T00:00:00.000Z'), status: RoadmapItemStatus.COMPLETED },
          { dueDate: new Date('2026-09-20T00:00:00.000Z'), status: RoadmapItemStatus.BLOCKED },
          { dueDate: null, status: RoadmapItemStatus.BLOCKED },
        ],
        todayStart,
      ),
    ).toEqual({ overdue: 1, blocked: 2 });
  });

  it('treats missing or stale activity as inactive', () => {
    const cutoff = new Date('2026-09-02T00:00:00.000Z');
    expect(isInactive(null, cutoff)).toBe(true);
    expect(isInactive(new Date('2026-09-01T00:00:00.000Z'), cutoff)).toBe(true);
    expect(isInactive(new Date('2026-09-16T00:00:00.000Z'), cutoff)).toBe(false);
    expect(
      lastActivityAt([null, new Date('2026-08-01T00:00:00.000Z'), new Date('2026-07-01')]),
    ).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it('keeps every KPI status bucket even when counts are zero', () => {
    expect(kpiStatusBuckets(new Map([[KpiStatus.BEHIND, 2]]))).toEqual([
      { key: KpiStatus.ON_TRACK, label: 'On track', count: 0 },
      { key: KpiStatus.AT_RISK, label: 'At risk', count: 0 },
      { key: KpiStatus.BEHIND, label: 'Behind', count: 2 },
      { key: KpiStatus.COMPLETED, label: 'Completed', count: 0 },
    ]);
  });
});
