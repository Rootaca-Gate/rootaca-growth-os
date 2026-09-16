import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { assertValidPassword } from '../src/auth/password.policy';
import { seedAssessmentCatalog } from '../src/orientation/catalog/seed-catalog';
import { seedPlacementCatalog } from '../src/placement/catalog/seed-placement-catalog';
import { seedRoadmapTemplates } from '../src/roadmap/catalog/seed-roadmap-templates';
import { seedKpiCatalog } from '../src/kpi/catalog/seed-kpis';
import { seedProjectCatalog } from '../src/projects/catalog/seed-projects';
import { seedProgressReviews } from '../src/progress/seed-progress-reviews';
import { DEV_SEED_USERS } from '../src/auth/dev-seed-users';
import { createPrismaTcpAdapter } from '../src/prisma/prisma-adapter';
import { DEV_SEED_STUDENTS } from './dev-seed-students';

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    process.env[key] ??= value;
  }
}

loadEnvFile(resolve(__dirname, '../../.env'));
loadEnvFile(resolve(__dirname, '../../../.env'));

const prisma = new PrismaClient({ adapter: createPrismaTcpAdapter() });

export { DEV_SEED_USERS, DEV_SEED_STUDENTS };

async function upsertSeedStudents(client: PrismaClient): Promise<void> {
  for (const student of DEV_SEED_STUDENTS) {
    const current = await client.student.findFirst({
      where: { phone: student.phone },
      select: { id: true },
    });

    const data = {
      ...student,
      programmingLanguages: [...student.programmingLanguages],
      interests: [...student.interests],
    };

    if (current) {
      await client.student.update({
        where: { id: current.id },
        data,
      });
    } else {
      await client.student.create({ data });
    }
  }
}

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SEED !== 'true') {
    throw new Error('Refusing to seed development users in production. Set ALLOW_DEV_SEED=true to override.');
  }

  for (const user of DEV_SEED_USERS) {
    assertValidPassword(user.password);
    const passwordHash = await argon2.hash(user.password, { type: argon2.argon2id });

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        role: user.role,
        passwordHash,
        isActive: true,
      },
      create: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        passwordHash,
      },
    });
  }

  await upsertSeedStudents(prisma);

  await seedAssessmentCatalog(prisma);
  await seedPlacementCatalog(prisma);
  await seedRoadmapTemplates(prisma);
  await seedKpiCatalog(prisma);
  await seedProjectCatalog(prisma);
  await seedProgressReviews(prisma);

  const [users, students] = await Promise.all([prisma.user.count(), prisma.student.count()]);
  console.log(`Seed complete: ${users} users, ${students} students`);
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
