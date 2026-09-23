import { Injectable } from '@nestjs/common';
import {
  PartnershipFollowUpStatus,
  PartnershipLeadStatus,
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

  @ApiProperty({ type: [NamedCountDto] })
  institutionsByGovernorate!: NamedCountDto[];

  @ApiProperty({ type: [NamedCountDto] })
  institutionsByType!: NamedCountDto[];

  @ApiProperty({ type: [NamedCountDto] })
  leadsByStatus!: NamedCountDto[];

  @ApiProperty({ type: [NamedCountDto] })
  leadsByPriority!: NamedCountDto[];
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

    const [
      totalInstitutions,
      totalLeads,
      leadStatusGroups,
      leadPriorityGroups,
      govGroups,
      typeGroups,
      followUpsDueToday,
      overdueFollowUps,
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
}
