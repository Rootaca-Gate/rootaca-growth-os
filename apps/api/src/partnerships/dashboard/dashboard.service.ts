import { Injectable } from '@nestjs/common';
import {
  PartnershipDeliveryStatus,
  PartnershipFollowUpStatus,
  PartnershipLeadStatus,
  PartnershipOpportunityStatus,
  PartnershipProposalStatus,
  PartnershipReportStatus,
  PartnershipSowStatus,
} from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

export class NamedCountDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  count!: number;
}

export class PartnershipDashboardDto {
  @ApiProperty()
  totalInstitutions!: number;

  @ApiProperty()
  totalLeads!: number;

  @ApiProperty()
  newLeads!: number;

  @ApiProperty()
  qualifiedLeads!: number;

  @ApiProperty()
  contactedLeads!: number;

  @ApiProperty()
  repliedLeads!: number;

  @ApiProperty()
  meetings!: number;

  @ApiProperty()
  proposals!: number;

  @ApiProperty()
  partners!: number;

  @ApiProperty()
  notInterested!: number;

  @ApiProperty()
  noResponse!: number;

  @ApiProperty()
  followUpsDueToday!: number;

  @ApiProperty()
  overdueFollowUps!: number;

  // --- Commercial lifecycle (factual counts) --------------------------------
  @ApiProperty()
  proposalsTotal!: number;

  @ApiProperty()
  proposalsAccepted!: number;

  @ApiProperty()
  sowsActive!: number;

  @ApiProperty()
  deliveriesActive!: number;

  @ApiProperty()
  reportsPublished!: number;

  @ApiProperty()
  renewalsOpen!: number;

  /** Factual attention counters — never AI/guessed. */
  @ApiProperty()
  attentionProposalFollowUp!: number;

  @ApiProperty()
  attentionSowPendingSignature!: number;

  @ApiProperty()
  attentionDeliveryPaused!: number;

  @ApiProperty()
  attentionReportInReview!: number;

  @ApiProperty()
  attentionRenewalPlanning!: number;

  @ApiProperty({ type: [NamedCountDto] })
  institutionsByGovernorate!: NamedCountDto[];

  @ApiProperty({ type: [NamedCountDto] })
  institutionsByType!: NamedCountDto[];

  @ApiProperty({ type: [NamedCountDto] })
  leadsByStatus!: NamedCountDto[];

  @ApiProperty({ type: [NamedCountDto] })
  leadsByPriority!: NamedCountDto[];
}

export class PartnershipSearchHitDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ description: 'Secondary line (status, number, etc.)' })
  subtitle!: string;

  @ApiProperty({ description: 'Absolute admin path, e.g. /partnerships/institutions/:id' })
  path!: string;
}

export class PartnershipSearchGroupDto {
  @ApiProperty({
    enum: [
      'institutions',
      'contacts',
      'leads',
      'proposals',
      'sows',
      'deliveries',
      'reports',
      'renewals',
    ],
  })
  group!: string;

  @ApiProperty({ type: [PartnershipSearchHitDto] })
  items!: PartnershipSearchHitDto[];
}

export class PartnershipSearchResultDto {
  @ApiProperty()
  query!: string;

  @ApiProperty({ type: [PartnershipSearchGroupDto] })
  groups!: PartnershipSearchGroupDto[];
}

@Injectable()
export class PartnershipDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<PartnershipDashboardDto> {
    const activeInstitution = { deletedAt: null };
    const leadWhere = { institution: activeInstitution };
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const OPEN_OPPORTUNITY_STATUSES: PartnershipOpportunityStatus[] = [
      PartnershipOpportunityStatus.IDENTIFIED,
      PartnershipOpportunityStatus.PLANNING,
      PartnershipOpportunityStatus.PROPOSAL_DRAFT,
      PartnershipOpportunityStatus.PROPOSAL_SENT,
      PartnershipOpportunityStatus.NEGOTIATION,
      PartnershipOpportunityStatus.ACCEPTED,
    ];

    const PROPOSAL_FOLLOW_UP: PartnershipProposalStatus[] = [
      PartnershipProposalStatus.SENT,
      PartnershipProposalStatus.VIEWED,
      PartnershipProposalStatus.UNDER_REVIEW,
    ];
    const RENEWAL_PLANNING: PartnershipOpportunityStatus[] = [
      PartnershipOpportunityStatus.IDENTIFIED,
      PartnershipOpportunityStatus.PLANNING,
    ];

    const [
      totalInstitutions,
      totalLeads,
      leadStatusGroups,
      leadPriorityGroups,
      govGroups,
      typeGroups,
      followUpsDueToday,
      overdueFollowUps,
      proposalsTotal,
      proposalsAccepted,
      sowsActive,
      deliveriesActive,
      reportsPublished,
      renewalsOpen,
      attentionProposalFollowUp,
      attentionSowPendingSignature,
      attentionDeliveryPaused,
      attentionReportInReview,
      attentionRenewalPlanning,
    ] = await Promise.all([
      this.prisma.partnershipInstitution.count({ where: activeInstitution }),
      this.prisma.partnershipLead.count({ where: leadWhere }),
      this.prisma.partnershipLead.groupBy({
        by: ['status'],
        where: leadWhere,
        _count: { _all: true },
      }),
      this.prisma.partnershipLead.groupBy({
        by: ['priority'],
        where: leadWhere,
        _count: { _all: true },
      }),
      this.prisma.partnershipInstitution.groupBy({
        by: ['governorate'],
        where: activeInstitution,
        _count: { _all: true },
      }),
      this.prisma.partnershipInstitution.groupBy({
        by: ['institutionType'],
        where: activeInstitution,
        _count: { _all: true },
      }),
      this.prisma.partnershipFollowUp.count({
        where: {
          institution: activeInstitution,
          status: PartnershipFollowUpStatus.PENDING,
          dueDate: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.partnershipFollowUp.count({
        where: {
          institution: activeInstitution,
          status: PartnershipFollowUpStatus.PENDING,
          dueDate: { lt: today },
        },
      }),
      this.prisma.partnershipProposal.count({
        where: { archivedAt: null },
      }),
      this.prisma.partnershipProposal.count({
        where: { status: PartnershipProposalStatus.ACCEPTED },
      }),
      this.prisma.partnershipSow.count({
        where: { archivedAt: null, status: PartnershipSowStatus.ACTIVE },
      }),
      this.prisma.partnershipDelivery.count({
        where: { archivedAt: null, status: PartnershipDeliveryStatus.ACTIVE },
      }),
      this.prisma.partnershipReport.count({
        where: { archivedAt: null, status: PartnershipReportStatus.PUBLISHED },
      }),
      this.prisma.partnershipOpportunity.count({
        where: { archivedAt: null, status: { in: OPEN_OPPORTUNITY_STATUSES } },
      }),
      this.prisma.partnershipProposal.count({
        where: { archivedAt: null, status: { in: PROPOSAL_FOLLOW_UP } },
      }),
      this.prisma.partnershipSow.count({
        where: {
          archivedAt: null,
          status: PartnershipSowStatus.PENDING_SIGNATURE,
        },
      }),
      this.prisma.partnershipDelivery.count({
        where: { archivedAt: null, status: PartnershipDeliveryStatus.PAUSED },
      }),
      this.prisma.partnershipReport.count({
        where: { archivedAt: null, status: PartnershipReportStatus.IN_REVIEW },
      }),
      this.prisma.partnershipOpportunity.count({
        where: { archivedAt: null, status: { in: RENEWAL_PLANNING } },
      }),
    ]);

    const statusCount = (status: PartnershipLeadStatus) =>
      leadStatusGroups.find((g) => g.status === status)?._count._all ?? 0;

    return {
      totalInstitutions,
      totalLeads,
      newLeads: statusCount(PartnershipLeadStatus.NEW),
      qualifiedLeads: statusCount(PartnershipLeadStatus.QUALIFIED),
      contactedLeads: statusCount(PartnershipLeadStatus.CONTACTED),
      repliedLeads: statusCount(PartnershipLeadStatus.REPLIED),
      meetings:
        statusCount(PartnershipLeadStatus.MEETING_SCHEDULED) +
        statusCount(PartnershipLeadStatus.MEETING_DONE),
      proposals: statusCount(PartnershipLeadStatus.PROPOSAL_SENT),
      partners: statusCount(PartnershipLeadStatus.PARTNER),
      notInterested: statusCount(PartnershipLeadStatus.NOT_INTERESTED),
      noResponse: statusCount(PartnershipLeadStatus.NO_RESPONSE),
      followUpsDueToday,
      overdueFollowUps,
      proposalsTotal,
      proposalsAccepted,
      sowsActive,
      deliveriesActive,
      reportsPublished,
      renewalsOpen,
      attentionProposalFollowUp,
      attentionSowPendingSignature,
      attentionDeliveryPaused,
      attentionReportInReview,
      attentionRenewalPlanning,
      institutionsByGovernorate: govGroups
        .filter((g) => g.governorate)
        .map((g) => ({ key: g.governorate as string, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      institutionsByType: typeGroups
        .filter((g) => g.institutionType)
        .map((g) => ({ key: String(g.institutionType), count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      leadsByStatus: leadStatusGroups.map((g) => ({
        key: g.status,
        count: g._count._all,
      })),
      leadsByPriority: leadPriorityGroups.map((g) => ({
        key: g.priority,
        count: g._count._all,
      })),
    };
  }

  /**
   * Cross-entity search for the Partnerships command center.
   * Returns factual matches only — never invents records.
   */
  async search(rawQuery: string, limitPerGroup = 5): Promise<PartnershipSearchResultDto> {
    const query = rawQuery.trim();
    if (query.length < 2) {
      return { query, groups: [] };
    }

    const take = Math.min(Math.max(limitPerGroup, 1), 10);
    const contains = { contains: query, mode: 'insensitive' as const };
    const activeInstitution = { deletedAt: null };

    const [
      institutions,
      contacts,
      leads,
      proposals,
      sows,
      deliveries,
      reports,
      renewals,
    ] = await Promise.all([
      this.prisma.partnershipInstitution.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: contains },
            { arabicName: contains },
            { englishName: contains },
            { city: contains },
            { governorate: contains },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, city: true, status: true },
      }),
      this.prisma.partnershipContact.findMany({
        where: {
          institution: activeInstitution,
          OR: [
            { fullName: contains },
            { firstName: contains },
            { lastName: contains },
            { email: contains },
            { phone: contains },
            { mobile: contains },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          institutionId: true,
          institution: { select: { name: true } },
        },
      }),
      this.prisma.partnershipLead.findMany({
        where: {
          institution: activeInstitution,
          OR: [
            { nextAction: contains },
            { qualificationReason: contains },
            { estimatedOpportunity: contains },
            { institution: { name: contains } },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          status: true,
          institutionId: true,
          institution: { select: { name: true } },
        },
      }),
      this.prisma.partnershipProposal.findMany({
        where: {
          archivedAt: null,
          OR: [
            { proposalNumber: contains },
            { title: contains },
            { institution: { name: contains } },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          proposalNumber: true,
          title: true,
          status: true,
          institution: { select: { name: true } },
        },
      }),
      this.prisma.partnershipSow.findMany({
        where: {
          archivedAt: null,
          OR: [
            { sowNumber: contains },
            { title: contains },
            { institution: { name: contains } },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          sowNumber: true,
          title: true,
          status: true,
          institution: { select: { name: true } },
        },
      }),
      this.prisma.partnershipDelivery.findMany({
        where: {
          archivedAt: null,
          OR: [
            { deliveryNumber: contains },
            { name: contains },
            { institution: { name: contains } },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          deliveryNumber: true,
          name: true,
          status: true,
          institution: { select: { name: true } },
        },
      }),
      this.prisma.partnershipReport.findMany({
        where: {
          archivedAt: null,
          OR: [
            { reportNumber: contains },
            { title: contains },
            { institution: { name: contains } },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          reportNumber: true,
          title: true,
          status: true,
          institution: { select: { name: true } },
        },
      }),
      this.prisma.partnershipOpportunity.findMany({
        where: {
          archivedAt: null,
          OR: [
            { opportunityNumber: contains },
            { title: contains },
            { institution: { name: contains } },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          opportunityNumber: true,
          title: true,
          status: true,
          institution: { select: { name: true } },
        },
      }),
    ]);

    const groups: PartnershipSearchGroupDto[] = [];

    if (institutions.length) {
      groups.push({
        group: 'institutions',
        items: institutions.map((row) => ({
          id: row.id,
          label: row.name,
          subtitle: [row.city, row.status].filter(Boolean).join(' · '),
          path: `/partnerships/institutions/${row.id}`,
        })),
      });
    }
    if (contacts.length) {
      groups.push({
        group: 'contacts',
        items: contacts.map((row) => ({
          id: row.id,
          label: row.fullName,
          subtitle: [row.institution.name, row.email].filter(Boolean).join(' · '),
          path: `/partnerships/institutions/${row.institutionId}`,
        })),
      });
    }
    if (leads.length) {
      groups.push({
        group: 'leads',
        items: leads.map((row) => ({
          id: row.id,
          label: row.institution.name,
          subtitle: row.status,
          path: `/partnerships/leads/${row.id}`,
        })),
      });
    }
    if (proposals.length) {
      groups.push({
        group: 'proposals',
        items: proposals.map((row) => ({
          id: row.id,
          label: row.proposalNumber,
          subtitle: [row.institution.name, row.status, row.title].filter(Boolean).join(' · '),
          path: `/partnerships/proposals/${row.id}`,
        })),
      });
    }
    if (sows.length) {
      groups.push({
        group: 'sows',
        items: sows.map((row) => ({
          id: row.id,
          label: row.sowNumber,
          subtitle: [row.institution.name, row.status, row.title].filter(Boolean).join(' · '),
          path: `/partnerships/sows/${row.id}`,
        })),
      });
    }
    if (deliveries.length) {
      groups.push({
        group: 'deliveries',
        items: deliveries.map((row) => ({
          id: row.id,
          label: row.deliveryNumber,
          subtitle: [row.institution.name, row.status, row.name].filter(Boolean).join(' · '),
          path: `/partnerships/delivery/${row.id}`,
        })),
      });
    }
    if (reports.length) {
      groups.push({
        group: 'reports',
        items: reports.map((row) => ({
          id: row.id,
          label: row.reportNumber,
          subtitle: [row.institution.name, row.status, row.title].filter(Boolean).join(' · '),
          path: `/partnerships/reports/${row.id}`,
        })),
      });
    }
    if (renewals.length) {
      groups.push({
        group: 'renewals',
        items: renewals.map((row) => ({
          id: row.id,
          label: row.opportunityNumber,
          subtitle: [row.institution.name, row.status, row.title].filter(Boolean).join(' · '),
          path: `/partnerships/renewals/${row.id}`,
        })),
      });
    }

    return { query, groups };
  }
}
