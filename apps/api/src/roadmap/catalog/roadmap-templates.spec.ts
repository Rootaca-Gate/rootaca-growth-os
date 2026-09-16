import { LevelCode, PathCode } from '@prisma/client';
import { buildRoadmapTemplateCatalog } from './roadmap-templates';

describe('roadmap template catalog', () => {
  const catalog = buildRoadmapTemplateCatalog();

  it('defines a template for every path and level', () => {
    expect(catalog).toHaveLength(Object.values(PathCode).length * Object.values(LevelCode).length);
    expect(new Set(catalog.map((item) => `${item.path}:${item.level}`)).size).toBe(25);
  });

  it('gives every template three phases with dated work items', () => {
    for (const template of catalog) {
      expect(template.phases).toHaveLength(3);
      expect(template.phases.flatMap((phase) => phase.items).length).toBeGreaterThan(4);
      expect(
        template.phases.every((phase) =>
          phase.items.every((item) => item.durationDays >= 4 && item.title.length > 4),
        ),
      ).toBe(true);
    }
  });
});
