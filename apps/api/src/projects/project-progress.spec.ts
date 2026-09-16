import { MilestoneStatus, StudentProjectStatus } from '@prisma/client';
import {
  deriveStudentProjectStatus,
  normalizeMilestoneProgress,
  projectOverallPercent,
} from './project-progress';

describe('project progress', () => {
  it('averages milestone completion with completed counting as 100', () => {
    expect(
      projectOverallPercent([
        { status: MilestoneStatus.COMPLETED, completionPercent: 40 },
        { status: MilestoneStatus.IN_PROGRESS, completionPercent: 50 },
        { status: MilestoneStatus.NOT_STARTED, completionPercent: 80 },
        { status: MilestoneStatus.BLOCKED, completionPercent: 10 },
      ]),
    ).toBe(40);
  });

  it('marks a student project complete at 100 percent unless on hold', () => {
    expect(
      deriveStudentProjectStatus({
        current: StudentProjectStatus.IN_PROGRESS,
        overallPercent: 100,
      }),
    ).toBe(StudentProjectStatus.COMPLETED);
    expect(
      deriveStudentProjectStatus({
        current: StudentProjectStatus.ON_HOLD,
        overallPercent: 100,
      }),
    ).toBe(StudentProjectStatus.ON_HOLD);
  });

  it('normalizes percent-only updates into status', () => {
    expect(
      normalizeMilestoneProgress({
        completionPercent: 80,
        currentStatus: MilestoneStatus.NOT_STARTED,
        currentPercent: 0,
      }),
    ).toEqual({ status: MilestoneStatus.IN_PROGRESS, completionPercent: 80 });
    expect(
      normalizeMilestoneProgress({
        completionPercent: 100,
        currentStatus: MilestoneStatus.IN_PROGRESS,
        currentPercent: 80,
      }),
    ).toEqual({ status: MilestoneStatus.COMPLETED, completionPercent: 100 });
  });
});
