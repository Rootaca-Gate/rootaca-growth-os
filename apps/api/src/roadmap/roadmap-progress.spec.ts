import { RoadmapItemStatus } from '@prisma/client';
import { averagePercent, normalizeItemProgress } from './roadmap-progress';

describe('roadmap progress', () => {
  it('averages item completion across a phase', () => {
    expect(
      averagePercent([
        { status: RoadmapItemStatus.COMPLETED, completionPercentage: 100 },
        { status: RoadmapItemStatus.IN_PROGRESS, completionPercentage: 50 },
        { status: RoadmapItemStatus.NOT_STARTED, completionPercentage: 40 },
      ]),
    ).toBe(50);
  });

  it('treats completed items as 100 even if the stored percent lags', () => {
    expect(
      averagePercent([{ status: RoadmapItemStatus.COMPLETED, completionPercentage: 10 }]),
    ).toBe(100);
  });

  it('normalizes a percent-only update into status', () => {
    expect(
      normalizeItemProgress({
        completionPercentage: 100,
        currentStatus: RoadmapItemStatus.IN_PROGRESS,
        currentPercent: 40,
      }),
    ).toEqual({ status: RoadmapItemStatus.COMPLETED, completionPercentage: 100 });

    expect(
      normalizeItemProgress({
        completionPercentage: 0,
        currentStatus: RoadmapItemStatus.IN_PROGRESS,
        currentPercent: 40,
      }),
    ).toEqual({ status: RoadmapItemStatus.NOT_STARTED, completionPercentage: 0 });

    expect(
      normalizeItemProgress({
        completionPercentage: 100,
        currentStatus: RoadmapItemStatus.NOT_STARTED,
        currentPercent: 0,
      }),
    ).toEqual({ status: RoadmapItemStatus.COMPLETED, completionPercentage: 100 });
  });

  it('keeps blocked items blocked when only completion changes', () => {
    expect(
      normalizeItemProgress({
        completionPercentage: 25,
        currentStatus: RoadmapItemStatus.BLOCKED,
        currentPercent: 10,
      }),
    ).toEqual({ status: RoadmapItemStatus.BLOCKED, completionPercentage: 25 });
  });
});
