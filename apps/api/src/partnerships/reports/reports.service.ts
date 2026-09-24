import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipReportStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import {
  buildReportDataSnapshot,
  ReportAggregateDelivery,
  ReportDataSnapshot,
  toSchoolFacingSnapshot,
  validateForPublish,
} from './report-aggregate';
import {
  ChangeReportStatusDto,
  CreateReportFromDeliveryDto,
  PaginatedReportsDto,
  QueryReportsDto,
  ReportListItemDto,
  ReportResponseDto,
  UpdateReportDto,
} from './dto/report.dto';

const deliveryAggregateInclude = {
  institution: { select: { id: true, name: true } },
  proposal: { select: { id: true, proposalNumber: true, title: true } },
  sow: {
    select: {
      id: true,
      sowNumber: true,
      title: true,
      scopeOfferings: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  phases: { orderBy: { sortOrder: 'asc' as const } },
  milestones: { orderBy: { sortOrder: 'asc' as const } },
  tasks: { orderBy: { sortOrder: 'asc' as const } },
  sessions: {
    orderBy: { sessionNumber: 'asc' as const },
    include: { attendances: { orderBy: { studentId: 'asc' as const } } },
  },
  groups: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      students: {
        orderBy: { joinedAt: 'asc' as const },
        include: { student: { select: { id: true, fullName: true } } },
      },
    },
  },
  deliverables: { orderBy: { sortOrder: 'asc' as const } },
  issues: { orderBy: { createdAt: 'desc' as const } },
  raidItems: { orderBy: [{ type: 'asc' as const }, { sortOrder: 'asc' as const }] },
} satisfies Prisma.PartnershipDeliveryInclude;

type DeliveryAggregateRow = Prisma.PartnershipDeliveryGetPayload<{
  include: typeof deliveryAggregateInclude;
}>;

const reportInclude = {
  institution: { select: { id: true, name: true } },
  delivery: { select: { id: true, deliveryNumber: true, name: true } },
  recommendations: { orderBy: { sortOrder: 'asc' as const } },
  versions: {
    orderBy: { createdAt: 'desc' as const },
    take: 50,
    include: { createdBy: { select: { displayName: true } } },
  },
  activityLogs: {
    orderBy: { createdAt: 'desc' as const },
    take: 50,
    include: { performedBy: { select: { displayName: true } } },
  },
  publishedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.PartnershipReportInclude;

type ReportRow = Prisma.PartnershipReportGetPayload<{
  include: typeof reportInclude;
}>;

const ALLOWED_TRANSITIONS: Record<
  PartnershipReportStatus,
  PartnershipReportStatus[]
> = {
  DRAFT: [PartnershipReportStatus.IN_REVIEW, PartnershipReportStatus.ARCHIVED],
  IN_REVIEW: [PartnershipReportStatus.PUBLISHED, PartnershipReportStatus.DRAFT],
  PUBLISHED: [PartnershipReportStatus.ARCHIVED],
  ARCHIVED: [],
};

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function date(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function parseSnapshot(raw: unknown): ReportDataSnapshot | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return raw as ReportDataSnapshot;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {}

  async findAll(query: QueryReportsDto): Promise<PaginatedReportsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildWhere(query);
    const [total, rows] = await Promise.all([
      this.prisma.partnershipReport.count({ where }),
      this.prisma.partnershipReport.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          institution: { select: { name: true } },
          delivery: { select: { deliveryNumber: true } },
        },
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

  async findOne(id: string): Promise<ReportResponseDto> {
    const row = await this.requireReport(id);
    const includeValidation =
      row.status === PartnershipReportStatus.DRAFT ||
      row.status === PartnershipReportStatus.IN_REVIEW;
    return this.toResponse(row, includeValidation);
  }

  async createFromDelivery(
    dto: CreateReportFromDeliveryDto,
    actorId: string,
  ): Promise<ReportResponseDto> {
    const delivery = await this.loadDeliveryAggregate(dto.deliveryId);
    const snapshot = buildReportDataSnapshot(this.mapDelivery(delivery));
    const reportNumber = await this.nextReportNumber();
    const programNameSnapshot = snapshot.programNames.join(', ');

    const title = `${delivery.name} — ${dto.type.replace(/_/g, ' ')}`;

    const row = await this.prisma.$transaction(async (tx) => {
      const report = await tx.partnershipReport.create({
        data: {
          reportNumber,
          title,
          type: dto.type,
          status: PartnershipReportStatus.DRAFT,
          institutionId: delivery.institutionId,
          deliveryId: delivery.id,
          sowId: delivery.sowId,
          proposalId: delivery.proposalId,
          institutionNameSnapshot: delivery.institution.name,
          deliveryNumberSnapshot: delivery.deliveryNumber,
          sowNumberSnapshot: delivery.sowNumberSnapshot || delivery.sow.sowNumber,
          proposalNumberSnapshot:
            delivery.proposalNumberSnapshot || delivery.proposal.proposalNumber,
          programNameSnapshot,
          periodStart: delivery.startDate,
          periodEnd: delivery.endDate,
          dataSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        },
        include: reportInclude,
      });

      await this.logActivity(
        tx,
        report.id,
        'CREATED',
        `Report created from delivery ${delivery.deliveryNumber}`,
        actorId,
        { deliveryId: delivery.id, type: dto.type },
      );

      return report;
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.REPORT,
      entityId: row.id,
      action: PartnershipAuditAction.REPORT_CREATED,
      performedById: actorId,
      metadata: { deliveryId: dto.deliveryId, type: dto.type },
    });

    return this.toResponse(row, true);
  }

  async update(
    id: string,
    dto: UpdateReportDto,
    actorId: string,
  ): Promise<ReportResponseDto> {
    const existing = await this.requireReport(id);
    if (
      existing.status === PartnershipReportStatus.PUBLISHED ||
      existing.status === PartnershipReportStatus.ARCHIVED
    ) {
      throw new BadRequestException('Published or archived reports cannot be edited');
    }

    const contentChanged = this.detectContentChange(existing, dto);
    const delivery = await this.loadDeliveryAggregate(existing.deliveryId);
    const freshSnapshot = buildReportDataSnapshot(this.mapDelivery(delivery));

    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.recommendations !== undefined) {
        await tx.partnershipReportRecommendation.deleteMany({ where: { reportId: id } });
        const recData = dto.recommendations.map((rec, index) => ({
          reportId: id,
          text: rec.text?.trim() ?? '',
          priority: rec.priority ?? 'MEDIUM',
          owner: rec.owner?.trim() ?? '',
          targetDate: date(rec.targetDate),
          isInternal: rec.isInternal ?? false,
          sortOrder: rec.sortOrder ?? index,
        }));
        if (recData.length) {
          await tx.partnershipReportRecommendation.createMany({ data: recData });
        }
      }

      const nextVersion =
        contentChanged && existing.status !== PartnershipReportStatus.PUBLISHED
          ? this.bumpVersion(existing.version)
          : existing.version;

      await tx.partnershipReport.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.periodStart !== undefined ? { periodStart: date(dto.periodStart) } : {}),
          ...(dto.periodEnd !== undefined ? { periodEnd: date(dto.periodEnd) } : {}),
          ...(dto.periodLabel !== undefined ? { periodLabel: dto.periodLabel.trim() } : {}),
          ...(dto.preparedBy !== undefined ? { preparedBy: dto.preparedBy.trim() } : {}),
          ...(dto.executiveSummary !== undefined
            ? { executiveSummary: dto.executiveSummary.trim() }
            : {}),
          ...(dto.achievements !== undefined ? { achievements: dto.achievements.trim() } : {}),
          ...(dto.nextSteps !== undefined ? { nextSteps: dto.nextSteps.trim() } : {}),
          ...(dto.renewalNotes !== undefined ? { renewalNotes: dto.renewalNotes.trim() } : {}),
          ...(dto.internalNotes !== undefined ? { internalNotes: dto.internalNotes.trim() } : {}),
          dataSnapshot: freshSnapshot as unknown as Prisma.InputJsonValue,
          version: nextVersion,
        },
      });

      await this.logActivity(tx, id, 'UPDATED', 'Report content updated', actorId);

      return this.requireReport(id, tx);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.REPORT,
      entityId: id,
      action: PartnershipAuditAction.REPORT_UPDATED,
      performedById: actorId,
    });

    return this.toResponse(row, true);
  }

  async changeStatus(
    id: string,
    dto: ChangeReportStatusDto,
    actorId: string,
  ): Promise<ReportResponseDto> {
    const existing = await this.requireReport(id);
    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${existing.status} to ${dto.status}`,
      );
    }

    if (dto.status === PartnershipReportStatus.PUBLISHED) {
      return this.publishReport(existing, actorId);
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.PartnershipReportUpdateInput = { status: dto.status };
      if (dto.status === PartnershipReportStatus.ARCHIVED) {
        data.archivedAt = new Date();
      }
      await tx.partnershipReport.update({ where: { id }, data });
      await this.logActivity(
        tx,
        id,
        'STATUS_CHANGED',
        `Status changed from ${existing.status} to ${dto.status}`,
        actorId,
        { from: existing.status, to: dto.status },
      );
      return this.requireReport(id, tx);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.REPORT,
      entityId: id,
      action:
        dto.status === PartnershipReportStatus.ARCHIVED
          ? PartnershipAuditAction.REPORT_ARCHIVED
          : PartnershipAuditAction.REPORT_STATUS_CHANGED,
      performedById: actorId,
      metadata: { from: existing.status, to: dto.status },
    });

    return this.toResponse(row, dto.status === PartnershipReportStatus.DRAFT);
  }

  async archive(id: string, actorId: string): Promise<ReportResponseDto> {
    const existing = await this.requireReport(id);
    if (existing.status === PartnershipReportStatus.ARCHIVED) {
      return this.toResponse(existing, false);
    }
    if (!ALLOWED_TRANSITIONS[existing.status]?.includes(PartnershipReportStatus.ARCHIVED)) {
      throw new BadRequestException(`Cannot archive report in status ${existing.status}`);
    }
    return this.changeStatus(id, { status: PartnershipReportStatus.ARCHIVED }, actorId);
  }

  async duplicate(id: string, actorId: string): Promise<ReportResponseDto> {
    const source = await this.requireReport(id);
    const delivery = await this.loadDeliveryAggregate(source.deliveryId);
    const freshSnapshot = buildReportDataSnapshot(this.mapDelivery(delivery));
    const reportNumber = await this.nextReportNumber();

    const row = await this.prisma.$transaction(async (tx) => {
      const copy = await tx.partnershipReport.create({
        data: {
          reportNumber,
          title: `${source.title} (Copy)`,
          type: source.type,
          status: PartnershipReportStatus.DRAFT,
          version: '1.0',
          institutionId: source.institutionId,
          deliveryId: source.deliveryId,
          sowId: source.sowId,
          proposalId: source.proposalId,
          institutionNameSnapshot: source.institutionNameSnapshot,
          deliveryNumberSnapshot: source.deliveryNumberSnapshot,
          sowNumberSnapshot: source.sowNumberSnapshot,
          proposalNumberSnapshot: source.proposalNumberSnapshot,
          programNameSnapshot: source.programNameSnapshot,
          periodStart: source.periodStart,
          periodEnd: source.periodEnd,
          periodLabel: source.periodLabel,
          preparedBy: source.preparedBy,
          executiveSummary: source.executiveSummary,
          achievements: source.achievements,
          nextSteps: source.nextSteps,
          renewalNotes: source.renewalNotes,
          internalNotes: source.internalNotes,
          dataSnapshot: freshSnapshot as unknown as Prisma.InputJsonValue,
          recommendations: {
            create: source.recommendations.map((rec) => ({
              text: rec.text,
              priority: rec.priority,
              owner: rec.owner,
              targetDate: rec.targetDate,
              isInternal: rec.isInternal,
              sortOrder: rec.sortOrder,
            })),
          },
        },
        include: reportInclude,
      });

      await this.logActivity(tx, copy.id, 'DUPLICATED', 'Report duplicated', actorId, {
        sourceId: id,
      });

      return copy;
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.REPORT,
      entityId: row.id,
      action: PartnershipAuditAction.REPORT_DUPLICATED,
      performedById: actorId,
      metadata: { sourceId: id },
    });

    return this.toResponse(row, true);
  }

  async refreshSnapshot(id: string, actorId: string): Promise<ReportResponseDto> {
    const existing = await this.requireReport(id);
    if (
      existing.status !== PartnershipReportStatus.DRAFT &&
      existing.status !== PartnershipReportStatus.IN_REVIEW
    ) {
      throw new BadRequestException(
        'Snapshot can only be refreshed while the report is draft or in review',
      );
    }

    const delivery = await this.loadDeliveryAggregate(existing.deliveryId);
    const freshSnapshot = buildReportDataSnapshot(this.mapDelivery(delivery));

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.partnershipReport.update({
        where: { id },
        data: {
          dataSnapshot: freshSnapshot as unknown as Prisma.InputJsonValue,
          programNameSnapshot: freshSnapshot.programNames.join(', '),
        },
      });
      await this.logActivity(
        tx,
        id,
        'SNAPSHOT_REFRESHED',
        'Data snapshot refreshed from delivery',
        actorId,
      );
      return this.requireReport(id, tx);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.REPORT,
      entityId: id,
      action: PartnershipAuditAction.REPORT_UPDATED,
      performedById: actorId,
      metadata: { refreshSnapshot: true },
    });

    return this.toResponse(row, true);
  }

  async markPdfGenerated(id: string, actorId: string): Promise<ReportResponseDto> {
    const existing = await this.requireReport(id);
    await this.prisma.$transaction(async (tx) => {
      await this.logActivity(tx, id, 'PDF_GENERATED', 'PDF generated', actorId);
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.REPORT,
      entityId: id,
      action: PartnershipAuditAction.REPORT_PDF_GENERATED,
      performedById: actorId,
    });
    return this.toResponse(existing, false);
  }

  // ---------------------------------------------------------------------------

  private async publishReport(
    existing: ReportRow,
    actorId: string,
  ): Promise<ReportResponseDto> {
    const snapshot = parseSnapshot(existing.dataSnapshot);
    const validation = validateForPublish({
      institutionId: existing.institutionId,
      deliveryId: existing.deliveryId,
      periodStart: existing.periodStart,
      periodEnd: existing.periodEnd,
      periodLabel: existing.periodLabel,
      snapshot,
    });
    if (!validation.ok) {
      throw new BadRequestException({
        message: 'Report cannot be published',
        publishValidation: validation,
      });
    }

    const narrative = {
      executiveSummary: existing.executiveSummary,
      achievements: existing.achievements,
      nextSteps: existing.nextSteps,
      recommendations: existing.recommendations.map((r) => ({
        text: r.text,
        priority: r.priority,
        owner: r.owner,
        targetDate: iso(r.targetDate),
        isInternal: r.isInternal,
      })),
    };
    const publishedSnapshot = snapshot
      ? toSchoolFacingSnapshot(snapshot, narrative)
      : {};

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.partnershipReportVersion.create({
        data: {
          reportId: existing.id,
          version: existing.version,
          changeNote: 'Published',
          snapshot: (existing.dataSnapshot ?? {}) as Prisma.InputJsonValue,
          publishedSnapshot: publishedSnapshot as Prisma.InputJsonValue,
          createdById: actorId,
        },
      });

      await tx.partnershipReport.update({
        where: { id: existing.id },
        data: {
          status: PartnershipReportStatus.PUBLISHED,
          publishedSnapshot: publishedSnapshot as Prisma.InputJsonValue,
          publishedAt: new Date(),
          publishedById: actorId,
        },
      });

      await this.logActivity(
        tx,
        existing.id,
        'PUBLISHED',
        'Report published',
        actorId,
      );

      return this.requireReport(existing.id, tx);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.REPORT,
      entityId: existing.id,
      action: PartnershipAuditAction.REPORT_PUBLISHED,
      performedById: actorId,
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.REPORT,
      entityId: existing.id,
      action: PartnershipAuditAction.REPORT_VERSIONED,
      performedById: actorId,
      metadata: { version: existing.version },
    });

    return this.toResponse(row, false);
  }

  private buildWhere(query: QueryReportsDto): Prisma.PartnershipReportWhereInput {
    const and: Prisma.PartnershipReportWhereInput[] = [];

    if (query.search?.trim()) {
      const q = query.search.trim();
      and.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { reportNumber: { contains: q, mode: 'insensitive' } },
          { institutionNameSnapshot: { contains: q, mode: 'insensitive' } },
          { deliveryNumberSnapshot: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (query.institutionId) {
      and.push({ institutionId: query.institutionId });
    }
    if (query.deliveryId) {
      and.push({ deliveryId: query.deliveryId });
    }
    if (query.programName?.trim()) {
      and.push({
        programNameSnapshot: { contains: query.programName.trim(), mode: 'insensitive' },
      });
    }
    if (query.type) {
      and.push({ type: query.type });
    }
    if (query.status) {
      and.push({ status: query.status });
    }
    if (query.dateFrom) {
      and.push({ periodStart: { gte: new Date(query.dateFrom) } });
    }
    if (query.dateTo) {
      and.push({ periodEnd: { lte: new Date(query.dateTo) } });
    }

    return and.length ? { AND: and } : {};
  }

  private detectContentChange(_existing: ReportRow, dto: UpdateReportDto): boolean {
    const scalarFields: (keyof UpdateReportDto)[] = [
      'title',
      'periodLabel',
      'preparedBy',
      'executiveSummary',
      'achievements',
      'nextSteps',
      'renewalNotes',
      'internalNotes',
    ];
    for (const field of scalarFields) {
      if (dto[field] !== undefined) {
        return true;
      }
    }
    if (dto.periodStart !== undefined || dto.periodEnd !== undefined) {
      return true;
    }
    if (dto.recommendations !== undefined) {
      return true;
    }
    return false;
  }

  private bumpVersion(current: string): string {
    const match = /^(\d+)\.(\d+)$/.exec(current.trim());
    if (!match) {
      return '1.1';
    }
    const major = Number(match[1]);
    const minor = Number(match[2]) + 1;
    return `${major}.${minor}`;
  }

  private async nextReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ROOTACA-RPT-${year}-`;
    const latest = await this.prisma.partnershipReport.findFirst({
      where: { reportNumber: { startsWith: prefix } },
      orderBy: { reportNumber: 'desc' },
      select: { reportNumber: true },
    });
    let seq = 1;
    if (latest?.reportNumber) {
      const parsed = Number.parseInt(latest.reportNumber.slice(prefix.length), 10);
      if (Number.isFinite(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  private async loadDeliveryAggregate(deliveryId: string): Promise<DeliveryAggregateRow> {
    const row = await this.prisma.partnershipDelivery.findUnique({
      where: { id: deliveryId },
      include: deliveryAggregateInclude,
    });
    if (!row) {
      throw new NotFoundException('Delivery not found');
    }
    return row;
  }

  private mapDelivery(delivery: DeliveryAggregateRow): ReportAggregateDelivery {
    return {
      id: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      name: delivery.name,
      status: delivery.status,
      startDate: delivery.startDate,
      endDate: delivery.endDate,
      sowNumberSnapshot: delivery.sowNumberSnapshot,
      proposalNumberSnapshot: delivery.proposalNumberSnapshot,
      scopeSnapshot: delivery.scopeSnapshot,
      institution: delivery.institution,
      sow: delivery.sow,
      proposal: delivery.proposal,
      phases: delivery.phases,
      milestones: delivery.milestones,
      tasks: delivery.tasks,
      sessions: delivery.sessions,
      groups: delivery.groups,
      deliverables: delivery.deliverables,
      issues: delivery.issues,
      raidItems: delivery.raidItems,
    };
  }

  private async requireReport(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ReportRow> {
    const client = tx ?? this.prisma;
    const row = await client.partnershipReport.findUnique({
      where: { id },
      include: reportInclude,
    });
    if (!row) {
      throw new NotFoundException('Report not found');
    }
    return row;
  }

  private async logActivity(
    tx: Prisma.TransactionClient,
    reportId: string,
    action: string,
    summary: string,
    actorId: string | null,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await tx.partnershipReportActivityLog.create({
      data: {
        reportId,
        action,
        summary,
        performedById: actorId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private toListItem(
    row: Prisma.PartnershipReportGetPayload<{
      include: {
        institution: { select: { name: true } };
        delivery: { select: { deliveryNumber: true } };
      };
    }>,
  ): ReportListItemDto {
    return {
      id: row.id,
      reportNumber: row.reportNumber,
      title: row.title,
      type: row.type,
      status: row.status,
      institutionId: row.institutionId,
      institutionName: row.institution.name,
      deliveryId: row.deliveryId,
      deliveryNumber: row.delivery.deliveryNumber,
      programNameSnapshot: row.programNameSnapshot,
      periodStart: iso(row.periodStart),
      periodEnd: iso(row.periodEnd),
      periodLabel: row.periodLabel,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toResponse(row: ReportRow, includePublishValidation: boolean): ReportResponseDto {
    const snapshot = parseSnapshot(row.dataSnapshot);
    const publishValidation =
      includePublishValidation && row.status !== PartnershipReportStatus.PUBLISHED
        ? validateForPublish({
            institutionId: row.institutionId,
            deliveryId: row.deliveryId,
            periodStart: row.periodStart,
            periodEnd: row.periodEnd,
            periodLabel: row.periodLabel,
            snapshot,
          })
        : undefined;

    return {
      id: row.id,
      reportNumber: row.reportNumber,
      title: row.title,
      type: row.type,
      status: row.status,
      version: row.version,
      institutionId: row.institutionId,
      institutionName: row.institution.name,
      deliveryId: row.deliveryId,
      deliveryNumber: row.delivery.deliveryNumber,
      sowId: row.sowId,
      sowNumber: row.sowNumberSnapshot,
      proposalId: row.proposalId,
      proposalNumber: row.proposalNumberSnapshot,
      programNameSnapshot: row.programNameSnapshot,
      periodStart: iso(row.periodStart),
      periodEnd: iso(row.periodEnd),
      periodLabel: row.periodLabel,
      preparedBy: row.preparedBy,
      executiveSummary: row.executiveSummary,
      achievements: row.achievements,
      nextSteps: row.nextSteps,
      renewalNotes: row.renewalNotes,
      internalNotes: row.internalNotes,
      kpis: snapshot?.kpis ?? null,
      dataSnapshot: snapshot,
      publishedSnapshot: (row.publishedSnapshot as Record<string, unknown> | null) ?? null,
      recommendations: row.recommendations.map((rec) => ({
        id: rec.id,
        text: rec.text,
        priority: rec.priority,
        owner: rec.owner,
        targetDate: iso(rec.targetDate),
        isInternal: rec.isInternal,
        sortOrder: rec.sortOrder,
      })),
      versions: row.versions.map((v) => ({
        id: v.id,
        version: v.version,
        changeNote: v.changeNote,
        createdAt: v.createdAt.toISOString(),
        createdByName: v.createdBy?.displayName ?? null,
      })),
      activityLogs: row.activityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        summary: log.summary,
        performedByName: log.performedBy?.displayName ?? null,
        createdAt: log.createdAt.toISOString(),
      })),
      publishValidation,
      publishedAt: iso(row.publishedAt),
      publishedByName: row.publishedBy?.displayName ?? null,
      archivedAt: iso(row.archivedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
