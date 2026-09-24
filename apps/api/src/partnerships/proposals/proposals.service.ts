import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipDiscountType,
  PartnershipProposalStatus,
  Prisma,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { OfferingsService } from '../offerings/offerings.service';
import {
  ChangeProposalStatusDto,
  CreateProposalDto,
  PaginatedProposalsDto,
  ProposalLineInputDto,
  ProposalResponseDto,
  QueryProposalsDto,
  UpdateProposalDto,
} from './dto/proposal.dto';
import { computeLineSubtotal, computeProposalTotals } from './proposal-pricing';
import { buildOfferingSnapshot } from './proposal-snapshot';

const proposalInclude = {
  institution: {
    include: {
      contacts: {
        where: { isPrimary: true },
        take: 1,
        orderBy: { updatedAt: 'desc' as const },
      },
    },
  },
  offerings: { orderBy: { sortOrder: 'asc' as const } },
  timelinePhases: { orderBy: { sortOrder: 'asc' as const } },
  customOutcomes: { orderBy: { sortOrder: 'asc' as const } },
  versions: { orderBy: { createdAt: 'desc' as const }, take: 20 },
} satisfies Prisma.PartnershipProposalInclude;

type ProposalRow = Prisma.PartnershipProposalGetPayload<{ include: typeof proposalInclude }>;

const ALLOWED_TRANSITIONS: Record<PartnershipProposalStatus, PartnershipProposalStatus[]> = {
  DRAFT: [PartnershipProposalStatus.SENT, PartnershipProposalStatus.ARCHIVED],
  SENT: [
    PartnershipProposalStatus.VIEWED,
    PartnershipProposalStatus.UNDER_REVIEW,
    PartnershipProposalStatus.ACCEPTED,
    PartnershipProposalStatus.REJECTED,
    PartnershipProposalStatus.EXPIRED,
    PartnershipProposalStatus.ARCHIVED,
  ],
  VIEWED: [
    PartnershipProposalStatus.UNDER_REVIEW,
    PartnershipProposalStatus.ACCEPTED,
    PartnershipProposalStatus.REJECTED,
    PartnershipProposalStatus.EXPIRED,
    PartnershipProposalStatus.ARCHIVED,
  ],
  UNDER_REVIEW: [
    PartnershipProposalStatus.ACCEPTED,
    PartnershipProposalStatus.REJECTED,
    PartnershipProposalStatus.EXPIRED,
    PartnershipProposalStatus.ARCHIVED,
  ],
  ACCEPTED: [PartnershipProposalStatus.ARCHIVED],
  REJECTED: [PartnershipProposalStatus.ARCHIVED],
  EXPIRED: [PartnershipProposalStatus.ARCHIVED],
  ARCHIVED: [],
};

function dec(value: number | null | undefined): Prisma.Decimal | null {
  if (value === null || value === undefined) {
    return null;
  }
  return new Prisma.Decimal(value);
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: () => number }).toNumber === 'function'
  ) {
    const parsed = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

@Injectable()
export class ProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
    private readonly offerings: OfferingsService,
  ) {}

  async create(dto: CreateProposalDto, actorId: string): Promise<ProposalResponseDto> {
    await this.assertInstitution(dto.institutionId);
    const proposalNumber = await this.nextProposalNumber();
    const lineCreates = await this.buildLineCreates(dto.offerings ?? []);
    const totals = this.totalsFromLines(
      lineCreates.map((line) => ({
        quantity: num(line.quantity as Prisma.Decimal | null),
        unitPrice: num(line.unitPrice as Prisma.Decimal | null),
        discountType: (line.discountType as PartnershipDiscountType) ?? PartnershipDiscountType.NONE,
        discountValue: num(line.discountValue as Prisma.Decimal | null),
      })),
      dto,
    );

    const row = await this.prisma.partnershipProposal.create({
      data: {
        proposalNumber,
        title: dto.title.trim(),
        institutionId: dto.institutionId,
        status: PartnershipProposalStatus.DRAFT,
        proposalDate: dto.proposalDate ? new Date(dto.proposalDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        preparedBy: dto.preparedBy?.trim() ?? '',
        ...this.contentFields(dto),
        currency: this.nullableCurrency(dto.currency),
        taxEnabled: dto.taxEnabled ?? false,
        taxRate: dec(dto.taxRate ?? null),
        headerDiscountType: dto.headerDiscountType ?? PartnershipDiscountType.NONE,
        headerDiscountValue: dec(dto.headerDiscountValue ?? null),
        subtotal: dec(totals.subtotal),
        discountAmount: dec(totals.discountAmount),
        taxAmount: dec(totals.taxAmount),
        grandTotal: dec(totals.grandTotal),
        offerings: { create: lineCreates },
        timelinePhases: { create: this.mapPhases(dto.timelinePhases) },
        customOutcomes: { create: this.mapOutcomes(dto.customOutcomes) },
      },
      include: proposalInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: row.id,
      action: PartnershipAuditAction.PROPOSAL_CREATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async findAll(query: QueryProposalsDto): Promise<PaginatedProposalsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildWhere(query);
    const [total, rows] = await Promise.all([
      this.prisma.partnershipProposal.count({ where }),
      this.prisma.partnershipProposal.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          institution: { select: { name: true } },
          offerings: {
            orderBy: { sortOrder: 'asc' },
            select: { snapshotOfferingName: true },
          },
        },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        proposalNumber: row.proposalNumber,
        title: row.title,
        institutionId: row.institutionId,
        institutionName: row.institution.name,
        status: row.status,
        offeringCount: row.offerings.length,
        offeringNames: row.offerings.map((o) => o.snapshotOfferingName),
        currency: row.currency,
        grandTotal: num(row.grandTotal),
        proposalDate: row.proposalDate.toISOString(),
        validUntil: iso(row.validUntil),
        version: row.version,
        isLocked: row.isLocked,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findOne(id: string): Promise<ProposalResponseDto> {
    return this.toResponse(await this.requireProposal(id));
  }

  async update(
    id: string,
    dto: UpdateProposalDto,
    actorId: string,
  ): Promise<ProposalResponseDto> {
    const existing = await this.requireProposal(id);
    if (existing.isLocked) {
      throw new BadRequestException(
        'Proposal is locked after send. Create a revision before editing.',
      );
    }
    if (dto.institutionId && dto.institutionId !== existing.institutionId) {
      await this.assertInstitution(dto.institutionId);
    }

    const replaceLines = dto.offerings !== undefined;
    const lineCreates = replaceLines ? await this.buildLineCreates(dto.offerings ?? []) : null;
    const lineInputs = replaceLines
      ? (dto.offerings ?? []).map((line, index) => ({
          quantity: line.quantity ?? null,
          unitPrice: line.unitPrice ?? null,
          discountType: line.discountType ?? PartnershipDiscountType.NONE,
          discountValue: line.discountValue ?? null,
          _sort: line.sortOrder ?? index,
        }))
      : existing.offerings.map((line) => ({
          quantity: num(line.quantity),
          unitPrice: num(line.unitPrice),
          discountType: line.discountType,
          discountValue: num(line.discountValue),
        }));

    const totals = computeProposalTotals({
      lines: lineInputs,
      headerDiscountType:
        dto.headerDiscountType ?? existing.headerDiscountType,
      headerDiscountValue:
        dto.headerDiscountValue !== undefined
          ? dto.headerDiscountValue
          : num(existing.headerDiscountValue),
      taxEnabled: dto.taxEnabled ?? existing.taxEnabled,
      taxRate: dto.taxRate !== undefined ? dto.taxRate : num(existing.taxRate),
    });

    const row = await this.prisma.$transaction(async (tx) => {
      if (replaceLines) {
        await tx.partnershipProposalOffering.deleteMany({ where: { proposalId: id } });
      }
      if (dto.timelinePhases !== undefined) {
        await tx.partnershipProposalTimelinePhase.deleteMany({ where: { proposalId: id } });
      }
      if (dto.customOutcomes !== undefined) {
        await tx.partnershipProposalOutcome.deleteMany({ where: { proposalId: id } });
      }

      return tx.partnershipProposal.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.institutionId !== undefined
            ? { institution: { connect: { id: dto.institutionId } } }
            : {}),
          ...(dto.proposalDate !== undefined
            ? { proposalDate: new Date(dto.proposalDate) }
            : {}),
          ...(dto.validUntil !== undefined
            ? { validUntil: dto.validUntil ? new Date(dto.validUntil) : null }
            : {}),
          ...(dto.preparedBy !== undefined ? { preparedBy: dto.preparedBy.trim() } : {}),
          ...this.partialContent(dto),
          ...(dto.currency !== undefined
            ? { currency: this.nullableCurrency(dto.currency) }
            : {}),
          ...(dto.taxEnabled !== undefined ? { taxEnabled: dto.taxEnabled } : {}),
          ...(dto.taxRate !== undefined ? { taxRate: dec(dto.taxRate) } : {}),
          ...(dto.headerDiscountType !== undefined
            ? { headerDiscountType: dto.headerDiscountType }
            : {}),
          ...(dto.headerDiscountValue !== undefined
            ? { headerDiscountValue: dec(dto.headerDiscountValue) }
            : {}),
          subtotal: dec(totals.subtotal),
          discountAmount: dec(totals.discountAmount),
          taxAmount: dec(totals.taxAmount),
          grandTotal: dec(totals.grandTotal),
          ...(lineCreates ? { offerings: { create: lineCreates } } : {}),
          ...(dto.timelinePhases !== undefined
            ? { timelinePhases: { create: this.mapPhases(dto.timelinePhases) } }
            : {}),
          ...(dto.customOutcomes !== undefined
            ? { customOutcomes: { create: this.mapOutcomes(dto.customOutcomes) } }
            : {}),
        },
        include: proposalInclude,
      });
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: id,
      action: PartnershipAuditAction.PROPOSAL_UPDATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async send(id: string, actorId: string): Promise<ProposalResponseDto> {
    const existing = await this.requireProposal(id);
    if (existing.status !== PartnershipProposalStatus.DRAFT) {
      throw new BadRequestException('Only Draft proposals can be sent');
    }
    if (!existing.offerings.length) {
      throw new BadRequestException('Add at least one offering before sending');
    }

    // Refresh snapshots from live offerings at send time, then lock.
    const refreshed = await this.buildLineCreates(
      existing.offerings.map((line) => ({
        offeringId: line.offeringId,
        sortOrder: line.sortOrder,
        customizedObjectives: line.customizedObjectives,
        customizedCurriculumNotes: line.customizedCurriculumNotes,
        specialRequirements: line.specialRequirements,
        implementationNotes: line.implementationNotes,
        deliveryNotes: line.deliveryNotes,
        pricingModel: line.pricingModel,
        quantity: num(line.quantity),
        unitPrice: num(line.unitPrice),
        discountType: line.discountType,
        discountValue: num(line.discountValue),
      })),
    );
    const shareToken = existing.shareToken ?? randomBytes(32).toString('hex');

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.partnershipProposalOffering.deleteMany({ where: { proposalId: id } });
      await tx.partnershipProposal.update({
        where: { id },
        data: {
          status: PartnershipProposalStatus.SENT,
          isLocked: true,
          sentAt: new Date(),
          shareToken,
          shareTokenCreatedAt: existing.shareTokenCreatedAt ?? new Date(),
          offerings: { create: refreshed },
        },
      });
      const locked = await tx.partnershipProposal.findUniqueOrThrow({
        where: { id },
        include: proposalInclude,
      });
      await tx.partnershipProposalVersion.create({
        data: {
          proposalId: id,
          version: locked.version,
          note: 'Sent to school',
          snapshot: this.toResponse(locked) as unknown as Prisma.InputJsonValue,
        },
      });
      return tx.partnershipProposal.findUniqueOrThrow({
        where: { id },
        include: proposalInclude,
      });
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: id,
      action: PartnershipAuditAction.PROPOSAL_SENT,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async changeStatus(
    id: string,
    dto: ChangeProposalStatusDto,
    actorId: string,
  ): Promise<ProposalResponseDto> {
    if (dto.status === PartnershipProposalStatus.SENT) {
      return this.send(id, actorId);
    }
    if (dto.status === PartnershipProposalStatus.ARCHIVED) {
      return this.archive(id, actorId);
    }
    const existing = await this.requireProposal(id);
    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${existing.status} to ${dto.status}`,
      );
    }
    const data: Prisma.PartnershipProposalUpdateInput = { status: dto.status };
    if (dto.status === PartnershipProposalStatus.VIEWED && !existing.viewedAt) {
      data.viewedAt = new Date();
    }
    const row = await this.prisma.partnershipProposal.update({
      where: { id },
      data,
      include: proposalInclude,
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: id,
      action: PartnershipAuditAction.PROPOSAL_STATUS_CHANGED,
      performedById: actorId,
      metadata: { from: existing.status, to: dto.status },
    });
    return this.toResponse(row);
  }

  async archive(id: string, actorId: string): Promise<ProposalResponseDto> {
    const existing = await this.requireProposal(id);
    if (existing.status === PartnershipProposalStatus.ARCHIVED) {
      return this.toResponse(existing);
    }
    const row = await this.prisma.partnershipProposal.update({
      where: { id },
      data: {
        status: PartnershipProposalStatus.ARCHIVED,
        archivedAt: new Date(),
        isLocked: true,
      },
      include: proposalInclude,
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: id,
      action: PartnershipAuditAction.PROPOSAL_ARCHIVED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async duplicate(id: string, actorId: string): Promise<ProposalResponseDto> {
    const source = await this.requireProposal(id);
    const proposalNumber = await this.nextProposalNumber();
    const lineCreates = await this.buildLineCreates(
      source.offerings.map((line) => ({
        offeringId: line.offeringId,
        sortOrder: line.sortOrder,
        customizedObjectives: line.customizedObjectives,
        customizedCurriculumNotes: line.customizedCurriculumNotes,
        specialRequirements: line.specialRequirements,
        implementationNotes: line.implementationNotes,
        deliveryNotes: line.deliveryNotes,
        pricingModel: line.pricingModel,
        quantity: num(line.quantity),
        unitPrice: num(line.unitPrice),
        discountType: line.discountType,
        discountValue: num(line.discountValue),
      })),
    );
    const totals = this.totalsFromLines(
      lineCreates.map((line) => ({
        quantity: num(line.quantity as Prisma.Decimal | null),
        unitPrice: num(line.unitPrice as Prisma.Decimal | null),
        discountType:
          (line.discountType as PartnershipDiscountType | undefined) ??
          PartnershipDiscountType.NONE,
        discountValue: num(line.discountValue as Prisma.Decimal | null),
      })),
      {
        headerDiscountType: source.headerDiscountType,
        headerDiscountValue: num(source.headerDiscountValue),
        taxEnabled: source.taxEnabled,
        taxRate: num(source.taxRate),
      },
    );

    const row = await this.prisma.partnershipProposal.create({
      data: {
        proposalNumber,
        title: `${source.title} (Copy)`,
        institutionId: source.institutionId,
        status: PartnershipProposalStatus.DRAFT,
        proposalDate: new Date(),
        validUntil: source.validUntil,
        preparedBy: source.preparedBy,
        version: '1.0',
        executiveSummary: source.executiveSummary,
        schoolChallenge: source.schoolChallenge,
        schoolObjective: source.schoolObjective,
        targetStudentGroup: source.targetStudentGroup,
        successCriteria: source.successCriteria,
        partnershipObjective: source.partnershipObjective,
        implementationApproach: source.implementationApproach,
        timelineNotes: source.timelineNotes,
        paymentTerms: source.paymentTerms,
        nextSteps: source.nextSteps,
        termsAndConditions: source.termsAndConditions,
        startDate: source.startDate,
        endDate: source.endDate,
        currency: source.currency,
        taxEnabled: source.taxEnabled,
        taxRate: source.taxRate,
        headerDiscountType: source.headerDiscountType,
        headerDiscountValue: source.headerDiscountValue,
        subtotal: dec(totals.subtotal),
        discountAmount: dec(totals.discountAmount),
        taxAmount: dec(totals.taxAmount),
        grandTotal: dec(totals.grandTotal),
        isLocked: false,
        offerings: { create: lineCreates },
        timelinePhases: {
          create: source.timelinePhases.map((phase, index) => ({
            title: phase.title,
            description: phase.description,
            sortOrder: phase.sortOrder ?? index,
            startDate: phase.startDate,
            endDate: phase.endDate,
          })),
        },
        customOutcomes: {
          create: source.customOutcomes.map((item, index) => ({
            title: item.title,
            description: item.description,
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: proposalInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: row.id,
      action: PartnershipAuditAction.PROPOSAL_DUPLICATED,
      performedById: actorId,
      metadata: { sourceId: id },
    });
    return this.toResponse(row);
  }

  async revise(id: string, actorId: string): Promise<ProposalResponseDto> {
    const existing = await this.requireProposal(id);
    if (!existing.isLocked) {
      throw new BadRequestException('Proposal is already editable');
    }
    const nextVersion = this.bumpVersion(existing.version);
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.partnershipProposalVersion.create({
        data: {
          proposalId: id,
          version: existing.version,
          note: 'Revision checkpoint before unlock',
          snapshot: this.toResponse(existing) as unknown as Prisma.InputJsonValue,
        },
      });
      return tx.partnershipProposal.update({
        where: { id },
        data: {
          status: PartnershipProposalStatus.DRAFT,
          isLocked: false,
          version: nextVersion,
          sentAt: null,
        },
        include: proposalInclude,
      });
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: id,
      action: PartnershipAuditAction.PROPOSAL_VERSIONED,
      performedById: actorId,
      metadata: { from: existing.version, to: nextVersion },
    });
    return this.toResponse(row);
  }

  async ensureShareToken(id: string, actorId: string): Promise<ProposalResponseDto> {
    const existing = await this.requireProposal(id);
    if (existing.shareToken) {
      return this.toResponse(existing);
    }
    const row = await this.prisma.partnershipProposal.update({
      where: { id },
      data: {
        shareToken: randomBytes(32).toString('hex'),
        shareTokenCreatedAt: new Date(),
      },
      include: proposalInclude,
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.PROPOSAL,
      entityId: id,
      action: PartnershipAuditAction.PROPOSAL_UPDATED,
      performedById: actorId,
      metadata: { shareTokenCreated: true },
    });
    return this.toResponse(row);
  }

  // --- helpers ---------------------------------------------------------------

  private async requireProposal(id: string): Promise<ProposalRow> {
    const row = await this.prisma.partnershipProposal.findUnique({
      where: { id },
      include: proposalInclude,
    });
    if (!row) {
      throw new NotFoundException('Proposal not found');
    }
    return row;
  }

  private async assertInstitution(id: string): Promise<void> {
    const found = await this.prisma.partnershipInstitution.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!found) {
      throw new BadRequestException('Institution not found');
    }
  }

  private async nextProposalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ROOTACA-PROP-${year}-`;
    const latest = await this.prisma.partnershipProposal.findFirst({
      where: { proposalNumber: { startsWith: prefix } },
      orderBy: { proposalNumber: 'desc' },
      select: { proposalNumber: true },
    });
    let seq = 1;
    if (latest?.proposalNumber) {
      const raw = latest.proposalNumber.slice(prefix.length);
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
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

  private async buildLineCreates(
    lines: ProposalLineInputDto[],
  ): Promise<Prisma.PartnershipProposalOfferingCreateWithoutProposalInput[]> {
    const creates: Prisma.PartnershipProposalOfferingCreateWithoutProposalInput[] = [];
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const offering = await this.offerings.findOne(line.offeringId);
      const snapshot = buildOfferingSnapshot(offering);
      const lineSubtotal = computeLineSubtotal({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountType: line.discountType ?? PartnershipDiscountType.NONE,
        discountValue: line.discountValue,
      });
      creates.push({
        offering: { connect: { id: line.offeringId } },
        sortOrder: line.sortOrder ?? index,
        ...snapshot,
        customizedObjectives: line.customizedObjectives?.trim() ?? '',
        customizedCurriculumNotes: line.customizedCurriculumNotes?.trim() ?? '',
        specialRequirements: line.specialRequirements?.trim() ?? '',
        implementationNotes: line.implementationNotes?.trim() ?? '',
        deliveryNotes: line.deliveryNotes?.trim() ?? '',
        pricingModel: line.pricingModel,
        quantity: dec(line.quantity ?? null),
        unitPrice: dec(line.unitPrice ?? null),
        discountType: line.discountType ?? PartnershipDiscountType.NONE,
        discountValue: dec(line.discountValue ?? null),
        lineSubtotal: dec(lineSubtotal),
      });
    }
    return creates;
  }

  private totalsFromLines(
    lines: Array<{
      quantity: number | null;
      unitPrice: number | null;
      discountType: PartnershipDiscountType;
      discountValue: number | null;
    }>,
    header: {
      headerDiscountType?: PartnershipDiscountType | null;
      headerDiscountValue?: number | null;
      taxEnabled?: boolean;
      taxRate?: number | null;
    },
  ) {
    return computeProposalTotals({
      lines,
      headerDiscountType: header.headerDiscountType,
      headerDiscountValue: header.headerDiscountValue,
      taxEnabled: header.taxEnabled,
      taxRate: header.taxRate,
    });
  }

  private mapPhases(phases: CreateProposalDto['timelinePhases']) {
    return (phases ?? []).map((phase, index) => ({
      title: phase.title.trim(),
      description: phase.description?.trim() ?? '',
      sortOrder: phase.sortOrder ?? index,
      startDate: phase.startDate ? new Date(phase.startDate) : null,
      endDate: phase.endDate ? new Date(phase.endDate) : null,
    }));
  }

  private mapOutcomes(outcomes: CreateProposalDto['customOutcomes']) {
    return (outcomes ?? []).map((item, index) => ({
      title: item.title.trim(),
      description: item.description?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private contentFields(dto: CreateProposalDto) {
    return {
      executiveSummary: dto.executiveSummary?.trim() ?? '',
      schoolChallenge: dto.schoolChallenge?.trim() ?? '',
      schoolObjective: dto.schoolObjective?.trim() ?? '',
      targetStudentGroup: dto.targetStudentGroup?.trim() ?? '',
      successCriteria: dto.successCriteria?.trim() ?? '',
      partnershipObjective: dto.partnershipObjective?.trim() ?? '',
      implementationApproach: dto.implementationApproach?.trim() ?? '',
      timelineNotes: dto.timelineNotes?.trim() ?? '',
      paymentTerms: dto.paymentTerms?.trim() ?? '',
      nextSteps: dto.nextSteps?.trim() ?? '',
      termsAndConditions: dto.termsAndConditions?.trim() ?? '',
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    };
  }

  private partialContent(dto: UpdateProposalDto): Prisma.PartnershipProposalUpdateInput {
    const data: Prisma.PartnershipProposalUpdateInput = {};
    const assign = (key: keyof UpdateProposalDto, target: keyof Prisma.PartnershipProposalUpdateInput) => {
      if (dto[key] !== undefined) {
        const value = dto[key];
        (data as Record<string, unknown>)[target as string] =
          typeof value === 'string' ? value.trim() : value;
      }
    };
    assign('executiveSummary', 'executiveSummary');
    assign('schoolChallenge', 'schoolChallenge');
    assign('schoolObjective', 'schoolObjective');
    assign('targetStudentGroup', 'targetStudentGroup');
    assign('successCriteria', 'successCriteria');
    assign('partnershipObjective', 'partnershipObjective');
    assign('implementationApproach', 'implementationApproach');
    assign('timelineNotes', 'timelineNotes');
    assign('paymentTerms', 'paymentTerms');
    assign('nextSteps', 'nextSteps');
    assign('termsAndConditions', 'termsAndConditions');
    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    return data;
  }

  private nullableCurrency(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim().toUpperCase();
    return trimmed || null;
  }

  private buildWhere(query: QueryProposalsDto): Prisma.PartnershipProposalWhereInput {
    const and: Prisma.PartnershipProposalWhereInput[] = [];
    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { proposalNumber: { contains: search, mode: 'insensitive' } },
          { institution: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    if (query.institutionId) {
      and.push({ institutionId: query.institutionId });
    }
    if (query.status) {
      and.push({ status: query.status });
    }
    if (query.createdFrom || query.createdTo) {
      and.push({
        createdAt: {
          ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
          ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
        },
      });
    }
    if (query.validUntilFrom || query.validUntilTo) {
      and.push({
        validUntil: {
          ...(query.validUntilFrom ? { gte: new Date(query.validUntilFrom) } : {}),
          ...(query.validUntilTo ? { lte: new Date(query.validUntilTo) } : {}),
        },
      });
    }
    return and.length ? { AND: and } : {};
  }

  private toResponse(row: ProposalRow): ProposalResponseDto {
    const primary = row.institution.contacts?.[0] ?? null;
    return {
      id: row.id,
      proposalNumber: row.proposalNumber,
      title: row.title,
      institutionId: row.institutionId,
      institutionName: row.institution.name,
      status: row.status,
      offeringCount: row.offerings.length,
      offeringNames: row.offerings.map((o) => o.snapshotOfferingName),
      currency: row.currency,
      grandTotal: num(row.grandTotal),
      proposalDate: row.proposalDate.toISOString(),
      validUntil: iso(row.validUntil),
      version: row.version,
      isLocked: row.isLocked,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      preparedBy: row.preparedBy,
      executiveSummary: row.executiveSummary,
      schoolChallenge: row.schoolChallenge,
      schoolObjective: row.schoolObjective,
      targetStudentGroup: row.targetStudentGroup,
      successCriteria: row.successCriteria,
      partnershipObjective: row.partnershipObjective,
      implementationApproach: row.implementationApproach,
      timelineNotes: row.timelineNotes,
      paymentTerms: row.paymentTerms,
      nextSteps: row.nextSteps,
      termsAndConditions: row.termsAndConditions,
      startDate: iso(row.startDate),
      endDate: iso(row.endDate),
      taxEnabled: row.taxEnabled,
      taxRate: num(row.taxRate),
      headerDiscountType: row.headerDiscountType,
      headerDiscountValue: num(row.headerDiscountValue),
      subtotal: num(row.subtotal),
      discountAmount: num(row.discountAmount),
      taxAmount: num(row.taxAmount),
      shareToken: row.shareToken,
      sentAt: iso(row.sentAt),
      viewedAt: iso(row.viewedAt),
      archivedAt: iso(row.archivedAt),
      institution: {
        id: row.institution.id,
        name: row.institution.name,
        arabicName: row.institution.arabicName,
        englishName: row.institution.englishName,
        institutionType: row.institution.institutionType,
        governorate: row.institution.governorate,
        city: row.institution.city,
        primaryContactName: primary?.fullName ?? null,
        primaryContactEmail: primary?.email ?? null,
      },
      offerings: row.offerings.map((line) => ({
        id: line.id,
        offeringId: line.offeringId,
        sortOrder: line.sortOrder,
        snapshotProgramName: line.snapshotProgramName,
        snapshotOfferingName: line.snapshotOfferingName,
        snapshotDeliveryFormat: line.snapshotDeliveryFormat,
        snapshotTargetGrades: line.snapshotTargetGrades,
        snapshotRecommendedLevel: line.snapshotRecommendedLevel,
        snapshotDuration: line.snapshotDuration,
        snapshotDurationUnit: line.snapshotDurationUnit,
        snapshotNumberOfSessions: line.snapshotNumberOfSessions,
        snapshotSessionDurationMinutes: line.snapshotSessionDurationMinutes,
        snapshotSessionFrequency: line.snapshotSessionFrequency,
        snapshotDeliveryMode: line.snapshotDeliveryMode,
        snapshotGroupSizeMin: line.snapshotGroupSizeMin,
        snapshotGroupSizeMax: line.snapshotGroupSizeMax,
        snapshotNumberOfGroups: line.snapshotNumberOfGroups,
        snapshotShortDescription: line.snapshotShortDescription,
        snapshotSchoolValue: line.snapshotSchoolValue,
        snapshotStudentValue: line.snapshotStudentValue,
        snapshotCurriculumJson: line.snapshotCurriculumJson,
        snapshotProjectsJson: line.snapshotProjectsJson,
        snapshotOutcomesJson: line.snapshotOutcomesJson,
        snapshotRequirementsJson: line.snapshotRequirementsJson,
        snapshotAssessmentJson: line.snapshotAssessmentJson,
        snapshotObjectivesJson: line.snapshotObjectivesJson,
        snapshotActivitiesJson: line.snapshotActivitiesJson,
        snapshotCapturedAt: line.snapshotCapturedAt.toISOString(),
        customizedObjectives: line.customizedObjectives,
        customizedCurriculumNotes: line.customizedCurriculumNotes,
        specialRequirements: line.specialRequirements,
        implementationNotes: line.implementationNotes,
        deliveryNotes: line.deliveryNotes,
        pricingModel: line.pricingModel,
        quantity: num(line.quantity),
        unitPrice: num(line.unitPrice),
        discountType: line.discountType,
        discountValue: num(line.discountValue),
        lineSubtotal: num(line.lineSubtotal),
      })),
      timelinePhases: row.timelinePhases.map((phase) => ({
        id: phase.id,
        title: phase.title,
        description: phase.description,
        sortOrder: phase.sortOrder,
        startDate: iso(phase.startDate) ?? undefined,
        endDate: iso(phase.endDate) ?? undefined,
      })),
      customOutcomes: row.customOutcomes.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        sortOrder: item.sortOrder,
      })),
      versions: row.versions.map((version) => ({
        id: version.id,
        version: version.version,
        note: version.note,
        createdAt: version.createdAt.toISOString(),
      })),
    };
  }
}
