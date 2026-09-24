import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipDeliveryFormat,
  PartnershipDiscountType,
  PartnershipPricingModel,
  PartnershipProposalStatus,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { OfferingsService } from '../offerings/offerings.service';
import { ProposalsService } from './proposals.service';

describe('ProposalsService', () => {
  let service: ProposalsService;
  const now = new Date('2026-09-24T00:00:00.000Z');
  const proposalId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const institutionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const offeringId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const lineId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  const offeringResponse = {
    id: offeringId,
    name: 'Web Dev — School Package',
    programId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    programName: 'Web Development',
    deliveryFormat: PartnershipDeliveryFormat.SEMESTER,
    status: 'ACTIVE',
    targetGrades: null,
    recommendedLevel: null,
    duration: 16,
    durationUnit: null,
    numberOfSessions: null,
    sessionDurationMinutes: null,
    displayOrder: 0,
    updatedAt: now.toISOString(),
    targetAge: null,
    learnerProfile: null,
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
    createdAt: now.toISOString(),
    program: {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      name: 'Web Development',
      programType: 'TECHNICAL',
      shortDescription: 'Intro web',
      status: 'ACTIVE',
      targetAge: null,
      targetGrades: 'G7-G9',
      recommendedLevel: null,
    },
    resolved: {
      targetAge: null,
      targetGrades: 'G7-G9',
      recommendedLevel: null,
      learnerProfile: null,
      shortDescription: 'Intro web',
      schoolValue: 'School value',
      studentValue: 'Student value',
      objectives: [],
      curriculumModules: [{ id: 'm1', title: 'Mod', description: '', skillsDeveloped: '', sortOrder: 0 }],
      activities: [],
      sampleProjects: [],
      includeFinalProject: true,
      finalProjectName: null,
      finalProjectDescription: null,
      finalProjectExpectedOutput: null,
      finalProjectSkills: null,
      finalProjectEvaluationMethod: null,
      assessmentMethods: [],
      requirements: [],
      requirementsInherited: true,
      outcomes: [],
    },
    selection: {
      selectedModuleIds: [],
      selectedProjectIds: [],
      inheritAllModules: true,
      inheritAllProjects: true,
    },
  };

  const baseProposal = {
    id: proposalId,
    proposalNumber: 'ROOTACA-PROP-2026-0001',
    title: 'Partnership Proposal',
    institutionId,
    status: PartnershipProposalStatus.DRAFT,
    proposalDate: now,
    validUntil: null,
    preparedBy: '',
    version: '1.0',
    executiveSummary: '',
    schoolChallenge: '',
    schoolObjective: '',
    targetStudentGroup: '',
    successCriteria: '',
    partnershipObjective: '',
    implementationApproach: '',
    timelineNotes: '',
    paymentTerms: '',
    nextSteps: '',
    termsAndConditions: '',
    startDate: null,
    endDate: null,
    currency: null,
    taxEnabled: false,
    taxRate: null,
    headerDiscountType: PartnershipDiscountType.NONE,
    headerDiscountValue: null,
    subtotal: null,
    discountAmount: null,
    taxAmount: null,
    grandTotal: null,
    shareToken: null,
    shareTokenCreatedAt: null,
    sentAt: null,
    viewedAt: null,
    isLocked: false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    institution: {
      id: institutionId,
      name: 'Demo School',
      arabicName: null,
      englishName: null,
      institutionType: null,
      city: null,
      governorate: null,
      contacts: [],
    },
    offerings: [
      {
        id: lineId,
        proposalId,
        offeringId,
        sortOrder: 0,
        snapshotProgramName: 'Web Development',
        snapshotOfferingName: 'Web Dev — School Package',
        snapshotDeliveryFormat: PartnershipDeliveryFormat.SEMESTER,
        snapshotTargetGrades: 'G7-G9',
        snapshotRecommendedLevel: null,
        snapshotDuration: 16,
        snapshotDurationUnit: null,
        snapshotNumberOfSessions: null,
        snapshotSessionDurationMinutes: null,
        snapshotSessionFrequency: null,
        snapshotDeliveryMode: null,
        snapshotGroupSizeMin: null,
        snapshotGroupSizeMax: null,
        snapshotNumberOfGroups: null,
        snapshotShortDescription: 'Intro web',
        snapshotSchoolValue: 'School value',
        snapshotStudentValue: 'Student value',
        snapshotCurriculumJson: [],
        snapshotProjectsJson: {},
        snapshotOutcomesJson: [],
        snapshotRequirementsJson: {},
        snapshotAssessmentJson: {},
        snapshotObjectivesJson: [],
        snapshotActivitiesJson: [],
        snapshotCapturedAt: now,
        customizedObjectives: '',
        customizedCurriculumNotes: '',
        specialRequirements: '',
        implementationNotes: '',
        deliveryNotes: '',
        pricingModel: PartnershipPricingModel.PER_PROGRAM,
        quantity: null,
        unitPrice: null,
        discountType: PartnershipDiscountType.NONE,
        discountValue: null,
        lineSubtotal: null,
      },
    ],
    timelinePhases: [],
    customOutcomes: [],
    versions: [],
  };

  const prisma = {
    partnershipProposal: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    partnershipProposalOffering: {
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    partnershipProposalTimelinePhase: { deleteMany: jest.fn() },
    partnershipProposalOutcome: { deleteMany: jest.fn() },
    partnershipProposalVersion: { create: jest.fn() },
    partnershipInstitution: { findUnique: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };

  const audit = { record: jest.fn() };
  const offerings = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    offerings.findOne.mockResolvedValue(offeringResponse);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnershipAuditService, useValue: audit },
        { provide: OfferingsService, useValue: offerings },
      ],
    }).compile();
    service = module.get(ProposalsService);
  });

  it('creates a DRAFT proposal with auto proposalNumber and audit', async () => {
    prisma.partnershipInstitution.findFirst.mockResolvedValue({ id: institutionId });
    prisma.partnershipProposal.findFirst.mockResolvedValue(null);
    prisma.partnershipProposal.create.mockResolvedValue(baseProposal);

    const result = await service.create(
      {
        title: 'Partnership Proposal',
        institutionId,
        offerings: [
          {
            offeringId,
            pricingModel: PartnershipPricingModel.PER_PROGRAM,
          },
        ],
      },
      'user-1',
    );

    expect(result.status).toBe(PartnershipProposalStatus.DRAFT);
    expect(result.proposalNumber).toBe('ROOTACA-PROP-2026-0001');
    expect(prisma.partnershipProposal.create).toHaveBeenCalled();
    expect(offerings.findOne).toHaveBeenCalledWith(offeringId);
    expect(audit.record).toHaveBeenCalledWith({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: proposalId,
      action: PartnershipAuditAction.PROPOSAL_CREATED,
      performedById: 'user-1',
    });
  });

  it('rejects update when proposal is locked', async () => {
    prisma.partnershipProposal.findUnique.mockResolvedValue({
      ...baseProposal,
      isLocked: true,
      status: PartnershipProposalStatus.SENT,
    });

    await expect(
      service.update(proposalId, { title: 'Nope' }, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends a draft: locks, sets SENT, refreshes snapshots, creates version', async () => {
    prisma.partnershipProposal.findUnique
      .mockResolvedValueOnce(baseProposal)
      .mockResolvedValueOnce({
        ...baseProposal,
        status: PartnershipProposalStatus.SENT,
        isLocked: true,
        sentAt: now,
        shareToken: 'abc',
        shareTokenCreatedAt: now,
        versions: [{ id: 'v1', version: '1.0', note: 'Sent', createdAt: now, snapshot: {} }],
      });
    prisma.partnershipProposal.update.mockResolvedValue({
      ...baseProposal,
      status: PartnershipProposalStatus.SENT,
      isLocked: true,
      sentAt: now,
      shareToken: 'abc',
      shareTokenCreatedAt: now,
    });
    prisma.partnershipProposal.findUniqueOrThrow.mockResolvedValue({
      ...baseProposal,
      status: PartnershipProposalStatus.SENT,
      isLocked: true,
      sentAt: now,
      shareToken: 'abc',
      shareTokenCreatedAt: now,
      versions: [{ id: 'v1', version: '1.0', note: 'Sent', createdAt: now, snapshot: {} }],
    });
    prisma.partnershipProposalOffering.deleteMany.mockResolvedValue({ count: 1 });
    prisma.partnershipProposalVersion.create.mockResolvedValue({});

    const result = await service.send(proposalId, 'user-1');

    expect(result.status).toBe(PartnershipProposalStatus.SENT);
    expect(result.isLocked).toBe(true);
    expect(prisma.partnershipProposalOffering.deleteMany).toHaveBeenCalled();
    expect(prisma.partnershipProposalVersion.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: PartnershipAuditAction.PROPOSAL_SENT }),
    );
  });

  it('validates status transitions', async () => {
    prisma.partnershipProposal.findUnique.mockResolvedValue({
      ...baseProposal,
      status: PartnershipProposalStatus.SENT,
      isLocked: true,
    });

    await expect(
      service.changeStatus(
        proposalId,
        { status: PartnershipProposalStatus.DRAFT },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.partnershipProposal.update.mockResolvedValue({
      ...baseProposal,
      status: PartnershipProposalStatus.VIEWED,
      isLocked: true,
      viewedAt: now,
    });

    const viewed = await service.changeStatus(
      proposalId,
      { status: PartnershipProposalStatus.VIEWED },
      'user-1',
    );
    expect(viewed.status).toBe(PartnershipProposalStatus.VIEWED);
  });

  it('revises a locked proposal: unlocks as DRAFT and bumps version', async () => {
    prisma.partnershipProposal.findUnique.mockResolvedValue({
      ...baseProposal,
      status: PartnershipProposalStatus.SENT,
      isLocked: true,
      sentAt: now,
      version: '1.0',
    });
    prisma.partnershipProposalVersion.create.mockResolvedValue({});
    prisma.partnershipProposal.update.mockResolvedValue({
      ...baseProposal,
      status: PartnershipProposalStatus.DRAFT,
      isLocked: false,
      sentAt: null,
      version: '1.1',
    });

    const result = await service.revise(proposalId, 'user-1');

    expect(result.status).toBe(PartnershipProposalStatus.DRAFT);
    expect(result.isLocked).toBe(false);
    expect(result.version).toBe('1.1');
    expect(result.sentAt).toBeNull();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: PartnershipAuditAction.PROPOSAL_VERSIONED }),
    );
  });

  it('throws NotFound when proposal missing', async () => {
    prisma.partnershipProposal.findUnique.mockResolvedValue(null);
    await expect(service.findOne(proposalId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
