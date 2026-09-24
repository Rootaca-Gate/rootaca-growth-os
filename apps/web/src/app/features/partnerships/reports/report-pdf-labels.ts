import { DirectionService } from '../../../core/direction.service';
import { ReportPdfLabels } from './report-pdf';

export function buildReportPdfLabels(i18n: DirectionService): ReportPdfLabels {
  const t = (key: string) => i18n.t(key);
  return {
    brand: t('brand.name'),
    documentTitle: t('partnerships.reportsPdfTitle'),
    confidential: t('partnerships.reportsPdfConfidential'),
    pageOf: t('partnerships.reportsPdfPageOf'),
    continued: t('partnerships.reportsPdfContinued'),
    organization: t('partnerships.reportsPdfOrganization'),
    reportNo: t('partnerships.reportsPdfReportNo'),
    school: t('partnerships.school'),
    delivery: t('partnerships.reportsDelivery'),
    type: t('partnerships.reportsType'),
    period: t('partnerships.reportsPeriod'),
    version: t('partnerships.reportsVersion'),
    executiveSummary: t('partnerships.reportsExecutiveSummary'),
    achievements: t('partnerships.reportsAchievements'),
    nextSteps: t('partnerships.reportsNextSteps'),
    recommendations: t('partnerships.reportsRecommendations'),
    kpis: t('partnerships.reportsKpis'),
    students: t('partnerships.reportsStudentsSection'),
    groups: t('partnerships.reportsGroupsSection'),
    projects: t('partnerships.reportsProjectsSection'),
    assessment: t('partnerships.reportsAssessmentSection'),
    challenges: t('partnerships.reportsChallengesSection'),
    kpiStudents: t('partnerships.reportsKpiStudents'),
    kpiGroups: t('partnerships.reportsKpiGroups'),
    kpiAttendance: t('partnerships.reportsKpiAttendance'),
    kpiCompletion: t('partnerships.reportsKpiCompletion'),
    trackStatus: t('partnerships.reportsTrackStatus'),
    noData: t('partnerships.reportsPdfNoSection'),
  };
}
