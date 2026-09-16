import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LevelCode, PathCode, ProgrammingExperience, SkillCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoadmapService } from '../roadmap/roadmap.service';
import { PlacementService } from './placement.service';

describe('PlacementService', () => {
  let service: PlacementService;

  const level = {
    id: 'd00000-level',
    code: LevelCode.EXPLORER,
    name: 'Explorer',
    description: 'Early',
    sortOrder: 1,
    rules: [{ id: 'rule-1', minScore: 0, maxScore: 29, source: 'OVERALL_SCORE' }],
  };
  const beginner = {
    ...level,
    id: 'd00000-beginner',
    code: LevelCode.BEGINNER,
    name: 'Beginner',
    sortOrder: 2,
    rules: [{ id: 'rule-2', minScore: 30, maxScore: 49, source: 'OVERALL_SCORE' }],
  };
  const path = {
    id: 'f00000-game',
    code: PathCode.GAME,
    name: 'Game',
    description: 'Games',
    sortOrder: 4,
  };
  const web = { ...path, id: 'f00000-web', code: PathCode.WEB, name: 'Web', sortOrder: 1 };
  const mobile = {
    ...path,
    id: 'f00000-mobile',
    code: PathCode.MOBILE,
    name: 'Mobile',
    sortOrder: 2,
  };
  const data = { ...path, id: 'f00000-data', code: PathCode.DATA, name: 'Data', sortOrder: 3 };
  const general = {
    ...path,
    id: 'f00000-general',
    code: PathCode.GENERAL,
    name: 'General',
    sortOrder: 5,
  };
  const skill = {
    id: 'e00000-pf',
    code: SkillCode.PROGRAMMING_FUNDAMENTALS,
    name: 'Programming Fundamentals',
    description: 'PF',
    sortOrder: 1,
  };

  const placement = {
    id: 'placement-1',
    studentId: 'student-1',
    assessmentResultId: 'result-1',
    systemLevelId: level.id,
    finalLevelId: level.id,
    systemPathId: path.id,
    finalPathId: path.id,
    alternativePathId: web.id,
    recommendationReasons: ['Interests include games'],
    alternativeReasons: ['Interests include web'],
    levelChangedById: null,
    pathChangedById: null,
    levelOverrideReason: null,
    pathOverrideReason: null,
    levelChangedAt: null,
    pathChangedAt: null,
    createdAt: new Date('2026-09-16T08:00:00.000Z'),
    updatedAt: new Date('2026-09-16T08:00:00.000Z'),
    systemLevel: level,
    finalLevel: level,
    systemPath: path,
    finalPath: path,
    alternativePath: web,
    levelChangedBy: null,
    pathChangedBy: null,
  };

  const prisma = {
    level: { findMany: jest.fn(), findUnique: jest.fn() },
    skill: { findMany: jest.fn() },
    learningPath: { findMany: jest.fn(), findUnique: jest.fn() },
    student: { findUnique: jest.fn(), update: jest.fn() },
    studentSkill: { findMany: jest.fn(), upsert: jest.fn() },
    studentPlacement: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    assessmentResult: { findUnique: jest.fn() },
    orientationSession: { findUnique: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  };

  const roadmapService = {
    syncForStudent: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    roadmapService.syncForStudent.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) =>
      callback(prisma),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlacementService,
        { provide: PrismaService, useValue: prisma },
        { provide: RoadmapService, useValue: roadmapService },
      ],
    }).compile();
    service = module.get(PlacementService);
  });

  it('lists levels with database rules', async () => {
    prisma.level.findMany.mockResolvedValue([level, beginner]);
    const result = await service.listLevels();
    expect(result[0]?.rules?.[0]?.maxScore).toBe(29);
    expect(result[1]?.code).toBe(LevelCode.BEGINNER);
  });

  it('creates placement from an assessment result', async () => {
    prisma.assessmentResult.findUnique.mockResolvedValue({
      id: 'result-1',
      overallScore: 25,
      categoryScores: [{ code: 'PROGRAMMING_FUNDAMENTALS', score: 100 }],
      skillScores: [{ key: 'debugging', score: 40 }],
      session: {
        student: {
          id: 'student-1',
          interests: ['Games'],
          learningGoal: 'Build a first game.',
          programmingExperience: ProgrammingExperience.BEGINNER,
          path: PathCode.GENERAL,
        },
      },
    });
    prisma.level.findMany.mockResolvedValue([level, beginner]);
    prisma.skill.findMany.mockResolvedValue([skill]);
    prisma.learningPath.findMany.mockResolvedValue([web, mobile, data, path, general]);
    prisma.studentPlacement.create.mockResolvedValue({ id: placement.id, studentId: 'student-1' });
    prisma.studentPlacement.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(placement);
    prisma.student.update.mockResolvedValue({});

    const result = await service.applyFromAssessmentResult('result-1');

    expect(result.systemLevel.code).toBe(LevelCode.EXPLORER);
    expect(result.finalLevel.code).toBe(LevelCode.EXPLORER);
    expect(prisma.studentPlacement.create).toHaveBeenCalled();
    expect(prisma.student.update).toHaveBeenCalled();
  });

  it('does not recompute an existing placement', async () => {
    prisma.studentPlacement.findUnique.mockResolvedValue(placement);
    const result = await service.applyFromAssessmentResult('result-1');
    expect(result.id).toBe(placement.id);
    expect(prisma.assessmentResult.findUnique).not.toHaveBeenCalled();
  });

  it('stores system level when a human overrides', async () => {
    prisma.student.findUnique.mockResolvedValue({ id: 'student-1' });
    prisma.studentPlacement.findFirst.mockResolvedValue(placement);
    prisma.level.findUnique.mockResolvedValue(beginner);
    prisma.studentPlacement.update.mockResolvedValue({ id: placement.id });
    prisma.studentPlacement.findUnique.mockResolvedValue({
      ...placement,
      finalLevelId: beginner.id,
      finalLevel: beginner,
      levelOverrideReason: 'Mentor observed stronger independence.',
      levelChangedById: 'user-1',
      levelChangedBy: { id: 'user-1', displayName: 'Mentor' },
      levelChangedAt: new Date('2026-09-16T09:00:00.000Z'),
    });

    const result = await service.overrideLevel(
      'student-1',
      { levelId: beginner.id, reason: 'Mentor observed stronger independence.' },
      'user-1',
    );

    expect(result.systemLevel.code).toBe(LevelCode.EXPLORER);
    expect(result.finalLevel.code).toBe(LevelCode.BEGINNER);
    expect(result.levelOverrideReason).toContain('Mentor');
    expect(result.levelChangedBy?.id).toBe('user-1');
  });

  it('rejects overrides before an assessment', async () => {
    prisma.student.findUnique.mockResolvedValue({ id: 'student-1' });
    prisma.studentPlacement.findFirst.mockResolvedValue(null);
    await expect(
      service.overridePath(
        'student-1',
        { pathId: web.id, reason: 'Family can only attend the web cohort.' },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when the student is missing', async () => {
    prisma.student.findUnique.mockResolvedValue(null);
    await expect(service.getStudentPlacement('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
