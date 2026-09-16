import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrientationSessionStatus, OrientationStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlacementService } from '../placement/placement.service';
import { OrientationService } from './orientation.service';

describe('OrientationService', () => {
  let service: OrientationService;
  const now = new Date('2026-09-16T08:00:00.000Z');

  const session = {
    id: '44444444-4444-4444-8444-444444444444',
    studentId: '55555555-5555-4555-8555-555555555555',
    createdById: '66666666-6666-4666-8666-666666666666',
    status: OrientationSessionStatus.DRAFT,
    currentStage: OrientationStage.STUDENT_PROFILE,
    notes: '',
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    lastResumedAt: null,
    elapsedMs: 0,
    createdAt: now,
    updatedAt: now,
    student: { id: '55555555-5555-4555-8555-555555555555', fullName: 'Yara Hassan' },
    answers: [],
    result: null,
  };

  const prisma = {
    student: { findUnique: jest.fn() },
    orientationSession: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    assessmentQuestion: { findMany: jest.fn() },
    assessmentAnswer: { upsert: jest.fn(), update: jest.fn() },
    assessmentResult: { upsert: jest.fn() },
    $transaction: jest.fn(),
  };

  const placementService = {
    applyFromCompletedSession: jest.fn().mockResolvedValue(null),
    applyFromAssessmentResult: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    placementService.applyFromCompletedSession.mockResolvedValue(null);
    placementService.applyFromAssessmentResult.mockResolvedValue(null);
    prisma.assessmentQuestion.findMany.mockResolvedValue([]);
    prisma.student.findUnique.mockResolvedValue({ id: session.studentId });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrientationService,
        { provide: PrismaService, useValue: prisma },
        { provide: PlacementService, useValue: placementService },
      ],
    }).compile();
    service = module.get(OrientationService);
  });

  it('reuses an open session instead of creating a second one', async () => {
    prisma.orientationSession.findFirst.mockResolvedValue(session);

    const result = await service.create(session.studentId, session.createdById);

    expect(result.id).toBe(session.id);
    expect(prisma.orientationSession.create).not.toHaveBeenCalled();
  });

  it('starts a draft session', async () => {
    const started = {
      ...session,
      status: OrientationSessionStatus.IN_PROGRESS,
      startedAt: now,
      lastResumedAt: now,
    };
    prisma.orientationSession.findUnique
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(started);
    prisma.orientationSession.update.mockResolvedValue(started);

    const result = await service.start(session.id);

    expect(result.status).toBe(OrientationSessionStatus.IN_PROGRESS);
    expect(result.running).toBe(true);
    expect(prisma.orientationSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: session.id },
        data: expect.objectContaining({ status: OrientationSessionStatus.IN_PROGRESS }),
      }),
    );
    expect(prisma.orientationSession.update.mock.calls[0]?.[0]).not.toHaveProperty('include');
  });

  it('creates a session without a relation include on the write', async () => {
    prisma.orientationSession.findFirst.mockResolvedValue(null);
    prisma.orientationSession.create.mockResolvedValue({ id: session.id });
    prisma.orientationSession.findUnique.mockResolvedValue(session);

    const result = await service.create(session.studentId, session.createdById);

    expect(result.id).toBe(session.id);
    expect(prisma.orientationSession.create).toHaveBeenCalledWith({
      data: { studentId: session.studentId, createdById: session.createdById },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('completes a session without using a prisma transaction', async () => {
    const running = {
      ...session,
      status: OrientationSessionStatus.IN_PROGRESS,
      startedAt: now,
      lastResumedAt: now,
    };
    const completed = {
      ...running,
      status: OrientationSessionStatus.COMPLETED,
      completedAt: now,
      lastResumedAt: null,
      result: {
        id: 'result-1',
        sessionId: session.id,
        overallScore: 0,
        categoryScores: [],
        skillScores: [],
        summary: '',
        completedAt: now,
      },
    };
    prisma.orientationSession.findUnique
      .mockResolvedValueOnce(running)
      .mockResolvedValueOnce(completed);
    prisma.orientationSession.update.mockResolvedValue(completed);
    prisma.assessmentResult.upsert.mockResolvedValue(completed.result);

    const result = await service.complete(session.id);

    expect(result.status).toBe(OrientationSessionStatus.COMPLETED);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.assessmentResult.upsert).toHaveBeenCalled();
  });

  it('rejects edits after completion', async () => {
    prisma.orientationSession.findUnique.mockResolvedValue({
      ...session,
      status: OrientationSessionStatus.COMPLETED,
      result: { id: 'result' },
    });

    await expect(service.pause(session.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 when the session is missing', async () => {
    prisma.orientationSession.findUnique.mockResolvedValue(null);

    await expect(service.findOne(session.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
