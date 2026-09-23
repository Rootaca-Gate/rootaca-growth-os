import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipActivityType,
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipFollowUpStatus,
  PartnershipLead,
  PartnershipLeadPriority,
  PartnershipLeadStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { InstitutionsService } from '../institutions/institutions.service';
import {
  CreateLeadDto,
  LeadResponseDto,
  PaginatedLeadsDto,
  QueryLeadsDto,
  UpdateLeadDto,
} from './dto/lead.dto';

type LeadRow = PartnershipLead & {
  institution?: { name: string } | null;
  primaryContact?: { fullName: string } | null;
  owner?: { displayName: string } | null;
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
    private readonly institutions: InstitutionsService,
  ) {}

  async create(dto: CreateLeadDto, actorId: string): Promise<LeadResponseDto> {
    await this.institutions.ensureActiveInstitution(dto.institutionId);
    await this.validateContact(dto.institutionId, dto.primaryContactId);
    await this.validateOwner(dto.ownerId);
    await this.validateSource(dto.sourceId);

    const row = await this.prisma.partnershipLead.create({
      data: {
        institutionId: dto.institutionId,
        primaryContactId: dto.primaryContactId,
        status: dto.status ?? PartnershipLeadStatus.NEW,
        priority: dto.priority ?? PartnershipLeadPriority.UNKNOWN,
        sourceId: dto.sourceId,
        qualificationReason: dto.qualificationReason?.trim() || null,
        estimatedStudentCount: dto.estimatedStudentCount,
        estimatedOpportunity: dto.estimatedOpportunity?.trim() || null,
        nextAction: dto.nextAction?.trim() || null,
        nextActionDate: dto.nextActionDate
          ? new Date(`${dto.nextActionDate.slice(0, 10)}T00:00:00.000Z`)
          : null,
        ownerId: dto.ownerId,
      },
      include: {
        institution: { select: { name: true } },
        primaryContact: { select: { fullName: true } },
        owner: { select: { displayName: true } },
      },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.LEAD,
      entityId: row.id,
      action: PartnershipAuditAction.LEAD_CREATED,
      performedById: actorId,
    });

    return this.toResponse(row);
  }

  async findAll(query: QueryLeadsDto): Promise<PaginatedLeadsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.PartnershipLeadWhereInput = {
      institution: { deletedAt: null },
      ...(query.institutionId ? { institutionId: query.institutionId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.partnershipLead.count({ where }),
      this.prisma.partnershipLead.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [query.sortBy ?? 'updatedAt']: query.sortOrder ?? 'desc' },
        include: {
          institution: { select: { name: true } },
          primaryContact: { select: { fullName: true } },
          owner: { select: { displayName: true } },
        },
      }),
    ]);

    const enrichment = await this.enrichLeadRows(rows.map((row) => row.id));

    return {
      items: rows.map((row) =>
        this.toResponse(row, enrichment.get(row.id)),
      ),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findOne(id: string): Promise<LeadResponseDto> {
    const row = await this.prisma.partnershipLead.findFirst({
      where: { id, institution: { deletedAt: null } },
      include: {
        institution: { select: { name: true } },
        primaryContact: { select: { fullName: true } },
        owner: { select: { displayName: true } },
      },
    });
    if (!row) {
      throw new NotFoundException('Lead not found');
    }
    const enrichment = await this.enrichLeadRows([row.id]);
    return this.toResponse(row, enrichment.get(row.id));
  }

  async update(id: string, dto: UpdateLeadDto, actorId: string): Promise<LeadResponseDto> {
    const existing = await this.prisma.partnershipLead.findFirst({
      where: { id, institution: { deletedAt: null } },
    });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    await this.validateContact(existing.institutionId, dto.primaryContactId);
    await this.validateOwner(dto.ownerId);
    await this.validateSource(dto.sourceId);

    const statusChanged =
      dto.status !== undefined && dto.status !== existing.status;

    const row = await this.prisma.partnershipLead.update({
      where: { id },
      data: {
        ...(dto.primaryContactId !== undefined
          ? { primaryContactId: dto.primaryContactId }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.sourceId !== undefined ? { sourceId: dto.sourceId } : {}),
        ...(dto.qualificationReason !== undefined
          ? { qualificationReason: dto.qualificationReason.trim() || null }
          : {}),
        ...(dto.estimatedStudentCount !== undefined
          ? { estimatedStudentCount: dto.estimatedStudentCount }
          : {}),
        ...(dto.estimatedOpportunity !== undefined
          ? { estimatedOpportunity: dto.estimatedOpportunity.trim() || null }
          : {}),
        ...(dto.nextAction !== undefined
          ? { nextAction: dto.nextAction.trim() || null }
          : {}),
        ...(dto.nextActionDate !== undefined
          ? {
              nextActionDate: dto.nextActionDate
                ? new Date(`${dto.nextActionDate.slice(0, 10)}T00:00:00.000Z`)
                : null,
            }
          : {}),
        ...(dto.ownerId !== undefined ? { ownerId: dto.ownerId } : {}),
      },
      include: {
        institution: { select: { name: true } },
        primaryContact: { select: { fullName: true } },
        owner: { select: { displayName: true } },
      },
    });

    if (statusChanged && dto.status) {
      await this.prisma.partnershipActivity.create({
        data: {
          institutionId: existing.institutionId,
          leadId: id,
          activityType: PartnershipActivityType.NOTE,
          subject: 'Lead status changed',
          description: `Status changed from ${existing.status} to ${dto.status}`,
          activityDate: new Date(),
          createdById: actorId,
        },
      });
      await this.audit.record({
        entityType: PartnershipAuditEntityType.LEAD,
        entityId: id,
        action: PartnershipAuditAction.STATUS_CHANGED,
        performedById: actorId,
        metadata: { from: existing.status, to: dto.status },
      });
    } else {
      await this.audit.record({
        entityType: PartnershipAuditEntityType.LEAD,
        entityId: id,
        action: PartnershipAuditAction.LEAD_UPDATED,
        performedById: actorId,
      });
    }

    const enrichment = await this.enrichLeadRows([row.id]);
    return this.toResponse(row, enrichment.get(row.id));
  }

  private async enrichLeadRows(
    leadIds: string[],
  ): Promise<
    Map<string, { lastActivityAt: string | null; nextFollowUpDate: string | null }>
  > {
    const result = new Map<
      string,
      { lastActivityAt: string | null; nextFollowUpDate: string | null }
    >();
    for (const id of leadIds) {
      result.set(id, { lastActivityAt: null, nextFollowUpDate: null });
    }
    if (leadIds.length === 0) {
      return result;
    }

    const [activityGroups, followUpGroups] = await Promise.all([
      this.prisma.partnershipActivity.groupBy({
        by: ['leadId'],
        where: { leadId: { in: leadIds } },
        _max: { activityDate: true },
      }),
      this.prisma.partnershipFollowUp.groupBy({
        by: ['leadId'],
        where: {
          leadId: { in: leadIds },
          status: PartnershipFollowUpStatus.PENDING,
        },
        _min: { dueDate: true },
      }),
    ]);

    for (const group of activityGroups) {
      if (!group.leadId) continue;
      const current = result.get(group.leadId);
      if (!current) continue;
      current.lastActivityAt = group._max.activityDate?.toISOString() ?? null;
    }

    for (const group of followUpGroups) {
      if (!group.leadId) continue;
      const current = result.get(group.leadId);
      if (!current) continue;
      current.nextFollowUpDate = group._min.dueDate
        ? group._min.dueDate.toISOString().slice(0, 10)
        : null;
    }

    return result;
  }

  private async validateContact(
    institutionId: string,
    contactId?: string | null,
  ): Promise<void> {
    if (!contactId) return;
    const contact = await this.prisma.partnershipContact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    if (contact.institutionId !== institutionId) {
      throw new BadRequestException('Contact does not belong to institution');
    }
  }

  private async validateOwner(ownerId?: string | null): Promise<void> {
    if (!ownerId) return;
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Owner user not found');
    }
  }

  private async validateSource(sourceId?: string | null): Promise<void> {
    if (!sourceId) return;
    const source = await this.prisma.partnershipSource.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });
    if (!source) {
      throw new NotFoundException('Source not found');
    }
  }

  private toResponse(
    row: LeadRow,
    enrichment?: { lastActivityAt: string | null; nextFollowUpDate: string | null },
  ): LeadResponseDto {
    return {
      id: row.id,
      institutionId: row.institutionId,
      institutionName: row.institution?.name ?? null,
      primaryContactId: row.primaryContactId,
      primaryContactName: row.primaryContact?.fullName ?? null,
      status: row.status,
      priority: row.priority,
      sourceId: row.sourceId,
      qualificationReason: row.qualificationReason,
      estimatedStudentCount: row.estimatedStudentCount,
      estimatedOpportunity: row.estimatedOpportunity,
      nextAction: row.nextAction,
      nextActionDate: row.nextActionDate
        ? row.nextActionDate.toISOString().slice(0, 10)
        : null,
      ownerId: row.ownerId,
      ownerName: row.owner?.displayName ?? null,
      lastActivityAt: enrichment?.lastActivityAt ?? null,
      nextFollowUpDate: enrichment?.nextFollowUpDate ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
