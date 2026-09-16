import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PathCode, ProgrammingExperience, Role, StudentLevel } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PasswordService } from '../src/auth/crypto/password.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedKpiCatalog } from '../src/kpi/catalog/seed-kpis';

describe('KPIs (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let counselorToken: string;
  let studentId: string;

  const password = 'E2eAuth#2026';
  const admin = {
    email: 'kpi.admin.e2e@rootaca.test',
    displayName: 'E2E KPI Admin',
    role: Role.ADMIN,
  };
  const counselor = {
    email: 'kpi.counselor.e2e@rootaca.test',
    displayName: 'E2E KPI Counselor',
    role: Role.COUNSELOR,
  };

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
    await seedKpiCatalog(prisma);
    await prisma.studentKpi.deleteMany({ where: { kpi: { code: 'REVIEW_SESSIONS' } } });
    await prisma.kpi.deleteMany({ where: { code: 'REVIEW_SESSIONS' } });

    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155455' } } });

    await prisma.user.create({
      data: { ...admin, passwordHash: await passwordService.hash(password) },
    });
    await prisma.user.create({
      data: { ...counselor, passwordHash: await passwordService.hash(password) },
    });

    const student = await prisma.student.create({
      data: {
        fullName: 'KPI E2E Student',
        dateOfBirth: new Date('2012-05-01'),
        schoolGrade: 'Grade 8',
        phone: '+201554550001',
        parentContact: 'Parent KPI +201554550002',
        programmingExperience: ProgrammingExperience.BEGINNER,
        programmingLanguages: ['Scratch'],
        interests: ['Games'],
        learningGoal: 'Build a first game and understand Python basics.',
        availableHoursPerWeek: 5,
        englishLevel: EnglishLevel.INTERMEDIATE,
        level: StudentLevel.JUNIOR,
        path: PathCode.GENERAL,
      },
    });
    studentId = student.id;

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
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155455' } } });
    await prisma.studentKpi.deleteMany({ where: { kpi: { code: 'REVIEW_SESSIONS' } } });
    await prisma.kpi.deleteMany({ where: { code: 'REVIEW_SESSIONS' } });
    await app.close();
  });

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string, token = adminToken) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
  }

  it('lists the default KPI definitions', async () => {
    const response = await authed('get', '/api/kpis');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(7);
    expect(response.body.map((item: { name: string }) => item.name)).toEqual(
      expect.arrayContaining([
        'Coding Problems',
        'Mini Projects',
        'Independent Tasks',
        'Weekly Practice Hours',
        'Project Completion',
        'Problem Solving',
        'Independence',
      ]),
    );
  });

  it('creates weekly and monthly records and calculates progress', async () => {
    const dashboard = await authed('get', `/api/students/${studentId}/kpis`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.items).toHaveLength(7);
    expect(dashboard.body.items[0].weekly).toBeTruthy();
    expect(dashboard.body.items[0].monthly).toBeTruthy();
    expect(dashboard.body.items[0].current.target).toBeGreaterThan(0);

    const coding = dashboard.body.items.find(
      (item: { kpi: { code: string } }) => item.kpi.code === 'CODING_PROBLEMS',
    );
    const hours = dashboard.body.items.find(
      (item: { kpi: { code: string } }) => item.kpi.code === 'WEEKLY_PRACTICE_HOURS',
    );
    expect(hours.current.target).toBe(5);

    const recorded = await authed('patch', `/api/students/${studentId}/kpis/${coding.id}`).send({
      actual: 5,
      notes: 'Finished five katas',
    });
    expect(recorded.status).toBe(200);
    const updated = recorded.body.items.find(
      (item: { kpi: { code: string } }) => item.kpi.code === 'CODING_PROBLEMS',
    );
    expect(updated.actual).toBe(5);
    expect(updated.progressPercent).toBe(50);
    expect(updated.status).toBeDefined();
    expect(updated.history.length).toBeGreaterThanOrEqual(1);
  });

  it('lets admin configure definitions and blocks counselor writes', async () => {
    const created = await authed('post', '/api/kpis').send({
      name: 'Review sessions',
      description: 'Mentor review sessions completed in the month.',
      category: 'PRACTICE',
      target: 2,
      unit: 'sessions',
      frequency: 'MONTHLY',
      weight: 5,
    });
    expect(created.status).toBe(201);
    expect(created.body.code).toBe('REVIEW_SESSIONS');

    const forbidden = await authed('patch', `/api/kpis/${created.body.id}`, counselorToken).send({
      target: 3,
    });
    expect(forbidden.status).toBe(403);

    const view = await authed('get', `/api/students/${studentId}/kpis`, counselorToken);
    expect(view.status).toBe(200);

    const write = await authed(
      'patch',
      `/api/students/${studentId}/kpis/${view.body.items[0].id}`,
      counselorToken,
    ).send({ actual: 1 });
    expect(write.status).toBe(403);

    const deactivated = await authed('delete', `/api/kpis/${created.body.id}`);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.active).toBe(false);
  });
});
