import { PrismaClient } from '@prisma/client';
import { buildRoadmapTemplateCatalog } from './roadmap-templates';

export async function seedRoadmapTemplates(prisma: PrismaClient): Promise<void> {
  const catalog = buildRoadmapTemplateCatalog();
  const paths = await prisma.learningPath.findMany();
  const levels = await prisma.level.findMany();
  const skills = await prisma.skill.findMany();

  const pathId = Object.fromEntries(paths.map((item) => [item.code, item.id]));
  const levelId = Object.fromEntries(levels.map((item) => [item.code, item.id]));
  const skillId = Object.fromEntries(skills.map((item) => [item.code, item.id]));

  for (const template of catalog) {
    const resolvedPathId = pathId[template.path];
    const resolvedLevelId = levelId[template.level];
    if (!resolvedPathId || !resolvedLevelId) {
      throw new Error(`Missing catalog ids for ${template.path} ${template.level}`);
    }

    const saved = await prisma.roadmapTemplate.upsert({
      where: {
        pathId_levelId: { pathId: resolvedPathId, levelId: resolvedLevelId },
      },
      update: {
        name: template.name,
        description: template.description,
      },
      create: {
        pathId: resolvedPathId,
        levelId: resolvedLevelId,
        name: template.name,
        description: template.description,
      },
    });

    await prisma.roadmapTemplatePhase.deleteMany({ where: { templateId: saved.id } });

    for (const [phaseIndex, phase] of template.phases.entries()) {
      const createdPhase = await prisma.roadmapTemplatePhase.create({
        data: {
          templateId: saved.id,
          title: phase.title,
          description: phase.description,
          sortOrder: phaseIndex + 1,
        },
      });

      for (const [itemIndex, item] of phase.items.entries()) {
        const resolvedSkillId = skillId[item.skill];
        if (!resolvedSkillId) {
          throw new Error(`Missing skill ${item.skill}`);
        }

        await prisma.roadmapTemplateItem.create({
          data: {
            phaseId: createdPhase.id,
            title: item.title,
            description: item.description,
            skillId: resolvedSkillId,
            durationDays: item.durationDays,
            sortOrder: itemIndex + 1,
          },
        });
      }
    }
  }
}
