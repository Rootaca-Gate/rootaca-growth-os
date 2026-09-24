import {
  PartnershipProposalStatus,
  PartnershipSowStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';

/**
 * Creates one editable DRAFT SOW per ACCEPTED proposal that does not yet have a
 * SOW. Purely copies proposal snapshots + institution parties — no invented
 * deliverables, dates, prices, legal terms, or signatures.
 */
export async function seedPartnershipSows(client: PrismaClient): Promise<void> {
  const proposals = await client.partnershipProposal.findMany({
    where: { status: PartnershipProposalStatus.ACCEPTED },
    orderBy: { createdAt: 'asc' },
    include: {
      institution: { include: { contacts: { where: { isPrimary: true }, take: 1 } } },
      offerings: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!proposals.length) {
    return;
  }

  const year = new Date().getFullYear();
  let created = 0;

  for (const proposal of proposals) {
    const alreadyHasSow = await client.partnershipSow.findFirst({
      where: { proposalId: proposal.id },
      select: { id: true },
    });
    if (alreadyHasSow) {
      continue;
    }

    const prefix = `ROOTACA-SOW-${year}-`;
    const existingCount = await client.partnershipSow.count({
      where: { sowNumber: { startsWith: prefix } },
    });
    const sowNumber = `${prefix}${String(existingCount + 1).padStart(3, '0')}`;
    const primaryContact = proposal.institution.contacts?.[0] ?? null;

    const scopeOfferings = proposal.offerings.map((line, index) => ({
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
      curriculumJson: (line.snapshotCurriculumJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      activitiesJson: (line.snapshotActivitiesJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      projectsJson: (line.snapshotProjectsJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      assessmentJson: (line.snapshotAssessmentJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      requirementsJson: (line.snapshotRequirementsJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      outcomesJson: (line.snapshotOutcomesJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      objectivesJson: (line.snapshotObjectivesJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    }));

    await client.partnershipSow.create({
      data: {
        sowNumber,
        title: proposal.title,
        institutionId: proposal.institutionId,
        proposalId: proposal.id,
        status: PartnershipSowStatus.DRAFT,
        version: '1.0',
        isLocked: false,
        purpose:
          proposal.partnershipObjective?.trim() ||
          proposal.executiveSummary?.trim() ||
          '',
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        clientName: proposal.institution.name,
        clientAddress: proposal.institution.fullAddress ?? '',
        primaryContactName: primaryContact?.fullName ?? '',
        primaryContactEmail: primaryContact?.email ?? '',
        primaryContactPhone: proposal.institution.phone ?? proposal.institution.mobile ?? '',
        proposalNumberSnapshot: proposal.proposalNumber,
        agreedValueSnapshot: proposal.grandTotal,
        currencySnapshot: proposal.currency,
        paymentTermsSnapshot: proposal.paymentTerms ?? '',
        scopeOfferings: { create: scopeOfferings },
      },
    });
    created += 1;
  }

  console.log(
    `Partnership SOWs seed: ${created} created from ${proposals.length} accepted proposals`,
  );
}
