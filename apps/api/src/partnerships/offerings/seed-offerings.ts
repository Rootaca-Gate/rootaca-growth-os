import {
  PartnershipDeliveryFormat,
  PartnershipOfferingStatus,
  PrismaClient,
} from '@prisma/client';

/**
 * Minimal offering seeds. Intentionally only set name, the linked program,
 * a delivery format, and ACTIVE status — every duration/session/group field is
 * left null so the offering inherits from its program and no fake numbers are
 * introduced. Selection join tables are left empty => inherit ALL curriculum
 * and projects from the program.
 */
const OFFERINGS: {
  name: string;
  programName: string;
  deliveryFormat: PartnershipDeliveryFormat;
  displayOrder: number;
}[] = [
  {
    name: 'Programming Fundamentals — School Package',
    programName: 'Programming Fundamentals',
    deliveryFormat: PartnershipDeliveryFormat.AFTER_SCHOOL,
    displayOrder: 10,
  },
  {
    name: 'Web Development — Semester Package',
    programName: 'Web Development',
    deliveryFormat: PartnershipDeliveryFormat.SEMESTER,
    displayOrder: 20,
  },
];

export async function seedPartnershipOfferings(client: PrismaClient): Promise<void> {
  for (const offering of OFFERINGS) {
    const program = await client.partnershipProgram.findFirst({
      where: { name: offering.programName },
      select: { id: true },
    });
    if (!program) {
      continue;
    }

    const existing = await client.partnershipOffering.findFirst({
      where: { name: offering.name },
      select: { id: true },
    });

    if (existing) {
      await client.partnershipOffering.update({
        where: { id: existing.id },
        data: {
          programId: program.id,
          deliveryFormat: offering.deliveryFormat,
          status: PartnershipOfferingStatus.ACTIVE,
          displayOrder: offering.displayOrder,
        },
      });
    } else {
      await client.partnershipOffering.create({
        data: {
          name: offering.name,
          programId: program.id,
          deliveryFormat: offering.deliveryFormat,
          status: PartnershipOfferingStatus.ACTIVE,
          displayOrder: offering.displayOrder,
        },
      });
    }
  }
}
