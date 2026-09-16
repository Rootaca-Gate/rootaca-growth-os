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
import { AnswerInputDto } from '../src/orientation/dto/submit-answers.dto';

describe('Placement (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let studentId: string;

  const password = 'E2eAuth#2026';
  const staff = {
    email: 'placement.e2e@rootaca.test',
    displayName: 'E2E Placement Admin',
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
      where: { student: { phone: { startsWith: '+20155333' } } },
    });
    await prisma.user.deleteMany({ where: { email: staff.email } });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155333' } } });

    await prisma.user.create({
      data: {
        ...staff,
        passwordHash: await passwordService.hash(password),
      },
    });

    const student = await prisma.student.create({
      data: {
        fullName: 'Placement E2E Student',
        dateOfBirth: new Date('2012-05-01'),
        schoolGrade: 'Grade 8',
        phone: '+201553330001',
        parentContact: 'Parent Placement +201553330002',
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

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: staff.email, password });
    accessToken = (login.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await prisma.orientationSession.deleteMany({
      where: { student: { phone: { startsWith: '+20155333' } } },
    });
    await prisma.refreshToken.deleteMany({ where: { user: { email: staff.email } } });
    await prisma.user.deleteMany({ where: { email: staff.email } });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155333' } } });
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

  it('exposes database-driven level thresholds', async () => {
    const response = await authed('get', '/api/levels');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    expect(
      response.body.map(
        (level: { name: string; rules: Array<{ minScore: number; maxScore: number }> }) => [
          level.name,
          level.rules[0]?.minScore,
          level.rules[0]?.maxScore,
        ],
      ),
    ).toEqual([
      ['Explorer', 0, 29],
      ['Beginner', 30, 49],
      ['Foundation', 50, 69],
      ['Intermediate', 70, 84],
      ['Advanced', 85, 100],
    ]);
  });

  it('lists ten skills and five learning paths', async () => {
    const skills = await authed('get', '/api/skills');
    const paths = await authed('get', '/api/learning-paths');
    expect(skills.status).toBe(200);
    expect(skills.body).toHaveLength(10);
    expect(paths.status).toBe(200);
    expect(paths.body).toHaveLength(5);
    expect(paths.body[0].skills.length).toBeGreaterThan(0);
  });

  it('calculates level, skills, and a path after assessment completion', async () => {
    const created = await authed('post', '/api/orientation-sessions').send({ studentId });
    await authed('put', `/api/orientation-sessions/${created.body.id}/answers`).send({
      answers: perfectAnswers(AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS),
    });
    const completed = await authed('post', `/api/orientation-sessions/${created.body.id}/complete`);
    expect(completed.status).toBe(200);
    expect(completed.body.result.overallScore).toBe(25);
    expect(completed.body.result.placement.systemLevel.name).toBe('Explorer');
    expect(completed.body.result.placement.finalLevel.name).toBe('Explorer');
    expect(completed.body.result.placement.systemPath.code).toBe('GAME');
    expect(completed.body.result.placement.alternativePath.code).not.toBe('GAME');
    expect(completed.body.result.placement.recommendationReasons.length).toBeGreaterThan(0);

    const placement = await authed('get', `/api/students/${studentId}/placement`);
    expect(placement.status).toBe(200);
    expect(placement.body.systemLevel.name).toBe('Explorer');
    expect(placement.body.finalPath.code).toBe('GAME');

    const skills = await authed('get', `/api/students/${studentId}/skills`);
    expect(skills.status).toBe(200);
    expect(skills.body).toHaveLength(10);
    expect(
      skills.body.find((item: { code: string }) => item.code === 'PROGRAMMING_FUNDAMENTALS').score,
    ).toBe(100);

    const beginner = (await authed('get', '/api/levels')).body.find(
      (item: { code: string }) => item.code === 'BEGINNER',
    );
    const web = (await authed('get', '/api/learning-paths')).body.find(
      (item: { code: string }) => item.code === 'WEB',
    );

    const levelOverride = await authed('patch', `/api/students/${studentId}/placement/level`).send({
      levelId: beginner.id,
      reason: 'Mentor observed stronger independence than the score shows.',
    });
    expect(levelOverride.status).toBe(200);
    expect(levelOverride.body.systemLevel.name).toBe('Explorer');
    expect(levelOverride.body.finalLevel.name).toBe('Beginner');
    expect(levelOverride.body.levelChangedBy.displayName).toContain('Placement');
    expect(levelOverride.body.levelOverrideReason).toContain('Mentor');
    expect(levelOverride.body.levelChangedAt).toBeTruthy();

    const pathOverride = await authed('patch', `/api/students/${studentId}/placement/path`).send({
      pathId: web.id,
      reason: 'Family can only attend the web cohort this term.',
    });
    expect(pathOverride.status).toBe(200);
    expect(pathOverride.body.systemPath.code).toBe('GAME');
    expect(pathOverride.body.finalPath.code).toBe('WEB');
    expect(pathOverride.body.pathChangedBy).toBeTruthy();
    expect(pathOverride.body.pathOverrideReason).toContain('Family');

    const student = await authed('get', `/api/students/${studentId}`);
    expect(student.body.currentLevel.name).toBe('Beginner');
    expect(student.body.currentPath.code).toBe('WEB');
    expect(student.body.path).toBe('WEB');
  });
});
