import { LevelCode, MilestoneKind, PathCode, ProjectPurpose } from '@prisma/client';
import { MILESTONE_CATALOG } from './milestone-catalog';
import { PROJECT_CATALOG } from './project-catalog';

describe('Educational project catalog', () => {
  it('seeds five classroom projects and never uses client-case-study language', () => {
    expect(PROJECT_CATALOG).toHaveLength(5);
    expect(PROJECT_CATALOG.every((item) => item.purpose === ProjectPurpose.EDUCATIONAL)).toBe(true);
    expect(new Set(PROJECT_CATALOG.map((item) => item.path))).toEqual(
      new Set(Object.values(PathCode)),
    );
    const blob = PROJECT_CATALOG.map(
      (item) => `${item.name} ${item.description} ${item.learningGoal}`,
    )
      .join(' ')
      .toLowerCase();
    expect(blob).not.toMatch(/client|case study|case-study|customer deliverable/);
    expect(PROJECT_CATALOG.some((item) => item.level === LevelCode.EXPLORER)).toBe(true);
  });

  it('defines the eight educational milestones in order', () => {
    expect(MILESTONE_CATALOG.map((item) => item.title)).toEqual([
      'Planning',
      'UI/UX',
      'Frontend',
      'Backend',
      'Database',
      'Testing',
      'Deployment',
      'Presentation',
    ]);
    expect(MILESTONE_CATALOG.map((item) => item.kind)).toEqual(Object.values(MilestoneKind));
  });
});
