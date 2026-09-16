import { PrismaClient } from '@prisma/client';
import { CATALOG_CATEGORIES, CATALOG_QUESTIONS } from './assessment-catalog';

export async function seedAssessmentCatalog(prisma: PrismaClient): Promise<void> {
  for (const category of CATALOG_CATEGORIES) {
    await prisma.assessmentCategory.upsert({
      where: { code: category.code },
      update: {
        name: category.name,
        weightPercent: category.weightPercent,
        sortOrder: category.sortOrder,
      },
      create: {
        id: category.id,
        code: category.code,
        name: category.name,
        weightPercent: category.weightPercent,
        sortOrder: category.sortOrder,
      },
    });
  }

  const categories = await prisma.assessmentCategory.findMany();
  const categoryIdByCode = Object.fromEntries(categories.map((item) => [item.code, item.id]));

  for (const question of CATALOG_QUESTIONS) {
    const categoryId = categoryIdByCode[question.categoryCode];
    if (!categoryId) {
      throw new Error(`Missing category ${question.categoryCode}`);
    }

    await prisma.assessmentQuestion.upsert({
      where: { id: question.id },
      update: {
        categoryId,
        stage: question.stage,
        type: question.type,
        prompt: question.prompt,
        helperText: question.helperText,
        skillKey: question.skillKey,
        scored: question.scored,
        maxScore: question.maxScore,
        scaleMax: question.scaleMax,
        sortOrder: question.sortOrder,
      },
      create: {
        id: question.id,
        categoryId,
        stage: question.stage,
        type: question.type,
        prompt: question.prompt,
        helperText: question.helperText,
        skillKey: question.skillKey,
        scored: question.scored,
        maxScore: question.maxScore,
        scaleMax: question.scaleMax,
        sortOrder: question.sortOrder,
      },
    });

    await prisma.assessmentOption.deleteMany({
      where: {
        questionId: question.id,
        id: { notIn: question.options.map((option) => option.id) },
      },
    });

    for (const option of question.options) {
      await prisma.assessmentOption.upsert({
        where: { id: option.id },
        update: {
          questionId: question.id,
          label: option.label,
          scoreValue: option.scoreValue,
          sortOrder: option.sortOrder,
        },
        create: {
          id: option.id,
          questionId: question.id,
          label: option.label,
          scoreValue: option.scoreValue,
          sortOrder: option.sortOrder,
        },
      });
    }
  }
}
