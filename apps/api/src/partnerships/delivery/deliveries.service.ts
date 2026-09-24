import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipDeliveryDeliverableStatus,
  PartnershipDeliveryMilestoneStatus,
  PartnershipDeliveryPhaseStatus,
  PartnershipDeliverySessionStatus,
  PartnershipDeliveryStatus,
  PartnershipDeliveryTaskStatus,
  PartnershipSowParty,
  PartnershipSowStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import {
  buildCompletionChecklist,
  computeDeliveryProgress,
} from './delivery-progress';
import {
  ChangeDeliveryStatusDto,
  CreateDeliveryFromSowDto,
  DeliveryResponseDto,
  DeliveryUserOptionDto,
  PaginatedDeliveriesDto,
  QueryDeliveriesDto,
  UpdateDeliveryDto,
} from './dto/delivery.dto';

// -----------------------------------------------------------------------------
// Prisma include for a fully-hydrated delivery aggregate.
// -----------------------------------------------------------------------------

const deliveryInclude = {
  institution: {
    select: {
      id: true,
      name: true,
      arabicName: true,
      englishName: true,
      governorate: true,
      city: true,
    },
  },
  sow: { select: { id: true, sowNumber: true, title: true, status: true } },
  phases: { orderBy: { sortOrder: 'asc' as const } },
  milestones: { orderBy: { sortOrder: 'asc' as const } },
  tasks: { orderBy: { sortOrder: 'asc' as const } },
  sessions: {
    orderBy: { sessionNumber: 'asc' as const },
    include: { attendances: { orderBy: { studentId: 'asc' as const } } },
  },
  groups: {
    orderBy: { sortOrder: 'asc' as const },
    include: { students: { orderBy: { joinedAt: 'asc' as const } } },
  },
  teamMembers: { orderBy: { sortOrder: 'asc' as const } },
  deliverables: {
    orderBy: { sortOrder: 'asc' as const },
    include: { submissions: { orderBy: { submittedAt: 'asc' as const } } },
  },
  issues: { orderBy: { createdAt: 'desc' as const } },
  raidItems: { orderBy: [{ type: 'asc' as const }, { sortOrder: 'asc' as const }] },
  communications: { orderBy: { occurredAt: 'desc' as const } },
  checkpoints: { orderBy: { sortOrder: 'asc' as const } },
  reports: { orderBy: { createdAt: 'desc' as const } },
  documents: { orderBy: { uploadedAt: 'desc' as const } },
  activityLogs: { orderBy: { createdAt: 'desc' as const }, take: 50 },
} satisfies Prisma.PartnershipDeliveryInclude;

type DeliveryRow = Prisma.PartnershipDeliveryGetPayload<{
  include: typeof deliveryInclude;
}>;

const ALLOWED_TRANSITIONS: Record<
  PartnershipDeliveryStatus,
  PartnershipDeliveryStatus[]
> = {
  PREPARING: [PartnershipDeliveryStatus.ACTIVE, PartnershipDeliveryStatus.CANCELLED],
  ACTIVE: [
    PartnershipDeliveryStatus.PAUSED,
    PartnershipDeliveryStatus.COMPLETED,
    PartnershipDeliveryStatus.CANCELLED,
  ],
  PAUSED: [PartnershipDeliveryStatus.ACTIVE, PartnershipDeliveryStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function date(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function isUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_RE.test(value);
}

function ratio(completed: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((completed / total) * 1000) / 10;
}

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Create — always derived from an ACTIVE SOW. Snapshots scope, never mutates.
  // ---------------------------------------------------------------------------

  async createFromSow(
    dto: CreateDeliveryFromSowDto,
    actorId: string,
  ): Promise<DeliveryResponseDto> {
    const sow = await this.prisma.partnershipSow.findUnique({
      where: { id: dto.sowId },
      include: {
        institution: { select: { id: true } },
        proposal: { select: { id: true, proposalNumber: true } },
        milestones: { orderBy: { sortOrder: 'asc' } },
        deliverables: { orderBy: { sortOrder: 'asc' } },
        teamMembers: { orderBy: [{ party: 'asc' }, { sortOrder: 'asc' }] },
        scopeItems: { orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }] },
        scopeOfferings: { orderBy: { sortOrder: 'asc' } },
        responsibilities: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!sow) {
      throw new NotFoundException('SOW not found');
    }
    if (sow.status !== PartnershipSowStatus.ACTIVE) {
      throw new BadRequestException(
        'A delivery can only be created from an ACTIVE SOW',
      );
    }

    const deliveryNumber = await this.nextDeliveryNumber();

    // Phases are created 1:1 from SOW milestone names. Milestones link to them.
    const phaseSeeds = sow.milestones.map((m, index) => ({
      id: randomUUID(),
      name: m.name,
      description: m.description,
      startDate: m.startDate,
      endDate: m.endDate,
      owner: m.owner,
      sortOrder: m.sortOrder ?? index,
    }));

    const milestoneSeeds = sow.milestones.map((m, index) => ({
      phaseId: phaseSeeds[index]?.id ?? null,
      sourceSowMilestoneId: m.id,
      name: m.name,
      description: m.description,
      startDate: m.startDate,
      endDate: m.endDate,
      owner: m.owner,
      sortOrder: m.sortOrder ?? index,
    }));

    const deliverableSeeds = sow.deliverables.map((d, index) => ({
      sourceSowDeliverableId: d.id,
      name: d.name,
      description: d.description,
      owner: d.owner,
      dueDate: d.dueDate,
      acceptanceCriteria: d.acceptanceCriteria,
      sortOrder: d.sortOrder ?? index,
    }));

    const teamSeeds = sow.teamMembers
      .filter((t) => t.party === PartnershipSowParty.ROOTACA)
      .map((t, index) => ({
        userId: t.assignedUserId ?? null,
        role: t.role,
        name: t.name,
        responsibilities: t.responsibility,
        sortOrder: t.sortOrder ?? index,
      }));

    const scopeSnapshot: Prisma.InputJsonValue = {
      scopeItems: sow.scopeItems.map((item) => ({
        kind: item.kind,
        text: item.text,
        sortOrder: item.sortOrder,
      })),
      scopeOfferings: sow.scopeOfferings.map((line) => ({
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
        sortOrder: line.sortOrder,
      })),
    };

    const responsibilitiesSnapshot: Prisma.InputJsonValue = sow.responsibilities.map(
      (item) => ({
        activity: item.activity,
        rootacaRole: item.rootacaRole,
        schoolRole: item.schoolRole,
        sortOrder: item.sortOrder,
      }),
    );

    const requirementsSnapshot: Prisma.InputJsonValue = {
      equipmentRequirements: sow.equipmentRequirements,
      internetRequirements: sow.internetRequirements,
      classroomLabRequirements: sow.classroomLabRequirements,
      studentDevicesRequirements: sow.studentDevicesRequirements,
      softwareRequirements: sow.softwareRequirements,
      accountsAccessRequirements: sow.accountsAccessRequirements,
      facultyLiaisonRequirements: sow.facultyLiaisonRequirements,
    };

    const created = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.partnershipDelivery.create({
        data: {
          deliveryNumber,
          name: sow.title,
          institution: { connect: { id: sow.institutionId } },
          sow: { connect: { id: sow.id } },
          proposal: { connect: { id: sow.proposalId } },
          status: PartnershipDeliveryStatus.PREPARING,
          startDate: sow.startDate,
          endDate: sow.endDate,
          sowNumberSnapshot: sow.sowNumber,
          proposalNumberSnapshot:
            sow.proposalNumberSnapshot || sow.proposal.proposalNumber,
          scopeSnapshot,
          responsibilitiesSnapshot,
          requirementsSnapshot,
          phases: { create: phaseSeeds },
          deliverables: { create: deliverableSeeds },
          teamMembers: { create: teamSeeds },
        },
      });

      if (milestoneSeeds.length) {
        await tx.partnershipDeliveryMilestone.createMany({
          data: milestoneSeeds.map((m) => ({
            deliveryId: delivery.id,
            phaseId: m.phaseId,
            sourceSowMilestoneId: m.sourceSowMilestoneId,
            name: m.name,
            description: m.description,
            startDate: m.startDate,
            endDate: m.endDate,
            owner: m.owner,
            sortOrder: m.sortOrder,
          })),
        });
      }

      await this.logActivity(tx, delivery.id, 'CREATED', 'Delivery created from SOW', actorId, {
        sowId: sow.id,
        sowNumber: sow.sowNumber,
      });

      return this.requireDelivery(delivery.id, tx);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.DELIVERY,
      entityId: created.id,
      action: PartnershipAuditAction.DELIVERY_CREATED,
      performedById: actorId,
      metadata: { sowId: sow.id },
    });

    return this.toResponse(created);
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  async findAll(query: QueryDeliveriesDto): Promise<PaginatedDeliveriesDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.partnershipDelivery.count({ where }),
      this.prisma.partnershipDelivery.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          institution: { select: { name: true } },
          sow: { select: { sowNumber: true } },
          milestones: { select: { status: true } },
          sessions: { select: { status: true } },
          _count: { select: { groups: true } },
        },
      }),
    ]);

    return {
      items: rows.map((row) => {
        const sessionsTotal = row.sessions.length;
        const sessionsCompleted = row.sessions.filter(
          (s) => s.status === PartnershipDeliverySessionStatus.COMPLETED,
        ).length;
        const milestonesTotal = row.milestones.length;
        const milestonesCompleted = row.milestones.filter(
          (m) => m.status === PartnershipDeliveryMilestoneStatus.COMPLETED,
        ).length;
        const progress = computeDeliveryProgress({
          phasesTotal: 0,
          phasesCompleted: 0,
          milestonesTotal,
          milestonesCompleted,
          tasksTotal: 0,
          tasksCompleted: 0,
          sessionsTotal,
          sessionsCompleted,
          deliverablesTotal: 0,
          deliverablesAccepted: 0,
        });
        return {
          id: row.id,
          deliveryNumber: row.deliveryNumber,
          name: row.name,
          institutionId: row.institutionId,
          institutionName: row.institution.name,
          sowId: row.sowId,
          sowNumber: row.sow?.sowNumber ?? null,
          status: row.status,
          startDate: iso(row.startDate),
          endDate: iso(row.endDate),
          overallPercent: progress.overallPercent ?? 0,
          sessionsCompleted,
          sessionsTotal,
          groupsCount: row._count.groups,
          archivedAt: iso(row.archivedAt),
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      }),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findOne(id: string): Promise<DeliveryResponseDto> {
    return this.toResponse(await this.requireDelivery(id));
  }

  // ---------------------------------------------------------------------------
  // Update — bulk-replace plan children (SOW-style deleteMany + create).
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    dto: UpdateDeliveryDto,
    actorId: string,
  ): Promise<DeliveryResponseDto> {
    // Ensure the delivery exists before mutating any children.
    await this.requireDelivery(id);

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.partnershipDelivery.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.startDate !== undefined ? { startDate: date(dto.startDate) } : {}),
          ...(dto.endDate !== undefined ? { endDate: date(dto.endDate) } : {}),
          ...(dto.finalReportRequired !== undefined
            ? { finalReportRequired: dto.finalReportRequired }
            : {}),
        },
      });

      // Resolve client-side refs (index or existing id) → new persisted ids.
      const phaseIdByRef = new Map<string, string>();
      if (dto.phases !== undefined) {
        // Children first so SetNull FKs do not dangle before re-create.
        await tx.partnershipDeliveryTask.deleteMany({ where: { deliveryId: id } });
        await tx.partnershipDeliveryMilestone.deleteMany({ where: { deliveryId: id } });
        await tx.partnershipDeliveryPhase.deleteMany({ where: { deliveryId: id } });

        const phaseData = dto.phases.map((phase, index) => {
          const newId = randomUUID();
          phaseIdByRef.set(String(index), newId);
          if (phase.id) {
            phaseIdByRef.set(phase.id, newId);
          }
          return {
            id: newId,
            deliveryId: id,
            name: phase.name.trim(),
            description: phase.description?.trim() ?? '',
            startDate: date(phase.startDate),
            endDate: date(phase.endDate),
            owner: phase.owner?.trim() ?? '',
            ...(phase.status ? { status: phase.status } : {}),
            sortOrder: phase.sortOrder ?? index,
          };
        });
        if (phaseData.length) {
          await tx.partnershipDeliveryPhase.createMany({ data: phaseData });
        }
      }

      const milestoneIdByRef = new Map<string, string>();
      if (dto.milestones !== undefined) {
        if (dto.phases === undefined) {
          await tx.partnershipDeliveryTask.deleteMany({ where: { deliveryId: id } });
        }
        await tx.partnershipDeliveryMilestone.deleteMany({ where: { deliveryId: id } });

        const milestoneData = dto.milestones.map((milestone, index) => {
          const newId = randomUUID();
          milestoneIdByRef.set(String(index), newId);
          if (milestone.id) {
            milestoneIdByRef.set(milestone.id, newId);
          }
          return {
            id: newId,
            deliveryId: id,
            phaseId: this.resolveRef(milestone.phaseRef, phaseIdByRef),
            name: milestone.name.trim(),
            description: milestone.description?.trim() ?? '',
            startDate: date(milestone.startDate),
            endDate: date(milestone.endDate),
            owner: milestone.owner?.trim() ?? '',
            ...(milestone.status ? { status: milestone.status } : {}),
            ...(milestone.requiredForCompletion !== undefined
              ? { requiredForCompletion: milestone.requiredForCompletion }
              : {}),
            sortOrder: milestone.sortOrder ?? index,
          };
        });
        if (milestoneData.length) {
          await tx.partnershipDeliveryMilestone.createMany({ data: milestoneData });
        }
      }

      if (dto.tasks !== undefined) {
        await tx.partnershipDeliveryTask.deleteMany({ where: { deliveryId: id } });
        const taskData = dto.tasks.map((task, index) => ({
          deliveryId: id,
          phaseId: this.resolveRef(task.phaseRef, phaseIdByRef),
          milestoneId: this.resolveRef(task.milestoneRef, milestoneIdByRef),
          title: task.title.trim(),
          description: task.description?.trim() ?? '',
          owner: task.owner?.trim() ?? '',
          assigneeId: task.assigneeId ?? null,
          ...(task.priority ? { priority: task.priority } : {}),
          startDate: date(task.startDate),
          dueDate: date(task.dueDate),
          ...(task.status ? { status: task.status } : {}),
          sortOrder: task.sortOrder ?? index,
        }));
        if (taskData.length) {
          await tx.partnershipDeliveryTask.createMany({ data: taskData });
        }
      }

      if (dto.teamMembers !== undefined) {
        await tx.partnershipDeliveryTeamMember.deleteMany({ where: { deliveryId: id } });
        const teamData = dto.teamMembers.map((member, index) => ({
          deliveryId: id,
          userId: member.userId ?? null,
          role: member.role.trim(),
          name: member.name?.trim() ?? '',
          responsibilities: member.responsibilities?.trim() ?? '',
          availability: member.availability?.trim() ?? '',
          sortOrder: member.sortOrder ?? index,
        }));
        if (teamData.length) {
          await tx.partnershipDeliveryTeamMember.createMany({ data: teamData });
        }
      }

      if (dto.deliverables !== undefined) {
        await tx.partnershipDeliveryDeliverable.deleteMany({ where: { deliveryId: id } });
        const deliverableData = dto.deliverables.map((deliverable, index) => ({
          deliveryId: id,
          name: deliverable.name.trim(),
          description: deliverable.description?.trim() ?? '',
          owner: deliverable.owner?.trim() ?? '',
          dueDate: date(deliverable.dueDate),
          acceptanceCriteria: deliverable.acceptanceCriteria?.trim() ?? '',
          ...(deliverable.status ? { status: deliverable.status } : {}),
          ...(deliverable.requiredForCompletion !== undefined
            ? { requiredForCompletion: deliverable.requiredForCompletion }
            : {}),
          sortOrder: deliverable.sortOrder ?? index,
        }));
        if (deliverableData.length) {
          await tx.partnershipDeliveryDeliverable.createMany({ data: deliverableData });
        }
      }

      if (dto.issues !== undefined) {
        await tx.partnershipDeliveryIssue.deleteMany({ where: { deliveryId: id } });
        const issueData = dto.issues.map((issue) => ({
          deliveryId: id,
          title: issue.title.trim(),
          description: issue.description?.trim() ?? '',
          category: issue.category?.trim() ?? '',
          ...(issue.severity ? { severity: issue.severity } : {}),
          owner: issue.owner?.trim() ?? '',
          dueDate: date(issue.dueDate),
          ...(issue.status ? { status: issue.status } : {}),
          resolution: issue.resolution?.trim() ?? '',
        }));
        if (issueData.length) {
          await tx.partnershipDeliveryIssue.createMany({ data: issueData });
        }
      }

      if (dto.raidItems !== undefined) {
        await tx.partnershipDeliveryRaidItem.deleteMany({ where: { deliveryId: id } });
        const raidData = dto.raidItems.map((item, index) => ({
          deliveryId: id,
          type: item.type,
          title: item.title.trim(),
          description: item.description?.trim() ?? '',
          owner: item.owner?.trim() ?? '',
          impact: item.impact?.trim() ?? '',
          probability: item.probability?.trim() ?? '',
          mitigation: item.mitigation?.trim() ?? '',
          dueDate: date(item.dueDate),
          ...(item.status ? { status: item.status } : {}),
          sortOrder: item.sortOrder ?? index,
        }));
        if (raidData.length) {
          await tx.partnershipDeliveryRaidItem.createMany({ data: raidData });
        }
      }

      if (dto.communications !== undefined) {
        await tx.partnershipDeliveryCommunication.deleteMany({ where: { deliveryId: id } });
        const commData = dto.communications.map((comm) => ({
          deliveryId: id,
          type: comm.type,
          ...(comm.occurredAt ? { occurredAt: new Date(comm.occurredAt) } : {}),
          participants: comm.participants?.trim() ?? '',
          subject: comm.subject?.trim() ?? '',
          summary: comm.summary?.trim() ?? '',
          actionItems: comm.actionItems?.trim() ?? '',
          owner: comm.owner?.trim() ?? '',
          followUpDate: date(comm.followUpDate),
        }));
        if (commData.length) {
          await tx.partnershipDeliveryCommunication.createMany({ data: commData });
        }
      }

      if (dto.checkpoints !== undefined) {
        await tx.partnershipDeliveryCheckpoint.deleteMany({ where: { deliveryId: id } });
        const checkpointData = dto.checkpoints.map((checkpoint, index) => ({
          deliveryId: id,
          ...(checkpoint.kind ? { kind: checkpoint.kind } : {}),
          name: checkpoint.name.trim(),
          checkpointDate: date(checkpoint.checkpointDate),
          participants: checkpoint.participants?.trim() ?? '',
          discussion: checkpoint.discussion?.trim() ?? '',
          decisions: checkpoint.decisions?.trim() ?? '',
          actionItems: checkpoint.actionItems?.trim() ?? '',
          ...(checkpoint.status ? { status: checkpoint.status } : {}),
          sortOrder: checkpoint.sortOrder ?? index,
        }));
        if (checkpointData.length) {
          await tx.partnershipDeliveryCheckpoint.createMany({ data: checkpointData });
        }
      }

      if (dto.documents !== undefined) {
        await tx.partnershipDeliveryDocument.deleteMany({ where: { deliveryId: id } });
        const documentData = dto.documents.map((document) => ({
          deliveryId: id,
          name: document.name.trim(),
          ...(document.type ? { type: document.type } : {}),
          version: document.version?.trim() || '1',
          uploadedBy: document.uploadedBy?.trim() ?? '',
          fileUrl: document.fileUrl?.trim() ?? '',
          notes: document.notes?.trim() ?? '',
        }));
        if (documentData.length) {
          await tx.partnershipDeliveryDocument.createMany({ data: documentData });
        }
      }

      await this.logActivity(tx, id, 'UPDATED', 'Delivery plan updated', actorId);

      return this.requireDelivery(id, tx);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.DELIVERY,
      entityId: id,
      action: PartnershipAuditAction.DELIVERY_UPDATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  // ---------------------------------------------------------------------------
  // Status change — completion gate enforced when moving to COMPLETED.
  // ---------------------------------------------------------------------------

  async changeStatus(
    id: string,
    dto: ChangeDeliveryStatusDto,
    actorId: string,
  ): Promise<DeliveryResponseDto> {
    const existing = await this.requireDelivery(id);
    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${existing.status} to ${dto.status}`,
      );
    }

    if (dto.status === PartnershipDeliveryStatus.COMPLETED) {
      const checklist = this.buildChecklist(existing);
      if (!checklist.canComplete) {
        throw new BadRequestException(
          'Delivery cannot be completed: required milestones, deliverables, sessions or final report are not satisfied',
        );
      }
    }

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.partnershipDelivery.update({
        where: { id },
        data: { status: dto.status },
      });
      await this.logActivity(
        tx,
        id,
        'STATUS_CHANGED',
        `Status changed from ${existing.status} to ${dto.status}`,
        actorId,
        { from: existing.status, to: dto.status },
      );
      return this.requireDelivery(id, tx);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.DELIVERY,
      entityId: id,
      action:
        dto.status === PartnershipDeliveryStatus.COMPLETED
          ? PartnershipAuditAction.DELIVERY_COMPLETED
          : PartnershipAuditAction.DELIVERY_STATUS_CHANGED,
      performedById: actorId,
      metadata: { from: existing.status, to: dto.status },
    });
    return this.toResponse(row);
  }

  // ---------------------------------------------------------------------------
  // Archive
  // ---------------------------------------------------------------------------

  async archive(id: string, actorId: string): Promise<DeliveryResponseDto> {
    const existing = await this.requireDelivery(id);
    if (existing.archivedAt) {
      return this.toResponse(existing);
    }
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.partnershipDelivery.update({
        where: { id },
        data: { archivedAt: new Date() },
      });
      await this.logActivity(tx, id, 'ARCHIVED', 'Delivery archived', actorId);
      return this.requireDelivery(id, tx);
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.DELIVERY,
      entityId: id,
      action: PartnershipAuditAction.DELIVERY_ARCHIVED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  // ---------------------------------------------------------------------------
  // Duplicate — copies the plan structure, not execution records.
  // ---------------------------------------------------------------------------

  async duplicate(id: string, actorId: string): Promise<DeliveryResponseDto> {
    const source = await this.requireDelivery(id);
    const deliveryNumber = await this.nextDeliveryNumber();

    // Preserve phase → milestone → task links via fresh ids.
    const phaseIdMap = new Map<string, string>();
    const phaseData = source.phases.map((phase) => {
      const newId = randomUUID();
      phaseIdMap.set(phase.id, newId);
      return {
        id: newId,
        name: phase.name,
        description: phase.description,
        startDate: phase.startDate,
        endDate: phase.endDate,
        owner: phase.owner,
        status: phase.status,
        sortOrder: phase.sortOrder,
      };
    });

    const milestoneIdMap = new Map<string, string>();
    const milestoneData = source.milestones.map((milestone) => {
      const newId = randomUUID();
      milestoneIdMap.set(milestone.id, newId);
      return {
        id: newId,
        phaseId: milestone.phaseId ? phaseIdMap.get(milestone.phaseId) ?? null : null,
        sourceSowMilestoneId: milestone.sourceSowMilestoneId,
        name: milestone.name,
        description: milestone.description,
        startDate: milestone.startDate,
        endDate: milestone.endDate,
        owner: milestone.owner,
        status: milestone.status,
        requiredForCompletion: milestone.requiredForCompletion,
        sortOrder: milestone.sortOrder,
      };
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.partnershipDelivery.create({
        data: {
          deliveryNumber,
          name: `${source.name} (Copy)`,
          institution: { connect: { id: source.institutionId } },
          sow: { connect: { id: source.sowId } },
          proposal: { connect: { id: source.proposalId } },
          status: PartnershipDeliveryStatus.PREPARING,
          startDate: source.startDate,
          endDate: source.endDate,
          sowNumberSnapshot: source.sowNumberSnapshot,
          proposalNumberSnapshot: source.proposalNumberSnapshot,
          scopeSnapshot: (source.scopeSnapshot ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          responsibilitiesSnapshot: (source.responsibilitiesSnapshot ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          requirementsSnapshot: (source.requirementsSnapshot ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          finalReportRequired: source.finalReportRequired,
          phases: { create: phaseData },
          teamMembers: {
            create: source.teamMembers.map((member) => ({
              userId: member.userId,
              role: member.role,
              name: member.name,
              responsibilities: member.responsibilities,
              availability: member.availability,
              sortOrder: member.sortOrder,
            })),
          },
          deliverables: {
            create: source.deliverables.map((deliverable) => ({
              sourceSowDeliverableId: deliverable.sourceSowDeliverableId,
              name: deliverable.name,
              description: deliverable.description,
              owner: deliverable.owner,
              dueDate: deliverable.dueDate,
              acceptanceCriteria: deliverable.acceptanceCriteria,
              requiredForCompletion: deliverable.requiredForCompletion,
              sortOrder: deliverable.sortOrder,
            })),
          },
          raidItems: {
            create: source.raidItems.map((item) => ({
              type: item.type,
              title: item.title,
              description: item.description,
              owner: item.owner,
              impact: item.impact,
              probability: item.probability,
              mitigation: item.mitigation,
              dueDate: item.dueDate,
              status: item.status,
              sortOrder: item.sortOrder,
            })),
          },
          checkpoints: {
            create: source.checkpoints.map((checkpoint) => ({
              kind: checkpoint.kind,
              name: checkpoint.name,
              checkpointDate: checkpoint.checkpointDate,
              participants: checkpoint.participants,
              discussion: checkpoint.discussion,
              decisions: checkpoint.decisions,
              actionItems: checkpoint.actionItems,
              status: checkpoint.status,
              sortOrder: checkpoint.sortOrder,
            })),
          },
        },
      });

      if (milestoneData.length) {
        await tx.partnershipDeliveryMilestone.createMany({
          data: milestoneData.map((m) => ({ ...m, deliveryId: delivery.id })),
        });
      }

      if (source.tasks.length) {
        await tx.partnershipDeliveryTask.createMany({
          data: source.tasks.map((task) => ({
            deliveryId: delivery.id,
            phaseId: task.phaseId ? phaseIdMap.get(task.phaseId) ?? null : null,
            milestoneId: task.milestoneId
              ? milestoneIdMap.get(task.milestoneId) ?? null
              : null,
            title: task.title,
            description: task.description,
            owner: task.owner,
            assigneeId: task.assigneeId,
            priority: task.priority,
            startDate: task.startDate,
            dueDate: task.dueDate,
            status: task.status,
            sortOrder: task.sortOrder,
          })),
        });
      }

      await this.logActivity(tx, delivery.id, 'CREATED', 'Delivery duplicated', actorId, {
        sourceId: id,
      });

      return this.requireDelivery(delivery.id, tx);
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.DELIVERY,
      entityId: created.id,
      action: PartnershipAuditAction.DELIVERY_CREATED,
      performedById: actorId,
      metadata: { sourceId: id },
    });
    return this.toResponse(created);
  }

  // ---------------------------------------------------------------------------
  // Users lookup for assignment dropdowns.
  // ---------------------------------------------------------------------------

  async listUsers(): Promise<DeliveryUserOptionDto[]> {
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

  private resolveRef(
    ref: string | null | undefined,
    map: Map<string, string>,
  ): string | null {
    if (ref === null || ref === undefined || ref === '') {
      return null;
    }
    const mapped = map.get(ref);
    if (mapped) {
      return mapped;
    }
    return isUuid(ref) ? ref : null;
  }

  private async requireDelivery(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DeliveryRow> {
    const client = tx ?? this.prisma;
    const row = await client.partnershipDelivery.findUnique({
      where: { id },
      include: deliveryInclude,
    });
    if (!row) {
      throw new NotFoundException('Delivery not found');
    }
    return row;
  }

  private async nextDeliveryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ROOTACA-DEL-${year}-`;
    const latest = await this.prisma.partnershipDelivery.findFirst({
      where: { deliveryNumber: { startsWith: prefix } },
      orderBy: { deliveryNumber: 'desc' },
      select: { deliveryNumber: true },
    });
    let seq = 1;
    if (latest?.deliveryNumber) {
      const parsed = Number.parseInt(latest.deliveryNumber.slice(prefix.length), 10);
      if (Number.isFinite(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  private async logActivity(
    tx: Prisma.TransactionClient,
    deliveryId: string,
    action: string,
    summary: string,
    actorId: string | null,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    await tx.partnershipDeliveryActivityLog.create({
      data: {
        deliveryId,
        action,
        summary,
        performedById: actorId,
        metadata: metadata ?? undefined,
      },
    });
  }

  private buildWhere(query: QueryDeliveriesDto): Prisma.PartnershipDeliveryWhereInput {
    const and: Prisma.PartnershipDeliveryWhereInput[] = [];
    const includeArchived =
      query.includeArchived === 'true' || query.includeArchived === '1';
    if (!includeArchived) {
      and.push({ archivedAt: null });
    }
    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { deliveryNumber: { contains: search, mode: 'insensitive' } },
          { institution: { name: { contains: search, mode: 'insensitive' } } },
          { sow: { sowNumber: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    if (query.institutionId) {
      and.push({ institutionId: query.institutionId });
    }
    if (query.sowId) {
      and.push({ sowId: query.sowId });
    }
    if (query.status) {
      and.push({ status: query.status });
    }
    if (query.instructorId) {
      and.push({
        OR: [
          { sessions: { some: { instructorId: query.instructorId } } },
          { groups: { some: { instructorId: query.instructorId } } },
        ],
      });
    }
    if (query.programName) {
      and.push({
        name: { contains: query.programName, mode: 'insensitive' },
      });
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
    return and.length ? { AND: and } : {};
  }

  private buildChecklist(row: DeliveryRow) {
    const hasFinalReport = row.reports.some(
      (report) => report.type === 'FINAL_PARTNERSHIP',
    );
    return buildCompletionChecklist({
      milestones: row.milestones.map((m) => ({
        requiredForCompletion: m.requiredForCompletion,
        status: m.status,
      })),
      deliverables: row.deliverables.map((d) => ({
        requiredForCompletion: d.requiredForCompletion,
        status: d.status,
      })),
      sessions: row.sessions.map((s) => ({ status: s.status })),
      finalReportRequired: row.finalReportRequired,
      hasFinalReport,
    });
  }

  private toResponse(row: DeliveryRow): DeliveryResponseDto {
    const phasesTotal = row.phases.length;
    const phasesCompleted = row.phases.filter(
      (p) => p.status === PartnershipDeliveryPhaseStatus.COMPLETED,
    ).length;
    const milestonesTotal = row.milestones.length;
    const milestonesCompleted = row.milestones.filter(
      (m) => m.status === PartnershipDeliveryMilestoneStatus.COMPLETED,
    ).length;
    const tasksTotal = row.tasks.length;
    const tasksCompleted = row.tasks.filter(
      (t) => t.status === PartnershipDeliveryTaskStatus.DONE,
    ).length;
    const sessionsTotal = row.sessions.length;
    const sessionsCompleted = row.sessions.filter(
      (s) => s.status === PartnershipDeliverySessionStatus.COMPLETED,
    ).length;
    const deliverablesTotal = row.deliverables.length;
    const deliverablesAccepted = row.deliverables.filter(
      (d) => d.status === PartnershipDeliveryDeliverableStatus.ACCEPTED,
    ).length;

    const progressResult = computeDeliveryProgress({
      phasesTotal,
      phasesCompleted,
      milestonesTotal,
      milestonesCompleted,
      tasksTotal,
      tasksCompleted,
      sessionsTotal,
      sessionsCompleted,
      deliverablesTotal,
      deliverablesAccepted,
    });

    const uniqueStudents = new Set<string>();
    for (const group of row.groups) {
      for (const student of group.students) {
        uniqueStudents.add(student.studentId);
      }
    }

    const checklist = this.buildChecklist(row);

    return {
      id: row.id,
      deliveryNumber: row.deliveryNumber,
      name: row.name,
      institutionId: row.institutionId,
      sowId: row.sowId,
      proposalId: row.proposalId,
      status: row.status,
      startDate: iso(row.startDate),
      endDate: iso(row.endDate),
      sowNumberSnapshot: row.sowNumberSnapshot,
      proposalNumberSnapshot: row.proposalNumberSnapshot,
      scopeSnapshot: row.scopeSnapshot,
      responsibilitiesSnapshot: row.responsibilitiesSnapshot,
      requirementsSnapshot: row.requirementsSnapshot,
      finalReportRequired: row.finalReportRequired,
      archivedAt: iso(row.archivedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      institution: {
        id: row.institution.id,
        name: row.institution.name,
        arabicName: row.institution.arabicName,
        englishName: row.institution.englishName,
        governorate: row.institution.governorate,
        city: row.institution.city,
      },
      sow: {
        id: row.sow.id,
        sowNumber: row.sow.sowNumber,
        title: row.sow.title,
        status: row.sow.status,
      },
      phases: row.phases.map((phase) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        startDate: iso(phase.startDate),
        endDate: iso(phase.endDate),
        owner: phase.owner,
        status: phase.status,
        sortOrder: phase.sortOrder,
      })),
      milestones: row.milestones.map((milestone) => ({
        id: milestone.id,
        phaseId: milestone.phaseId,
        sourceSowMilestoneId: milestone.sourceSowMilestoneId,
        name: milestone.name,
        description: milestone.description,
        startDate: iso(milestone.startDate),
        endDate: iso(milestone.endDate),
        owner: milestone.owner,
        status: milestone.status,
        requiredForCompletion: milestone.requiredForCompletion,
        sortOrder: milestone.sortOrder,
      })),
      tasks: row.tasks.map((task) => ({
        id: task.id,
        phaseId: task.phaseId,
        milestoneId: task.milestoneId,
        title: task.title,
        description: task.description,
        owner: task.owner,
        assigneeId: task.assigneeId,
        priority: task.priority,
        startDate: iso(task.startDate),
        dueDate: iso(task.dueDate),
        status: task.status,
        sortOrder: task.sortOrder,
      })),
      sessions: row.sessions.map((session) => ({
        id: session.id,
        groupId: session.groupId,
        sessionNumber: session.sessionNumber,
        sessionDate: iso(session.sessionDate),
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        instructorId: session.instructorId,
        instructorName: session.instructorName,
        topic: session.topic,
        status: session.status,
        learningObjectives: session.learningObjectives,
        activities: session.activities,
        projects: session.projects,
        homework: session.homework,
        instructorNotes: session.instructorNotes,
        sessionOutcome: session.sessionOutcome,
        issuesNotes: session.issuesNotes,
        nextSessionPrep: session.nextSessionPrep,
        attendances: session.attendances.map((attendance) => ({
          id: attendance.id,
          studentId: attendance.studentId,
          status: attendance.status,
          notes: attendance.notes,
        })),
      })),
      groups: row.groups.map((group) => ({
        id: group.id,
        name: group.name,
        grade: group.grade,
        level: group.level,
        instructorId: group.instructorId,
        schedule: group.schedule,
        status: group.status,
        sortOrder: group.sortOrder,
        students: group.students.map((student) => ({
          id: student.id,
          studentId: student.studentId,
          joinedAt: student.joinedAt.toISOString(),
        })),
      })),
      teamMembers: row.teamMembers.map((member) => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        name: member.name,
        responsibilities: member.responsibilities,
        availability: member.availability,
        sortOrder: member.sortOrder,
      })),
      deliverables: row.deliverables.map((deliverable) => ({
        id: deliverable.id,
        sourceSowDeliverableId: deliverable.sourceSowDeliverableId,
        name: deliverable.name,
        description: deliverable.description,
        owner: deliverable.owner,
        dueDate: iso(deliverable.dueDate),
        acceptanceCriteria: deliverable.acceptanceCriteria,
        status: deliverable.status,
        requiredForCompletion: deliverable.requiredForCompletion,
        rejectionReason: deliverable.rejectionReason,
        sortOrder: deliverable.sortOrder,
        submissions: deliverable.submissions.map((submission) => ({
          id: submission.id,
          description: submission.description,
          fileName: submission.fileName,
          fileUrl: submission.fileUrl,
          submittedBy: submission.submittedBy,
          submittedAt: submission.submittedAt.toISOString(),
          version: submission.version,
          status: submission.status,
          rejectionReason: submission.rejectionReason,
        })),
      })),
      issues: row.issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        severity: issue.severity,
        owner: issue.owner,
        dueDate: iso(issue.dueDate),
        status: issue.status,
        resolution: issue.resolution,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
      })),
      raidItems: row.raidItems.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        owner: item.owner,
        impact: item.impact,
        probability: item.probability,
        mitigation: item.mitigation,
        dueDate: iso(item.dueDate),
        status: item.status,
        sortOrder: item.sortOrder,
      })),
      communications: row.communications.map((comm) => ({
        id: comm.id,
        type: comm.type,
        occurredAt: comm.occurredAt.toISOString(),
        participants: comm.participants,
        subject: comm.subject,
        summary: comm.summary,
        actionItems: comm.actionItems,
        owner: comm.owner,
        followUpDate: iso(comm.followUpDate),
      })),
      checkpoints: row.checkpoints.map((checkpoint) => ({
        id: checkpoint.id,
        kind: checkpoint.kind,
        name: checkpoint.name,
        checkpointDate: iso(checkpoint.checkpointDate),
        participants: checkpoint.participants,
        discussion: checkpoint.discussion,
        decisions: checkpoint.decisions,
        actionItems: checkpoint.actionItems,
        status: checkpoint.status,
        sortOrder: checkpoint.sortOrder,
      })),
      reports: row.reports.map((report) => ({
        id: report.id,
        type: report.type,
        title: report.title,
        periodLabel: report.periodLabel,
        author: report.author,
        status: report.status,
        generatedAt: iso(report.generatedAt),
        fileName: report.fileName,
        fileUrl: report.fileUrl,
        contentSnapshot: report.contentSnapshot,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      })),
      documents: row.documents.map((document) => ({
        id: document.id,
        name: document.name,
        type: document.type,
        version: document.version,
        uploadedBy: document.uploadedBy,
        fileUrl: document.fileUrl,
        notes: document.notes,
        uploadedAt: document.uploadedAt.toISOString(),
      })),
      activityLogs: row.activityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        summary: log.summary,
        metadata: log.metadata,
        performedById: log.performedById,
        createdAt: log.createdAt.toISOString(),
      })),
      progress: {
        phaseProgress: {
          completed: phasesCompleted,
          total: phasesTotal,
          ratio: ratio(phasesCompleted, phasesTotal),
        },
        milestoneProgress: {
          completed: milestonesCompleted,
          total: milestonesTotal,
          ratio: ratio(milestonesCompleted, milestonesTotal),
        },
        taskProgress: {
          completed: tasksCompleted,
          total: tasksTotal,
          ratio: ratio(tasksCompleted, tasksTotal),
        },
        sessionProgress: {
          completed: sessionsCompleted,
          total: sessionsTotal,
          ratio: ratio(sessionsCompleted, sessionsTotal),
        },
        deliverableProgress: {
          completed: deliverablesAccepted,
          total: deliverablesTotal,
          ratio: ratio(deliverablesAccepted, deliverablesTotal),
        },
        overall: progressResult.overallPercent ?? 0,
        overallPercent: progressResult.overallPercent ?? 0,
        dimensionsCounted: progressResult.dimensionsUsed,
      },
      kpis: {
        sessionsCompleted,
        sessionsTotal,
        studentsUnique: uniqueStudents.size,
        groupsCount: row.groups.length,
        deliverablesAccepted,
        deliverablesTotal,
        milestonesCompleted,
        milestonesTotal,
      },
      completionChecklist: {
        items: [
          {
            key: 'milestones',
            label: 'Required milestones completed',
            required: checklist.details.milestonesRequired > 0,
            satisfied: checklist.requiredMilestonesCompleted,
            detail: `${checklist.details.milestonesCompleted}/${checklist.details.milestonesRequired}`,
          },
          {
            key: 'deliverables',
            label: 'Required deliverables accepted',
            required: checklist.details.deliverablesRequired > 0,
            satisfied: checklist.requiredDeliverablesAccepted,
            detail: `${checklist.details.deliverablesAccepted}/${checklist.details.deliverablesRequired}`,
          },
          {
            key: 'sessions',
            label: 'Scheduled sessions completed',
            required: checklist.details.sessionsRequired > 0,
            satisfied: checklist.requiredSessionsCompleted,
            detail: `${checklist.details.sessionsCompleted}/${checklist.details.sessionsRequired}`,
          },
          {
            key: 'finalReport',
            label: 'Final partnership report ready',
            required: checklist.details.finalReportRequired,
            satisfied: checklist.finalReportReady,
            detail: checklist.details.finalReportPresent ? 'Present' : 'Missing',
          },
        ],
        allRequiredSatisfied: checklist.canComplete,
      },
    };
  }
}
