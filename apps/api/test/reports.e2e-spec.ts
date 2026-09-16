import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel, PathCode, ProgrammingExperience, Role, StudentLevel } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PasswordService } from '../src/auth/crypto/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Student progress reports (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let counselorToken: string;
  let studentId: string;

  const password = 'E2eAuth#2026';
  const admin = {
    email: 'reports.admin.e2e@rootaca.test',
    displayName: 'E2E Reports Admin',
    role: Role.ADMIN,
  };
  const counselor = {
    email: 'reports.counselor.e2e@rootaca.test',
    displayName: 'E2E Reports Counselor',
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
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155458' } } });

    await prisma.user.create({
      data: { ...admin, passwordHash: await passwordService.hash(password) },
    });
    await prisma.user.create({
      data: { ...counselor, passwordHash: await passwordService.hash(password) },
    });

    const student = await prisma.student.create({
      data: {
        fullName: 'Reports E2E Student',
        dateOfBirth: new Date('2012-05-01'),
        schoolGrade: 'Grade 8',
        phone: '+201554580001',
        parentContact: 'Parent Reports +201554580002',
        programmingExperience: ProgrammingExperience.BEGINNER,
        programmingLanguages: ['Scratch'],
        interests: ['Web'],
        learningGoal: 'Read a progress report in English and Arabic.',
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
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155458' } } });
    await app.close();
  });

  function authed(method: 'get', url: string, token = adminToken) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
  }

  it('returns a JSON preview with every report section', async () => {
    const res = await authed('get', `/api/students/${studentId}/report?locale=en`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Student Progress Report');
    expect(res.body.student.fullName).toBe('Reports E2E Student');
    expect(res.body.student.fields.length).toBeGreaterThan(5);
    expect(res.body).toEqual(
      expect.objectContaining({
        skills: expect.any(Array),
        kpis: expect.objectContaining({ items: expect.any(Array) }),
        projects: expect.objectContaining({ items: expect.any(Array) }),
        achievements: expect.any(Array),
        areasForImprovement: expect.any(Array),
        nextGoals: expect.any(Array),
      }),
    );
  });

  it('lets a counselor generate English and Arabic PDFs', async () => {
    const english = await authed(
      'get',
      `/api/students/${studentId}/report.pdf?locale=en`,
      counselorToken,
    );
    expect(english.status).toBe(200);
    expect(english.headers['content-type']).toMatch(/pdf/);
    expect(pdfMagic(english.body)).toBe('%PDF');

    const arabic = await authed(
      'get',
      `/api/students/${studentId}/report.pdf?locale=ar`,
      counselorToken,
    );
    expect(arabic.status).toBe(200);
    expect(pdfMagic(arabic.body)).toBe('%PDF');
  }, 30000);

  it('returns 404 for an unknown student', async () => {
    const res = await authed('get', '/api/students/11111111-1111-4111-8111-111111111111/report');
    expect(res.status).toBe(404);
  });
});

function pdfMagic(body: unknown): string {
  if (Buffer.isBuffer(body)) {
    return body.subarray(0, 4).toString();
  }
  if (typeof body === 'string') {
    return body.slice(0, 4);
  }
  return Buffer.from(body as ArrayBuffer)
    .subarray(0, 4)
    .toString();
}
