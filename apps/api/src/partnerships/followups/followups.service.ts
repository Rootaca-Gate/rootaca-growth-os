import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  PartnershipActivityType,
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipFollowUp,
  PartnershipFollowUpPriority,
  PartnershipFollowUpStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { InstitutionsService } from '../institutions/institutions.service';
import {
  CreateFollowUpDto,
  FollowUpResponseDto,
  PaginatedFollowUpsDto,
  QueryFollowUpsDto,
  UpdateFollowUpDto,
} from './dto/followup.dto';

@Injectable()
export class FollowUpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
    private readonly institutions: InstitutionsService,
  ) {}

  async create(dto: CreateFollowUpDto, actorId: string): Promise<FollowUpResponseDto> {
    await this.institutions.ensureActiveInstitution(dto.institutionId);
    await this.validateRefs(dto.institutionId, dto.contactId, dto.leadId, dto.assignedToId);

    const row = await this.prisma.partnershipFollowUp.create({
      data: {
        institutionId: dto.institutionId,
        contactId: dto.contactId,
        leadId: dto.leadId,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? '',
        dueDate: new Date(`${dto.dueDate.slice(0, 10)}T00:00:00.000Z`),
        priority: dto.priority ?? PartnershipFollowUpPriority.MEDIUM,
        status: PartnershipFollowUpStatus.PENDING,
        assignedToId: dto.assignedToId,
      },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.FOLLOW_UP,
      entityId: row.id,
      action: PartnershipAuditAction.FOLLOWUP_CREATED,
      performedById: actorId,
    });

    return this.toResponse(row);
  }

  async findAll(query: QueryFollowUpsDto): Promise<PaginatedFollowUpsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.partnershipFollowUp.count({ where }),
      this.prisma.partnershipFollowUp.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      items: rows.map((row) => this.toResponse(row)),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  findByInstitution(institutionId: string, query: QueryFollowUpsDto) {
    return this.findAll({ ...query, institutionId });
  }

  async update(id: string, dto: UpdateFollowUpDto, actorId: string): Promise<FollowUpResponseDto> {
    const existing = await this.prisma.partnershipFollowUp.findFirst({
      where: { id, institution: { deletedAt: null } },
    });
    if (!existing) {
      throw new NotFoundException('Follow-up not found');
    }

    const completing =
      dto.complete === true || dto.status === PartnershipFollowUpStatus.COMPLETED;
    const alreadyCompleted = existing.status === PartnershipFollowUpStatus.COMPLETED;

    const row = await this.prisma.partnershipFollowUp.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: new Date(`${dto.dueDate.slice(0, 10)}T00:00:00.000Z`) }
          : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId } : {}),
        ...(dto.status !== undefined && !completing ? { status: dto.status } : {}),
        ...(completing && !alreadyCompleted
          ? {
              status: PartnershipFollowUpStatus.COMPLETED,
              completedAt: new Date(),
            }
          : {}),
      },
    });

    if (completing && !alreadyCompleted) {
      await this.prisma.partnershipActivity.create({
        data: {
          institutionId: existing.institutionId,
          contactId: existing.contactId,
          leadId: existing.leadId,
          activityType: PartnershipActivityType.FOLLOW_UP,
          subject: `Follow-up completed: ${existing.title}`,
          description: existing.description,
          activityDate: new Date(),
          createdById: actorId,
        },
      });
      await this.audit.record({
        entityType: PartnershipAuditEntityType.FOLLOW_UP,
        entityId: id,
        action: PartnershipAuditAction.FOLLOWUP_COMPLETED,
        performedById: actorId,
      });
    } else {
      await this.audit.record({
        entityType: PartnershipAuditEntityType.FOLLOW_UP,
        entityId: id,
        action: PartnershipAuditAction.FOLLOWUP_UPDATED,
        performedById: actorId,
      });
    }

    return this.toResponse(row);
  }

  private buildWhere(query: QueryFollowUpsDto): Prisma.PartnershipFollowUpWhereInput {
    const and: Prisma.PartnershipFollowUpWhereInput[] = [
      { institution: { deletedAt: null } },
    ];
    if (query.institutionId) and.push({ institutionId: query.institutionId });
    if (query.status) and.push({ status: query.status });
    if (query.priority) and.push({ priority: query.priority });
    if (query.assignedToId) and.push({ assignedToId: query.assignedToId });
    if (query.dueDate) {
      and.push({ dueDate: new Date(`${query.dueDate.slice(0, 10)}T00:00:00.000Z`) });
    }
    if (query.overdue === true) {
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, and.length ? 0 : 0);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      and.push({
        status: PartnershipFollowUpStatus.PENDING,
        dueDate: { lt: today },
      });
    }
    return { AND: and };
  }

  private async validateRefs(
    institutionId: string,
    contactId?: string,
    leadId?: string,
    assignedToId?: string,
  ): Promise<void> {
    if (contactId) {
      const contact = await this.prisma.partnershipContact.findUnique({ where: { id: contactId } });
      if (!contact) throw new NotFoundException('Contact not found');
      if (contact.institutionId !== institutionId) {
        throw new BadRequestException('Contact does not belong to institution');
      }
    }
    if (leadId) {
      const lead = await this.prisma.partnershipLead.findUnique({ where: { id: leadId } });
      if (!lead) throw new NotFoundException('Lead not found');
      if (lead.institutionId !== institutionId) {
        throw new BadRequestException('Lead does not belong to institution');
      }
    }
    if (assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true },
      });
      if (!user) throw new NotFoundException('Assignee not found');
    }
  }

  private toResponse(row: PartnershipFollowUp): FollowUpResponseDto {
    return {
      id: row.id,
      institutionId: row.institutionId,
      contactId: row.contactId,
      leadId: row.leadId,
      title: row.title,
      description: row.description,
      dueDate: row.dueDate.toISOString().slice(0, 10),
      priority: row.priority,
      status: row.status,
      assignedToId: row.assignedToId,
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
