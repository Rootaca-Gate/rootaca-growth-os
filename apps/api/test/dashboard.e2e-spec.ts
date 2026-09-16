import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EnglishLevel,
  KpiStatus,
  OrientationSessionStatus,
  OrientationStage,
  PathCode,
  ProgrammingExperience,
  ReviewKind,
  Role,
  RoadmapItemStatus,
  StudentLevel,
  StudentProjectStatus,
  StudentStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PasswordService } from '../src/auth/crypto/password.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedKpiCatalog } from '../src/kpi/catalog/seed-kpis';
import { seedPlacementCatalog } from '../src/placement/catalog/seed-placement-catalog';
import { seedProjectCatalog } from '../src/projects/catalog/seed-projects';

describe('Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let counselorToken: string;
  let adminId: string;
  let activeId: string;
  let intakeId: string;
  let idleId: string;

  const password = 'E2eAuth#2026';
  const admin = {
    email: 'dashboard.admin.e2e@rootaca.test',
    displayName: 'E2E Dashboard Admin',
    role: Role.ADMIN,
  };
  const counselor = {
    email: 'dashboard.counselor.e2e@rootaca.test',
    displayName: 'E2E Dashboard Counselor',
    role: Role.COUNSELOR,
  };
  const phonePrefix = '+20155459';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const passwordService = app.get(PasswordService);
    await prisma.$connect();
    await seedPlacementCatalog(prisma);
    await seedKpiCatalog(prisma);
    await seedProjectCatalog(prisma);

    await prisma.student.deleteMany({ where: { phone: { startsWith: phonePrefix } } });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });

    const adminUser = await prisma.user.create({
      data: { ...admin, passwordHash: await passwordService.hash(password) },
    });
    adminId = adminUser.id;
    await prisma.user.create({
      data: { ...counselor, passwordHash: await passwordService.hash(password) },
    });

    const level = await prisma.level.findFirstOrThrow({ orderBy: { sortOrder: 'asc' } });
    const path = await prisma.learningPath.findFirstOrThrow({
      where: { code: PathCode.WEB },
    });
    const skill = await prisma.skill.findFirstOrThrow({ orderBy: { sortOrder: 'asc' } });
    const kpi = await prisma.kpi.findFirstOrThrow({ orderBy: { sortOrder: 'asc' } });
    const project = await prisma.project.findFirstOrThrow({ orderBy: { sortOrder: 'asc' } });

    const active = await prisma.student.create({
      data: {
        ...studentFields('AAA Dashboard Active', `${phonePrefix}0001`, StudentStatus.ACTIVE),
        currentLevelId: level.id,
        currentPathId: path.id,
      },
    });
    const intake = await prisma.student.create({
      data: {
        ...studentFields('AAA Dashboard Intake', `${phonePrefix}0003`, StudentStatus.INTAKE),
        path: PathCode.MOBILE,
      },
    });
    const idle = await prisma.student.create({
      data: studentFields('AAA Dashboard Idle', `${phonePrefix}0005`, StudentStatus.INTAKE),
    });
    activeId = active.id;
    intakeId = intake.id;
    idleId = idle.id;

    await prisma.orientationSession.create({
      data: {
        studentId: active.id,
        createdById: adminId,
        status: OrientationSessionStatus.COMPLETED,
        currentStage: OrientationStage.SUMMARY,
        startedAt: new Date('2026-09-01T08:00:00.000Z'),
        completedAt: new Date('2026-09-01T08:20:00.000Z'),
        result: {
          create: {
            overallScore: 68,
            categoryScores: [],
            skillScores: [],
            summary: 'Completed for dashboard e2e.',
          },
        },
      },
    });
    await prisma.orientationSession.create({
      data: {
        studentId: active.id,
        createdById: adminId,
        status: OrientationSessionStatus.IN_PROGRESS,
        currentStage: OrientationStage.TECHNICAL_CHECK,
        startedAt: new Date(),
        lastResumedAt: new Date(),
      },
    });
    await prisma.orientationSession.create({
      data: {
        studentId: intake.id,
        createdById: adminId,
        status: OrientationSessionStatus.DRAFT,
        currentStage: OrientationStage.STUDENT_PROFILE,
      },
    });

    await prisma.studentSkill.create({
      data: { studentId: active.id, skillId: skill.id, score: 80 },
    });
    await prisma.studentKpi.create({
      data: {
        studentId: active.id,
        kpiId: kpi.id,
        target: kpi.target,
        actual: 1,
        progressPercent: 10,
        status: KpiStatus.BEHIND,
      },
    });
    await prisma.studentProject.create({
      data: {
        studentId: active.id,
        projectId: project.id,
        status: StudentProjectStatus.COMPLETED,
        progressPercent: 100,
      },
    });
    await prisma.progressReview.create({
      data: {
        studentId: active.id,
        kind: ReviewKind.INITIAL_ASSESSMENT,
        reviewedAt: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(),
        reviewerId: adminId,
        technicalSkills: 70,
        problemSolving: 72,
        projects: 68,
        independence: 74,
        communication: 76,
        overallScore: 72,
        kpiOverallPercent: 10,
        projectOverallPercent: 100,
        notes: 'Dashboard e2e review',
      },
    });
    await prisma.roadmap.create({
      data: {
        studentId: active.id,
        pathId: path.id,
        levelId: level.id,
        phases: {
          create: {
            title: 'Foundation',
            description: 'Catch-up work',
            sortOrder: 1,
            items: {
              create: {
                title: 'Overdue practice',
                description: 'Should have been finished',
                durationDays: 7,
                dueDate: new Date(Date.now() - 14 * 86_400_000),
                status: RoadmapItemStatus.IN_PROGRESS,
                sortOrder: 1,
              },
            },
          },
        },
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: admin.email, password });
    adminToken = (adminLogin.body as { accessToken: string }).accessToken;

    const counselorLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: counselor.email, password });
    counselorToken = (counselorLogin.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await prisma.student.deleteMany({ where: { phone: { startsWith: phonePrefix } } });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await app.close();
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app.getHttpServer()).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('returns live aggregations for the seeded students', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.cards.totalStudents).toBeGreaterThanOrEqual(3);
    expect(res.body.cards.activeStudents).toBeGreaterThanOrEqual(1);
    expect(res.body.cards.todaysSessions).toBeGreaterThanOrEqual(2);
    expect(res.body.cards.pendingAssessments).toBeGreaterThanOrEqual(2);
    expect(res.body.cards.projectsCompleted).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.cards.averageProgress).toBe('number');
    expect(res.body.charts.studentsByLevel.length).toBeGreaterThan(0);
    expect(res.body.charts.studentsByPath.some((item: { key: string }) => item.key === 'WEB')).toBe(
      true,
    );
    expect(res.body.charts.averageSkillScores.length).toBeGreaterThan(0);
    expect(res.body.charts.kpiStatus).toHaveLength(4);
    expect(res.body.charts.monthlyProgress).toHaveLength(6);
    expect(
      res.body.attention.kpiBelowTarget.some(
        (item: { studentId: string }) => item.studentId === activeId,
      ),
    ).toBe(true);
    expect(
      res.body.attention.assessmentPending.map((item: { studentId: string }) => item.studentId),
    ).toEqual(expect.arrayContaining([intakeId, idleId]));
    expect(
      res.body.attention.noRecentActivity.some(
        (item: { studentId: string }) => item.studentId === idleId,
      ),
    ).toBe(true);
    expect(
      res.body.attention.roadmapBehindSchedule.some(
        (item: { studentId: string }) => item.studentId === activeId,
      ),
    ).toBe(true);
    expect(
      res.body.recentSessions.some(
        (item: { studentId: string; status: string }) =>
          item.studentId === activeId && item.status === 'IN_PROGRESS',
      ),
    ).toBe(true);
    expect(
      res.body.upcomingSessions.some((item: { studentId: string }) => item.studentId === intakeId),
    ).toBe(true);
  });

  it('lets a counselor read the same live dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${counselorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.cards).toEqual(
      expect.objectContaining({
        totalStudents: expect.any(Number),
        activeStudents: expect.any(Number),
        todaysSessions: expect.any(Number),
        pendingAssessments: expect.any(Number),
        projectsCompleted: expect.any(Number),
      }),
    );
  });
});

function studentFields(fullName: string, phone: string, status: StudentStatus) {
  return {
    fullName,
    dateOfBirth: new Date('2012-05-01'),
    schoolGrade: 'Grade 8',
    phone,
    parentContact: `Parent ${fullName}`,
    programmingExperience: ProgrammingExperience.BEGINNER,
    programmingLanguages: ['Scratch'],
    interests: ['Web'],
    learningGoal: 'Appear on the live dashboard.',
    availableHoursPerWeek: 5,
    englishLevel: EnglishLevel.INTERMEDIATE,
    level: StudentLevel.JUNIOR,
    path: PathCode.WEB,
    status,
  };
}
