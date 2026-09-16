import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PathCode, ProgrammingExperience, Role, StudentLevel } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PasswordService } from '../src/auth/crypto/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Student progress reviews (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let counselorToken: string;
  let studentId: string;

  const password = 'E2eAuth#2026';
  const admin = {
    email: 'progress.admin.e2e@rootaca.test',
    displayName: 'E2E Progress Admin',
    role: Role.ADMIN,
  };
  const counselor = {
    email: 'progress.counselor.e2e@rootaca.test',
    displayName: 'E2E Progress Counselor',
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

    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155457' } } });

    await prisma.user.create({
      data: { ...admin, passwordHash: await passwordService.hash(password) },
    });
    await prisma.user.create({
      data: { ...counselor, passwordHash: await passwordService.hash(password) },
    });

    const student = await prisma.student.create({
      data: {
        fullName: 'Progress E2E Student',
        dateOfBirth: new Date('2012-05-01'),
        schoolGrade: 'Grade 8',
        phone: '+201554570001',
        parentContact: 'Parent Progress +201554570002',
        programmingExperience: ProgrammingExperience.BEGINNER,
        programmingLanguages: ['Scratch'],
        interests: ['Web'],
        learningGoal: 'Grow technical skills through monthly reviews.',
        availableHoursPerWeek: 5,
        englishLevel: EnglishLevel.INTERMEDIATE,
        level: StudentLevel.JUNIOR,
        path: PathCode.WEB,
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
    await prisma.progressReview.deleteMany({ where: { studentId } });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155457' } } });
    await app.close();
  });

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string, token = adminToken) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
  }

  it('creates an initial assessment and monthly review with growth and charts', async () => {
    const initial = await authed('post', `/api/students/${studentId}/progress/reviews`).send({
      kind: 'INITIAL_ASSESSMENT',
      reviewedAt: '2026-08-01',
      technicalSkills: 40,
      problemSolving: 30,
      projects: 20,
      independence: 35,
      communication: 50,
      notes: 'Baseline classroom review.',
      strengths: 'Curious questions.',
      nextFocus: 'Planning a first page.',
    });
    expect(initial.status).toBe(201);
    expect(initial.body.overallScore).toBe(35);
    expect(initial.body.previousOverallScore).toBeNull();
    expect(initial.body.dimensions).toHaveLength(5);

    const monthly = await authed('post', `/api/students/${studentId}/progress/reviews`).send({
      kind: 'MONTHLY_REVIEW',
      reviewedAt: '2026-09-16',
      technicalSkills: 55,
      problemSolving: 45,
      projects: 40,
      independence: 50,
      communication: 60,
      notes: 'Stronger planning.',
    });
    expect(monthly.status).toBe(201);
    expect(monthly.body.overallScore).toBe(50);
    expect(monthly.body.previousOverallScore).toBe(35);
    expect(monthly.body.overallGrowth).toBe(15);

    const dashboard = await authed('get', `/api/students/${studentId}/progress`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.currentScore).toBe(50);
    expect(dashboard.body.previousScore).toBe(35);
    expect(dashboard.body.growth).toBe(15);
    expect(dashboard.body.history).toHaveLength(2);
    expect(dashboard.body.skillGrowth.title).toBe('Skill Growth');
    expect(dashboard.body.kpiGrowth.title).toBe('KPI Growth');
    expect(dashboard.body.projectGrowth.title).toBe('Project Growth');
    expect(dashboard.body.skillGrowth.series).toHaveLength(5);

    const duplicate = await authed('post', `/api/students/${studentId}/progress/reviews`).send({
      kind: 'INITIAL_ASSESSMENT',
      technicalSkills: 10,
      problemSolving: 10,
      projects: 10,
      independence: 10,
      communication: 10,
    });
    expect(duplicate.status).toBe(409);
  });

  it('lets counselors view progress and blocks writes', async () => {
    const view = await authed('get', `/api/students/${studentId}/progress`, counselorToken);
    expect(view.status).toBe(200);

    const write = await authed(
      'post',
      `/api/students/${studentId}/progress/reviews`,
      counselorToken,
    ).send({
      kind: 'MONTHLY_REVIEW',
      reviewedAt: '2026-10-01',
      technicalSkills: 60,
      problemSolving: 60,
      projects: 60,
      independence: 60,
      communication: 60,
    });
    expect(write.status).toBe(403);
  });
});
