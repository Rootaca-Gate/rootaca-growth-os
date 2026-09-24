import { Test, TestingModule } from '@nestjs/testing';
import { PartnershipLeadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipDashboardService } from './dashboard.service';

describe('PartnershipDashboardService', () => {
  let service: PartnershipDashboardService;
  const prisma = {
    partnershipInstitution: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    partnershipLead: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    partnershipFollowUp: {
      count: jest.fn(),
    },
    partnershipProposal: {
      count: jest.fn(),
    },
    partnershipSow: {
      count: jest.fn(),
    },
    partnershipDelivery: {
      count: jest.fn(),
    },
    partnershipReport: {
      count: jest.fn(),
    },
    partnershipOpportunity: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnershipDashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(PartnershipDashboardService);

    prisma.partnershipInstitution.count.mockResolvedValue(10);
    prisma.partnershipLead.count.mockResolvedValue(5);
    prisma.partnershipLead.groupBy
      .mockResolvedValueOnce([
        { status: PartnershipLeadStatus.NEW, _count: { _all: 2 } },
        { status: PartnershipLeadStatus.PARTNER, _count: { _all: 1 } },
        { status: PartnershipLeadStatus.MEETING_SCHEDULED, _count: { _all: 1 } },
        { status: PartnershipLeadStatus.MEETING_DONE, _count: { _all: 1 } },
      ])
      .mockResolvedValueOnce([{ priority: 'HIGH', _count: { _all: 3 } }]);
    prisma.partnershipInstitution.groupBy
      .mockResolvedValueOnce([{ governorate: 'Cairo', _count: { _all: 4 } }])
      .mockResolvedValueOnce([{ institutionType: 'SCHOOL', _count: { _all: 8 } }]);
    prisma.partnershipFollowUp.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    prisma.partnershipProposal.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4);
    prisma.partnershipSow.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
    prisma.partnershipDelivery.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    prisma.partnershipReport.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    prisma.partnershipOpportunity.count.mockResolvedValueOnce(6).mockResolvedValueOnce(3);
  });

  it('aggregates dashboard metrics without loading all rows', async () => {
    const result = await service.getDashboard();
    expect(result.totalInstitutions).toBe(10);
    expect(result.newLeads).toBe(2);
    expect(result.partners).toBe(1);
    expect(result.meetings).toBe(2);
    expect(result.followUpsDueToday).toBe(2);
    expect(result.overdueFollowUps).toBe(1);
    expect(result.proposalsTotal).toBe(7);
    expect(result.proposalsAccepted).toBe(3);
    expect(result.sowsActive).toBe(4);
    expect(result.deliveriesActive).toBe(2);
    expect(result.reportsPublished).toBe(5);
    expect(result.renewalsOpen).toBe(6);
    expect(result.attentionProposalFollowUp).toBe(4);
    expect(result.attentionSowPendingSignature).toBe(1);
    expect(result.attentionDeliveryPaused).toBe(1);
    expect(result.attentionReportInReview).toBe(2);
    expect(result.attentionRenewalPlanning).toBe(3);
    expect(result.institutionsByGovernorate[0]?.key).toBe('Cairo');
  });
});
