import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipProposalStatus,
  PartnershipSowChangeImpact,
  PartnershipSowChangeRequestStatus,
  PartnershipSowStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import {
  ChangeSowStatusDto,
  CreateChangeRequestDto,
  CreateSowDto,
  DecideChangeRequestDto,
  PaginatedSowsDto,
  SowResponseDto,
  SowScopeOfferingInputDto,
  QuerySowsDto,
  UpdateSowDto,
} from './dto/sow.dto';

const sowInclude = {
  institution: {
    include: {
      contacts: {
        where: { isPrimary: true },
        take: 1,
        orderBy: { updatedAt: 'desc' as const },
      },
    },
  },
  proposal: {
    select: { id: true, proposalNumber: true, title: true, status: true },
  },
  scopeOfferings: { orderBy: { sortOrder: 'asc' as const } },
  scopeItems: { orderBy: [{ kind: 'asc' as const }, { sortOrder: 'asc' as const }] },
  deliverables: { orderBy: { sortOrder: 'asc' as const } },
  milestones: { orderBy: { sortOrder: 'asc' as const } },
  responsibilities: { orderBy: { sortOrder: 'asc' as const } },
  teamMembers: { orderBy: [{ party: 'asc' as const }, { sortOrder: 'asc' as const }] },
  assessmentItems: { orderBy: { sortOrder: 'asc' as const } },
  changeRequests: { orderBy: { createdAt: 'desc' as const } },
  versions: { orderBy: { createdAt: 'desc' as const }, take: 50 },
} satisfies Prisma.PartnershipSowInclude;

type SowRow = Prisma.PartnershipSowGetPayload<{ include: typeof sowInclude }>;

const ALLOWED_TRANSITIONS: Record<PartnershipSowStatus, PartnershipSowStatus[]> = {
  DRAFT: [PartnershipSowStatus.PENDING_SIGNATURE, PartnershipSowStatus.CANCELLED],
  PENDING_SIGNATURE: [PartnershipSowStatus.ACTIVE, PartnershipSowStatus.CANCELLED],
  ACTIVE: [
    PartnershipSowStatus.COMPLETED,
    PartnershipSowStatus.CANCELLED,
    PartnershipSowStatus.EXPIRED,
  ],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

function num(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = value.toNumber();
  return Number.isFinite(parsed) ? parsed : null;
}

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function date(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function jsonIn(
  value: Prisma.JsonValue | unknown | null | undefined,
): Prisma.InputJsonValue | undefined {
  return value === null || value === undefined
    ? undefined
    : (value as Prisma.InputJsonValue);
}

@Injectable()
export class SowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {}

  async createFromProposal(proposalId: string, actorId: string): Promise<SowResponseDto> {
    return this.create({ proposalId }, actorId);
  }

  async create(dto: CreateSowDto, actorId: string): Promise<SowResponseDto> {
    const proposal = await this.prisma.partnershipProposal.findUnique({
      where: { id: dto.proposalId },
      include: {
        institution: { include: { contacts: { where: { isPrimary: true }, take: 1 } } },
        offerings: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.status === PartnershipProposalStatus.ARCHIVED) {
      throw new BadRequestException('Cannot create a SOW from an archived proposal');
    }
    if (proposal.status !== PartnershipProposalStatus.ACCEPTED) {
      throw new BadRequestException(
        'SOW can only be created from an accepted (approved) proposal',
      );
    }

    const sowNumber = await this.nextSowNumber();
    const primaryContact = proposal.institution.contacts?.[0] ?? null;

    // Scope offerings come from the proposal offering snapshots (never mutate proposal).
    const scopeOfferingCreates =
      dto.scopeOfferings !== undefined
        ? this.mapScopeOfferingInputs(dto.scopeOfferings)
        : proposal.offerings.map((line, index) => ({
            offeringId: line.offeringId,
            sortOrder: line.sortOrder ?? index,
            programName: line.snapshotProgramName,
            offeringName: line.snapshotOfferingName,
            deliveryFormat: line.snapshotDeliveryFormat,
            targetGrades: line.snapshotTargetGrades,
            recommendedLevel: line.snapshotRecommendedLevel,
            duration: line.snapshotDuration,
            durationUnit: line.snapshotDurationUnit,
            numberOfSessions: line.snapshotNumberOfSessions,
            sessionDurationMinutes: line.snapshotSessionDurationMinutes,
            sessionFrequency: line.snapshotSessionFrequency,
            deliveryMode: line.snapshotDeliveryMode,
            groupSizeMin: line.snapshotGroupSizeMin,
            groupSizeMax: line.snapshotGroupSizeMax,
            numberOfGroups: line.snapshotNumberOfGroups,
            shortDescription: line.snapshotShortDescription,
            curriculumJson: jsonIn(line.snapshotCurriculumJson),
            activitiesJson: jsonIn(line.snapshotActivitiesJson),
            projectsJson: jsonIn(line.snapshotProjectsJson),
            assessmentJson: jsonIn(line.snapshotAssessmentJson),
            requirementsJson: jsonIn(line.snapshotRequirementsJson),
            outcomesJson: jsonIn(line.snapshotOutcomesJson),
            objectivesJson: jsonIn(line.snapshotObjectivesJson),
          }));

    const purpose =
      dto.purpose?.trim() ??
      (proposal.partnershipObjective?.trim() ||
        proposal.executiveSummary?.trim() ||
        '');

    const row = await this.prisma.partnershipSow.create({
      data: {
        sowNumber,
        title: dto.title?.trim() || proposal.title,
        institution: { connect: { id: proposal.institutionId } },
        proposal: { connect: { id: proposal.id } },
        status: PartnershipSowStatus.DRAFT,
        sowDate: date(dto.sowDate) ?? new Date(),
        effectiveDate: date(dto.effectiveDate),
        startDate: date(dto.startDate) ?? proposal.startDate,
        endDate: date(dto.endDate) ?? proposal.endDate,
        preparedBy: dto.preparedBy?.trim() ?? '',
        approvedBy: dto.approvedBy?.trim() ?? '',
        purpose,
        // Parties copied from institution / proposal — never invented.
        clientName: dto.clientName?.trim() || proposal.institution.name,
        clientAddress: dto.clientAddress?.trim() || (proposal.institution.fullAddress ?? ''),
        primaryContactName:
          dto.primaryContactName?.trim() || (primaryContact?.fullName ?? ''),
        primaryContactEmail:
          dto.primaryContactEmail?.trim() || (primaryContact?.email ?? ''),
        primaryContactPhone:
          dto.primaryContactPhone?.trim() ||
          (proposal.institution.phone ?? proposal.institution.mobile ?? ''),
        ...this.narrativeFields(dto),
        ...this.requirementFields(dto),
        termsAndConditions: dto.termsAndConditions?.trim() ?? '',
        // Commercial reference snapshot (display only — no recalculation).
        proposalNumberSnapshot: proposal.proposalNumber,
        agreedValueSnapshot: proposal.grandTotal,
        currencySnapshot: proposal.currency,
        paymentTermsSnapshot: proposal.paymentTerms ?? '',
        rootacaSignatoryName: dto.rootacaSignatoryName?.trim() ?? '',
        rootacaSignatoryTitle: dto.rootacaSignatoryTitle?.trim() ?? '',
        schoolSignatoryName: dto.schoolSignatoryName?.trim() ?? '',
        schoolSignatoryTitle: dto.schoolSignatoryTitle?.trim() ?? '',
        isLocked: false,
        scopeOfferings: { create: scopeOfferingCreates },
        scopeItems: { create: this.mapScopeItems(dto.scopeItems) },
        deliverables: { create: this.mapDeliverables(dto.deliverables) },
        milestones: { create: this.mapMilestones(dto.milestones) },
        responsibilities: { create: this.mapResponsibilities(dto.responsibilities) },
        teamMembers: { create: this.mapTeamMembers(dto.teamMembers) },
        assessmentItems: { create: this.mapAssessmentItems(dto.assessmentItems) },
      },
      include: sowInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOW,
      entityId: row.id,
      action: PartnershipAuditAction.SOW_CREATED,
      performedById: actorId,
      metadata: { proposalId: proposal.id },
    });
    return this.toResponse(row);
  }

  async findAll(query: QuerySowsDto): Promise<PaginatedSowsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildWhere(query);
    const [total, rows] = await Promise.all([
      this.prisma.partnershipSow.count({ where }),
      this.prisma.partnershipSow.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          institution: { select: { name: true } },
          proposal: { select: { proposalNumber: true } },
          _count: { select: { scopeOfferings: true } },
        },
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        sowNumber: row.sowNumber,
        title: row.title,
        institutionId: row.institutionId,
        institutionName: row.institution.name,
        proposalId: row.proposalId,
        proposalNumber: row.proposal?.proposalNumber ?? null,
        status: row.status,
        sowDate: row.sowDate.toISOString(),
        startDate: iso(row.startDate),
        endDate: iso(row.endDate),
        currencySnapshot: row.currencySnapshot,
        agreedValueSnapshot: num(row.agreedValueSnapshot),
        version: row.version,
        isLocked: row.isLocked,
        offeringCount: row._count.scopeOfferings,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findOne(id: string): Promise<SowResponseDto> {
    return this.toResponse(await this.requireSow(id));
  }

  async update(id: string, dto: UpdateSowDto, actorId: string): Promise<SowResponseDto> {
    const existing = await this.requireSow(id);
    if (existing.isLocked) {
      throw new BadRequestException(
        'SOW is locked. Submit and approve a change request to unlock edits.',
      );
    }
    if (dto.proposalId && dto.proposalId !== existing.proposalId) {
      throw new BadRequestException('Cannot re-point a SOW to a different proposal');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      // Scope offerings may only be replaced while the SOW is a DRAFT.
      if (dto.scopeOfferings !== undefined) {
        if (existing.status !== PartnershipSowStatus.DRAFT) {
          throw new BadRequestException(
            'Scope offerings can only be replaced while the SOW is a draft',
          );
        }
        await tx.partnershipSowScopeOffering.deleteMany({ where: { sowId: id } });
      }
      if (dto.scopeItems !== undefined) {
        await tx.partnershipSowScopeItem.deleteMany({ where: { sowId: id } });
      }
      if (dto.deliverables !== undefined) {
        await tx.partnershipSowDeliverable.deleteMany({ where: { sowId: id } });
      }
      if (dto.milestones !== undefined) {
        await tx.partnershipSowMilestone.deleteMany({ where: { sowId: id } });
      }
      if (dto.responsibilities !== undefined) {
        await tx.partnershipSowResponsibility.deleteMany({ where: { sowId: id } });
      }
      if (dto.teamMembers !== undefined) {
        await tx.partnershipSowTeamMember.deleteMany({ where: { sowId: id } });
      }
      if (dto.assessmentItems !== undefined) {
        await tx.partnershipSowAssessmentItem.deleteMany({ where: { sowId: id } });
      }

      return tx.partnershipSow.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...this.partialScalar(dto),
          ...(dto.scopeOfferings !== undefined
            ? { scopeOfferings: { create: this.mapScopeOfferingInputs(dto.scopeOfferings) } }
            : {}),
          ...(dto.scopeItems !== undefined
            ? { scopeItems: { create: this.mapScopeItems(dto.scopeItems) } }
            : {}),
          ...(dto.deliverables !== undefined
            ? { deliverables: { create: this.mapDeliverables(dto.deliverables) } }
            : {}),
          ...(dto.milestones !== undefined
            ? { milestones: { create: this.mapMilestones(dto.milestones) } }
            : {}),
          ...(dto.responsibilities !== undefined
            ? { responsibilities: { create: this.mapResponsibilities(dto.responsibilities) } }
            : {}),
          ...(dto.teamMembers !== undefined
            ? { teamMembers: { create: this.mapTeamMembers(dto.teamMembers) } }
            : {}),
          ...(dto.assessmentItems !== undefined
            ? { assessmentItems: { create: this.mapAssessmentItems(dto.assessmentItems) } }
            : {}),
        },
        include: sowInclude,
      });
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOW,
      entityId: id,
      action: PartnershipAuditAction.SOW_UPDATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async changeStatus(
    id: string,
    dto: ChangeSowStatusDto,
    actorId: string,
  ): Promise<SowResponseDto> {
    const existing = await this.requireSow(id);
    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${existing.status} to ${dto.status}`,
      );
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.PartnershipSowUpdateInput = { status: dto.status };

      if (dto.status === PartnershipSowStatus.PENDING_SIGNATURE) {
        // Lock the SOW and freeze a document snapshot + version checkpoint.
        data.isLocked = true;
        data.documentSnapshot = this.toResponse(existing) as unknown as Prisma.InputJsonValue;
        await tx.partnershipSowVersion.create({
          data: {
            sowId: id,
            version: existing.version,
            changeSummary: 'Submitted for signature',
            createdById: actorId,
            snapshot: this.toResponse(existing) as unknown as Prisma.InputJsonValue,
          },
        });
      }
      if (dto.status === PartnershipSowStatus.ACTIVE) {
        // Remain locked once active.
        data.isLocked = true;
      }

      return tx.partnershipSow.update({ where: { id }, data, include: sowInclude });
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOW,
      entityId: id,
      action: PartnershipAuditAction.SOW_STATUS_CHANGED,
      performedById: actorId,
      metadata: { from: existing.status, to: dto.status },
    });
    return this.toResponse(row);
  }

  async archive(id: string, actorId: string): Promise<SowResponseDto> {
    const existing = await this.requireSow(id);
    if (existing.archivedAt) {
      return this.toResponse(existing);
    }
    const row = await this.prisma.partnershipSow.update({
      where: { id },
      data: { archivedAt: new Date() },
      include: sowInclude,
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOW,
      entityId: id,
      action: PartnershipAuditAction.SOW_ARCHIVED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async duplicate(id: string, actorId: string): Promise<SowResponseDto> {
    const source = await this.requireSow(id);
    const sowNumber = await this.nextSowNumber();

    const row = await this.prisma.partnershipSow.create({
      data: {
        sowNumber,
        title: `${source.title} (Copy)`,
        institution: { connect: { id: source.institutionId } },
        proposal: { connect: { id: source.proposalId } },
        status: PartnershipSowStatus.DRAFT,
        sowDate: new Date(),
        effectiveDate: source.effectiveDate,
        startDate: source.startDate,
        endDate: source.endDate,
        version: '1.0',
        preparedBy: source.preparedBy,
        approvedBy: source.approvedBy,
        purpose: source.purpose,
        targetStudents: source.targetStudents,
        deliveryModelNotes: source.deliveryModelNotes,
        activitiesNotes: source.activitiesNotes,
        projectsNotes: source.projectsNotes,
        assessmentNotes: source.assessmentNotes,
        reportingNotes: source.reportingNotes,
        clientName: source.clientName,
        clientAddress: source.clientAddress,
        primaryContactName: source.primaryContactName,
        primaryContactEmail: source.primaryContactEmail,
        primaryContactPhone: source.primaryContactPhone,
        attendanceExpectations: source.attendanceExpectations,
        minimumParticipation: source.minimumParticipation,
        studentReplacementRules: source.studentReplacementRules,
        makeupSessionRules: source.makeupSessionRules,
        equipmentRequirements: source.equipmentRequirements,
        internetRequirements: source.internetRequirements,
        classroomLabRequirements: source.classroomLabRequirements,
        studentDevicesRequirements: source.studentDevicesRequirements,
        softwareRequirements: source.softwareRequirements,
        accountsAccessRequirements: source.accountsAccessRequirements,
        facultyLiaisonRequirements: source.facultyLiaisonRequirements,
        termsAndConditions: source.termsAndConditions,
        proposalNumberSnapshot: source.proposalNumberSnapshot,
        agreedValueSnapshot: source.agreedValueSnapshot,
        currencySnapshot: source.currencySnapshot,
        paymentTermsSnapshot: source.paymentTermsSnapshot,
        isLocked: false,
        scopeOfferings: {
          create: source.scopeOfferings.map((line) => ({
            offeringId: line.offeringId,
            sortOrder: line.sortOrder,
            programName: line.programName,
            offeringName: line.offeringName,
            deliveryFormat: line.deliveryFormat,
            targetGrades: line.targetGrades,
            recommendedLevel: line.recommendedLevel,
            duration: line.duration,
            durationUnit: line.durationUnit,
            numberOfSessions: line.numberOfSessions,
            sessionDurationMinutes: line.sessionDurationMinutes,
            sessionFrequency: line.sessionFrequency,
            deliveryMode: line.deliveryMode,
            groupSizeMin: line.groupSizeMin,
            groupSizeMax: line.groupSizeMax,
            numberOfGroups: line.numberOfGroups,
            shortDescription: line.shortDescription,
            curriculumJson: jsonIn(line.curriculumJson),
            activitiesJson: jsonIn(line.activitiesJson),
            projectsJson: jsonIn(line.projectsJson),
            assessmentJson: jsonIn(line.assessmentJson),
            requirementsJson: jsonIn(line.requirementsJson),
            outcomesJson: jsonIn(line.outcomesJson),
            objectivesJson: jsonIn(line.objectivesJson),
          })),
        },
        scopeItems: {
          create: source.scopeItems.map((item) => ({
            kind: item.kind,
            text: item.text,
            sortOrder: item.sortOrder,
          })),
        },
        deliverables: {
          create: source.deliverables.map((item) => ({
            name: item.name,
            description: item.description,
            owner: item.owner,
            dueDate: item.dueDate,
            acceptanceCriteria: item.acceptanceCriteria,
            status: item.status,
            sortOrder: item.sortOrder,
          })),
        },
        milestones: {
          create: source.milestones.map((item) => ({
            name: item.name,
            description: item.description,
            startDate: item.startDate,
            endDate: item.endDate,
            owner: item.owner,
            status: item.status,
            sortOrder: item.sortOrder,
          })),
        },
        responsibilities: {
          create: source.responsibilities.map((item) => ({
            activity: item.activity,
            rootacaRole: item.rootacaRole,
            schoolRole: item.schoolRole,
            sortOrder: item.sortOrder,
          })),
        },
        teamMembers: {
          create: source.teamMembers.map((item) => ({
            party: item.party,
            role: item.role,
            name: item.name,
            responsibility: item.responsibility,
            contact: item.contact,
            assignedUserId: item.assignedUserId,
            sortOrder: item.sortOrder,
          })),
        },
        assessmentItems: {
          create: source.assessmentItems.map((item) => ({
            name: item.name,
            responsibleParty: item.responsibleParty,
            frequency: item.frequency,
            format: item.format,
            dueDate: item.dueDate,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: sowInclude,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOW,
      entityId: row.id,
      action: PartnershipAuditAction.SOW_DUPLICATED,
      performedById: actorId,
      metadata: { sourceId: id },
    });
    return this.toResponse(row);
  }

  async createChangeRequest(
    id: string,
    dto: CreateChangeRequestDto,
    actorId: string,
  ): Promise<SowResponseDto> {
    await this.requireSow(id);
    const changeRequestNumber = await this.nextChangeRequestNumber(id);

    await this.prisma.partnershipSowChangeRequest.create({
      data: {
        sowId: id,
        changeRequestNumber,
        requestedBy: dto.requestedBy?.trim() ?? '',
        requestDate: date(dto.requestDate) ?? new Date(),
        description: dto.description.trim(),
        impact: dto.impact ?? PartnershipSowChangeImpact.MINOR,
        approvalStatus: PartnershipSowChangeRequestStatus.PENDING,
      },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOW,
      entityId: id,
      action: PartnershipAuditAction.SOW_CHANGE_REQUEST,
      performedById: actorId,
      metadata: { changeRequestNumber, impact: dto.impact ?? PartnershipSowChangeImpact.MINOR },
    });
    return this.toResponse(await this.requireSow(id));
  }

  async decideChangeRequest(
    id: string,
    changeRequestId: string,
    dto: DecideChangeRequestDto,
    actorId: string,
  ): Promise<SowResponseDto> {
    const existing = await this.requireSow(id);
    const cr = existing.changeRequests.find((item) => item.id === changeRequestId);
    if (!cr) {
      throw new NotFoundException('Change request not found');
    }
    if (cr.approvalStatus !== PartnershipSowChangeRequestStatus.PENDING) {
      throw new BadRequestException('Change request has already been decided');
    }
    if (
      dto.decision !== PartnershipSowChangeRequestStatus.APPROVED &&
      dto.decision !== PartnershipSowChangeRequestStatus.REJECTED
    ) {
      throw new BadRequestException('Decision must be APPROVED or REJECTED');
    }

    if (dto.decision === PartnershipSowChangeRequestStatus.REJECTED) {
      await this.prisma.partnershipSowChangeRequest.update({
        where: { id: changeRequestId },
        data: {
          approvalStatus: PartnershipSowChangeRequestStatus.REJECTED,
          approvedBy: dto.approvedBy?.trim() ?? '',
          decisionDate: new Date(),
          changeSummary: dto.changeSummary?.trim() ?? '',
        },
      });
      await this.audit.record({
        entityType: PartnershipAuditEntityType.SOW,
        entityId: id,
        action: PartnershipAuditAction.SOW_CHANGE_REQUEST,
        performedById: actorId,
        metadata: { changeRequestId, decision: 'REJECTED' },
      });
      return this.toResponse(await this.requireSow(id));
    }

    // Approved: checkpoint current state as a version, bump version, unlock for edits.
    const nextVersion = this.bumpVersion(existing.version, cr.impact);
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.partnershipSowVersion.create({
        data: {
          sowId: id,
          version: existing.version,
          changeSummary: dto.changeSummary?.trim() || `Change request ${cr.changeRequestNumber}`,
          createdById: actorId,
          snapshot: this.toResponse(existing) as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.partnershipSowChangeRequest.update({
        where: { id: changeRequestId },
        data: {
          approvalStatus: PartnershipSowChangeRequestStatus.APPROVED,
          approvedBy: dto.approvedBy?.trim() ?? '',
          decisionDate: new Date(),
          changeSummary: dto.changeSummary?.trim() ?? '',
          resultingVersion: nextVersion,
        },
      });
      return tx.partnershipSow.update({
        where: { id },
        data: {
          version: nextVersion,
          // Unlock so the approved change can be applied via a follow-up update.
          isLocked: false,
        },
        include: sowInclude,
      });
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOW,
      entityId: id,
      action: PartnershipAuditAction.SOW_VERSIONED,
      performedById: actorId,
      metadata: {
        changeRequestId,
        decision: 'APPROVED',
        from: existing.version,
        to: nextVersion,
        impact: cr.impact,
      },
    });
    return this.toResponse(row);
  }

  // --- helpers ---------------------------------------------------------------

  private async requireSow(id: string): Promise<SowRow> {
    const row = await this.prisma.partnershipSow.findUnique({
      where: { id },
      include: sowInclude,
    });
    if (!row) {
      throw new NotFoundException('SOW not found');
    }
    return row;
  }

  private async nextSowNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ROOTACA-SOW-${year}-`;
    const latest = await this.prisma.partnershipSow.findFirst({
      where: { sowNumber: { startsWith: prefix } },
      orderBy: { sowNumber: 'desc' },
      select: { sowNumber: true },
    });
    let seq = 1;
    if (latest?.sowNumber) {
      const parsed = Number.parseInt(latest.sowNumber.slice(prefix.length), 10);
      if (Number.isFinite(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  private async nextChangeRequestNumber(sowId: string): Promise<string> {
    const count = await this.prisma.partnershipSowChangeRequest.count({ where: { sowId } });
    return `CR-${String(count + 1).padStart(3, '0')}`;
  }

  private bumpVersion(current: string, impact: PartnershipSowChangeImpact): string {
    const match = /^(\d+)\.(\d+)$/.exec(current.trim());
    const major = match ? Number(match[1]) : 1;
    const minor = match ? Number(match[2]) : 0;
    if (impact === PartnershipSowChangeImpact.MAJOR) {
      return `${major + 1}.0`;
    }
    return `${major}.${minor + 1}`;
  }

  private buildWhere(query: QuerySowsDto): Prisma.PartnershipSowWhereInput {
    const and: Prisma.PartnershipSowWhereInput[] = [];
    const includeArchived =
      query.includeArchived === 'true' || query.includeArchived === '1';
    if (!includeArchived) {
      and.push({ archivedAt: null });
    }
    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { sowNumber: { contains: search, mode: 'insensitive' } },
          { institution: { name: { contains: search, mode: 'insensitive' } } },
          { proposal: { proposalNumber: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    if (query.institutionId) {
      and.push({ institutionId: query.institutionId });
    }
    if (query.proposalId) {
      and.push({ proposalId: query.proposalId });
    }
    if (query.status) {
      and.push({ status: query.status });
    }
    if (query.startDateFrom || query.startDateTo) {
      and.push({
        startDate: {
          ...(query.startDateFrom ? { gte: new Date(query.startDateFrom) } : {}),
          ...(query.startDateTo ? { lte: new Date(query.startDateTo) } : {}),
        },
      });
    }
    if (query.endDateFrom || query.endDateTo) {
      and.push({
        endDate: {
          ...(query.endDateFrom ? { gte: new Date(query.endDateFrom) } : {}),
          ...(query.endDateTo ? { lte: new Date(query.endDateTo) } : {}),
        },
      });
    }
    if (query.createdFrom || query.createdTo) {
      and.push({
        createdAt: {
          ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
          ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}),
        },
      });
    }
    return and.length ? { AND: and } : {};
  }

  private narrativeFields(dto: CreateSowDto) {
    return {
      targetStudents: dto.targetStudents?.trim() ?? '',
      deliveryModelNotes: dto.deliveryModelNotes?.trim() ?? '',
      activitiesNotes: dto.activitiesNotes?.trim() ?? '',
      projectsNotes: dto.projectsNotes?.trim() ?? '',
      assessmentNotes: dto.assessmentNotes?.trim() ?? '',
      reportingNotes: dto.reportingNotes?.trim() ?? '',
      attendanceExpectations: dto.attendanceExpectations?.trim() ?? '',
      minimumParticipation: dto.minimumParticipation?.trim() ?? '',
      studentReplacementRules: dto.studentReplacementRules?.trim() ?? '',
      makeupSessionRules: dto.makeupSessionRules?.trim() ?? '',
    };
  }

  private requirementFields(dto: CreateSowDto) {
    return {
      equipmentRequirements: dto.equipmentRequirements?.trim() ?? '',
      internetRequirements: dto.internetRequirements?.trim() ?? '',
      classroomLabRequirements: dto.classroomLabRequirements?.trim() ?? '',
      studentDevicesRequirements: dto.studentDevicesRequirements?.trim() ?? '',
      softwareRequirements: dto.softwareRequirements?.trim() ?? '',
      accountsAccessRequirements: dto.accountsAccessRequirements?.trim() ?? '',
      facultyLiaisonRequirements: dto.facultyLiaisonRequirements?.trim() ?? '',
    };
  }

  private partialScalar(dto: UpdateSowDto): Prisma.PartnershipSowUpdateInput {
    const data: Prisma.PartnershipSowUpdateInput = {};
    const assignString = (key: keyof UpdateSowDto) => {
      const value = dto[key];
      if (value !== undefined && typeof value === 'string') {
        (data as Record<string, unknown>)[key as string] = value.trim();
      }
    };
    const assignDate = (key: keyof UpdateSowDto) => {
      const value = dto[key];
      if (value !== undefined) {
        (data as Record<string, unknown>)[key as string] =
          typeof value === 'string' && value ? new Date(value) : null;
      }
    };
    (
      [
        'preparedBy',
        'approvedBy',
        'purpose',
        'targetStudents',
        'deliveryModelNotes',
        'activitiesNotes',
        'projectsNotes',
        'assessmentNotes',
        'reportingNotes',
        'clientName',
        'clientAddress',
        'primaryContactName',
        'primaryContactEmail',
        'primaryContactPhone',
        'attendanceExpectations',
        'minimumParticipation',
        'studentReplacementRules',
        'makeupSessionRules',
        'equipmentRequirements',
        'internetRequirements',
        'classroomLabRequirements',
        'studentDevicesRequirements',
        'softwareRequirements',
        'accountsAccessRequirements',
        'facultyLiaisonRequirements',
        'termsAndConditions',
        'rootacaSignatoryName',
        'rootacaSignatoryTitle',
        'schoolSignatoryName',
        'schoolSignatoryTitle',
      ] as const
    ).forEach(assignString);
    (['sowDate', 'effectiveDate', 'startDate', 'endDate'] as const).forEach(assignDate);
    return data;
  }

  private mapScopeOfferingInputs(
    items: SowScopeOfferingInputDto[],
  ): Prisma.PartnershipSowScopeOfferingCreateWithoutSowInput[] {
    return items.map((item, index) => ({
      offeringId: item.offeringId ?? null,
      sortOrder: item.sortOrder ?? index,
      programName: item.programName.trim(),
      offeringName: item.offeringName.trim(),
      deliveryFormat: item.deliveryFormat ?? null,
      targetGrades: item.targetGrades ?? null,
      recommendedLevel: item.recommendedLevel ?? null,
      duration: item.duration ?? null,
      durationUnit: item.durationUnit ?? null,
      numberOfSessions: item.numberOfSessions ?? null,
      sessionDurationMinutes: item.sessionDurationMinutes ?? null,
      sessionFrequency: item.sessionFrequency ?? null,
      deliveryMode: item.deliveryMode ?? null,
      groupSizeMin: item.groupSizeMin ?? null,
      groupSizeMax: item.groupSizeMax ?? null,
      numberOfGroups: item.numberOfGroups ?? null,
      shortDescription: item.shortDescription?.trim() ?? '',
      curriculumJson: jsonIn(item.curriculumJson),
      activitiesJson: jsonIn(item.activitiesJson),
      projectsJson: jsonIn(item.projectsJson),
      assessmentJson: jsonIn(item.assessmentJson),
      requirementsJson: jsonIn(item.requirementsJson),
      outcomesJson: jsonIn(item.outcomesJson),
      objectivesJson: jsonIn(item.objectivesJson),
    }));
  }

  private mapScopeItems(items: CreateSowDto['scopeItems']) {
    return (items ?? []).map((item, index) => ({
      kind: item.kind,
      text: item.text.trim(),
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapDeliverables(items: CreateSowDto['deliverables']) {
    return (items ?? []).map((item, index) => ({
      name: item.name.trim(),
      description: item.description?.trim() ?? '',
      owner: item.owner?.trim() ?? '',
      dueDate: date(item.dueDate),
      acceptanceCriteria: item.acceptanceCriteria?.trim() ?? '',
      ...(item.status ? { status: item.status } : {}),
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapMilestones(items: CreateSowDto['milestones']) {
    return (items ?? []).map((item, index) => ({
      name: item.name.trim(),
      description: item.description?.trim() ?? '',
      startDate: date(item.startDate),
      endDate: date(item.endDate),
      owner: item.owner?.trim() ?? '',
      ...(item.status ? { status: item.status } : {}),
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapResponsibilities(items: CreateSowDto['responsibilities']) {
    return (items ?? []).map((item, index) => ({
      activity: item.activity.trim(),
      rootacaRole: item.rootacaRole?.trim() ?? '',
      schoolRole: item.schoolRole?.trim() ?? '',
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapTeamMembers(items: CreateSowDto['teamMembers']) {
    return (items ?? []).map((item, index) => ({
      party: item.party,
      role: item.role.trim(),
      name: item.name?.trim() ?? '',
      responsibility: item.responsibility?.trim() ?? '',
      contact: item.contact?.trim() ?? '',
      assignedUserId: item.assignedUserId ?? null,
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private mapAssessmentItems(items: CreateSowDto['assessmentItems']) {
    return (items ?? []).map((item, index) => ({
      name: item.name.trim(),
      responsibleParty: item.responsibleParty?.trim() ?? '',
      frequency: item.frequency?.trim() ?? '',
      format: item.format?.trim() ?? '',
      dueDate: date(item.dueDate),
      sortOrder: item.sortOrder ?? index,
    }));
  }

  private toResponse(row: SowRow): SowResponseDto {
    const primary = row.institution.contacts?.[0] ?? null;
    return {
      id: row.id,
      sowNumber: row.sowNumber,
      title: row.title,
      institutionId: row.institutionId,
      institutionName: row.institution.name,
      proposalId: row.proposalId,
      proposalNumber: row.proposal?.proposalNumber ?? null,
      status: row.status,
      sowDate: row.sowDate.toISOString(),
      startDate: iso(row.startDate),
      endDate: iso(row.endDate),
      currencySnapshot: row.currencySnapshot,
      agreedValueSnapshot: num(row.agreedValueSnapshot),
      version: row.version,
      isLocked: row.isLocked,
      offeringCount: row.scopeOfferings.length,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      effectiveDate: iso(row.effectiveDate),
      preparedBy: row.preparedBy,
      approvedBy: row.approvedBy,
      purpose: row.purpose,
      targetStudents: row.targetStudents,
      deliveryModelNotes: row.deliveryModelNotes,
      activitiesNotes: row.activitiesNotes,
      projectsNotes: row.projectsNotes,
      assessmentNotes: row.assessmentNotes,
      reportingNotes: row.reportingNotes,
      clientName: row.clientName,
      clientAddress: row.clientAddress,
      primaryContactName: row.primaryContactName,
      primaryContactEmail: row.primaryContactEmail,
      primaryContactPhone: row.primaryContactPhone,
      attendanceExpectations: row.attendanceExpectations,
      minimumParticipation: row.minimumParticipation,
      studentReplacementRules: row.studentReplacementRules,
      makeupSessionRules: row.makeupSessionRules,
      equipmentRequirements: row.equipmentRequirements,
      internetRequirements: row.internetRequirements,
      classroomLabRequirements: row.classroomLabRequirements,
      studentDevicesRequirements: row.studentDevicesRequirements,
      softwareRequirements: row.softwareRequirements,
      accountsAccessRequirements: row.accountsAccessRequirements,
      facultyLiaisonRequirements: row.facultyLiaisonRequirements,
      termsAndConditions: row.termsAndConditions,
      proposalNumberSnapshot: row.proposalNumberSnapshot,
      paymentTermsSnapshot: row.paymentTermsSnapshot,
      rootacaSignatoryName: row.rootacaSignatoryName,
      rootacaSignatoryTitle: row.rootacaSignatoryTitle,
      rootacaSignedAt: iso(row.rootacaSignedAt),
      rootacaSignatureImage: row.rootacaSignatureImage,
      schoolSignatoryName: row.schoolSignatoryName,
      schoolSignatoryTitle: row.schoolSignatoryTitle,
      schoolSignedAt: iso(row.schoolSignedAt),
      schoolSignatureImage: row.schoolSignatureImage,
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
      proposal: {
        id: row.proposal.id,
        proposalNumber: row.proposal.proposalNumber,
        title: row.proposal.title,
        status: row.proposal.status,
      },
      scopeOfferings: row.scopeOfferings.map((line) => ({
        id: line.id,
        offeringId: line.offeringId,
        sortOrder: line.sortOrder,
        programName: line.programName,
        offeringName: line.offeringName,
        deliveryFormat: line.deliveryFormat,
        targetGrades: line.targetGrades,
        recommendedLevel: line.recommendedLevel,
        duration: line.duration,
        durationUnit: line.durationUnit,
        numberOfSessions: line.numberOfSessions,
        sessionDurationMinutes: line.sessionDurationMinutes,
        sessionFrequency: line.sessionFrequency,
        deliveryMode: line.deliveryMode,
        groupSizeMin: line.groupSizeMin,
        groupSizeMax: line.groupSizeMax,
        numberOfGroups: line.numberOfGroups,
        shortDescription: line.shortDescription,
        curriculumJson: line.curriculumJson,
        activitiesJson: line.activitiesJson,
        projectsJson: line.projectsJson,
        assessmentJson: line.assessmentJson,
        requirementsJson: line.requirementsJson,
        outcomesJson: line.outcomesJson,
        objectivesJson: line.objectivesJson,
      })),
      scopeItems: row.scopeItems.map((item) => ({
        id: item.id,
        kind: item.kind,
        text: item.text,
        sortOrder: item.sortOrder,
      })),
      deliverables: row.deliverables.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        owner: item.owner,
        dueDate: iso(item.dueDate),
        acceptanceCriteria: item.acceptanceCriteria,
        status: item.status,
        sortOrder: item.sortOrder,
      })),
      milestones: row.milestones.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        startDate: iso(item.startDate),
        endDate: iso(item.endDate),
        owner: item.owner,
        status: item.status,
        sortOrder: item.sortOrder,
      })),
      responsibilities: row.responsibilities.map((item) => ({
        id: item.id,
        activity: item.activity,
        rootacaRole: item.rootacaRole,
        schoolRole: item.schoolRole,
        sortOrder: item.sortOrder,
      })),
      teamMembers: row.teamMembers.map((item) => ({
        id: item.id,
        party: item.party,
        role: item.role,
        name: item.name,
        responsibility: item.responsibility,
        contact: item.contact,
        assignedUserId: item.assignedUserId,
        sortOrder: item.sortOrder,
      })),
      assessmentItems: row.assessmentItems.map((item) => ({
        id: item.id,
        name: item.name,
        responsibleParty: item.responsibleParty,
        frequency: item.frequency,
        format: item.format,
        dueDate: iso(item.dueDate),
        sortOrder: item.sortOrder,
      })),
      changeRequests: row.changeRequests.map((item) => ({
        id: item.id,
        changeRequestNumber: item.changeRequestNumber,
        requestedBy: item.requestedBy,
        requestDate: item.requestDate.toISOString(),
        description: item.description,
        impact: item.impact,
        approvalStatus: item.approvalStatus,
        approvedBy: item.approvedBy,
        decisionDate: iso(item.decisionDate),
        changeSummary: item.changeSummary,
        resultingVersion: item.resultingVersion,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      versions: row.versions.map((item) => ({
        id: item.id,
        version: item.version,
        changeSummary: item.changeSummary,
        createdById: item.createdById,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
