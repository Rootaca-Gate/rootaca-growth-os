import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AssessmentCategoryCode,
  EnglishLevel,
  PathCode,
  ProgrammingExperience,
  Role,
  StudentLevel,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PasswordService } from '../src/auth/crypto/password.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { CATALOG_QUESTIONS } from '../src/orientation/catalog/assessment-catalog';
import { seedAssessmentCatalog } from '../src/orientation/catalog/seed-catalog';
import { seedPlacementCatalog } from '../src/placement/catalog/seed-placement-catalog';
import { seedRoadmapTemplates } from '../src/roadmap/catalog/seed-roadmap-templates';
import { TARGET_DURATION_MS } from '../src/orientation/orientation.constants';
import { AnswerInputDto } from '../src/orientation/dto/submit-answers.dto';

describe('Orientation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let studentId: string;

  const password = 'E2eAuth#2026';
  const staff = {
    email: 'orientation.e2e@rootaca.test',
    displayName: 'E2E Orientation Admin',
    role: Role.ADMIN,
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
    await seedAssessmentCatalog(prisma);
    await seedPlacementCatalog(prisma);
    await seedRoadmapTemplates(prisma);

    await prisma.refreshToken.deleteMany({ where: { user: { email: staff.email } } });
    await prisma.orientationSession.deleteMany({
      where: { student: { phone: { startsWith: '+20155222' } } },
    });
    await prisma.user.deleteMany({ where: { email: staff.email } });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155222' } } });

    const user = await prisma.user.create({
      data: {
        ...staff,
        passwordHash: await passwordService.hash(password),
      },
    });

    const student = await prisma.student.create({
      data: {
        fullName: 'Orientation E2E Student',
        dateOfBirth: new Date('2012-05-01'),
        schoolGrade: 'Grade 8',
        phone: '+201552220001',
        parentContact: 'Parent E2E +201552220002',
        programmingExperience: ProgrammingExperience.BEGINNER,
        programmingLanguages: ['Scratch'],
        interests: ['Games'],
        learningGoal: 'Learn the ROOTACA orientation flow.',
        availableHoursPerWeek: 5,
        englishLevel: EnglishLevel.INTERMEDIATE,
        level: StudentLevel.JUNIOR,
        path: PathCode.GENERAL,
      },
    });
    studentId = student.id;

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: staff.email, password });
    accessToken = (login.body as { accessToken: string }).accessToken;

    void user;
  });

  afterAll(async () => {
    await prisma.orientationSession.deleteMany({
      where: { student: { phone: { startsWith: '+20155222' } } },
    });
    await prisma.refreshToken.deleteMany({ where: { user: { email: staff.email } } });
    await prisma.user.deleteMany({ where: { email: staff.email } });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155222' } } });
    await app.close();
  });

  function authed(method: 'get' | 'post' | 'put' | 'patch', url: string) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${accessToken}`);
  }

  function perfectAnswers(category?: AssessmentCategoryCode): AnswerInputDto[] {
    return CATALOG_QUESTIONS.filter(
      (question) => question.scored && (!category || question.categoryCode === category),
    ).map((question) => {
      if (question.type === 'MULTIPLE_CHOICE') {
        const best = [...question.options].sort(
          (left, right) => right.scoreValue - left.scoreValue,
        )[0];
        return { questionId: question.id, optionId: best?.id };
      }
      if (question.type === 'RATING') {
        return { questionId: question.id, numericValue: question.scaleMax };
      }
      return { questionId: question.id, numericValue: question.maxScore };
    });
  }

  it('rejects unauthenticated access', async () => {
    const response = await request(app.getHttpServer()).get('/api/orientation-sessions');
    expect(response.status).toBe(401);
  });

  it('runs the 20-minute workflow, scores weights, and allows overtime completion', async () => {
    const created = await authed('post', '/api/orientation-sessions').send({ studentId });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('DRAFT');
    expect(created.body.questions.length).toBeGreaterThan(10);
    const sessionId = created.body.id as string;

    const reused = await authed('post', '/api/orientation-sessions').send({ studentId });
    expect(reused.body.id).toBe(sessionId);

    const started = await authed('post', `/api/orientation-sessions/${sessionId}/start`);
    expect(started.status).toBe(200);
    expect(started.body.status).toBe('IN_PROGRESS');
    expect(started.body.running).toBe(true);

    const paused = await authed('post', `/api/orientation-sessions/${sessionId}/pause`);
    expect(paused.status).toBe(200);
    expect(paused.body.status).toBe('PAUSED');
    expect(paused.body.running).toBe(false);

    const resumed = await authed('post', `/api/orientation-sessions/${sessionId}/resume`);
    expect(resumed.status).toBe(200);
    expect(resumed.body.status).toBe('IN_PROGRESS');

    const saved = await authed('patch', `/api/orientation-sessions/${sessionId}`).send({
      notes: 'Student is curious and calm.',
      currentStage: 'TECHNICAL_CHECK',
      answers: [{ questionId: CATALOG_QUESTIONS[0].id, textValue: 'Wants to build games.' }],
    });
    expect(saved.status).toBe(200);
    expect(saved.body.notes).toContain('curious');
    expect(saved.body.currentStage).toBe('TECHNICAL_CHECK');

    const submitted = await authed('put', `/api/orientation-sessions/${sessionId}/answers`).send({
      answers: perfectAnswers(AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS),
    });
    expect(submitted.status).toBe(200);

    const completedPartial = await authed(
      'post',
      `/api/orientation-sessions/${sessionId}/complete`,
    );
    expect(completedPartial.status).toBe(200);
    expect(completedPartial.body.status).toBe('COMPLETED');
    expect(completedPartial.body.result.overallScore).toBe(25);
    expect(
      completedPartial.body.result.categoryScores.find(
        (item: { code: string }) => item.code === 'PROGRAMMING_FUNDAMENTALS',
      ).score,
    ).toBe(100);

    const result = await authed('get', `/api/orientation-sessions/${sessionId}/result`);
    expect(result.status).toBe(200);
    expect(result.body.overallScore).toBe(25);
    expect(result.body.summary).toContain('Programming Fundamentals (100)');

    const overtimeStudent = await prisma.student.create({
      data: {
        fullName: 'Overtime E2E Student',
        dateOfBirth: new Date('2011-08-08'),
        schoolGrade: 'Grade 9',
        phone: '+201552220003',
        parentContact: 'Parent Overtime +201552220004',
        programmingExperience: ProgrammingExperience.BEGINNER,
        programmingLanguages: ['Python'],
        interests: ['Web'],
        learningGoal: 'Finish even if the timer rings.',
        availableHoursPerWeek: 6,
        englishLevel: EnglishLevel.INTERMEDIATE,
        level: StudentLevel.JUNIOR,
        path: PathCode.WEB,
      },
    });

    const overtimeSession = await prisma.orientationSession.create({
      data: {
        studentId: overtimeStudent.id,
        createdById: created.body.createdById,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        lastResumedAt: new Date(),
        elapsedMs: TARGET_DURATION_MS + 90_000,
      },
    });

    const overtimeComplete = await authed(
      'post',
      `/api/orientation-sessions/${overtimeSession.id}/complete`,
    );
    expect(overtimeComplete.status).toBe(200);
    expect(overtimeComplete.body.status).toBe('COMPLETED');
    expect(overtimeComplete.body.overtime).toBe(true);
    expect(overtimeComplete.body.elapsedMs).toBeGreaterThan(TARGET_DURATION_MS);
  });

  it('scores a perfect mixed catalog attempt at 100', async () => {
    const student = await prisma.student.create({
      data: {
        fullName: 'Perfect E2E Student',
        dateOfBirth: new Date('2010-02-02'),
        schoolGrade: 'Grade 10',
        phone: '+201552220005',
        parentContact: 'Parent Perfect +201552220006',
        programmingExperience: ProgrammingExperience.INTERMEDIATE,
        programmingLanguages: ['JavaScript'],
        interests: ['Web'],
        learningGoal: 'Show a full-score orientation.',
        availableHoursPerWeek: 7,
        englishLevel: EnglishLevel.ADVANCED,
        level: StudentLevel.INTERMEDIATE,
        path: PathCode.WEB,
      },
    });

    const created = await authed('post', '/api/orientation-sessions').send({
      studentId: student.id,
    });
    await authed('put', `/api/orientation-sessions/${created.body.id}/answers`).send({
      answers: perfectAnswers(),
    });
    const completed = await authed('post', `/api/orientation-sessions/${created.body.id}/complete`);

    expect(completed.status).toBe(200);
    expect(completed.body.result.overallScore).toBe(100);
    for (const category of completed.body.result.categoryScores) {
      expect(category.score).toBe(100);
    }
    expect(completed.body.result.skillScores.length).toBeGreaterThan(0);
  });
});
