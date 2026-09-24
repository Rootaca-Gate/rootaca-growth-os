import {
  PartnershipDeliveryIssueStatus,
  PartnershipDeliveryMilestoneStatus,
  PartnershipDeliveryRaidStatus,
  PartnershipDeliveryRaidType,
  PartnershipDeliveryStatus,
  PartnershipFollowUpStatus,
  PartnershipLeadStatus,
  PartnershipOfferingStatus,
  PartnershipOpportunityStatus,
  PartnershipProposalStatus,
  PartnershipReportStatus,
  PartnershipReportType,
  PartnershipSowStatus,
} from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { computeDeliveryProgress } from '../delivery/delivery-progress';

/** Proposal awaiting response with no update for this many days. */
export const PROPOSAL_FOLLOW_UP_DAYS = 7;
/** Deliveries ending within this window need renewal planning attention. */
export const RENEWAL_PLANNING_WINDOW_DAYS = 45;
const LIST_LIMIT = 8;

export const OPEN_LEAD_STATUSES: PartnershipLeadStatus[] = [
  PartnershipLeadStatus.NEW,
  PartnershipLeadStatus.QUALIFIED,
  PartnershipLeadStatus.CONTACTED,
  PartnershipLeadStatus.REPLIED,
  PartnershipLeadStatus.MEETING_SCHEDULED,
  PartnershipLeadStatus.MEETING_DONE,
  PartnershipLeadStatus.PROPOSAL_SENT,
  PartnershipLeadStatus.NEGOTIATION,
];

export const OPEN_PROPOSAL_STATUSES: PartnershipProposalStatus[] = [
  PartnershipProposalStatus.DRAFT,
  PartnershipProposalStatus.SENT,
  PartnershipProposalStatus.VIEWED,
  PartnershipProposalStatus.UNDER_REVIEW,
];

export const AWAITING_PROPOSAL_STATUSES: PartnershipProposalStatus[] = [
  PartnershipProposalStatus.SENT,
  PartnershipProposalStatus.VIEWED,
  PartnershipProposalStatus.UNDER_REVIEW,
];

export const OPEN_OPPORTUNITY_STATUSES: PartnershipOpportunityStatus[] = [
  PartnershipOpportunityStatus.IDENTIFIED,
  PartnershipOpportunityStatus.PLANNING,
  PartnershipOpportunityStatus.PROPOSAL_DRAFT,
  PartnershipOpportunityStatus.PROPOSAL_SENT,
  PartnershipOpportunityStatus.NEGOTIATION,
  PartnershipOpportunityStatus.ACCEPTED,
];

export class DashboardLinkDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() path!: string;
  @ApiPropertyOptional({ nullable: true }) subtitle!: string | null;
  @ApiPropertyOptional({ nullable: true }) status!: string | null;
  @ApiPropertyOptional({ nullable: true }) lastActivityAt!: string | null;
}

export class PipelineStageDto {
  @ApiProperty() key!: string;
  @ApiProperty() path!: string;
  @ApiProperty() total!: number;
  @ApiPropertyOptional({ nullable: true }) active!: number | null;
  @ApiPropertyOptional({ nullable: true }) highlight!: number | null;
  @ApiPropertyOptional({ nullable: true }) highlightKey!: string | null;
  @ApiPropertyOptional({ nullable: true }) latestActivityAt!: string | null;
}

export class AttentionItemDto {
  @ApiProperty()
  kind!:
    | 'PROPOSAL_FOLLOW_UP'
    | 'SOW_PENDING'
    | 'DELIVERY_ISSUE'
    | 'REPORT_PENDING'
    | 'RENEWAL_PLANNING'
    | 'OVERDUE_FOLLOW_UP';
  @ApiProperty() title!: string;
  @ApiProperty() entityLabel!: string;
  @ApiProperty() path!: string;
  @ApiPropertyOptional({ type: Object, nullable: true })
  queryParams!: Record<string, string> | null;
  @ApiPropertyOptional({ nullable: true }) schoolName!: string | null;
  @ApiPropertyOptional({ nullable: true }) status!: string | null;
  @ApiPropertyOptional({ nullable: true }) lastActivityAt!: string | null;
  @ApiPropertyOptional({ nullable: true }) dueDate!: string | null;
}

export class ActivePartnershipDto {
  @ApiProperty() institutionId!: string;
  @ApiProperty() schoolName!: string;
  @ApiPropertyOptional({ nullable: true }) programName!: string | null;
  @ApiProperty() sowId!: string;
  @ApiProperty() sowNumber!: string;
  @ApiProperty() deliveryId!: string;
  @ApiProperty() deliveryNumber!: string;
  @ApiPropertyOptional({ nullable: true }) progressPercent!: number | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiProperty() status!: string;
}

export class ActiveDeliveryCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() deliveryNumber!: string;
  @ApiProperty() name!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() schoolName!: string;
  @ApiPropertyOptional({ nullable: true }) programName!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty() groupsCount!: number;
  @ApiProperty() studentsCount!: number;
  @ApiProperty() sessionsCompleted!: number;
  @ApiProperty() sessionsTotal!: number;
  @ApiProperty() milestonesCompleted!: number;
  @ApiProperty() milestonesTotal!: number;
  @ApiProperty() openIssues!: number;
  @ApiPropertyOptional({ nullable: true }) progressPercent!: number | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
}

export class UpcomingMilestoneDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() deliveryId!: string;
  @ApiProperty() deliveryNumber!: string;
  @ApiProperty() schoolName!: string;
  @ApiPropertyOptional({ nullable: true }) dueDate!: string | null;
  @ApiProperty() owner!: string;
  @ApiProperty() status!: string;
}

export class UpcomingRenewalDto {
  @ApiPropertyOptional({ nullable: true }) opportunityId!: string | null;
  @ApiPropertyOptional({ nullable: true }) opportunityNumber!: string | null;
  @ApiProperty() institutionId!: string;
  @ApiProperty() schoolName!: string;
  @ApiPropertyOptional({ nullable: true }) deliveryId!: string | null;
  @ApiPropertyOptional({ nullable: true }) deliveryNumber!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) status!: string | null;
  @ApiProperty() path!: string;
  @ApiPropertyOptional({ type: Object, nullable: true })
  queryParams!: Record<string, string> | null;
}

export class RecentActivityDto {
  @ApiProperty() id!: string;
  @ApiProperty() subject!: string;
  @ApiProperty() activityType!: string;
  @ApiProperty() institutionId!: string;
  @ApiPropertyOptional({ nullable: true }) schoolName!: string | null;
  @ApiProperty() occurredAt!: string;
  @ApiProperty() path!: string;
}

export class OutcomesDto {
  @ApiProperty() activeStudents!: number;
  @ApiProperty() completedDeliveries!: number;
  @ApiProperty() publishedReports!: number;
  @ApiProperty() activeDeliveries!: number;
  @ApiProperty() openRenewals!: number;
}

export class DeliveryStatusBreakdownDto {
  @ApiProperty() preparing!: number;
  @ApiProperty() active!: number;
  @ApiProperty() paused!: number;
  @ApiProperty() completed!: number;
  @ApiProperty() cancelled!: number;
}

export class ProgramPerformanceDto {
  @ApiProperty() programName!: string;
  @ApiProperty() activeOfferings!: number;
  @ApiProperty() activeDeliveries!: number;
  @ApiProperty() students!: number;
}

export class PeriodNewCountsDto {
  @ApiProperty() period!: string;
  @ApiProperty() newLeads!: number;
  @ApiProperty() newInstitutions!: number;
  @ApiProperty() newProposals!: number;
  @ApiProperty() newSows!: number;
  @ApiProperty() newDeliveries!: number;
  @ApiProperty() newReports!: number;
  @ApiProperty() newOpportunities!: number;
}

export class CommandCenterDto {
  @ApiProperty() generatedAt!: string;
  @ApiProperty() openLeads!: number;
  @ApiProperty() openProposals!: number;
  @ApiProperty() proposalsAwaitingResponse!: number;
  @ApiProperty() sowsPendingSignature!: number;
  @ApiProperty() reportsPending!: number;
  @ApiProperty() reportsTotal!: number;
  @ApiProperty({ type: [PipelineStageDto] }) pipeline!: PipelineStageDto[];
  @ApiProperty({ type: [AttentionItemDto] }) attention!: AttentionItemDto[];
  @ApiProperty({ type: [ActivePartnershipDto] }) activePartnerships!: ActivePartnershipDto[];
  @ApiProperty({ type: [ActiveDeliveryCardDto] }) activeDeliveries!: ActiveDeliveryCardDto[];
  @ApiProperty({ type: DeliveryStatusBreakdownDto }) deliveryStatus!: DeliveryStatusBreakdownDto;
  @ApiProperty({ type: [UpcomingMilestoneDto] }) upcomingMilestones!: UpcomingMilestoneDto[];
  @ApiProperty({ type: [UpcomingRenewalDto] }) upcomingRenewals!: UpcomingRenewalDto[];
  @ApiProperty({ type: [RecentActivityDto] }) recentActivity!: RecentActivityDto[];
  @ApiProperty({ type: OutcomesDto }) outcomes!: OutcomesDto;
  @ApiProperty({ type: [ProgramPerformanceDto] }) programPerformance!: ProgramPerformanceDto[];
  @ApiPropertyOptional({ type: PeriodNewCountsDto, nullable: true })
  periodNew!: PeriodNewCountsDto | null;
}

export type DashboardPeriodKey = 'all' | 'today' | 'week' | 'month' | 'quarter';

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function startOfUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function periodStart(period: DashboardPeriodKey, today: Date): Date | null {
  if (period === 'all') return null;
  if (period === 'today') return today;
  if (period === 'week') return addDays(today, -6);
  if (period === 'month') {
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  }
  const quarterMonth = Math.floor(today.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(today.getUTCFullYear(), quarterMonth, 1));
}

function normalizePeriod(raw: string | undefined | null): DashboardPeriodKey {
  if (raw === 'today' || raw === 'week' || raw === 'month' || raw === 'quarter') {
    return raw;
  }
  return 'all';
}

/**
 * Builds the Partnerships Command Center payload from factual DB queries only.
 */
export async function buildCommandCenter(
  prisma: PrismaService,
  periodRaw?: string | null,
): Promise<CommandCenterDto> {
  const activeInstitution = { deletedAt: null };
  const today = startOfUtcDay();
  const followUpCutoff = addDays(today, -PROPOSAL_FOLLOW_UP_DAYS);
  const renewalHorizon = addDays(today, RENEWAL_PLANNING_WINDOW_DAYS);
  const period = normalizePeriod(periodRaw);
  const createdSince = periodStart(period, today);

  const [
    openLeads,
    leadsTotal,
    leadsLatest,
    institutionsTotal,
    institutionsLatest,
    proposalsTotal,
    openProposals,
    proposalsAwaitingResponse,
    proposalsLatest,
    sowsTotal,
    sowsActive,
    sowsPendingSignature,
    sowsLatest,
    deliveriesTotal,
    deliveriesActive,
    deliveriesPreparing,
    deliveriesPaused,
    deliveriesCompleted,
    deliveriesCancelled,
    deliveriesLatest,
    reportsTotal,
    reportsPublished,
    reportsPending,
    reportsLatest,
    renewalsOpen,
    renewalsLatest,
    staleProposals,
    pendingSows,
    issueDeliveries,
    overdueMilestones,
    reportPendingDeliveries,
    renewalWindowDeliveries,
    overdueFollowUps,
    activeDeliveryRows,
    upcomingMilestoneRows,
    upcomingOpportunityRows,
    recentActivityRows,
    activeStudentCount,
    activeOfferings,
    periodNewLeads,
    periodNewInstitutions,
    periodNewProposals,
    periodNewSows,
    periodNewDeliveries,
    periodNewReports,
    periodNewOpportunities,
  ] = await Promise.all([
    prisma.partnershipLead.count({
      where: { institution: activeInstitution, status: { in: OPEN_LEAD_STATUSES } },
    }),
    prisma.partnershipLead.count({ where: { institution: activeInstitution } }),
    prisma.partnershipLead.findFirst({
      where: { institution: activeInstitution },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.partnershipInstitution.count({ where: activeInstitution }),
    prisma.partnershipInstitution.findFirst({
      where: activeInstitution,
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.partnershipProposal.count({ where: { archivedAt: null } }),
    prisma.partnershipProposal.count({
      where: { archivedAt: null, status: { in: OPEN_PROPOSAL_STATUSES } },
    }),
    prisma.partnershipProposal.count({
      where: { archivedAt: null, status: { in: AWAITING_PROPOSAL_STATUSES } },
    }),
    prisma.partnershipProposal.findFirst({
      where: { archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.partnershipSow.count({ where: { archivedAt: null } }),
    prisma.partnershipSow.count({
      where: { archivedAt: null, status: PartnershipSowStatus.ACTIVE },
    }),
    prisma.partnershipSow.count({
      where: { archivedAt: null, status: PartnershipSowStatus.PENDING_SIGNATURE },
    }),
    prisma.partnershipSow.findFirst({
      where: { archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.partnershipDelivery.count({ where: { archivedAt: null } }),
    prisma.partnershipDelivery.count({
      where: { archivedAt: null, status: PartnershipDeliveryStatus.ACTIVE },
    }),
    prisma.partnershipDelivery.count({
      where: { archivedAt: null, status: PartnershipDeliveryStatus.PREPARING },
    }),
    prisma.partnershipDelivery.count({
      where: { archivedAt: null, status: PartnershipDeliveryStatus.PAUSED },
    }),
    prisma.partnershipDelivery.count({
      where: { archivedAt: null, status: PartnershipDeliveryStatus.COMPLETED },
    }),
    prisma.partnershipDelivery.count({
      where: { archivedAt: null, status: PartnershipDeliveryStatus.CANCELLED },
    }),
    prisma.partnershipDelivery.findFirst({
      where: { archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.partnershipReport.count({ where: { archivedAt: null } }),
    prisma.partnershipReport.count({
      where: { archivedAt: null, status: PartnershipReportStatus.PUBLISHED },
    }),
    prisma.partnershipReport.count({
      where: {
        archivedAt: null,
        status: {
          in: [PartnershipReportStatus.DRAFT, PartnershipReportStatus.IN_REVIEW],
        },
      },
    }),
    prisma.partnershipReport.findFirst({
      where: { archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.partnershipOpportunity.count({
      where: { archivedAt: null, status: { in: OPEN_OPPORTUNITY_STATUSES } },
    }),
    prisma.partnershipOpportunity.findFirst({
      where: { archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.partnershipProposal.findMany({
      where: {
        archivedAt: null,
        status: { in: AWAITING_PROPOSAL_STATUSES },
        updatedAt: { lt: followUpCutoff },
      },
      take: LIST_LIMIT,
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        proposalNumber: true,
        title: true,
        status: true,
        updatedAt: true,
        institution: { select: { name: true } },
      },
    }),
    prisma.partnershipSow.findMany({
      where: {
        archivedAt: null,
        status: PartnershipSowStatus.PENDING_SIGNATURE,
      },
      take: LIST_LIMIT,
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        sowNumber: true,
        title: true,
        status: true,
        updatedAt: true,
        institution: { select: { name: true } },
      },
    }),
    prisma.partnershipDelivery.findMany({
      where: {
        archivedAt: null,
        status: {
          in: [PartnershipDeliveryStatus.ACTIVE, PartnershipDeliveryStatus.PAUSED],
        },
        OR: [
          { issues: { some: { status: PartnershipDeliveryIssueStatus.OPEN } } },
          {
            raidItems: {
              some: {
                status: PartnershipDeliveryRaidStatus.OPEN,
                type: {
                  in: [
                    PartnershipDeliveryRaidType.RISK,
                    PartnershipDeliveryRaidType.ISSUE,
                  ],
                },
              },
            },
          },
        ],
      },
      take: LIST_LIMIT,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        deliveryNumber: true,
        name: true,
        status: true,
        updatedAt: true,
        institution: { select: { name: true } },
        _count: {
          select: {
            issues: { where: { status: PartnershipDeliveryIssueStatus.OPEN } },
          },
        },
      },
    }),
    prisma.partnershipDeliveryMilestone.findMany({
      where: {
        endDate: { lt: today },
        status: {
          notIn: [PartnershipDeliveryMilestoneStatus.COMPLETED],
        },
        delivery: {
          archivedAt: null,
          status: {
            in: [
              PartnershipDeliveryStatus.ACTIVE,
              PartnershipDeliveryStatus.PREPARING,
              PartnershipDeliveryStatus.PAUSED,
            ],
          },
        },
      },
      take: LIST_LIMIT,
      orderBy: { endDate: 'asc' },
      select: {
        id: true,
        name: true,
        endDate: true,
        status: true,
        owner: true,
        delivery: {
          select: {
            id: true,
            deliveryNumber: true,
            institution: { select: { name: true } },
          },
        },
      },
    }),
    prisma.partnershipDelivery.findMany({
      where: {
        archivedAt: null,
        status: PartnershipDeliveryStatus.COMPLETED,
        finalReportRequired: true,
        partnershipReports: {
          none: {
            archivedAt: null,
            status: PartnershipReportStatus.PUBLISHED,
            type: PartnershipReportType.FINAL_PARTNERSHIP,
          },
        },
      },
      take: LIST_LIMIT,
      orderBy: { endDate: 'asc' },
      select: {
        id: true,
        deliveryNumber: true,
        name: true,
        status: true,
        updatedAt: true,
        endDate: true,
        institution: { select: { name: true } },
      },
    }),
    prisma.partnershipDelivery.findMany({
      where: {
        archivedAt: null,
        status: {
          in: [PartnershipDeliveryStatus.ACTIVE, PartnershipDeliveryStatus.COMPLETED],
        },
        endDate: { gte: today, lte: renewalHorizon },
        opportunitiesAsPrevious: { none: { archivedAt: null } },
      },
      take: LIST_LIMIT,
      orderBy: { endDate: 'asc' },
      select: {
        id: true,
        deliveryNumber: true,
        name: true,
        status: true,
        endDate: true,
        updatedAt: true,
        institutionId: true,
        institution: { select: { name: true } },
      },
    }),
    prisma.partnershipFollowUp.findMany({
      where: {
        institution: activeInstitution,
        status: PartnershipFollowUpStatus.PENDING,
        dueDate: { lt: today },
      },
      take: LIST_LIMIT,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        dueDate: true,
        updatedAt: true,
        institutionId: true,
        institution: { select: { name: true } },
      },
    }),
    prisma.partnershipDelivery.findMany({
      where: {
        archivedAt: null,
        status: {
          in: [
            PartnershipDeliveryStatus.ACTIVE,
            PartnershipDeliveryStatus.PREPARING,
            PartnershipDeliveryStatus.PAUSED,
          ],
        },
      },
      take: LIST_LIMIT,
      orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
      select: {
        id: true,
        deliveryNumber: true,
        name: true,
        status: true,
        endDate: true,
        institutionId: true,
        institution: { select: { name: true } },
        sowId: true,
        sow: {
          select: {
            sowNumber: true,
            scopeOfferings: {
              orderBy: { sortOrder: 'asc' },
              select: { programName: true },
            },
          },
        },
        milestones: { select: { status: true } },
        sessions: { select: { status: true } },
        issues: {
          where: { status: PartnershipDeliveryIssueStatus.OPEN },
          select: { id: true },
        },
        groups: {
          select: {
            _count: { select: { students: true } },
          },
        },
      },
    }),
    prisma.partnershipDeliveryMilestone.findMany({
      where: {
        endDate: { gte: today },
        status: {
          notIn: [PartnershipDeliveryMilestoneStatus.COMPLETED],
        },
        delivery: {
          archivedAt: null,
          status: {
            in: [
              PartnershipDeliveryStatus.ACTIVE,
              PartnershipDeliveryStatus.PREPARING,
              PartnershipDeliveryStatus.PAUSED,
            ],
          },
        },
      },
      take: LIST_LIMIT,
      orderBy: { endDate: 'asc' },
      select: {
        id: true,
        name: true,
        endDate: true,
        owner: true,
        status: true,
        delivery: {
          select: {
            id: true,
            deliveryNumber: true,
            institution: { select: { name: true } },
          },
        },
      },
    }),
    prisma.partnershipOpportunity.findMany({
      where: {
        archivedAt: null,
        status: { in: OPEN_OPPORTUNITY_STATUSES },
      },
      take: LIST_LIMIT,
      orderBy: [{ expectedDate: 'asc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        opportunityNumber: true,
        status: true,
        expectedDate: true,
        institutionId: true,
        institution: { select: { name: true } },
        previousDelivery: {
          select: { id: true, deliveryNumber: true, endDate: true },
        },
      },
    }),
    prisma.partnershipActivity.findMany({
      where: { institution: activeInstitution },
      take: 12,
      orderBy: { activityDate: 'desc' },
      select: {
        id: true,
        subject: true,
        activityType: true,
        activityDate: true,
        institutionId: true,
        institution: { select: { name: true } },
      },
    }),
    prisma.partnershipDeliveryGroupStudent.count({
      where: {
        group: {
          delivery: {
            archivedAt: null,
            status: PartnershipDeliveryStatus.ACTIVE,
          },
        },
      },
    }),
    prisma.partnershipOffering.findMany({
      where: { status: PartnershipOfferingStatus.ACTIVE },
      select: {
        program: { select: { name: true } },
      },
    }),
    createdSince
      ? prisma.partnershipLead.count({
          where: { institution: activeInstitution, createdAt: { gte: createdSince } },
        })
      : Promise.resolve(0),
    createdSince
      ? prisma.partnershipInstitution.count({
          where: { ...activeInstitution, createdAt: { gte: createdSince } },
        })
      : Promise.resolve(0),
    createdSince
      ? prisma.partnershipProposal.count({
          where: { archivedAt: null, createdAt: { gte: createdSince } },
        })
      : Promise.resolve(0),
    createdSince
      ? prisma.partnershipSow.count({
          where: { archivedAt: null, createdAt: { gte: createdSince } },
        })
      : Promise.resolve(0),
    createdSince
      ? prisma.partnershipDelivery.count({
          where: { archivedAt: null, createdAt: { gte: createdSince } },
        })
      : Promise.resolve(0),
    createdSince
      ? prisma.partnershipReport.count({
          where: { archivedAt: null, createdAt: { gte: createdSince } },
        })
      : Promise.resolve(0),
    createdSince
      ? prisma.partnershipOpportunity.count({
          where: { archivedAt: null, createdAt: { gte: createdSince } },
        })
      : Promise.resolve(0),
  ]);

  const pipeline: PipelineStageDto[] = [
    {
      key: 'leads',
      path: '/partnerships/leads',
      total: leadsTotal,
      active: openLeads,
      highlight: openLeads,
      highlightKey: 'open',
      latestActivityAt: iso(leadsLatest?.updatedAt),
    },
    {
      key: 'institutions',
      path: '/partnerships/institutions',
      total: institutionsTotal,
      active: null,
      highlight: null,
      highlightKey: null,
      latestActivityAt: iso(institutionsLatest?.updatedAt),
    },
    {
      key: 'proposals',
      path: '/partnerships/proposals',
      total: proposalsTotal,
      active: openProposals,
      highlight: proposalsAwaitingResponse,
      highlightKey: 'awaitingResponse',
      latestActivityAt: iso(proposalsLatest?.updatedAt),
    },
    {
      key: 'sows',
      path: '/partnerships/sows',
      total: sowsTotal,
      active: sowsActive,
      highlight: sowsActive,
      highlightKey: 'active',
      latestActivityAt: iso(sowsLatest?.updatedAt),
    },
    {
      key: 'deliveries',
      path: '/partnerships/delivery',
      total: deliveriesTotal,
      active: deliveriesActive,
      highlight: deliveriesActive,
      highlightKey: 'inProgress',
      latestActivityAt: iso(deliveriesLatest?.updatedAt),
    },
    {
      key: 'reports',
      path: '/partnerships/reports',
      total: reportsTotal,
      active: reportsPublished,
      highlight: reportsPending,
      highlightKey: 'pending',
      latestActivityAt: iso(reportsLatest?.updatedAt),
    },
    {
      key: 'renewals',
      path: '/partnerships/renewals',
      total: renewalsOpen,
      active: renewalsOpen,
      highlight: renewalsOpen,
      highlightKey: 'open',
      latestActivityAt: iso(renewalsLatest?.updatedAt),
    },
  ];

  const attention: AttentionItemDto[] = [];

  for (const row of staleProposals) {
    attention.push({
      kind: 'PROPOSAL_FOLLOW_UP',
      title: 'Proposal follow-up',
      entityLabel: row.proposalNumber,
      path: `/partnerships/proposals/${row.id}`,
      queryParams: null,
      schoolName: row.institution.name,
      status: row.status,
      lastActivityAt: iso(row.updatedAt),
      dueDate: null,
    });
  }
  for (const row of pendingSows) {
    attention.push({
      kind: 'SOW_PENDING',
      title: 'SOW pending signature',
      entityLabel: row.sowNumber,
      path: `/partnerships/sows/${row.id}`,
      queryParams: null,
      schoolName: row.institution.name,
      status: row.status,
      lastActivityAt: iso(row.updatedAt),
      dueDate: null,
    });
  }
  for (const row of issueDeliveries) {
    attention.push({
      kind: 'DELIVERY_ISSUE',
      title: 'Delivery issue',
      entityLabel: row.deliveryNumber,
      path: `/partnerships/delivery/${row.id}`,
      queryParams: null,
      schoolName: row.institution.name,
      status: row.status,
      lastActivityAt: iso(row.updatedAt),
      dueDate: null,
    });
  }
  for (const row of overdueMilestones) {
    attention.push({
      kind: 'DELIVERY_ISSUE',
      title: 'Milestone overdue',
      entityLabel: row.name,
      path: `/partnerships/delivery/${row.delivery.id}`,
      queryParams: null,
      schoolName: row.delivery.institution.name,
      status: row.status,
      lastActivityAt: null,
      dueDate: iso(row.endDate),
    });
  }
  for (const row of reportPendingDeliveries) {
    attention.push({
      kind: 'REPORT_PENDING',
      title: 'Report pending',
      entityLabel: row.deliveryNumber,
      path: `/partnerships/delivery/${row.id}`,
      queryParams: null,
      schoolName: row.institution.name,
      status: row.status,
      lastActivityAt: iso(row.updatedAt),
      dueDate: iso(row.endDate),
    });
  }
  for (const row of renewalWindowDeliveries) {
    attention.push({
      kind: 'RENEWAL_PLANNING',
      title: 'Renewal planning',
      entityLabel: row.deliveryNumber,
      path: '/partnerships/renewals/new',
      queryParams: {
        deliveryId: row.id,
        institutionId: row.institutionId,
      },
      schoolName: row.institution.name,
      status: row.status,
      lastActivityAt: iso(row.updatedAt),
      dueDate: iso(row.endDate),
    });
  }
  for (const row of overdueFollowUps) {
    attention.push({
      kind: 'OVERDUE_FOLLOW_UP',
      title: 'Overdue follow-up',
      entityLabel: row.title,
      path: `/partnerships/institutions/${row.institutionId}`,
      queryParams: null,
      schoolName: row.institution.name,
      status: 'OVERDUE',
      lastActivityAt: iso(row.updatedAt),
      dueDate: iso(row.dueDate),
    });
  }

  const activePartnerships: ActivePartnershipDto[] = activeDeliveryRows
    .filter((row) => row.status === PartnershipDeliveryStatus.ACTIVE)
    .map((row) => {
      const sessionsTotal = row.sessions.length;
      const sessionsCompleted = row.sessions.filter((s) => s.status === 'COMPLETED').length;
      const milestonesTotal = row.milestones.length;
      const milestonesCompleted = row.milestones.filter((m) => m.status === 'COMPLETED').length;
      const progress = computeDeliveryProgress({
        phasesTotal: 0,
        phasesCompleted: 0,
        milestonesTotal,
        milestonesCompleted,
        tasksTotal: 0,
        tasksCompleted: 0,
        sessionsTotal,
        sessionsCompleted,
        deliverablesTotal: 0,
        deliverablesAccepted: 0,
      });
      return {
        institutionId: row.institutionId,
        schoolName: row.institution.name,
        programName: row.sow?.scopeOfferings[0]?.programName ?? null,
        sowId: row.sowId,
        sowNumber: row.sow?.sowNumber ?? '',
        deliveryId: row.id,
        deliveryNumber: row.deliveryNumber,
        progressPercent: progress.overallPercent,
        endDate: iso(row.endDate),
        status: row.status,
      };
    });

  const activeDeliveries: ActiveDeliveryCardDto[] = activeDeliveryRows.map((row) => {
    const sessionsTotal = row.sessions.length;
    const sessionsCompleted = row.sessions.filter((s) => s.status === 'COMPLETED').length;
    const milestonesTotal = row.milestones.length;
    const milestonesCompleted = row.milestones.filter((m) => m.status === 'COMPLETED').length;
    const progress = computeDeliveryProgress({
      phasesTotal: 0,
      phasesCompleted: 0,
      milestonesTotal,
      milestonesCompleted,
      tasksTotal: 0,
      tasksCompleted: 0,
      sessionsTotal,
      sessionsCompleted,
      deliverablesTotal: 0,
      deliverablesAccepted: 0,
    });
    const studentsCount = row.groups.reduce((sum, g) => sum + g._count.students, 0);
    return {
      id: row.id,
      deliveryNumber: row.deliveryNumber,
      name: row.name,
      institutionId: row.institutionId,
      schoolName: row.institution.name,
      programName: row.sow?.scopeOfferings[0]?.programName ?? null,
      status: row.status,
      groupsCount: row.groups.length,
      studentsCount,
      sessionsCompleted,
      sessionsTotal,
      milestonesCompleted,
      milestonesTotal,
      openIssues: row.issues.length,
      progressPercent: progress.overallPercent,
      endDate: iso(row.endDate),
    };
  });

  const offeringCounts = new Map<string, number>();
  for (const row of activeOfferings) {
    const name = row.program.name.trim();
    if (!name) continue;
    offeringCounts.set(name, (offeringCounts.get(name) ?? 0) + 1);
  }

  const programAgg = new Map<
    string,
    { activeOfferings: number; activeDeliveries: number; students: number }
  >();
  for (const row of activeDeliveryRows.filter((d) => d.status === PartnershipDeliveryStatus.ACTIVE)) {
    const students = row.groups.reduce((sum, g) => sum + g._count.students, 0);
    const names = [
      ...new Set(
        (row.sow?.scopeOfferings ?? [])
          .map((o) => o.programName.trim())
          .filter((n) => n.length > 0),
      ),
    ];
    if (names.length === 0) {
      names.push('—');
    }
    for (const name of names) {
      const current = programAgg.get(name) ?? {
        activeOfferings: offeringCounts.get(name) ?? 0,
        activeDeliveries: 0,
        students: 0,
      };
      current.activeDeliveries += 1;
      current.students += students;
      programAgg.set(name, current);
    }
  }
  for (const [name, count] of offeringCounts) {
    if (!programAgg.has(name)) {
      programAgg.set(name, { activeOfferings: count, activeDeliveries: 0, students: 0 });
    }
  }
  const programPerformance: ProgramPerformanceDto[] = [...programAgg.entries()]
    .map(([programName, stats]) => ({
      programName,
      activeOfferings: stats.activeOfferings,
      activeDeliveries: stats.activeDeliveries,
      students: stats.students,
    }))
    .sort((a, b) => b.activeDeliveries - a.activeDeliveries || a.programName.localeCompare(b.programName))
    .slice(0, 12);

  const upcomingMilestones: UpcomingMilestoneDto[] = upcomingMilestoneRows.map((row) => ({
    id: row.id,
    name: row.name,
    deliveryId: row.delivery.id,
    deliveryNumber: row.delivery.deliveryNumber,
    schoolName: row.delivery.institution.name,
    dueDate: iso(row.endDate),
    owner: row.owner,
    status: row.status,
  }));

  const upcomingRenewals: UpcomingRenewalDto[] = [
    ...upcomingOpportunityRows.map((row) => ({
      opportunityId: row.id,
      opportunityNumber: row.opportunityNumber,
      institutionId: row.institutionId,
      schoolName: row.institution.name,
      deliveryId: row.previousDelivery?.id ?? null,
      deliveryNumber: row.previousDelivery?.deliveryNumber ?? null,
      endDate: iso(row.expectedDate ?? row.previousDelivery?.endDate ?? null),
      status: row.status,
      path: `/partnerships/renewals/${row.id}`,
      queryParams: null,
    })),
    ...renewalWindowDeliveries
      .filter(
        (d) =>
          !upcomingOpportunityRows.some(
            (o) => o.previousDelivery?.id === d.id || o.institutionId === d.institutionId,
          ),
      )
      .map((row) => ({
        opportunityId: null,
        opportunityNumber: null,
        institutionId: row.institutionId,
        schoolName: row.institution.name,
        deliveryId: row.id,
        deliveryNumber: row.deliveryNumber,
        endDate: iso(row.endDate),
        status: null,
        path: '/partnerships/renewals/new',
        queryParams: {
          deliveryId: row.id,
          institutionId: row.institutionId,
        },
      })),
  ].slice(0, LIST_LIMIT);

  const recentActivity: RecentActivityDto[] = recentActivityRows.map((row) => ({
    id: row.id,
    subject: row.subject,
    activityType: row.activityType,
    institutionId: row.institutionId,
    schoolName: row.institution.name,
    occurredAt: row.activityDate.toISOString(),
    path: `/partnerships/institutions/${row.institutionId}`,
  }));

  return {
    generatedAt: new Date().toISOString(),
    openLeads,
    openProposals,
    proposalsAwaitingResponse,
    sowsPendingSignature,
    reportsPending,
    reportsTotal,
    pipeline,
    attention: attention.slice(0, 20),
    activePartnerships,
    activeDeliveries,
    deliveryStatus: {
      preparing: deliveriesPreparing,
      active: deliveriesActive,
      paused: deliveriesPaused,
      completed: deliveriesCompleted,
      cancelled: deliveriesCancelled,
    },
    upcomingMilestones,
    upcomingRenewals,
    recentActivity,
    outcomes: {
      activeStudents: activeStudentCount,
      completedDeliveries: deliveriesCompleted,
      publishedReports: reportsPublished,
      activeDeliveries: deliveriesActive,
      openRenewals: renewalsOpen,
    },
    programPerformance,
    periodNew:
      period === 'all'
        ? null
        : {
            period,
            newLeads: periodNewLeads,
            newInstitutions: periodNewInstitutions,
            newProposals: periodNewProposals,
            newSows: periodNewSows,
            newDeliveries: periodNewDeliveries,
            newReports: periodNewReports,
            newOpportunities: periodNewOpportunities,
          },
  };
}
