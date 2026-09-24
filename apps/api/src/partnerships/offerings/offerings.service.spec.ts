import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipDeliveryFormat,
  PartnershipOfferingStatus,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramRequirementPriority,
  PartnershipProgramStatus,
  PartnershipProgramType,
} from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { OfferingsService } from './offerings.service';

describe('OfferingsService', () => {
  let service: OfferingsService;
  const now = new Date('2026-09-24T00:00:00.000Z');
  const offeringId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const programId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const moduleAId = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
  const moduleBId = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2';

  const program = {
    id: programId,
    name: 'Web Development',
    shortDescription: 'Intro web track',
    programType: PartnershipProgramType.TECHNICAL,
    targetAge: '12-15',
    targetGrades: 'G7-G9',
    recommendedLevel: PartnershipProgramLevel.BEGINNER,
    recommendedStudentProfile: 'Curious beginners',
    status: PartnershipProgramStatus.ACTIVE,
    schoolValue: 'School value',
    studentValue: 'Student value',
    finalProjectName: 'Personal site',
    finalProjectDescription: 'Build a site',
    finalProjectExpectedOutput: 'Deployed site',
    finalProjectSkills: 'HTML, CSS',
    finalProjectEvaluationMethod: 'Demo rubric',
    objectives: [{ id: 'o1', title: 'Obj', description: '', sortOrder: 0 }],
    curriculumModules: [
      { id: moduleAId, title: 'Module A', description: '', skillsDeveloped: '', sortOrder: 0 },
      { id: moduleBId, title: 'Module B', description: '', skillsDeveloped: '', sortOrder: 1 },
    ],
    activities: [{ id: 'a1', name: 'Act', description: '', skillsDeveloped: '', sortOrder: 0 }],
    sampleProjects: [
      { id: 'p1', name: 'Proj', description: '', skills: '', expectedOutput: '', sortOrder: 0 },
    ],
    assessmentMethods: [
      { id: 'm1', key: 'FINAL', label: 'Final', description: '', weight: null, enabled: true, sortOrder: 0 },
    ],
    requirements: [
      {
        id: 'r1',
        kind: PartnershipProgramRequirementKind.EQUIPMENT,
        priority: PartnershipProgramRequirementPriority.REQUIRED,
        label: 'Laptops',
        description: '',
        sortOrder: 0,
      },
    ],
    outcomes: [{ id: 'oc1', title: 'Outcome', description: '', sortOrder: 0 }],
  };

  const baseOffering = {
    id: offeringId,
    name: 'Web Dev — School Package',
    programId,
    deliveryFormat: PartnershipDeliveryFormat.SEMESTER,
    status: PartnershipOfferingStatus.ACTIVE,
    targetAge: null,
    targetGrades: 'G8 only',
    recommendedLevel: null,
    learnerProfile: null,
    duration: null,
    durationUnit: null,
    numberOfSessions: null,
    sessionDurationMinutes: null,
    sessionFrequency: null,
    deliveryMode: null,
    locationNotes: '',
    groupSizeMin: null,
    groupSizeMax: null,
    numberOfGroups: null,
    instructorRequirement: '',
    coordinatorRequirement: '',
    curriculumCustomizationNotes: '',
    projectCustomizationNotes: '',
    includeFinalProject: true,
    assessmentFrequency: '',
    includeInitialAssessment: true,
    includeMidAssessment: true,
    includeFinalAssessment: true,
    studentProgressReport: true,
    schoolSummaryReport: true,
    internalNotes: '',
    commercialNotes: '',
    displayOrder: 10,
    createdAt: now,
    updatedAt: now,
    program,
    selectedModules: [],
    selectedProjects: [],
    requirements: [],
  };

  const prisma = {
    partnershipOffering: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    partnershipProgram: { findUnique: jest.fn() },
    partnershipProgramCurriculumModule: { count: jest.fn() },
    partnershipProgramSampleProject: { count: jest.fn() },
    partnershipOfferingSelectedModule: { deleteMany: jest.fn() },
    partnershipOfferingSelectedProject: { deleteMany: jest.fn() },
    partnershipOfferingRequirement: { deleteMany: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };

  const audit = { record: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnershipAuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(OfferingsService);
  });

  it('creates an offering and records audit', async () => {
    prisma.partnershipProgram.findUnique.mockResolvedValue({ id: programId });
    prisma.partnershipOffering.create.mockResolvedValue(baseOffering);

    const result = await service.create(
      {
        name: 'Web Dev — School Package',
        programId,
        deliveryFormat: PartnershipDeliveryFormat.SEMESTER,
        status: PartnershipOfferingStatus.ACTIVE,
      },
      'user-1',
    );

    expect(result.name).toBe('Web Dev — School Package');
    expect(prisma.partnershipOffering.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith({
      entityType: PartnershipAuditEntityType.OFFERING,
      entityId: offeringId,
      action: PartnershipAuditAction.OFFERING_CREATED,
      performedById: 'user-1',
    });
  });

  it('resolves inherited fields from the program at read time', async () => {
    prisma.partnershipOffering.findUnique.mockResolvedValue(baseOffering);

    const result = await service.findOne(offeringId);

    // targetAge is null on offering => inherit from program
    expect(result.resolved.targetAge).toBe('12-15');
    // targetGrades overridden on the offering => keep override
    expect(result.resolved.targetGrades).toBe('G8 only');
    // recommendedLevel null => inherit
    expect(result.resolved.recommendedLevel).toBe(PartnershipProgramLevel.BEGINNER);
    // learnerProfile null => fall back to program recommendedStudentProfile
    expect(result.resolved.learnerProfile).toBe('Curious beginners');
    // empty selections => inherit ALL modules/projects
    expect(result.selection.inheritAllModules).toBe(true);
    expect(result.resolved.curriculumModules).toHaveLength(2);
    // no custom requirements => inherited from program
    expect(result.resolved.requirementsInherited).toBe(true);
    expect(result.resolved.requirements).toHaveLength(1);
    // includeFinalProject true => final project surfaced
    expect(result.resolved.finalProjectName).toBe('Personal site');
  });

  it('filters curriculum to selected modules and hides final project when disabled', async () => {
    prisma.partnershipOffering.findUnique.mockResolvedValue({
      ...baseOffering,
      includeFinalProject: false,
      selectedModules: [{ id: 's1', offeringId, moduleId: moduleBId, sortOrder: 0 }],
      requirements: [
        {
          id: 'cr1',
          offeringId,
          kind: PartnershipProgramRequirementKind.SCHOOL,
          priority: PartnershipProgramRequirementPriority.RECOMMENDED,
          label: 'Custom req',
          description: '',
          sortOrder: 0,
        },
      ],
    });

    const result = await service.findOne(offeringId);

    expect(result.selection.inheritAllModules).toBe(false);
    expect(result.resolved.curriculumModules).toHaveLength(1);
    expect(result.resolved.curriculumModules[0].id).toBe(moduleBId);
    expect(result.resolved.requirementsInherited).toBe(false);
    expect(result.resolved.requirements[0].label).toBe('Custom req');
    expect(result.resolved.finalProjectName).toBeNull();
  });

  it('archives an offering and records audit', async () => {
    prisma.partnershipOffering.findUnique.mockResolvedValue(baseOffering);
    prisma.partnershipOffering.update.mockResolvedValue({
      ...baseOffering,
      status: PartnershipOfferingStatus.ARCHIVED,
    });

    const result = await service.archive(offeringId, 'user-2');

    expect(result.status).toBe(PartnershipOfferingStatus.ARCHIVED);
    expect(audit.record).toHaveBeenCalledWith({
      entityType: PartnershipAuditEntityType.OFFERING,
      entityId: offeringId,
      action: PartnershipAuditAction.OFFERING_ARCHIVED,
      performedById: 'user-2',
    });
  });

  it('throws when archiving a missing offering', async () => {
    prisma.partnershipOffering.findUnique.mockResolvedValue(null);
    await expect(service.archive(offeringId, 'user-2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
