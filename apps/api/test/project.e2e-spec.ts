import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PathCode, ProgrammingExperience, Role, StudentLevel } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PasswordService } from '../src/auth/crypto/password.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedProjectCatalog } from '../src/projects/catalog/seed-projects';

describe('Educational projects (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let counselorToken: string;
  let studentId: string;

  const password = 'E2eAuth#2026';
  const admin = {
    email: 'project.admin.e2e@rootaca.test',
    displayName: 'E2E Project Admin',
    role: Role.ADMIN,
  };
  const counselor = {
    email: 'project.counselor.e2e@rootaca.test',
    displayName: 'E2E Project Counselor',
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
    await seedProjectCatalog(prisma);
    await prisma.studentProject.deleteMany({ where: { project: { code: 'CLASSROOM_TIMER' } } });
    await prisma.project.deleteMany({ where: { code: 'CLASSROOM_TIMER' } });

    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155456' } } });

    await prisma.user.create({
      data: { ...admin, passwordHash: await passwordService.hash(password) },
    });
    await prisma.user.create({
      data: { ...counselor, passwordHash: await passwordService.hash(password) },
    });

    const student = await prisma.student.create({
      data: {
        fullName: 'Project E2E Student',
        dateOfBirth: new Date('2012-05-01'),
        schoolGrade: 'Grade 8',
        phone: '+201554560001',
        parentContact: 'Parent Project +201554560002',
        programmingExperience: ProgrammingExperience.BEGINNER,
        programmingLanguages: ['Scratch'],
        interests: ['Web'],
        learningGoal: 'Build a first practice page and explain HTML.',
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
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155456' } } });
    await prisma.studentProject.deleteMany({ where: { project: { code: 'CLASSROOM_TIMER' } } });
    await prisma.project.deleteMany({ where: { code: 'CLASSROOM_TIMER' } });
    await app.close();
  });

  function authed(method: 'get' | 'post' | 'patch' | 'delete', url: string, token = adminToken) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
  }

  it('lists educational projects and rejects client-case-study copy', async () => {
    const response = await authed('get', '/api/projects');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(5);
    expect(response.body.every((item: { purpose: string }) => item.purpose === 'EDUCATIONAL')).toBe(
      true,
    );

    const banned = await authed('post', '/api/projects').send({
      name: 'Boutique rebuild',
      description: 'A client case study for a local shop homepage.',
      learningGoal: 'Deliver a storefront the shop can sell from.',
      path: 'WEB',
      level: 'EXPLORER',
      durationDays: 38,
    });
    expect(banned.status).toBe(400);
  });

  it('assigns eight milestones and calculates overall progress', async () => {
    const catalog = await authed('get', '/api/projects');
    const web = catalog.body.find((item: { code: string }) => item.code === 'FIRST_WEB_PAGE');
    const assigned = await authed('post', `/api/projects/${web.id}/assign`).send({
      studentId,
      notes: 'Classroom practice only',
    });
    expect(assigned.status).toBe(201);
    expect(assigned.body.milestones).toHaveLength(8);
    expect(assigned.body.milestones.map((item: { title: string }) => item.title)).toEqual([
      'Planning',
      'UI/UX',
      'Frontend',
      'Backend',
      'Database',
      'Testing',
      'Deployment',
      'Presentation',
    ]);

    const planning = assigned.body.milestones[0];
    const updated = await authed(
      'patch',
      `/api/students/${studentId}/projects/${assigned.body.id}/milestones/${planning.id}`,
    ).send({ completionPercent: 50, mentorFeedback: 'Clear plan. Keep it small.' });
    expect(updated.status).toBe(200);
    expect(updated.body.milestones[0].completionPercent).toBe(50);
    expect(updated.body.milestones[0].status).toBe('IN_PROGRESS');
    expect(updated.body.progressPercent).toBe(6);
    expect(updated.body.status).toBe('IN_PROGRESS');

    const dashboard = await authed('get', `/api/students/${studentId}/projects`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.items).toHaveLength(1);
    expect(dashboard.body.overallPercent).toBe(6);
  });

  it('lets admin create definitions and blocks counselor writes', async () => {
    const created = await authed('post', '/api/projects').send({
      name: 'Classroom timer',
      description: 'A tiny practice timer for counting focused study minutes in class.',
      learningGoal: 'Show start, pause, and reset during a mentor demo.',
      path: 'GENERAL',
      level: 'BEGINNER',
      durationDays: 21,
    });
    expect(created.status).toBe(201);
    expect(created.body.code).toBe('CLASSROOM_TIMER');
    expect(created.body.purpose).toBe('EDUCATIONAL');

    const forbidden = await authed(
      'post',
      `/api/projects/${created.body.id}/assign`,
      counselorToken,
    ).send({
      studentId,
    });
    expect(forbidden.status).toBe(403);

    const view = await authed('get', `/api/students/${studentId}/projects`, counselorToken);
    expect(view.status).toBe(200);

    const deactivated = await authed('delete', `/api/projects/${created.body.id}`);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.active).toBe(false);
  });
});
