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

describe('Roadmaps (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let counselorToken: string;
  let studentId: string;

  const password = 'E2eAuth#2026';
  const admin = {
    email: 'roadmap.admin.e2e@rootaca.test',
    displayName: 'E2E Roadmap Admin',
    role: Role.ADMIN,
  };
  const counselor = {
    email: 'roadmap.counselor.e2e@rootaca.test',
    displayName: 'E2E Roadmap Counselor',
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
    await seedAssessmentCatalog(prisma);
    await seedPlacementCatalog(prisma);
    await seedRoadmapTemplates(prisma);

    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.orientationSession.deleteMany({
      where: { student: { phone: { startsWith: '+20155444' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155444' } } });

    await prisma.user.create({
      data: { ...admin, passwordHash: await passwordService.hash(password) },
    });
    await prisma.user.create({
      data: { ...counselor, passwordHash: await passwordService.hash(password) },
    });

    const student = await prisma.student.create({
      data: {
        fullName: 'Roadmap E2E Student',
        dateOfBirth: new Date('2012-05-01'),
        schoolGrade: 'Grade 8',
        phone: '+201554440001',
        parentContact: 'Parent Roadmap +201554440002',
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
    await prisma.orientationSession.deleteMany({
      where: { student: { phone: { startsWith: '+20155444' } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [admin.email, counselor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [admin.email, counselor.email] } },
    });
    await prisma.student.deleteMany({ where: { phone: { startsWith: '+20155444' } } });
    await app.close();
  });

  function authed(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    token = adminToken,
  ) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
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

  it('lists a template for every path and level', async () => {
    const response = await authed('get', '/api/roadmap-templates');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(25);
    expect(response.body[0].phases.length).toBe(3);
    expect(response.body[0].phases[0].items.length).toBeGreaterThan(0);
  });

  it('generates a roadmap after path selection and allows mentor edits', async () => {
    const created = await authed('post', '/api/orientation-sessions').send({ studentId });
    await authed('put', `/api/orientation-sessions/${created.body.id}/answers`).send({
      answers: perfectAnswers(AssessmentCategoryCode.PROGRAMMING_FUNDAMENTALS),
    });
    const completed = await authed('post', `/api/orientation-sessions/${created.body.id}/complete`);
    expect(completed.status).toBe(200);

    const roadmap = await authed('get', `/api/students/${studentId}/roadmap`);
    expect(roadmap.status).toBe(200);
    expect(roadmap.body.pathCode).toBe('GAME');
    expect(roadmap.body.levelCode).toBe('EXPLORER');
    expect(roadmap.body.phases).toHaveLength(3);
    expect(roadmap.body.progress.overallPercent).toBe(0);
    expect(roadmap.body.phases[0].items[0].startDate).toBeTruthy();
    expect(roadmap.body.phases[0].items[0].dueDate).toBeTruthy();

    const firstPhase = roadmap.body.phases[0];
    const firstItem = firstPhase.items[0];
    const secondItem = firstPhase.items[1];

    const progressed = await authed(
      'patch',
      `/api/students/${studentId}/roadmap/items/${firstItem.id}`,
    ).send({ completionPercentage: 40, status: 'IN_PROGRESS' });
    expect(progressed.status).toBe(200);
    expect(progressed.body.progress.overallPercent).toBeGreaterThan(0);
    expect(progressed.body.progress.inProgressCount).toBe(1);

    const blocked = await authed(
      'patch',
      `/api/students/${studentId}/roadmap/items/${secondItem.id}`,
    ).send({ status: 'BLOCKED', notes: 'Waiting on a shared laptop.' });
    expect(blocked.body.progress.blockedCount).toBe(1);
    expect(blocked.body.progress.blockedItems[0].id).toBe(secondItem.id);

    const reordered = await authed(
      'put',
      `/api/students/${studentId}/roadmap/phases/${firstPhase.id}/items/reorder`,
    ).send({ ids: [secondItem.id, firstItem.id] });
    expect(reordered.body.phases[0].items[0].id).toBe(secondItem.id);

    const added = await authed(
      'post',
      `/api/students/${studentId}/roadmap/phases/${firstPhase.id}/items`,
    ).send({
      title: 'Mentor checkpoint',
      description: 'Review the first scene with a mentor before continuing.',
      durationDays: 3,
    });
    expect(added.body.phases[0].items.length).toBe(firstPhase.items.length + 1);

    const extraPhase = await authed('post', `/api/students/${studentId}/roadmap/phases`).send({
      title: 'Stretch',
      description: 'Optional extras if the student finishes early.',
    });
    expect(extraPhase.body.phases.map((phase: { title: string }) => phase.title)).toContain(
      'Stretch',
    );

    const dated = await authed(
      'patch',
      `/api/students/${studentId}/roadmap/items/${firstItem.id}`,
    ).send({ startDate: '2026-10-01', dueDate: '2026-10-08', durationDays: 7 });
    expect(
      dated.body.phases[0].items.find((item: { id: string }) => item.id === firstItem.id).startDate,
    ).toBe('2026-10-01');

    const removed = await authed(
      'delete',
      `/api/students/${studentId}/roadmap/items/${added.body.phases[0].items.at(-1).id}`,
    );
    expect(removed.status).toBe(200);

    const forbidden = await authed(
      'post',
      `/api/students/${studentId}/roadmap/phases`,
      counselorToken,
    ).send({
      title: 'Counselor phase',
      description: 'Should be rejected for counselors.',
    });
    expect(forbidden.status).toBe(403);

    const counselorView = await authed('get', `/api/students/${studentId}/roadmap`, counselorToken);
    expect(counselorView.status).toBe(200);
    expect(counselorView.body.progress.blockedCount).toBe(1);
  });
});
