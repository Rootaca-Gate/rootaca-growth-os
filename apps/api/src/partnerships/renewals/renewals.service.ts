import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipOpportunityStatus,
  PartnershipOpportunityTimelineKind,
  PartnershipOpportunityType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { ProposalsService } from '../proposals/proposals.service';
import { SowsService } from '../sows/sows.service';
import {
  buildHistoricalSnapshot,
  OpportunityHistoricalSnapshot,
} from './opportunity-snapshot';
import {
  AddTimelineEventDto,
  ChangeOpportunityStatusDto,
  CreateOpportunityDto,
  CreateOpportunityFromDeliveryDto,
  CreateOpportunityFromReportDto,
  CreateProposalFromOpportunityDto,
  OpportunityDashboardDto,
  OpportunityListItemDto,
  OpportunityResponseDto,
  OpportunityUserOptionDto,
  PaginatedOpportunitiesDto,
  QueryOpportunitiesDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';

const opportunityInclude = {
  institution: { select: { id: true, name: true } },
  campusInstitution: { select: { id: true, name: true } },
  previousProposal: { select: { id: true, proposalNumber: true, title: true } },
  previousSow: { select: { id: true, sowNumber: true, title: true } },
  previousDelivery: { select: { id: true, deliveryNumber: true, name: true } },
  previousReport: { select: { id: true, reportNumber: true, title: true } },
  newProposal: { select: { id: true, proposalNumber: true, title: true, status: true } },
  newSow: { select: { id: true, sowNumber: true, title: true } },
  owner: { select: { id: true, displayName: true } },
  expansionKinds: { orderBy: { sortOrder: 'asc' as const } },
  timeline: {
    orderBy: { occurredAt: 'desc' as const },
    take: 100,
    include: { performedBy: { select: { displayName: true } } },
  },
  activityLogs: {
    orderBy: { createdAt: 'desc' as const },
    take: 100,
    include: { performedBy: { select: { displayName: true } } },
  },
} satisfies Prisma.PartnershipOpportunityInclude;

type OpportunityRow = Prisma.PartnershipOpportunityGetPayload<{
  include: typeof opportunityInclude;
}>;

const listInclude = {
  institution: { select: { name: true } },
  previousDelivery: { select: { deliveryNumber: true } },
  previousSow: { select: { sowNumber: true } },
  previousReport: { select: { reportNumber: true } },
  owner: { select: { displayName: true } },
} satisfies Prisma.PartnershipOpportunityInclude;

type OpportunityListRow = Prisma.PartnershipOpportunityGetPayload<{
  include: typeof listInclude;
}>;

const S = PartnershipOpportunityStatus;

const ALLOWED_TRANSITIONS: Record<
  PartnershipOpportunityStatus,
  PartnershipOpportunityStatus[]
> = {
  [S.IDENTIFIED]: [S.PLANNING, S.CLOSED],
  [S.PLANNING]: [S.PROPOSAL_DRAFT, S.CLOSED],
  [S.PROPOSAL_DRAFT]: [S.PROPOSAL_SENT, S.CLOSED],
  [S.PROPOSAL_SENT]: [S.NEGOTIATION, S.REJECTED, S.EXPIRED, S.CLOSED],
  [S.NEGOTIATION]: [S.ACCEPTED, S.REJECTED, S.EXPIRED, S.CLOSED],
  [S.ACCEPTED]: [S.CONVERTED, S.CLOSED],
  [S.REJECTED]: [],
  [S.EXPIRED]: [],
  [S.CONVERTED]: [],
  [S.CLOSED]: [],
};

const TIMELINE_KIND_FOR_STATUS: Partial<
  Record<PartnershipOpportunityStatus, PartnershipOpportunityTimelineKind>
> = {
  [S.PROPOSAL_SENT]: PartnershipOpportunityTimelineKind.PROPOSAL_SENT,
  [S.NEGOTIATION]: PartnershipOpportunityTimelineKind.NEGOTIATION,
  [S.ACCEPTED]: PartnershipOpportunityTimelineKind.ACCEPTED,
  [S.REJECTED]: PartnershipOpportunityTimelineKind.REJECTED,
  [S.CONVERTED]: PartnershipOpportunityTimelineKind.CONVERTED,
  [S.CLOSED]: PartnershipOpportunityTimelineKind.CLOSED,
};

const OPEN_STATUSES: PartnershipOpportunityStatus[] = [
  S.IDENTIFIED,
  S.PLANNING,
  S.PROPOSAL_DRAFT,
  S.PROPOSAL_SENT,
  S.NEGOTIATION,
  S.ACCEPTED,
];

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function date(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function parseSnapshot(raw: unknown): OpportunityHistoricalSnapshot | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return raw as OpportunityHistoricalSnapshot;
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((v): v is string => typeof v === 'string');
}

function num(value: Prisma.Decimal | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = value.toNumber();
  return Number.isFinite(parsed) ? parsed : null;
}

@Injectable()
export class RenewalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
    private readonly proposals: ProposalsService,
    private readonly sows: SowsService,
  ) {}

  async findAll(query: QueryOpportunitiesDto): Promise<PaginatedOpportunitiesDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildWhere(query);
    const [total, rows] = await Promise.all([
      this.prisma.partnershipOpportunity.count({ where }),
      this.prisma.partnershipOpportunity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { expectedDate: { sort: 'asc', nulls: 'last' } },
          { updatedAt: 'desc' },
        ],
        include: listInclude,
      }),
    ]);

    return {
      items: rows.map((row) => this.toListItem(row)),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findOne(id: string): Promise<OpportunityResponseDto> {
    return this.toResponse(await this.requireOpportunity(id));
  }

  async dashboard(): Promise<OpportunityDashboardDto> {
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const [open, renewals, expansions, proposalDrafts, converted, upcoming] =
      await Promise.all([
        this.prisma.partnershipOpportunity.count({
          where: { archivedAt: null, status: { in: OPEN_STATUSES } },
        }),
        this.prisma.partnershipOpportunity.count({
          where: {
            archivedAt: null,
            type: {
              in: [
                PartnershipOpportunityType.RENEWAL,
                PartnershipOpportunityType.RENEWAL_AND_EXPANSION,
              ],
            },
          },
        }),
        this.prisma.partnershipOpportunity.count({
          where: {
            archivedAt: null,
            type: {
              in: [
                PartnershipOpportunityType.EXPANSION,
                PartnershipOpportunityType.RENEWAL_AND_EXPANSION,
              ],
            },
          },
        }),
        this.prisma.partnershipOpportunity.count({
          where: {
            archivedAt: null,
            status: { in: [S.PROPOSAL_DRAFT, S.PROPOSAL_SENT] },
          },
        }),
        this.prisma.partnershipOpportunity.count({
          where: { status: S.CONVERTED },
        }),
        this.prisma.partnershipOpportunity.count({
          where: {
            archivedAt: null,
            status: { in: OPEN_STATUSES },
            expectedDate: { gte: now, lte: in90Days },
          },
        }),
      ]);

    return { open, renewals, expansions, proposalDrafts, converted, upcoming };
  }

  async create(
    dto: CreateOpportunityDto,
    actorId: string,
  ): Promise<OpportunityResponseDto> {
    await this.assertInstitution(dto.institutionId);
    const opportunityNumber = await this.nextOpportunityNumber();

    // Resolve previous chain from delivery/report when not explicitly provided.
    let previousProposalId = dto.previousProposalId ?? null;
    let previousSowId = dto.previousSowId ?? null;
    let previousDeliveryId = dto.previousDeliveryId ?? null;
    let previousReportId = dto.previousReportId ?? null;

    if (previousReportId && (!previousDeliveryId || !previousSowId || !previousProposalId)) {
      const report = await this.prisma.partnershipReport.findUnique({
        where: { id: previousReportId },
        select: { deliveryId: true, sowId: true, proposalId: true, institutionId: true },
      });
      if (!report) {
        throw new BadRequestException('Previous report not found');
      }
      previousDeliveryId = previousDeliveryId ?? report.deliveryId;
      previousSowId = previousSowId ?? report.sowId;
      previousProposalId = previousProposalId ?? report.proposalId;
    }

    if (previousDeliveryId && (!previousSowId || !previousProposalId)) {
      const delivery = await this.prisma.partnershipDelivery.findUnique({
        where: { id: previousDeliveryId },
        select: { sowId: true, proposalId: true, institutionId: true },
      });
      if (!delivery) {
        throw new BadRequestException('Previous delivery not found');
      }
      previousSowId = previousSowId ?? delivery.sowId;
      previousProposalId = previousProposalId ?? delivery.proposalId;
    }

    const historicalSnapshot = await buildHistoricalSnapshot(this.prisma, {
      deliveryId: previousDeliveryId,
      reportId: previousReportId,
    });

    const title =
      dto.title?.trim() ||
      (await this.deriveTitle(dto.institutionId, dto.type));

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.partnershipOpportunity.create({
        data: {
          opportunityNumber,
          title,
          type: dto.type,
          status: S.IDENTIFIED,
          institutionId: dto.institutionId,
          campusInstitutionId: dto.campusInstitutionId ?? null,
          previousProposalId,
          previousSowId,
          previousDeliveryId,
          previousReportId,
          ownerId: dto.ownerId ?? null,
          expectedDate: date(dto.expectedDate),
          historicalSnapshot: historicalSnapshot
            ? (historicalSnapshot as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

      await this.addTimeline(
        tx,
        created.id,
        PartnershipOpportunityTimelineKind.OPPORTUNITY_CREATED,
        'Opportunity created',
        actorId,
      );
      await this.logActivity(tx, created.id, 'CREATED', 'Opportunity created', actorId, {
        type: dto.type,
      });

      return created.id;
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OPPORTUNITY,
      entityId: row,
      action: PartnershipAuditAction.OPPORTUNITY_CREATED,
      performedById: actorId,
      metadata: { type: dto.type },
    });

    return this.toResponse(await this.requireOpportunity(row));
  }

  async createFromDelivery(
    dto: CreateOpportunityFromDeliveryDto,
    actorId: string,
  ): Promise<OpportunityResponseDto> {
    const delivery = await this.prisma.partnershipDelivery.findUnique({
      where: { id: dto.deliveryId },
      select: {
        id: true,
        institutionId: true,
        sowId: true,
        proposalId: true,
      },
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return this.create(
      {
        type: dto.type ?? PartnershipOpportunityType.RENEWAL,
        institutionId: delivery.institutionId,
        previousDeliveryId: delivery.id,
        previousSowId: delivery.sowId ?? undefined,
        previousProposalId: delivery.proposalId ?? undefined,
        ownerId: dto.ownerId,
        expectedDate: dto.expectedDate ?? undefined,
      },
      actorId,
    );
  }

  async createFromReport(
    dto: CreateOpportunityFromReportDto,
    actorId: string,
  ): Promise<OpportunityResponseDto> {
    const report = await this.prisma.partnershipReport.findUnique({
      where: { id: dto.reportId },
      select: {
        id: true,
        institutionId: true,
        deliveryId: true,
        sowId: true,
        proposalId: true,
      },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return this.create(
      {
        type: dto.type ?? PartnershipOpportunityType.RENEWAL,
        institutionId: report.institutionId,
        previousReportId: report.id,
        previousDeliveryId: report.deliveryId ?? undefined,
        previousSowId: report.sowId ?? undefined,
        previousProposalId: report.proposalId ?? undefined,
        ownerId: dto.ownerId,
        expectedDate: dto.expectedDate ?? undefined,
      },
      actorId,
    );
  }

  async update(
    id: string,
    dto: UpdateOpportunityDto,
    actorId: string,
  ): Promise<OpportunityResponseDto> {
    const existing = await this.requireOpportunity(id);
    this.assertMutable(existing);

    // Refresh snapshot only when the previous links change and the opportunity
    // has not yet been converted or closed.
    const linksChanged =
      (dto.previousDeliveryId !== undefined &&
        dto.previousDeliveryId !== existing.previousDeliveryId) ||
      (dto.previousReportId !== undefined &&
        dto.previousReportId !== existing.previousReportId);
    const canRefreshSnapshot =
      existing.status !== S.CONVERTED && existing.status !== S.CLOSED;

    let refreshedSnapshot: OpportunityHistoricalSnapshot | null | undefined;
    if (linksChanged && canRefreshSnapshot) {
      refreshedSnapshot = await buildHistoricalSnapshot(this.prisma, {
        deliveryId:
          dto.previousDeliveryId !== undefined
            ? dto.previousDeliveryId
            : existing.previousDeliveryId,
        reportId:
          dto.previousReportId !== undefined
            ? dto.previousReportId
            : existing.previousReportId,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.expansionKinds !== undefined) {
        await tx.partnershipOpportunityExpansionType.deleteMany({
          where: { opportunityId: id },
        });
        if (dto.expansionKinds.length) {
          await tx.partnershipOpportunityExpansionType.createMany({
            data: dto.expansionKinds.map((k, index) => ({
              opportunityId: id,
              kind: k.kind,
              notes: k.notes?.trim() ?? '',
              sortOrder: k.sortOrder ?? index,
            })),
          });
        }
      }

      await tx.partnershipOpportunity.update({
        where: { id },
        data: {
          ...this.stringField(dto, 'title', (v) => v.trim()),
          ...(dto.campusInstitutionId !== undefined
            ? { campusInstitutionId: dto.campusInstitutionId ?? null }
            : {}),
          ...(dto.previousProposalId !== undefined
            ? { previousProposalId: dto.previousProposalId ?? null }
            : {}),
          ...(dto.previousSowId !== undefined
            ? { previousSowId: dto.previousSowId ?? null }
            : {}),
          ...(dto.previousDeliveryId !== undefined
            ? { previousDeliveryId: dto.previousDeliveryId ?? null }
            : {}),
          ...(dto.previousReportId !== undefined
            ? { previousReportId: dto.previousReportId ?? null }
            : {}),
          ...(dto.ownerId !== undefined ? { ownerId: dto.ownerId ?? null } : {}),
          ...(dto.expectedDate !== undefined
            ? { expectedDate: date(dto.expectedDate) }
            : {}),
          ...(dto.renewalProgramIds !== undefined
            ? {
                renewalProgramIds:
                  dto.renewalProgramIds as unknown as Prisma.InputJsonValue,
              }
            : {}),
          ...(dto.renewalOfferingIds !== undefined
            ? {
                renewalOfferingIds:
                  dto.renewalOfferingIds as unknown as Prisma.InputJsonValue,
              }
            : {}),
          ...this.stringField(dto, 'renewalGrades'),
          ...this.stringField(dto, 'renewalGroupsNote'),
          ...this.stringField(dto, 'renewalDurationNote'),
          ...this.stringField(dto, 'renewalDeliveryMode'),
          ...this.stringField(dto, 'renewalScopeNotes'),
          ...this.stringField(dto, 'expansionScopeNotes'),
          ...this.stringField(dto, 'proposedScopeNotes'),
          ...this.stringField(dto, 'existingScopeNotes'),
          ...this.stringField(dto, 'reason'),
          ...this.stringField(dto, 'schoolFeedback'),
          ...this.stringField(dto, 'successFactors'),
          ...this.stringField(dto, 'challenges'),
          ...this.stringField(dto, 'requestedChanges'),
          ...this.stringField(dto, 'internalNotes'),
          ...this.stringField(dto, 'nextSteps'),
          ...this.stringField(dto, 'feedbackSummary'),
          ...(dto.feedbackScore !== undefined
            ? {
                feedbackScore:
                  dto.feedbackScore === null
                    ? null
                    : new Prisma.Decimal(dto.feedbackScore),
              }
            : {}),
          ...this.stringField(dto, 'feedbackRequestedPrograms'),
          ...this.stringField(dto, 'feedbackRequestedChanges'),
          ...this.stringField(dto, 'feedbackKeyComments'),
          ...(dto.feedbackDate !== undefined
            ? { feedbackDate: date(dto.feedbackDate) }
            : {}),
          ...this.stringField(dto, 'feedbackRecordedBy'),
          ...(refreshedSnapshot !== undefined
            ? {
                historicalSnapshot: refreshedSnapshot
                  ? (refreshedSnapshot as unknown as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              }
            : {}),
        },
      });

      await this.logActivity(tx, id, 'UPDATED', 'Opportunity updated', actorId);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OPPORTUNITY,
      entityId: id,
      action: PartnershipAuditAction.OPPORTUNITY_UPDATED,
      performedById: actorId,
    });

    return this.toResponse(await this.requireOpportunity(id));
  }

  async changeStatus(
    id: string,
    dto: ChangeOpportunityStatusDto,
    actorId: string,
  ): Promise<OpportunityResponseDto> {
    const existing = await this.requireOpportunity(id);
    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${existing.status} to ${dto.status}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.PartnershipOpportunityUpdateInput = { status: dto.status };
      if (dto.status === S.CONVERTED) {
        data.convertedAt = new Date();
      }
      if (dto.status === S.CLOSED) {
        data.closedAt = new Date();
      }
      await tx.partnershipOpportunity.update({ where: { id }, data });

      const timelineKind = TIMELINE_KIND_FOR_STATUS[dto.status];
      if (timelineKind) {
        await this.addTimeline(
          tx,
          id,
          timelineKind,
          dto.note?.trim() || `Status changed to ${dto.status}`,
          actorId,
        );
      }
      await this.logActivity(
        tx,
        id,
        'STATUS_CHANGED',
        `Status changed from ${existing.status} to ${dto.status}`,
        actorId,
        { from: existing.status, to: dto.status },
      );
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OPPORTUNITY,
      entityId: id,
      action: PartnershipAuditAction.OPPORTUNITY_STATUS_CHANGED,
      performedById: actorId,
      metadata: { from: existing.status, to: dto.status },
    });
    if (dto.status === S.CONVERTED) {
      await this.audit.record({
        entityType: PartnershipAuditEntityType.OPPORTUNITY,
        entityId: id,
        action: PartnershipAuditAction.OPPORTUNITY_CONVERTED,
        performedById: actorId,
      });
    }
    if (dto.status === S.CLOSED) {
      await this.audit.record({
        entityType: PartnershipAuditEntityType.OPPORTUNITY,
        entityId: id,
        action: PartnershipAuditAction.OPPORTUNITY_CLOSED,
        performedById: actorId,
      });
    }

    return this.toResponse(await this.requireOpportunity(id));
  }

  async archive(id: string, actorId: string): Promise<OpportunityResponseDto> {
    const existing = await this.requireOpportunity(id);
    if (existing.archivedAt) {
      return this.toResponse(existing);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.partnershipOpportunity.update({
        where: { id },
        data: { archivedAt: new Date() },
      });
      await this.logActivity(tx, id, 'ARCHIVED', 'Opportunity archived', actorId);
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.OPPORTUNITY,
      entityId: id,
      action: PartnershipAuditAction.OPPORTUNITY_ARCHIVED,
      performedById: actorId,
    });
    return this.toResponse(await this.requireOpportunity(id));
  }

  async createProposal(
    id: string,
    dto: CreateProposalFromOpportunityDto,
    actorId: string,
  ): Promise<OpportunityResponseDto> {
    const existing = await this.requireOpportunity(id);
    this.assertMutable(existing);
    if (existing.newProposalId) {
      throw new BadRequestException(
        'A proposal has already been created for this opportunity',
      );
    }

    // Copy offering lines from the previous proposal (reference the SAME offering
    // IDs — we never duplicate programs/offerings).
    const previousLines = existing.previousProposalId
      ? await this.prisma.partnershipProposalOffering.findMany({
          where: { proposalId: existing.previousProposalId },
          orderBy: { sortOrder: 'asc' },
        })
      : [];

    const title = dto.title?.trim() || existing.title;

    const proposal = await this.proposals.create(
      {
        title,
        institutionId: existing.institutionId,
        offerings: previousLines.map((line, index) => ({
          offeringId: line.offeringId,
          sortOrder: line.sortOrder ?? index,
          pricingModel: line.pricingModel,
          quantity: num(line.quantity),
          unitPrice: num(line.unitPrice),
          discountType: line.discountType,
          discountValue: num(line.discountValue),
          customizedObjectives: line.customizedObjectives,
          customizedCurriculumNotes: line.customizedCurriculumNotes,
          specialRequirements: line.specialRequirements,
          implementationNotes: line.implementationNotes,
          deliveryNotes: line.deliveryNotes,
        })),
      },
      actorId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.partnershipOpportunity.update({
        where: { id },
        data: {
          newProposalId: proposal.id,
          status:
            existing.status === S.IDENTIFIED || existing.status === S.PLANNING
              ? S.PROPOSAL_DRAFT
              : existing.status,
        },
      });
      await this.addTimeline(
        tx,
        id,
        PartnershipOpportunityTimelineKind.PROPOSAL_CREATED,
        `Proposal ${proposal.proposalNumber} created`,
        actorId,
      );
      await this.logActivity(
        tx,
        id,
        'PROPOSAL_CREATED',
        `Proposal ${proposal.proposalNumber} created`,
        actorId,
        { proposalId: proposal.id },
      );
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OPPORTUNITY,
      entityId: id,
      action: PartnershipAuditAction.OPPORTUNITY_PROPOSAL_CREATED,
      performedById: actorId,
      metadata: { proposalId: proposal.id },
    });

    return this.toResponse(await this.requireOpportunity(id));
  }

  async createSow(id: string, actorId: string): Promise<OpportunityResponseDto> {
    const existing = await this.requireOpportunity(id);
    if (existing.newSowId) {
      throw new BadRequestException(
        'A SOW has already been created for this opportunity',
      );
    }
    if (!existing.newProposalId) {
      throw new BadRequestException(
        'Create and accept a proposal before creating a SOW',
      );
    }

    const proposalAccepted = existing.newProposal?.status === 'ACCEPTED';
    if (!proposalAccepted && existing.status !== S.ACCEPTED) {
      throw new BadRequestException(
        'The new proposal must be accepted before creating a SOW',
      );
    }

    const sow = await this.sows.createFromProposal(existing.newProposalId, actorId);

    await this.prisma.$transaction(async (tx) => {
      await tx.partnershipOpportunity.update({
        where: { id },
        data: {
          newSowId: sow.id,
          status: S.CONVERTED,
          convertedAt: new Date(),
        },
      });
      await this.addTimeline(
        tx,
        id,
        PartnershipOpportunityTimelineKind.CONVERTED,
        `Converted — SOW ${sow.sowNumber} created`,
        actorId,
      );
      await this.logActivity(
        tx,
        id,
        'SOW_CREATED',
        `SOW ${sow.sowNumber} created`,
        actorId,
        { sowId: sow.id },
      );
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.OPPORTUNITY,
      entityId: id,
      action: PartnershipAuditAction.OPPORTUNITY_SOW_CREATED,
      performedById: actorId,
      metadata: { sowId: sow.id },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.OPPORTUNITY,
      entityId: id,
      action: PartnershipAuditAction.OPPORTUNITY_CONVERTED,
      performedById: actorId,
    });

    return this.toResponse(await this.requireOpportunity(id));
  }

  async addTimelineEvent(
    id: string,
    dto: AddTimelineEventDto,
    actorId: string,
  ): Promise<OpportunityResponseDto> {
    await this.requireOpportunity(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.partnershipOpportunityTimelineEvent.create({
        data: {
          opportunityId: id,
          kind: dto.kind,
          note: dto.note?.trim() ?? '',
          occurredAt: date(dto.occurredAt) ?? new Date(),
          performedById: actorId,
        },
      });
      await this.logActivity(tx, id, 'TIMELINE_ADDED', 'Timeline event added', actorId, {
        kind: dto.kind,
      });
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.OPPORTUNITY,
      entityId: id,
      action: PartnershipAuditAction.OPPORTUNITY_UPDATED,
      performedById: actorId,
      metadata: { timelineKind: dto.kind },
    });
    return this.toResponse(await this.requireOpportunity(id));
  }

  async listUsers(): Promise<OpportunityUserOptionDto[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
      select: { id: true, displayName: true, email: true, role: true },
    });
    return users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    }));
  }

  // --- helpers ---------------------------------------------------------------

  private assertMutable(row: OpportunityRow): void {
    if (row.archivedAt) {
      throw new BadRequestException('Archived opportunities cannot be modified');
    }
    if (row.status === S.CONVERTED) {
      throw new BadRequestException('Converted opportunities cannot be modified');
    }
    if (row.status === S.CLOSED) {
      throw new BadRequestException('Closed opportunities cannot be modified');
    }
  }

  private stringField<K extends keyof UpdateOpportunityDto>(
    dto: UpdateOpportunityDto,
    key: K,
    transform: (value: string) => string = (v) => v.trim(),
  ): Record<string, string> {
    const value = dto[key];
    if (value === undefined || typeof value !== 'string') {
      return {};
    }
    return { [key as string]: transform(value) };
  }

  private buildWhere(
    query: QueryOpportunitiesDto,
  ): Prisma.PartnershipOpportunityWhereInput {
    const and: Prisma.PartnershipOpportunityWhereInput[] = [];
    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { opportunityNumber: { contains: search, mode: 'insensitive' } },
          { institution: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    if (query.institutionId) {
      and.push({ institutionId: query.institutionId });
    }
    if (query.ownerId) {
      and.push({ ownerId: query.ownerId });
    }
    if (query.type) {
      and.push({ type: query.type });
    }
    if (query.status) {
      and.push({ status: query.status });
    }
    if (query.dateFrom || query.dateTo) {
      and.push({
        expectedDate: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        },
      });
    }
    return and.length ? { AND: and } : {};
  }

  private async assertInstitution(institutionId: string): Promise<void> {
    const found = await this.prisma.partnershipInstitution.findFirst({
      where: { id: institutionId, deletedAt: null },
      select: { id: true },
    });
    if (!found) {
      throw new BadRequestException('Institution not found');
    }
  }

  private async deriveTitle(
    institutionId: string,
    type: PartnershipOpportunityType,
  ): Promise<string> {
    const institution = await this.prisma.partnershipInstitution.findUnique({
      where: { id: institutionId },
      select: { name: true },
    });
    const label =
      type === PartnershipOpportunityType.EXPANSION
        ? 'Expansion'
        : type === PartnershipOpportunityType.RENEWAL_AND_EXPANSION
          ? 'Renewal & Expansion'
          : 'Renewal';
    return `${institution?.name ?? 'Partnership'} — ${label}`;
  }

  private async nextOpportunityNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ROOTACA-OPP-${year}-`;
    const latest = await this.prisma.partnershipOpportunity.findFirst({
      where: { opportunityNumber: { startsWith: prefix } },
      orderBy: { opportunityNumber: 'desc' },
      select: { opportunityNumber: true },
    });
    let seq = 1;
    if (latest?.opportunityNumber) {
      const parsed = Number.parseInt(
        latest.opportunityNumber.slice(prefix.length),
        10,
      );
      if (Number.isFinite(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  private async requireOpportunity(id: string): Promise<OpportunityRow> {
    const row = await this.prisma.partnershipOpportunity.findUnique({
      where: { id },
      include: opportunityInclude,
    });
    if (!row) {
      throw new NotFoundException('Opportunity not found');
    }
    return row;
  }

  private async addTimeline(
    tx: Prisma.TransactionClient,
    opportunityId: string,
    kind: PartnershipOpportunityTimelineKind,
    note: string,
    actorId: string | null,
  ): Promise<void> {
    await tx.partnershipOpportunityTimelineEvent.create({
      data: {
        opportunityId,
        kind,
        note,
        performedById: actorId,
      },
    });
  }

  private async logActivity(
    tx: Prisma.TransactionClient,
    opportunityId: string,
    action: string,
    summary: string,
    actorId: string | null,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await tx.partnershipOpportunityActivityLog.create({
      data: {
        opportunityId,
        action,
        summary,
        performedById: actorId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private toListItem(row: OpportunityListRow): OpportunityListItemDto {
    return {
      id: row.id,
      opportunityNumber: row.opportunityNumber,
      title: row.title,
      type: row.type,
      status: row.status,
      institutionId: row.institutionId,
      institutionName: row.institution.name,
      previousDeliveryNumber: row.previousDelivery?.deliveryNumber ?? null,
      previousSowNumber: row.previousSow?.sowNumber ?? null,
      previousReportNumber: row.previousReport?.reportNumber ?? null,
      ownerId: row.ownerId,
      ownerName: row.owner?.displayName ?? null,
      expectedDate: iso(row.expectedDate),
      newProposalId: row.newProposalId,
      newSowId: row.newSowId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toResponse(row: OpportunityRow): OpportunityResponseDto {
    return {
      id: row.id,
      opportunityNumber: row.opportunityNumber,
      title: row.title,
      type: row.type,
      status: row.status,
      institutionId: row.institutionId,
      institutionName: row.institution.name,
      campus: row.campusInstitution
        ? { id: row.campusInstitution.id, number: null, title: row.campusInstitution.name }
        : null,
      previousProposal: row.previousProposal
        ? {
            id: row.previousProposal.id,
            number: row.previousProposal.proposalNumber,
            title: row.previousProposal.title,
          }
        : null,
      previousSow: row.previousSow
        ? {
            id: row.previousSow.id,
            number: row.previousSow.sowNumber,
            title: row.previousSow.title,
          }
        : null,
      previousDelivery: row.previousDelivery
        ? {
            id: row.previousDelivery.id,
            number: row.previousDelivery.deliveryNumber,
            title: row.previousDelivery.name,
          }
        : null,
      previousReport: row.previousReport
        ? {
            id: row.previousReport.id,
            number: row.previousReport.reportNumber,
            title: row.previousReport.title,
          }
        : null,
      newProposal: row.newProposal
        ? {
            id: row.newProposal.id,
            number: row.newProposal.proposalNumber,
            title: row.newProposal.title,
          }
        : null,
      newSow: row.newSow
        ? { id: row.newSow.id, number: row.newSow.sowNumber, title: row.newSow.title }
        : null,
      ownerId: row.ownerId,
      ownerName: row.owner?.displayName ?? null,
      expectedDate: iso(row.expectedDate),
      historicalSnapshot: parseSnapshot(row.historicalSnapshot),
      renewalProgramIds: parseStringArray(row.renewalProgramIds),
      renewalOfferingIds: parseStringArray(row.renewalOfferingIds),
      renewalGrades: row.renewalGrades,
      renewalGroupsNote: row.renewalGroupsNote,
      renewalDurationNote: row.renewalDurationNote,
      renewalDeliveryMode: row.renewalDeliveryMode,
      renewalScopeNotes: row.renewalScopeNotes,
      expansionScopeNotes: row.expansionScopeNotes,
      proposedScopeNotes: row.proposedScopeNotes,
      existingScopeNotes: row.existingScopeNotes,
      reason: row.reason,
      schoolFeedback: row.schoolFeedback,
      successFactors: row.successFactors,
      challenges: row.challenges,
      requestedChanges: row.requestedChanges,
      internalNotes: row.internalNotes,
      nextSteps: row.nextSteps,
      feedbackSummary: row.feedbackSummary,
      feedbackScore: num(row.feedbackScore),
      feedbackRequestedPrograms: row.feedbackRequestedPrograms,
      feedbackRequestedChanges: row.feedbackRequestedChanges,
      feedbackKeyComments: row.feedbackKeyComments,
      feedbackDate: iso(row.feedbackDate),
      feedbackRecordedBy: row.feedbackRecordedBy,
      expansionKinds: row.expansionKinds.map((k) => ({
        id: k.id,
        kind: k.kind,
        notes: k.notes,
        sortOrder: k.sortOrder,
      })),
      timeline: row.timeline.map((event) => ({
        id: event.id,
        kind: event.kind,
        occurredAt: event.occurredAt.toISOString(),
        note: event.note,
        performedByName: event.performedBy?.displayName ?? null,
        createdAt: event.createdAt.toISOString(),
      })),
      activityLogs: row.activityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        summary: log.summary,
        performedByName: log.performedBy?.displayName ?? null,
        createdAt: log.createdAt.toISOString(),
      })),
      allowedTransitions: ALLOWED_TRANSITIONS[row.status] ?? [],
      archivedAt: iso(row.archivedAt),
      convertedAt: iso(row.convertedAt),
      closedAt: iso(row.closedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
