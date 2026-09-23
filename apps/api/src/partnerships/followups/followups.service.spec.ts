import { Test, TestingModule } from '@nestjs/testing';
import {
  PartnershipFollowUpPriority,
  PartnershipFollowUpStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { InstitutionsService } from '../institutions/institutions.service';
import { FollowUpsService } from './followups.service';

describe('FollowUpsService', () => {
  let service: FollowUpsService;
  const now = new Date('2026-09-22T00:00:00.000Z');
  const followUp = {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    institutionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    contactId: null,
    leadId: null,
    title: 'Call principal',
    description: '',
    dueDate: now,
    priority: PartnershipFollowUpPriority.HIGH,
    status: PartnershipFollowUpStatus.PENDING,
    assignedToId: null,
    completedAt: null,
    metadata: null,
    createdAt: now,
    updatedAt: now,
  };

  const prisma = {
    partnershipFollowUp: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    partnershipActivity: { create: jest.fn() },
    partnershipContact: { findUnique: jest.fn() },
    partnershipLead: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const audit = { record: jest.fn() };
  const institutions = { ensureActiveInstitution: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnershipAuditService, useValue: audit },
        { provide: InstitutionsService, useValue: institutions },
      ],
    }).compile();
    service = module.get(FollowUpsService);
  });

  it('completes a follow-up and creates activity + audit', async () => {
    prisma.partnershipFollowUp.findFirst.mockResolvedValue(followUp);
    prisma.partnershipFollowUp.update.mockResolvedValue({
      ...followUp,
      status: PartnershipFollowUpStatus.COMPLETED,
      completedAt: now,
    });

    const result = await service.update(followUp.id, { complete: true }, 'user-1');

    expect(result.status).toBe(PartnershipFollowUpStatus.COMPLETED);
    expect(prisma.partnershipActivity.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: expect.stringContaining('FOLLOWUP_COMPLETED') }),
    );
  });
});
