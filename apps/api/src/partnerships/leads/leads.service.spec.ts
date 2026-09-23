import {
  PartnershipActivityType,
  PartnershipLeadPriority,
  PartnershipLeadStatus,
} from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { InstitutionsService } from '../institutions/institutions.service';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  const now = new Date('2026-09-22T00:00:00.000Z');
  const lead = {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    institutionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    primaryContactId: null,
    status: PartnershipLeadStatus.CONTACTED,
    priority: PartnershipLeadPriority.HIGH,
    sourceId: null,
    qualificationReason: null,
    estimatedStudentCount: null,
    estimatedOpportunity: null,
    nextAction: null,
    nextActionDate: null,
    ownerId: null,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    institution: { name: 'ABC School' },
    primaryContact: null,
    owner: null,
  };

  const prisma = {
    partnershipLead: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    partnershipContact: { findUnique: jest.fn() },
    partnershipSource: { findUnique: jest.fn() },
    partnershipActivity: { create: jest.fn(), groupBy: jest.fn() },
    partnershipFollowUp: { groupBy: jest.fn() },
    user: { findUnique: jest.fn() },
  };

  const audit = { record: jest.fn() };
  const institutions = { ensureActiveInstitution: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.partnershipActivity.groupBy.mockResolvedValue([]);
    prisma.partnershipFollowUp.groupBy.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnershipAuditService, useValue: audit },
        { provide: InstitutionsService, useValue: institutions },
      ],
    }).compile();
    service = module.get(LeadsService);
  });

  it('creates a lead', async () => {
    prisma.partnershipLead.create.mockResolvedValue({
      ...lead,
      status: PartnershipLeadStatus.NEW,
    });
    const result = await service.create(
      { institutionId: lead.institutionId },
      'user-1',
    );
    expect(result.status).toBe(PartnershipLeadStatus.NEW);
    expect(institutions.ensureActiveInstitution).toHaveBeenCalled();
  });

  it('returns existing leads with pagination', async () => {
    prisma.partnershipLead.count.mockResolvedValue(1);
    prisma.partnershipLead.findMany.mockResolvedValue([lead]);
    prisma.partnershipActivity.groupBy.mockResolvedValue([
      { leadId: lead.id, _max: { activityDate: now } },
    ]);
    prisma.partnershipFollowUp.groupBy.mockResolvedValue([
      { leadId: lead.id, _min: { dueDate: now } },
    ]);

    const result = await service.findAll({ page: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].institutionName).toBe('ABC School');
    expect(result.items[0].lastActivityAt).toBe(now.toISOString());
    expect(result.items[0].nextFollowUpDate).toBe('2026-09-22');
    expect(prisma.partnershipLead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { institution: { deletedAt: null } },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('applies status and priority filters', async () => {
    prisma.partnershipLead.count.mockResolvedValue(0);
    prisma.partnershipLead.findMany.mockResolvedValue([]);

    await service.findAll({
      status: PartnershipLeadStatus.NEW,
      priority: PartnershipLeadPriority.HIGH,
      page: 2,
      pageSize: 10,
    });

    expect(prisma.partnershipLead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          institution: { deletedAt: null },
          status: PartnershipLeadStatus.NEW,
          priority: PartnershipLeadPriority.HIGH,
        },
        skip: 10,
        take: 10,
      }),
    );
  });

  it('does not filter by status when omitted (all leads)', async () => {
    prisma.partnershipLead.count.mockResolvedValue(0);
    prisma.partnershipLead.findMany.mockResolvedValue([]);

    await service.findAll({ page: 1, pageSize: 20 });

    expect(prisma.partnershipLead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { institution: { deletedAt: null } },
      }),
    );
  });

  it('creates activity and audit only when status actually changes', async () => {
    prisma.partnershipLead.findFirst.mockResolvedValue(lead);
    prisma.partnershipLead.update.mockResolvedValue({
      ...lead,
      status: PartnershipLeadStatus.REPLIED,
    });

    await service.update(lead.id, { status: PartnershipLeadStatus.REPLIED }, 'user-1');

    expect(prisma.partnershipActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          activityType: PartnershipActivityType.NOTE,
          subject: 'Lead status changed',
        }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { from: PartnershipLeadStatus.CONTACTED, to: PartnershipLeadStatus.REPLIED },
      }),
    );
  });

  it('does not create status activity when status unchanged', async () => {
    prisma.partnershipLead.findFirst.mockResolvedValue(lead);
    prisma.partnershipLead.update.mockResolvedValue(lead);

    await service.update(lead.id, { status: PartnershipLeadStatus.CONTACTED }, 'user-1');

    expect(prisma.partnershipActivity.create).not.toHaveBeenCalled();
  });

  it('rejects contact from another institution', async () => {
    prisma.partnershipLead.findFirst.mockResolvedValue(lead);
    prisma.partnershipContact.findUnique.mockResolvedValue({
      id: 'contact-1',
      institutionId: 'other-institution',
    });

    await expect(
      service.update(lead.id, { primaryContactId: 'contact-1' }, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
