import { PrismaClient } from '@prisma/client';
import { PROJECT_CATALOG } from './project-catalog';

export async function seedProjectCatalog(prisma: PrismaClient): Promise<void> {
  for (const item of PROJECT_CATALOG) {
    await prisma.project.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        description: item.description,
        learningGoal: item.learningGoal,
        purpose: item.purpose,
        path: item.path,
        level: item.level,
        durationDays: item.durationDays,
        sortOrder: item.sortOrder,
        active: true,
      },
      create: item,
    });
  }
}
