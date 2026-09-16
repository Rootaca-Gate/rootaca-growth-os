import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EnglishLevel,
  PathCode,
  ProgrammingExperience,
  Role,
  StudentLevel,
  StudentStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PasswordService } from '../src/auth/crypto/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Students (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;

  const password = 'E2eAuth#2026';
  const staff = {
    email: 'students.e2e@rootaca.test',
    displayName: 'E2E Students Admin',
    role: Role.ADMIN,
  };

  const payload = {
    fullName: 'Omar E2E',
    dateOfBirth: '2011-09-02',
    schoolGrade: 'Grade 9',
    phone: '+201551110001',
    parentContact: 'Parent E2E +201551110002',
    programmingExperience: ProgrammingExperience.BEGINNER,
    programmingLanguages: ['Python', 'Scratch'],
    interests: ['Web', 'Games'],
    learningGoal: 'Learn web fundamentals and ship a first project.',
    availableHoursPerWeek: 5,
    englishLevel: EnglishLevel.INTERMEDIATE,
    level: StudentLevel.JUNIOR,
    path: PathCode.WEB,
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
      where: { user: { email: staff.email } },
    });
    await prisma.orientationSession.deleteMany({
      where: { createdBy: { email: staff.email } },
    });
    await prisma.user.deleteMany({ where: { email: staff.email } });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155111' } } });

    await prisma.user.create({
      data: {
        ...staff,
        passwordHash: await passwordService.hash(password),
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: staff.email, password });

    accessToken = (login.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155111' } } });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: staff.email } },
    });
    await prisma.orientationSession.deleteMany({
      where: { createdBy: { email: staff.email } },
    });
    await prisma.user.deleteMany({ where: { email: staff.email } });
    await app.close();
  });

  function authed(method: 'get' | 'post' | 'put' | 'patch', url: string) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${accessToken}`);
  }

  it('rejects unauthenticated access', async () => {
    const response = await request(app.getHttpServer()).get('/api/students');
    expect(response.status).toBe(401);
  });

  it('creates, lists, filters, updates, and changes status', async () => {
    const created = await authed('post', '/api/students').send(payload);

    expect(created.status).toBe(201);
    expect(created.body.fullName).toBe('Omar E2E');
    expect(created.body.status).toBe(StudentStatus.INTAKE);
    const id = created.body.id as string;

    const listed = await authed('get', '/api/students').query({
      search: 'Omar E2E',
      status: StudentStatus.INTAKE,
      level: StudentLevel.JUNIOR,
      path: PathCode.WEB,
      sortBy: 'fullName',
      sortOrder: 'asc',
      page: 1,
      pageSize: 10,
    });

    expect(listed.status).toBe(200);
    expect(listed.body.total).toBeGreaterThanOrEqual(1);
    expect(listed.body.items.some((item: { id: string }) => item.id === id)).toBe(true);

    const fetched = await authed('get', `/api/students/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.learningGoal).toContain('web fundamentals');

    const updated = await authed('put', `/api/students/${id}`).send({
      ...payload,
      fullName: 'Omar E2E Updated',
      availableHoursPerWeek: 8,
    });

    expect(updated.status).toBe(200);
    expect(updated.body.fullName).toBe('Omar E2E Updated');
    expect(updated.body.availableHoursPerWeek).toBe(8);
    expect(updated.body.status).toBe(StudentStatus.INTAKE);

    const status = await authed('patch', `/api/students/${id}/status`).send({
      status: StudentStatus.ACTIVE,
    });

    expect(status.status).toBe(200);
    expect(status.body.status).toBe(StudentStatus.ACTIVE);
  });

  it('returns 404 for an unknown student', async () => {
    const response = await authed('get', '/api/students/33333333-3333-4333-8333-333333333333');
    expect(response.status).toBe(404);
  });
});
