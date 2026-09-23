import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  PartnershipActivity,
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { InstitutionsService } from '../institutions/institutions.service';
import {
  ActivityResponseDto,
  CreateActivityDto,
  PaginatedActivitiesDto,
  QueryActivitiesDto,
} from './dto/activity.dto';

type ActivityRow = PartnershipActivity & {
  createdBy?: { displayName: string } | null;
};

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
    private readonly institutions: InstitutionsService,
  ) {}

  async create(dto: CreateActivityDto, actorId: string): Promise<ActivityResponseDto> {
    await this.institutions.ensureActiveInstitution(dto.institutionId);
    await this.validateRefs(dto.institutionId, dto.contactId, dto.leadId);

    const row = await this.prisma.partnershipActivity.create({
      data: {
        institutionId: dto.institutionId,
        contactId: dto.contactId,
        leadId: dto.leadId,
        activityType: dto.activityType,
        subject: dto.subject.trim(),
        description: dto.description?.trim() ?? '',
        activityDate: dto.activityDate ? new Date(dto.activityDate) : new Date(),
        createdById: actorId,
      },
      include: { createdBy: { select: { displayName: true } } },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.ACTIVITY,
      entityId: row.id,
      action: PartnershipAuditAction.ACTIVITY_CREATED,
      performedById: actorId,
    });

    return this.toResponse(row);
  }

  async findAll(query: QueryActivitiesDto): Promise<PaginatedActivitiesDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.partnershipActivity.count({ where }),
      this.prisma.partnershipActivity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { activityDate: 'desc' },
        include: { createdBy: { select: { displayName: true } } },
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

  findByInstitution(institutionId: string, query: QueryActivitiesDto) {
    return this.findAll({ ...query, institutionId });
  }

  private buildWhere(query: QueryActivitiesDto): Prisma.PartnershipActivityWhereInput {
    const and: Prisma.PartnershipActivityWhereInput[] = [
      { institution: { deletedAt: null } },
    ];
    if (query.institutionId) and.push({ institutionId: query.institutionId });
    if (query.contactId) and.push({ contactId: query.contactId });
    if (query.leadId) and.push({ leadId: query.leadId });
    if (query.activityType) and.push({ activityType: query.activityType });
    if (query.dateFrom || query.dateTo) {
      and.push({
        activityDate: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        },
      });
    }
    return { AND: and };
  }

  private async validateRefs(
    institutionId: string,
    contactId?: string,
    leadId?: string,
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
  }

  private toResponse(row: ActivityRow): ActivityResponseDto {
    return {
      id: row.id,
      institutionId: row.institutionId,
      contactId: row.contactId,
      leadId: row.leadId,
      activityType: row.activityType,
      subject: row.subject,
      description: row.description,
      activityDate: row.activityDate.toISOString(),
      createdById: row.createdById,
      createdByName: row.createdBy?.displayName ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
