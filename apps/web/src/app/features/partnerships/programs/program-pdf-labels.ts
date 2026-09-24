import { DirectionService } from '../../../core/direction.service';
import { ProgramPdfLabels } from './program-pdf';

/** Shared i18n labels for school-facing Program PDF documents. */
export function buildProgramPdfLabels(i18n: DirectionService): ProgramPdfLabels {
  const t = (key: string) => i18n.t(key);
  return {
    brand: t('brand.name'),
    documentTitle: t('partnerships.schoolPartnershipProgram'),
    initiative: t('partnerships.pdfTagline'),
    preparedFor: t('partnerships.pdfPreparedFor'),
    confidential: t('partnerships.pdfConfidential'),
    pageOf: t('partnerships.pdfPageOf'),
    overview: t('partnerships.programSectionOverview'),
    audience: t('partnerships.programSectionAudience'),
    objectives: t('partnerships.programSectionObjectives'),
    curriculum: t('partnerships.programSectionCurriculum'),
    activities: t('partnerships.programSectionActivities'),
    projects: t('partnerships.programSectionProjects'),
    sampleProjects: t('partnerships.sampleProjects'),
    finalProject: t('partnerships.finalProject'),
    assessment: t('partnerships.programSectionAssessment'),
    delivery: t('partnerships.programSectionDelivery'),
    requirements: t('partnerships.programSectionRequirements'),
    equipment: t('partnerships.equipmentRequirements'),
    schoolReqs: t('partnerships.schoolRequirements'),
    outcomes: t('partnerships.programSectionOutcomes'),
    targetAge: t('partnerships.targetAge'),
    targetGrades: t('partnerships.targetGrades'),
    level: t('partnerships.programLevel'),
    profile: t('partnerships.recommendedStudentProfile'),
    schoolValue: t('partnerships.schoolValue'),
    studentValue: t('partnerships.studentValue'),
    expectedOutput: t('partnerships.expectedOutput'),
    evaluation: t('partnerships.evaluationMethod'),
    skills: t('partnerships.skills'),
    required: t('partnerships.requirementRequired'),
    recommended: t('partnerships.requirementRecommended'),
    ctaTitle: t('partnerships.pdfCtaTitle'),
    ctaExplore: t('partnerships.pdfCtaExplore'),
    organization: t('partnerships.pdfOrganization'),
    continued: t('partnerships.pdfContinued'),
  };
}
