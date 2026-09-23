import { Injectable } from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
} from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { InstitutionsService } from '../institutions/institutions.service';

export class TimelineItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  date!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  metadata!: Record<string, unknown> | null;
}

export class TimelineResponseDto {
  @ApiProperty({ type: [TimelineItemDto] })
  items!: TimelineItemDto[];
}

@Injectable()
export class TimelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly institutions: InstitutionsService,
  ) {}

  async getInstitutionTimeline(institutionId: string): Promise<TimelineResponseDto> {
    await this.institutions.ensureActiveInstitution(institutionId);

    const [activities, followUps, notes, audits] = await Promise.all([
      this.prisma.partnershipActivity.findMany({
        where: { institutionId },
        include: { createdBy: { select: { displayName: true } } },
        orderBy: { activityDate: 'desc' },
        take: 200,
      }),
      this.prisma.partnershipFollowUp.findMany({
        where: { institutionId },
        include: { assignedTo: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.partnershipNote.findMany({
        where: { institutionId },
        include: { createdBy: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.partnershipAuditEvent.findMany({
        where: {
          OR: [
            {
              entityType: PartnershipAuditEntityType.INSTITUTION,
              entityId: institutionId,
            },
            {
              entityType: PartnershipAuditEntityType.LEAD,
              action: PartnershipAuditAction.STATUS_CHANGED,
              metadata: { path: ['institutionId'], equals: institutionId },
            },
          ],
        },
        include: { performedBy: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Lead status audits store from/to only — also fetch lead status activities already in activities.
    const leadIds = (
      await this.prisma.partnershipLead.findMany({
        where: { institutionId },
        select: { id: true },
      })
    ).map((l) => l.id);

    const leadStatusAudits =
      leadIds.length > 0
        ? await this.prisma.partnershipAuditEvent.findMany({
            where: {
              entityType: PartnershipAuditEntityType.LEAD,
              entityId: { in: leadIds },
              action: PartnershipAuditAction.STATUS_CHANGED,
            },
            include: { performedBy: { select: { displayName: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
          })
        : [];

    const items: TimelineItemDto[] = [
      ...activities.map((a) => ({
        id: a.id,
        type: `ACTIVITY_${a.activityType}`,
        date: a.activityDate.toISOString(),
        title: a.subject,
        description: a.description,
        createdBy: a.createdBy?.displayName ?? null,
        metadata: { activityType: a.activityType, contactId: a.contactId, leadId: a.leadId },
      })),
      ...followUps.map((f) => ({
        id: f.id,
        type: `FOLLOW_UP_${f.status}`,
        date: f.createdAt.toISOString(),
        title: f.title,
        description: f.description,
        createdBy: f.assignedTo?.displayName ?? null,
        metadata: {
          status: f.status,
          priority: f.priority,
          dueDate: f.dueDate.toISOString().slice(0, 10),
        },
      })),
      ...notes.map((n) => ({
        id: n.id,
        type: 'NOTE',
        date: n.createdAt.toISOString(),
        title: 'Note',
        description: n.content,
        createdBy: n.createdBy?.displayName ?? null,
        metadata: { contactId: n.contactId, leadId: n.leadId },
      })),
      ...audits.map((a) => ({
        id: a.id,
        type: `AUDIT_${a.action}`,
        date: a.createdAt.toISOString(),
        title: a.action,
        description: typeof a.metadata === 'object' ? JSON.stringify(a.metadata) : '',
        createdBy: a.performedBy?.displayName ?? null,
        metadata: (a.metadata as Record<string, unknown> | null) ?? null,
      })),
      ...leadStatusAudits.map((a) => ({
        id: a.id,
        type: 'LEAD_STATUS_CHANGED',
        date: a.createdAt.toISOString(),
        title: 'Lead status changed',
        description:
          a.metadata && typeof a.metadata === 'object'
            ? `${(a.metadata as { from?: string }).from ?? '?'} → ${(a.metadata as { to?: string }).to ?? '?'}`
            : '',
        createdBy: a.performedBy?.displayName ?? null,
        metadata: (a.metadata as Record<string, unknown> | null) ?? null,
      })),
    ];

    items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    return { items };
  }
}
