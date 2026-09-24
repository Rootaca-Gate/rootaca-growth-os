import {
  PartnershipPricingModel,
  PartnershipProposalStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';

/**
 * Creates one editable DRAFT proposal per active offering so admins can open
 * and refine commercial terms without starting from scratch.
 * No invented prices, currency, tax, or dates beyond proposalDate=now.
 */
export async function seedPartnershipProposals(client: PrismaClient): Promise<void> {
  const institution = await client.partnershipInstitution.findFirst({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!institution) {
    return;
  }

  const offerings = await client.partnershipOffering.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      program: {
        include: {
          objectives: { orderBy: { sortOrder: 'asc' } },
          curriculumModules: { orderBy: { sortOrder: 'asc' } },
          activities: { orderBy: { sortOrder: 'asc' } },
          sampleProjects: { orderBy: { sortOrder: 'asc' } },
          assessmentMethods: { orderBy: { sortOrder: 'asc' } },
          requirements: { orderBy: { sortOrder: 'asc' } },
          outcomes: { orderBy: { sortOrder: 'asc' } },
        },
      },
      selectedModules: { orderBy: { sortOrder: 'asc' } },
      selectedProjects: { orderBy: { sortOrder: 'asc' } },
      requirements: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!offerings.length) {
    return;
  }

  const year = new Date().getFullYear();
  let created = 0;
  let updated = 0;

  for (let index = 0; index < offerings.length; index += 1) {
    const offering = offerings[index];
    const program = offering.program;
    const title = `ROOTACA Partnership — ${offering.name}`;

    const modules =
      offering.selectedModules.length > 0
        ? program.curriculumModules.filter((module) =>
            offering.selectedModules.some((sel) => sel.moduleId === module.id),
          )
        : program.curriculumModules;
    const projects =
      offering.selectedProjects.length > 0
        ? program.sampleProjects.filter((project) =>
            offering.selectedProjects.some((sel) => sel.sampleProjectId === project.id),
          )
        : program.sampleProjects;
    const requirements =
      offering.requirements.length > 0 ? offering.requirements : program.requirements;

    const lineData = {
      offeringId: offering.id,
      sortOrder: 0,
      snapshotProgramName: program.name,
      snapshotOfferingName: offering.name,
      snapshotDeliveryFormat: offering.deliveryFormat,
      snapshotTargetGrades: offering.targetGrades ?? program.targetGrades,
      snapshotRecommendedLevel: offering.recommendedLevel ?? program.recommendedLevel,
      snapshotDuration: offering.duration,
      snapshotDurationUnit: offering.durationUnit,
      snapshotNumberOfSessions: offering.numberOfSessions,
      snapshotSessionDurationMinutes: offering.sessionDurationMinutes,
      snapshotSessionFrequency: offering.sessionFrequency,
      snapshotDeliveryMode: offering.deliveryMode,
      snapshotGroupSizeMin: offering.groupSizeMin,
      snapshotGroupSizeMax: offering.groupSizeMax,
      snapshotNumberOfGroups: offering.numberOfGroups,
      snapshotShortDescription: program.shortDescription,
      snapshotSchoolValue: program.schoolValue,
      snapshotStudentValue: program.studentValue,
      snapshotCurriculumJson: modules as unknown as Prisma.InputJsonValue,
      snapshotProjectsJson: {
        sampleProjects: projects,
        includeFinalProject: offering.includeFinalProject,
        finalProjectName: offering.includeFinalProject ? program.finalProjectName : null,
        finalProjectDescription: offering.includeFinalProject
          ? program.finalProjectDescription
          : null,
        finalProjectExpectedOutput: offering.includeFinalProject
          ? program.finalProjectExpectedOutput
          : null,
        finalProjectSkills: offering.includeFinalProject ? program.finalProjectSkills : null,
        finalProjectEvaluationMethod: offering.includeFinalProject
          ? program.finalProjectEvaluationMethod
          : null,
      } as unknown as Prisma.InputJsonValue,
      snapshotOutcomesJson: program.outcomes as unknown as Prisma.InputJsonValue,
      snapshotRequirementsJson: {
        requirements,
        requirementsInherited: offering.requirements.length === 0,
      } as unknown as Prisma.InputJsonValue,
      snapshotAssessmentJson: {
        assessmentFrequency: offering.assessmentFrequency,
        includeInitialAssessment: offering.includeInitialAssessment,
        includeMidAssessment: offering.includeMidAssessment,
        includeFinalAssessment: offering.includeFinalAssessment,
        studentProgressReport: offering.studentProgressReport,
        schoolSummaryReport: offering.schoolSummaryReport,
        methods: program.assessmentMethods,
      } as unknown as Prisma.InputJsonValue,
      snapshotObjectivesJson: program.objectives as unknown as Prisma.InputJsonValue,
      snapshotActivitiesJson: program.activities as unknown as Prisma.InputJsonValue,
      snapshotCapturedAt: new Date(),
      customizedObjectives: '',
      customizedCurriculumNotes: '',
      specialRequirements: '',
      implementationNotes: '',
      deliveryNotes: '',
      pricingModel: PartnershipPricingModel.PER_PROGRAM,
      // No invented commercial numbers
      quantity: null,
      unitPrice: null,
      discountValue: null,
      lineSubtotal: null,
    };

    const existing = await client.partnershipProposal.findFirst({
      where: {
        title,
        institutionId: institution.id,
        status: PartnershipProposalStatus.DRAFT,
      },
      select: { id: true, proposalNumber: true },
    });

    if (existing) {
      await client.partnershipProposalOffering.deleteMany({
        where: { proposalId: existing.id },
      });
      await client.partnershipProposal.update({
        where: { id: existing.id },
        data: {
          isLocked: false,
          preparedBy: 'ROOTACA',
          executiveSummary: '',
          partnershipObjective: '',
          offerings: { create: [lineData] },
        },
      });
      updated += 1;
      continue;
    }

    const seq = String(index + 1).padStart(3, '0');
    let proposalNumber = `ROOTACA-PROP-${year}-${seq}`;
    const numberTaken = await client.partnershipProposal.findUnique({
      where: { proposalNumber },
      select: { id: true },
    });
    if (numberTaken) {
      proposalNumber = `ROOTACA-PROP-${year}-${Date.now().toString().slice(-6)}-${seq}`;
    }

    await client.partnershipProposal.create({
      data: {
        proposalNumber,
        title,
        institutionId: institution.id,
        status: PartnershipProposalStatus.DRAFT,
        preparedBy: 'ROOTACA',
        version: '1.0',
        isLocked: false,
        offerings: { create: [lineData] },
      },
    });
    created += 1;
  }

  console.log(
    `Partnership proposals seed: ${created} created, ${updated} refreshed for ${offerings.length} offerings (institution: ${institution.name})`,
  );
}
