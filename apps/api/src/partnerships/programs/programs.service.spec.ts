import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipDeliveryFormat,
  PartnershipProgramStatus,
  PartnershipProgramType,
} from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { ProgramsService } from './programs.service';

describe('ProgramsService', () => {
  let service: ProgramsService;
  const now = new Date('2026-09-23T00:00:00.000Z');
  const programId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  const fullProgram = {
    id: programId,
    name: 'Web Development',
    shortDescription: 'Intro web track',
    programType: PartnershipProgramType.TECHNICAL,
    targetAge: null,
    targetGrades: null,
    recommendedLevel: null,
    recommendedStudentProfile: '',
    status: PartnershipProgramStatus.ACTIVE,
    displayOrder: 30,
    internalNotes: '',
    schoolValue: 'School value',
    studentValue: 'Student value',
    finalProjectName: null,
    finalProjectDescription: null,
    finalProjectExpectedOutput: null,
    finalProjectSkills: null,
    finalProjectEvaluationMethod: null,
    createdAt: now,
    updatedAt: now,
    objectives: [],
    curriculumModules: [],
    activities: [],
    sampleProjects: [],
    assessmentMethods: [],
    deliveryFormats: [{ format: PartnershipDeliveryFormat.SEMESTER }],
    requirements: [],
    outcomes: [],
    documents: [],
  };

  const prisma = {
    partnershipProgram: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    partnershipProgramObjective: { deleteMany: jest.fn() },
    partnershipProgramCurriculumModule: { deleteMany: jest.fn() },
    partnershipProgramActivity: { deleteMany: jest.fn() },
    partnershipProgramSampleProject: { deleteMany: jest.fn() },
    partnershipProgramAssessmentMethod: { deleteMany: jest.fn() },
    partnershipProgramDeliverySupport: { deleteMany: jest.fn() },
    partnershipProgramRequirement: { deleteMany: jest.fn() },
    partnershipProgramOutcome: { deleteMany: jest.fn() },
    partnershipProgramDocument: { deleteMany: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };

  const audit = { record: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnershipAuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(ProgramsService);
  });

  it('creates a program and records audit', async () => {
    prisma.partnershipProgram.create.mockResolvedValue(fullProgram);

    const result = await service.create(
      {
        name: 'Web Development',
        programType: PartnershipProgramType.TECHNICAL,
        deliveryFormats: [PartnershipDeliveryFormat.SEMESTER],
      },
      'user-1',
    );

    expect(result.name).toBe('Web Development');
    expect(prisma.partnershipProgram.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith({
      entityType: PartnershipAuditEntityType.PROGRAM,
      entityId: programId,
      action: PartnershipAuditAction.PROGRAM_CREATED,
      performedById: 'user-1',
    });
  });

  it('archives a program and records audit', async () => {
    prisma.partnershipProgram.findUnique.mockResolvedValue(fullProgram);
    prisma.partnershipProgram.update.mockResolvedValue({
      ...fullProgram,
      status: PartnershipProgramStatus.ARCHIVED,
    });

    const result = await service.archive(programId, 'user-2');

    expect(result.status).toBe(PartnershipProgramStatus.ARCHIVED);
    expect(prisma.partnershipProgram.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: programId },
        data: { status: PartnershipProgramStatus.ARCHIVED },
      }),
    );
    expect(audit.record).toHaveBeenCalledWith({
      entityType: PartnershipAuditEntityType.PROGRAM,
      entityId: programId,
      action: PartnershipAuditAction.PROGRAM_ARCHIVED,
      performedById: 'user-2',
    });
  });

  it('throws when archiving a missing program', async () => {
    prisma.partnershipProgram.findUnique.mockResolvedValue(null);
    await expect(service.archive(programId, 'user-2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
