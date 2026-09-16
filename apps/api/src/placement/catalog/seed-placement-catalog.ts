import { PrismaClient } from '@prisma/client';
import {
  LEVEL_CATALOG,
  PATH_CATALOG,
  PATH_SKILL_WEIGHTS,
  SKILL_CATALOG,
} from './placement-catalog';

export async function seedPlacementCatalog(prisma: PrismaClient): Promise<void> {
  for (const level of LEVEL_CATALOG) {
    await prisma.level.upsert({
      where: { code: level.code },
      update: {
        name: level.name,
        description: level.description,
        sortOrder: level.sortOrder,
      },
      create: {
        id: level.id,
        code: level.code,
        name: level.name,
        description: level.description,
        sortOrder: level.sortOrder,
      },
    });
  }

  const levels = await prisma.level.findMany();
  const levelIdByCode = Object.fromEntries(levels.map((item) => [item.code, item.id]));

  for (const level of LEVEL_CATALOG) {
    const levelId = levelIdByCode[level.code];
    if (!levelId) {
      throw new Error(`Missing level ${level.code}`);
    }

    const existing = await prisma.levelRule.findFirst({
      where: { levelId, source: 'OVERALL_SCORE' },
    });

    if (existing) {
      await prisma.levelRule.update({
        where: { id: existing.id },
        data: { minScore: level.minScore, maxScore: level.maxScore },
      });
    } else {
      await prisma.levelRule.create({
        data: {
          levelId,
          minScore: level.minScore,
          maxScore: level.maxScore,
          source: 'OVERALL_SCORE',
        },
      });
    }
  }

  for (const skill of SKILL_CATALOG) {
    await prisma.skill.upsert({
      where: { code: skill.code },
      update: {
        name: skill.name,
        description: skill.description,
        sortOrder: skill.sortOrder,
      },
      create: {
        id: skill.id,
        code: skill.code,
        name: skill.name,
        description: skill.description,
        sortOrder: skill.sortOrder,
      },
    });
  }

  for (const path of PATH_CATALOG) {
    await prisma.learningPath.upsert({
      where: { code: path.code },
      update: {
        name: path.name,
        description: path.description,
        sortOrder: path.sortOrder,
      },
      create: {
        id: path.id,
        code: path.code,
        name: path.name,
        description: path.description,
        sortOrder: path.sortOrder,
      },
    });
  }

  const skills = await prisma.skill.findMany();
  const paths = await prisma.learningPath.findMany();
  const skillIdByCode = Object.fromEntries(skills.map((item) => [item.code, item.id]));
  const pathIdByCode = Object.fromEntries(paths.map((item) => [item.code, item.id]));

  for (const path of PATH_CATALOG) {
    const pathId = pathIdByCode[path.code];
    const weights = PATH_SKILL_WEIGHTS[path.code];
    if (!pathId) {
      throw new Error(`Missing path ${path.code}`);
    }

    const keepSkillIds: string[] = [];
    for (const [skillCode, weightPercent] of Object.entries(weights)) {
      const skillId = skillIdByCode[skillCode];
      if (!skillId || weightPercent === undefined) {
        continue;
      }
      keepSkillIds.push(skillId);
      await prisma.pathSkill.upsert({
        where: { pathId_skillId: { pathId, skillId } },
        update: { weightPercent },
        create: { pathId, skillId, weightPercent },
      });
    }

    await prisma.pathSkill.deleteMany({
      where: { pathId, skillId: { notIn: keepSkillIds } },
    });
  }
}
