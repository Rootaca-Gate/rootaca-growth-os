import {
  PartnershipDeliveryFormat,
  PartnershipDeliveryMode,
  PartnershipDurationUnit,
  PartnershipProgramLevel,
  Prisma,
} from '@prisma/client';
import { OfferingResponseDto } from '../offerings/dto/offering.dto';

/**
 * Frozen offering snapshot fields stored on PartnershipProposalOffering.
 * Built from OfferingsService.findOne / toResponse so inheritance matches live reads.
 */
export type OfferingSnapshotData = {
  snapshotProgramName: string;
  snapshotOfferingName: string;
  snapshotDeliveryFormat: PartnershipDeliveryFormat;
  snapshotTargetGrades: string | null;
  snapshotRecommendedLevel: PartnershipProgramLevel | null;
  snapshotDuration: number | null;
  snapshotDurationUnit: PartnershipDurationUnit | null;
  snapshotNumberOfSessions: number | null;
  snapshotSessionDurationMinutes: number | null;
  snapshotSessionFrequency: string | null;
  snapshotDeliveryMode: PartnershipDeliveryMode | null;
  snapshotGroupSizeMin: number | null;
  snapshotGroupSizeMax: number | null;
  snapshotNumberOfGroups: number | null;
  snapshotShortDescription: string;
  snapshotSchoolValue: string;
  snapshotStudentValue: string;
  snapshotCurriculumJson: Prisma.InputJsonValue;
  snapshotProjectsJson: Prisma.InputJsonValue;
  snapshotOutcomesJson: Prisma.InputJsonValue;
  snapshotRequirementsJson: Prisma.InputJsonValue;
  snapshotAssessmentJson: Prisma.InputJsonValue;
  snapshotObjectivesJson: Prisma.InputJsonValue;
  snapshotActivitiesJson: Prisma.InputJsonValue;
  snapshotCapturedAt: Date;
};

/**
 * Maps a fully resolved offering response into immutable snapshot columns + JSON blobs.
 * Prefer calling OfferingsService.findOne then this mapper (avoids duplicating inheritance).
 */
export function buildOfferingSnapshot(offering: OfferingResponseDto): OfferingSnapshotData {
  const { resolved } = offering;

  return {
    snapshotProgramName: offering.program.name,
    snapshotOfferingName: offering.name,
    snapshotDeliveryFormat: offering.deliveryFormat,
    snapshotTargetGrades: resolved.targetGrades,
    snapshotRecommendedLevel: resolved.recommendedLevel,
    snapshotDuration: offering.duration,
    snapshotDurationUnit: offering.durationUnit,
    snapshotNumberOfSessions: offering.numberOfSessions,
    snapshotSessionDurationMinutes: offering.sessionDurationMinutes,
    snapshotSessionFrequency: offering.sessionFrequency,
    snapshotDeliveryMode: offering.deliveryMode,
    snapshotGroupSizeMin: offering.groupSizeMin,
    snapshotGroupSizeMax: offering.groupSizeMax,
    snapshotNumberOfGroups: offering.numberOfGroups,
    snapshotShortDescription: resolved.shortDescription,
    snapshotSchoolValue: resolved.schoolValue,
    snapshotStudentValue: resolved.studentValue,
    snapshotCurriculumJson: resolved.curriculumModules as unknown as Prisma.InputJsonValue,
    snapshotProjectsJson: {
      sampleProjects: resolved.sampleProjects,
      includeFinalProject: resolved.includeFinalProject,
      finalProjectName: resolved.finalProjectName,
      finalProjectDescription: resolved.finalProjectDescription,
      finalProjectExpectedOutput: resolved.finalProjectExpectedOutput,
      finalProjectSkills: resolved.finalProjectSkills,
      finalProjectEvaluationMethod: resolved.finalProjectEvaluationMethod,
    } as unknown as Prisma.InputJsonValue,
    snapshotOutcomesJson: resolved.outcomes as unknown as Prisma.InputJsonValue,
    snapshotRequirementsJson: {
      requirements: resolved.requirements,
      requirementsInherited: resolved.requirementsInherited,
    } as unknown as Prisma.InputJsonValue,
    snapshotAssessmentJson: {
      assessmentFrequency: offering.assessmentFrequency,
      includeInitialAssessment: offering.includeInitialAssessment,
      includeMidAssessment: offering.includeMidAssessment,
      includeFinalAssessment: offering.includeFinalAssessment,
      studentProgressReport: offering.studentProgressReport,
      schoolSummaryReport: offering.schoolSummaryReport,
      methods: resolved.assessmentMethods,
    } as unknown as Prisma.InputJsonValue,
    snapshotObjectivesJson: resolved.objectives as unknown as Prisma.InputJsonValue,
    snapshotActivitiesJson: resolved.activities as unknown as Prisma.InputJsonValue,
    snapshotCapturedAt: new Date(),
  };
}
