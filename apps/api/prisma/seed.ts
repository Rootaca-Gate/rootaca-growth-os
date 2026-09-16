import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EnglishLevel,
  PathCode,
  ProgrammingExperience,
  Role,
  PrismaClient,
  StudentLevel,
  StudentStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { assertValidPassword } from '../src/auth/password.policy';
import { seedAssessmentCatalog } from '../src/orientation/catalog/seed-catalog';
import { seedPlacementCatalog } from '../src/placement/catalog/seed-placement-catalog';
import { seedRoadmapTemplates } from '../src/roadmap/catalog/seed-roadmap-templates';
import { seedKpiCatalog } from '../src/kpi/catalog/seed-kpis';
import { seedProjectCatalog } from '../src/projects/catalog/seed-projects';
import { seedProgressReviews } from '../src/progress/seed-progress-reviews';

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

const prisma = new PrismaClient();

type SeedUser = {
  email: string;
  displayName: string;
  role: Role;
  password: string;
};

export const DEV_SEED_USERS: SeedUser[] = [
  {
    email: 'admin@rootaca.com',
    displayName: 'ROOTACA Admin',
    role: Role.ADMIN,
    password: 'DevAdmin#2026',
  },
  {
    email: 'mentor@rootaca.com',
    displayName: 'ROOTACA Mentor',
    role: Role.MENTOR,
    password: 'DevMentor#2026',
  },
  {
    email: 'counselor@rootaca.com',
    displayName: 'ROOTACA Counselor',
    role: Role.COUNSELOR,
    password: 'DevCounselor#2026',
  },
];

export const DEV_SEED_STUDENTS = [
  {
    fullName: 'Yara Hassan',
    dateOfBirth: new Date('2012-04-18'),
    schoolGrade: 'Grade 8',
    phone: '+201000000001',
    parentContact: 'Mona Hassan +201000000101',
    programmingExperience: ProgrammingExperience.BEGINNER,
    programmingLanguages: ['Scratch', 'Python'],
    interests: ['Games', 'Web'],
    learningGoal: 'Build a first game and understand Python basics.',
    availableHoursPerWeek: 6,
    englishLevel: EnglishLevel.INTERMEDIATE,
    status: StudentStatus.ACTIVE,
    level: StudentLevel.JUNIOR,
    path: PathCode.GAME,
  },
  {
    fullName: 'Omar Khaled',
    dateOfBirth: new Date('2010-11-02'),
    schoolGrade: 'Grade 10',
    phone: '+201000000002',
    parentContact: 'Khaled Omar +201000000102',
    programmingExperience: ProgrammingExperience.INTERMEDIATE,
    programmingLanguages: ['JavaScript', 'HTML/CSS'],
    interests: ['Web', 'Mobile'],
    learningGoal: 'Ship a personal website and start frontend projects.',
    availableHoursPerWeek: 8,
    englishLevel: EnglishLevel.ADVANCED,
    status: StudentStatus.ACTIVE,
    level: StudentLevel.INTERMEDIATE,
    path: PathCode.WEB,
  },
  {
    fullName: 'Lina Farid',
    dateOfBirth: new Date('2013-01-25'),
    schoolGrade: 'Grade 7',
    phone: '+201000000003',
    parentContact: 'Farid Nabil +201000000103',
    programmingExperience: ProgrammingExperience.NONE,
    programmingLanguages: [],
    interests: ['Robotics', 'Games'],
    learningGoal: 'Discover programming through visual tools and simple robots.',
    availableHoursPerWeek: 4,
    englishLevel: EnglishLevel.BEGINNER,
    status: StudentStatus.INTAKE,
    level: StudentLevel.FOUNDATION,
    path: PathCode.GENERAL,
  },
  {
    fullName: 'Adam Youssef',
    dateOfBirth: new Date('2009-07-09'),
    schoolGrade: 'Grade 11',
    phone: '+201000000004',
    parentContact: 'Youssef Adam +201000000104',
    programmingExperience: ProgrammingExperience.ADVANCED,
    programmingLanguages: ['Python', 'SQL', 'JavaScript'],
    interests: ['AI', 'Data'],
    learningGoal: 'Build data projects and prepare for a CS track.',
    availableHoursPerWeek: 10,
    englishLevel: EnglishLevel.FLUENT,
    status: StudentStatus.ACTIVE,
    level: StudentLevel.ADVANCED,
    path: PathCode.DATA,
  },
  {
    fullName: 'Nour El-Sayed',
    dateOfBirth: new Date('2011-03-14'),
    schoolGrade: 'Grade 9',
    phone: '+201000000005',
    parentContact: 'Heba El-Sayed +201000000105',
    programmingExperience: ProgrammingExperience.BEGINNER,
    programmingLanguages: ['Dart', 'Scratch'],
    interests: ['Mobile', 'Design'],
    learningGoal: 'Create a simple mobile app with a mentor.',
    availableHoursPerWeek: 5,
    englishLevel: EnglishLevel.INTERMEDIATE,
    status: StudentStatus.PAUSED,
    level: StudentLevel.JUNIOR,
    path: PathCode.MOBILE,
  },
  {
    fullName: 'Karim Tarek',
    dateOfBirth: new Date('2008-12-30'),
    schoolGrade: 'Grade 12',
    phone: '+201000000006',
    parentContact: 'Tarek Karim +201000000106',
    programmingExperience: ProgrammingExperience.INTERMEDIATE,
    programmingLanguages: ['C#', 'JavaScript'],
    interests: ['Games', 'Web'],
    learningGoal: 'Finish a capstone game project before university.',
    availableHoursPerWeek: 7,
    englishLevel: EnglishLevel.ADVANCED,
    status: StudentStatus.COMPLETED,
    level: StudentLevel.ADVANCED,
    path: PathCode.GAME,
  },
];

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed development users in production.');
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

  await prisma.student.deleteMany({
    where: { phone: { in: DEV_SEED_STUDENTS.map((student) => student.phone) } },
  });

  await prisma.student.createMany({
    data: DEV_SEED_STUDENTS.map((student) => ({
      ...student,
      programmingLanguages: [...student.programmingLanguages],
      interests: [...student.interests],
    })),
  });

  await seedAssessmentCatalog(prisma);
  await seedPlacementCatalog(prisma);
  await seedRoadmapTemplates(prisma);
  await seedKpiCatalog(prisma);
  await seedProjectCatalog(prisma);
  await seedProgressReviews(prisma);
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
