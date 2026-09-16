import { AssessmentResultResponseDto } from '../orientation/dto/session-response.dto';
import { StudentKpiDashboardDto } from '../kpi/dto/kpi-response.dto';
import { StudentSkillResponseDto } from '../placement/dto/placement-response.dto';
import { StudentProgressDashboardDto } from '../progress/dto/progress-response.dto';
import { StudentProjectSummaryDto } from '../projects/dto/project-response.dto';
import { RoadmapResponseDto } from '../roadmap/dto/roadmap-response.dto';
import { ReportCopy } from './report-copy';
import { catalogLabel, localizeText } from './report-catalog-i18n';

const MAX_ITEMS = 8;

export type ReportInsights = {
  achievements: string[];
  areasForImprovement: string[];
  nextGoals: string[];
};

export type InsightSource = {
  copy: ReportCopy;
  skills: StudentSkillResponseDto[];
  assessment: AssessmentResultResponseDto | null;
  kpis: StudentKpiDashboardDto;
  projects: StudentProjectSummaryDto;
  roadmap: RoadmapResponseDto | null;
  progress: StudentProgressDashboardDto;
  learningGoal: string;
};

export function buildReportInsights(source: InsightSource): ReportInsights {
  return {
    achievements: cap(collectAchievements(source)),
    areasForImprovement: cap(collectImprovements(source)),
    nextGoals: cap(collectNextGoals(source)),
  };
}

function collectAchievements(source: InsightSource): string[] {
  const { copy } = source;
  const items: string[] = [];

  for (const skill of source.skills) {
    if (skill.score >= 70) {
      items.push(
        copy.insights.skillHigh(
          catalogLabel(copy.locale, 'skill', skill.code, skill.name),
          Math.round(skill.score),
        ),
      );
    }
  }

  for (const category of source.assessment?.categoryScores ?? []) {
    if (category.score >= 70) {
      items.push(
        copy.insights.assessmentHigh(
          catalogLabel(copy.locale, 'category', category.code, category.name),
          Math.round(category.score),
        ),
      );
    }
  }

  for (const kpi of source.kpis.items) {
    if (kpi.status === 'COMPLETED') {
      items.push(
        copy.insights.kpiCompleted(catalogLabel(copy.locale, 'kpi', kpi.kpi.code, kpi.kpi.name)),
      );
    }
  }

  for (const project of source.projects.items) {
    if (project.status === 'COMPLETED' || project.progressPercent >= 100) {
      items.push(
        copy.insights.projectCompleted(
          catalogLabel(copy.locale, 'project', project.project.code, project.project.name),
        ),
      );
    }
  }

  if (source.roadmap && source.roadmap.progress.completedCount > 0) {
    items.push(copy.insights.roadmapCompleted(source.roadmap.progress.completedCount));
  }

  const strengths = source.progress.latest?.strengths.trim();
  if (strengths) {
    items.push(copy.insights.reviewStrength(strengths));
  }

  return unique(items);
}

function collectImprovements(source: InsightSource): string[] {
  const { copy } = source;
  const items: string[] = [];

  for (const skill of source.skills) {
    if (skill.score < 50) {
      items.push(
        copy.insights.skillLow(
          catalogLabel(copy.locale, 'skill', skill.code, skill.name),
          Math.round(skill.score),
        ),
      );
    }
  }

  for (const category of source.assessment?.categoryScores ?? []) {
    if (category.score < 50) {
      items.push(
        copy.insights.assessmentLow(
          catalogLabel(copy.locale, 'category', category.code, category.name),
          Math.round(category.score),
        ),
      );
    }
  }

  for (const kpi of source.kpis.items) {
    if (kpi.status === 'BEHIND' || kpi.status === 'AT_RISK') {
      items.push(
        copy.insights.kpiBehind(catalogLabel(copy.locale, 'kpi', kpi.kpi.code, kpi.kpi.name)),
      );
    }
  }

  for (const project of source.projects.items) {
    if (project.status !== 'COMPLETED' && project.progressPercent < 50) {
      items.push(
        copy.insights.projectBehind(
          catalogLabel(copy.locale, 'project', project.project.code, project.project.name),
          project.progressPercent,
        ),
      );
    }
  }

  for (const blocked of source.roadmap?.progress.blockedItems ?? []) {
    items.push(copy.insights.roadmapBlocked(localizeText(copy.locale, blocked.title)));
  }

  return unique(items);
}

function collectNextGoals(source: InsightSource): string[] {
  const { copy } = source;
  const items: string[] = [];

  const nextFocus = source.progress.latest?.nextFocus.trim();
  if (nextFocus) {
    items.push(copy.insights.reviewFocus(nextFocus));
  }

  const inProgress = source.roadmap?.phases
    .flatMap((phase) => phase.items)
    .filter((item) => item.status === 'IN_PROGRESS' || item.status === 'BLOCKED');
  for (const item of inProgress ?? []) {
    items.push(
      item.status === 'BLOCKED'
        ? copy.insights.roadmapBlocked(localizeText(copy.locale, item.title))
        : copy.insights.roadmapContinue(localizeText(copy.locale, item.title)),
    );
  }

  const notStarted = source.roadmap?.phases
    .flatMap((phase) => phase.items)
    .filter((item) => item.status === 'NOT_STARTED')
    .slice(0, 2);
  for (const item of notStarted ?? []) {
    items.push(copy.insights.roadmapContinue(localizeText(copy.locale, item.title)));
  }

  const goal = source.learningGoal.trim();
  if (goal) {
    items.push(copy.insights.learningGoal(goal));
  }

  return unique(items);
}

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function cap(items: string[]): string[] {
  return items.slice(0, MAX_ITEMS);
}
