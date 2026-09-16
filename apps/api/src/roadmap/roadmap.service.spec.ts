import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LevelCode, PathCode, RoadmapItemStatus, SkillCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoadmapService } from './roadmap.service';

describe('RoadmapService', () => {
  let service: RoadmapService;

  const path = { id: 'path-web', code: PathCode.WEB, name: 'Web', sortOrder: 1 };
  const level = { id: 'level-beginner', code: LevelCode.BEGINNER, name: 'Beginner', sortOrder: 2 };
  const skill = {
    id: 'skill-1',
    code: SkillCode.PROGRAMMING_FUNDAMENTALS,
    name: 'Programming Fundamentals',
  };

  const item = {
    id: 'item-1',
    phaseId: 'phase-1',
    title: 'Set up the web workspace',
    description: 'Open the tools and save a first page.',
    skillId: skill.id,
    skill,
    durationDays: 7,
    startDate: new Date('2026-09-16T00:00:00.000Z'),
    dueDate: new Date('2026-09-23T00:00:00.000Z'),
    status: RoadmapItemStatus.NOT_STARTED,
    completionPercentage: 0,
    projectId: null,
    notes: '',
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const phase = {
    id: 'phase-1',
    roadmapId: 'roadmap-1',
    title: 'Foundations',
    description: 'Guided setup',
    sortOrder: 1,
    items: [item],
  };

  const roadmap = {
    id: 'roadmap-1',
    studentId: 'student-1',
    templateId: 'template-1',
    pathId: path.id,
    levelId: level.id,
    generatedAt: new Date('2026-09-16T08:00:00.000Z'),
    createdAt: new Date('2026-09-16T08:00:00.000Z'),
    updatedAt: new Date('2026-09-16T08:00:00.000Z'),
    path,
    level,
    phases: [phase],
  };

  const prisma = {
    student: { findUnique: jest.fn() },
    roadmapTemplate: { findUnique: jest.fn(), findMany: jest.fn() },
    roadmap: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    roadmapPhase: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    roadmapItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: typeof prisma) => unknown)(prisma);
      }
      return arg;
    });
    prisma.roadmap.findUnique.mockResolvedValue(roadmap);
    prisma.roadmap.findUniqueOrThrow.mockResolvedValue(roadmap);

    const module: TestingModule = await Test.createTestingModule({
      providers: [RoadmapService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(RoadmapService);
  });

  it('keeps an existing roadmap when path and level match', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      currentPathId: path.id,
      currentLevelId: level.id,
      roadmap,
    });

    const result = await service.syncForStudent('student-1');

    expect(result.id).toBe(roadmap.id);
    expect(prisma.roadmap.create).not.toHaveBeenCalled();
  });

  it('generates a dated roadmap from the path/level template', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      currentPathId: path.id,
      currentLevelId: level.id,
      roadmap: null,
      currentPath: path,
      currentLevel: level,
    });
    prisma.roadmapTemplate.findUnique.mockResolvedValue({
      id: 'template-1',
      pathId: path.id,
      levelId: level.id,
      name: 'Web · Beginner',
      description: 'Beginner web',
      path,
      level,
      phases: [
        {
          id: 'tphase-1',
          title: 'Foundations',
          description: 'Setup',
          sortOrder: 1,
          items: [
            {
              title: 'Set up',
              description: 'Open the tools.',
              skillId: skill.id,
              durationDays: 7,
              sortOrder: 1,
            },
          ],
        },
      ],
    });
    prisma.roadmap.create.mockResolvedValue({ id: 'roadmap-1' });
    prisma.roadmapPhase.create.mockResolvedValue({ id: 'phase-1' });
    prisma.roadmapItem.create.mockResolvedValue(item);

    const result = await service.generate('student-1');

    expect(result.pathCode).toBe(PathCode.WEB);
    expect(prisma.roadmap.create).toHaveBeenCalled();
    expect(prisma.roadmapItem.create).toHaveBeenCalled();
    const created = prisma.roadmapItem.create.mock.calls[0]?.[0].data as {
      startDate: Date;
      dueDate: Date;
    };
    expect(created.dueDate.getTime()).toBeGreaterThan(created.startDate.getTime());
  });

  it('updates completion and status together', async () => {
    prisma.roadmapItem.findUnique.mockResolvedValue({
      ...item,
      phase: { ...phase, roadmap },
    });
    prisma.roadmapItem.update.mockResolvedValue(item);

    await service.updateItem('student-1', item.id, { completionPercentage: 100 });

    expect(prisma.roadmapItem.update).toHaveBeenCalledWith({
      where: { id: item.id },
      data: expect.objectContaining({
        status: RoadmapItemStatus.COMPLETED,
        completionPercentage: 100,
      }),
    });
  });

  it('rejects editing before a roadmap exists', async () => {
    prisma.student.findUnique.mockResolvedValue({ id: 'student-1' });
    prisma.roadmap.findUnique.mockResolvedValue(null);
    await expect(
      service.addPhase('student-1', { title: 'Extra', description: 'Mentor-added phase.' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires a selected path before generating', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      currentPathId: null,
      currentLevelId: null,
      roadmap: null,
    });
    await expect(service.generate('student-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
