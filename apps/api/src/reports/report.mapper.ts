import { AssessmentResultResponseDto } from '../orientation/dto/session-response.dto';
import { StudentKpiDashboardDto } from '../kpi/dto/kpi-response.dto';
import {
  PlacementResponseDto,
  StudentSkillResponseDto,
} from '../placement/dto/placement-response.dto';
import { StudentProgressDashboardDto } from '../progress/dto/progress-response.dto';
import { StudentProjectSummaryDto } from '../projects/dto/project-response.dto';
import { RoadmapResponseDto } from '../roadmap/dto/roadmap-response.dto';
import { StudentResponseDto } from '../students/dto/student-response.dto';
import { ReportLocale } from './dto/report-query.dto';
import {
  ReportAssessmentSectionDto,
  ReportFieldDto,
  ReportKpiSectionDto,
  ReportLevelSectionDto,
  ReportPathSectionDto,
  ReportProjectSectionDto,
  ReportRoadmapSectionDto,
  StudentProgressReportDto,
} from './dto/report-response.dto';
import { labeled, reportCopy } from './report-copy';
import {
  catalogLabel,
  localizeAssessmentSummary,
  localizeList,
  localizeText,
} from './report-catalog-i18n';
import { buildReportInsights } from './report-insights';

export type ReportSource = {
  locale: ReportLocale;
  generatedAt: Date;
  student: StudentResponseDto;
  skills: StudentSkillResponseDto[];
  placement: PlacementResponseDto | null;
  assessment: AssessmentResultResponseDto | null;
  roadmap: RoadmapResponseDto | null;
  kpis: StudentKpiDashboardDto;
  projects: StudentProjectSummaryDto;
  progress: StudentProgressDashboardDto;
};

export function toStudentProgressReport(source: ReportSource): StudentProgressReportDto {
  const copy = reportCopy(source.locale);
  const insights = buildReportInsights({
    copy,
    skills: source.skills,
    assessment: source.assessment,
    kpis: source.kpis,
    projects: source.projects,
    roadmap: source.roadmap,
    progress: source.progress,
    learningGoal: source.student.learningGoal,
  });

  const currentLevel = toLevelSection(source);
  const recommendedPath = toPathSection(source);
  const generatedAt = source.generatedAt.toISOString();

  return {
    studentId: source.student.id,
    locale: source.locale,
    generatedAt,
    title: copy.title,
    fileName: reportFileName(source.student.fullName, generatedAt),
    student: {
      id: source.student.id,
      fullName: source.student.fullName,
      fields: studentFields(source.student, copy),
    },
    currentLevel,
    assessment: toAssessmentSection(source.assessment, source.locale),
    skills: source.skills.map((skill) => ({
      name: catalogLabel(source.locale, 'skill', skill.code, skill.name),
      score: Math.round(skill.score),
    })),
    recommendedPath,
    roadmap: toRoadmapSection(source.roadmap, source.locale),
    kpis: toKpiSection(source.kpis, copy),
    projects: toProjectSection(source.projects, copy),
    achievements: insights.achievements,
    areasForImprovement: insights.areasForImprovement,
    nextGoals: insights.nextGoals,
  };
}

function studentFields(
  student: StudentResponseDto,
  copy: ReturnType<typeof reportCopy>,
): ReportFieldDto[] {
  return [
    field(copy.labels.fullName, student.fullName),
    field(copy.labels.dateOfBirth, student.dateOfBirth),
    field(copy.labels.schoolGrade, localizeText(copy.locale, student.schoolGrade)),
    field(copy.labels.phone, student.phone),
    field(copy.labels.parentContact, student.parentContact),
    field(copy.labels.status, labeled(copy.status, student.status)),
    field(copy.labels.english, labeled(copy.status, student.englishLevel)),
    field(copy.labels.experience, labeled(copy.status, student.programmingExperience)),
    field(copy.labels.hours, String(student.availableHoursPerWeek)),
    field(copy.labels.languages, joinList(student.programmingLanguages, copy.empty)),
    field(copy.labels.interests, localizeList(copy.locale, student.interests, copy.empty)),
    field(copy.labels.learningGoal, student.learningGoal || copy.empty),
  ];
}

function toLevelSection(source: ReportSource): ReportLevelSectionDto | null {
  const level = source.student.currentLevel ?? source.placement?.finalLevel;
  if (!level) {
    return null;
  }
  return {
    name: catalogLabel(source.locale, 'level', level.code, level.name),
    code: level.code,
    description: catalogLabel(source.locale, 'levelDetail', level.code, level.description),
  };
}

function toPathSection(source: ReportSource): ReportPathSectionDto | null {
  const path = source.placement?.finalPath ?? source.student.currentPath;
  if (!path) {
    return null;
  }
  return {
    name: catalogLabel(source.locale, 'path', path.code, path.name),
    code: path.code,
    description: catalogLabel(source.locale, 'pathDetail', path.code, path.description),
    reasons: (source.placement?.recommendationReasons ?? []).map((reason) =>
      localizeText(source.locale, reason),
    ),
    alternativeName: source.placement?.alternativePath
      ? catalogLabel(
          source.locale,
          'path',
          source.placement.alternativePath.code,
          source.placement.alternativePath.name,
        )
      : null,
    alternativeReasons: (source.placement?.alternativeReasons ?? []).map((reason) =>
      localizeText(source.locale, reason),
    ),
  };
}

function toAssessmentSection(
  assessment: AssessmentResultResponseDto | null,
  locale: ReportLocale,
): ReportAssessmentSectionDto | null {
  if (!assessment) {
    return null;
  }
  const categories = assessment.categoryScores.map((category) => ({
    name: catalogLabel(locale, 'category', category.code, category.name),
    score: Math.round(category.score),
    detail: locale === 'ar' ? `${category.weightPercent}٪` : `${category.weightPercent}%`,
  }));
  return {
    overallScore: Math.round(assessment.overallScore),
    completedAt: assessment.completedAt.slice(0, 10),
    summary: localizeAssessmentSummary(
      locale,
      assessment.overallScore,
      categories,
      assessment.summary,
    ),
    categories,
  };
}

function toRoadmapSection(
  roadmap: RoadmapResponseDto | null,
  locale: ReportLocale,
): ReportRoadmapSectionDto | null {
  if (!roadmap) {
    return null;
  }
  return {
    pathName: catalogLabel(locale, 'path', roadmap.pathCode, roadmap.pathName),
    levelName: catalogLabel(locale, 'level', roadmap.levelCode, roadmap.levelName),
    overallPercent: roadmap.progress.overallPercent,
    completedCount: roadmap.progress.completedCount,
    itemCount: roadmap.progress.itemCount,
    inProgressCount: roadmap.progress.inProgressCount,
    blockedCount: roadmap.progress.blockedCount,
    phases: roadmap.progress.phases.map((phase) => ({
      title: localizeText(locale, phase.title),
      percent: phase.percent,
      completedCount: phase.completedCount,
      itemCount: phase.itemCount,
    })),
  };
}

function toKpiSection(
  kpis: StudentKpiDashboardDto,
  copy: ReturnType<typeof reportCopy>,
): ReportKpiSectionDto {
  return {
    overallPercent: kpis.overallPercent,
    overallStatus: kpis.overallStatus,
    overallStatusLabel: labeled(copy.kpiStatus, kpis.overallStatus),
    items: kpis.items.map((item) => ({
      name: catalogLabel(copy.locale, 'kpi', item.kpi.code, item.kpi.name),
      actual: item.actual,
      target: item.target,
      unit: catalogLabel(copy.locale, 'kpiUnit', item.kpi.unit, item.kpi.unit),
      progressPercent: item.progressPercent,
      status: item.status,
      statusLabel: labeled(copy.kpiStatus, item.status),
    })),
  };
}

function toProjectSection(
  projects: StudentProjectSummaryDto,
  copy: ReturnType<typeof reportCopy>,
): ReportProjectSectionDto {
  return {
    overallPercent: projects.overallPercent,
    assignedCount: projects.assignedCount,
    completedCount: projects.completedCount,
    items: projects.items.map((item) => ({
      name: catalogLabel(copy.locale, 'project', item.project.code, item.project.name),
      status: item.status,
      statusLabel: labeled(copy.projectStatus, item.status),
      progressPercent: item.progressPercent,
    })),
  };
}

function field(label: string, value: string): ReportFieldDto {
  return { label, value };
}

function joinList(values: string[], empty: string): string {
  return values.filter(Boolean).join(', ') || empty;
}

export function reportFileName(fullName: string, generatedAt: string): string {
  const slug = fullName
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `ROOTACA-Progress-${slug || 'student'}-${generatedAt.slice(0, 10)}.pdf`;
}
