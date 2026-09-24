import { randomUUID } from 'node:crypto';
import {
  PartnershipDeliveryStatus,
  PartnershipSowParty,
  PartnershipSowStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';

/**
 * Creates one PREPARING delivery per ACTIVE SOW that does not yet have a
 * delivery. Purely snapshots SOW scope + copies milestones/deliverables/team —
 * no invented sessions, groups, dates, or execution data. Never mutates the SOW.
 */
export async function seedPartnershipDeliveries(client: PrismaClient): Promise<void> {
  const sows = await client.partnershipSow.findMany({
    where: { status: PartnershipSowStatus.ACTIVE },
    orderBy: { createdAt: 'asc' },
    include: {
      proposal: { select: { id: true, proposalNumber: true } },
      milestones: { orderBy: { sortOrder: 'asc' } },
      deliverables: { orderBy: { sortOrder: 'asc' } },
      teamMembers: { orderBy: [{ party: 'asc' }, { sortOrder: 'asc' }] },
      scopeItems: { orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }] },
      scopeOfferings: { orderBy: { sortOrder: 'asc' } },
      responsibilities: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!sows.length) {
    return;
  }

  const year = new Date().getFullYear();
  let created = 0;

  for (const sow of sows) {
    const already = await client.partnershipDelivery.findFirst({
      where: { sowId: sow.id },
      select: { id: true },
    });
    if (already) {
      continue;
    }

    const prefix = `ROOTACA-DEL-${year}-`;
    const existingCount = await client.partnershipDelivery.count({
      where: { deliveryNumber: { startsWith: prefix } },
    });
    const deliveryNumber = `${prefix}${String(existingCount + 1).padStart(3, '0')}`;

    const phaseSeeds = sow.milestones.map((m, index) => ({
      id: randomUUID(),
      name: m.name,
      description: m.description,
      startDate: m.startDate,
      endDate: m.endDate,
      owner: m.owner,
      sortOrder: m.sortOrder ?? index,
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
        sortOrder: line.sortOrder,
      })),
    };

    const delivery = await client.partnershipDelivery.create({
      data: {
        deliveryNumber,
        name: sow.title,
        institutionId: sow.institutionId,
        sowId: sow.id,
        proposalId: sow.proposalId,
        status: PartnershipDeliveryStatus.PREPARING,
        startDate: sow.startDate,
        endDate: sow.endDate,
        sowNumberSnapshot: sow.sowNumber,
        proposalNumberSnapshot:
          sow.proposalNumberSnapshot || sow.proposal.proposalNumber,
        scopeSnapshot,
        responsibilitiesSnapshot: sow.responsibilities.map((item) => ({
          activity: item.activity,
          rootacaRole: item.rootacaRole,
          schoolRole: item.schoolRole,
          sortOrder: item.sortOrder,
        })) as unknown as Prisma.InputJsonValue,
        requirementsSnapshot: {
          equipmentRequirements: sow.equipmentRequirements,
          internetRequirements: sow.internetRequirements,
          classroomLabRequirements: sow.classroomLabRequirements,
          studentDevicesRequirements: sow.studentDevicesRequirements,
          softwareRequirements: sow.softwareRequirements,
          accountsAccessRequirements: sow.accountsAccessRequirements,
          facultyLiaisonRequirements: sow.facultyLiaisonRequirements,
        },
        phases: { create: phaseSeeds },
        deliverables: {
          create: sow.deliverables.map((d, index) => ({
            sourceSowDeliverableId: d.id,
            name: d.name,
            description: d.description,
            owner: d.owner,
            dueDate: d.dueDate,
            acceptanceCriteria: d.acceptanceCriteria,
            sortOrder: d.sortOrder ?? index,
          })),
        },
        teamMembers: {
          create: sow.teamMembers
            .filter((t) => t.party === PartnershipSowParty.ROOTACA)
            .map((t, index) => ({
              userId: t.assignedUserId ?? null,
              role: t.role,
              name: t.name,
              responsibilities: t.responsibility,
              sortOrder: t.sortOrder ?? index,
            })),
        },
      },
    });

    if (sow.milestones.length) {
      await client.partnershipDeliveryMilestone.createMany({
        data: sow.milestones.map((m, index) => ({
          deliveryId: delivery.id,
          phaseId: phaseSeeds[index]?.id ?? null,
          sourceSowMilestoneId: m.id,
          name: m.name,
          description: m.description,
          startDate: m.startDate,
          endDate: m.endDate,
          owner: m.owner,
          sortOrder: m.sortOrder ?? index,
        })),
      });
    }

    await client.partnershipDeliveryActivityLog.create({
      data: {
        deliveryId: delivery.id,
        action: 'CREATED',
        summary: 'Delivery created from SOW (seed)',
      },
    });

    created += 1;
  }

  console.log(
    `Partnership deliveries seed: ${created} created from ${sows.length} active SOWs`,
  );
}
