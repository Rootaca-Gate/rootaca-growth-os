import { PrismaClient } from '@prisma/client';
import { KPI_CATALOG } from './kpi-catalog';

export async function seedKpiCatalog(prisma: PrismaClient): Promise<void> {
  for (const item of KPI_CATALOG) {
    await prisma.kpi.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        description: item.description,
        category: item.category,
        target: item.target,
        unit: item.unit,
        frequency: item.frequency,
        weight: item.weight,
        sortOrder: item.sortOrder,
        active: true,
      },
      create: item,
    });
  }
}
