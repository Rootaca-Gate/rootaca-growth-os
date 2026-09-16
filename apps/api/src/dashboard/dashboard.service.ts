import { Injectable } from '@nestjs/common';
import {
  KpiStatus,
  OrientationSession,
  OrientationSessionStatus,
  Prisma,
  StudentProjectStatus,
  StudentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ATTENTION_LIMIT,
  INTAKE_LEVEL_LABELS,
  INTAKE_LEVEL_ORDER,
  PATH_LABELS,
  PATH_ORDER,
  SESSION_LIMIT,
  SESSION_STATUS_LABELS,
  STAGE_LABELS,
  activityCutoff,
  averageLatestProgress,
  capItems,
  groupNamedCounts,
  isInactive,
  isTodaysSession,
  kpiStatusBuckets,
  lastActivityAt,
  monthlyProgress,
  roadmapBehindCounts,
  todayBounds,
  type AttentionItem,
  type ScoreBucket,
} from './dashboard.math';
import { DashboardResponseDto, DashboardSessionItemDto } from './dto/dashboard-response.dto';

type DashboardStudent = Prisma.StudentGetPayload<{
  include: {
    currentLevel: true;
    currentPath: true;
    orientationSessions: { include: { result: true } };
    skills: { include: { skill: true } };
    kpis: true;
    projects: true;
    progressReviews: true;
    roadmap: { include: { phases: { include: { items: true } } } };
  };
}>;

type SessionWithResult = OrientationSession & {
  result: { overallScore: number } | null;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(now = new Date()): Promise<DashboardResponseDto> {
    const students = await this.prisma.student.findMany({
      include: {
        currentLevel: true,
        currentPath: true,
        orientationSessions: {
          include: { result: true },
          orderBy: { updatedAt: 'desc' },
        },
        skills: { include: { skill: true } },
        kpis: { where: { active: true } },
        projects: true,
        progressReviews: true,
        roadmap: { include: { phases: { include: { items: true } } } },
      },
      orderBy: { fullName: 'asc' },
    });

    return this.build(students, now);
  }

  build(students: DashboardStudent[], now: Date): DashboardResponseDto {
    const { todayStart, tomorrow } = todayBounds(now);
    const cutoff = activityCutoff(now);
    const sessions = students.flatMap((student) =>
      student.orientationSessions.map((session) => ({ student, session })),
    );

    const kpiBelowTarget: AttentionItem[] = [];
    const assessmentPending: AttentionItem[] = [];
    const noRecentActivity: AttentionItem[] = [];
    const roadmapBehindSchedule: AttentionItem[] = [];
    const skillTotals = new Map<
      string,
      { label: string; total: number; count: number; sortOrder: number }
    >();
    const kpiCounts = new Map<KpiStatus, number>();
    const reviews = students.flatMap((student) =>
      student.progressReviews.map((review) => ({
        studentId: student.id,
        overallScore: review.overallScore,
        reviewedAt: review.reviewedAt,
      })),
    );

    let todaysSessions = 0;
    let pendingAssessments = 0;
    let projectsCompleted = 0;

    for (const student of students) {
      const hasCompletedAssessment = student.orientationSessions.some(
        (session) => session.status === OrientationSessionStatus.COMPLETED,
      );
      if (!hasCompletedAssessment) {
        pendingAssessments += 1;
        assessmentPending.push({
          studentId: student.id,
          studentName: student.fullName,
          detail: 'No completed orientation',
          href: `/students/${student.id}`,
        });
      }

      for (const session of student.orientationSessions) {
        if (isTodaysSession(session, todayStart, tomorrow)) {
          todaysSessions += 1;
        }
      }

      const belowTarget = student.kpis.filter(
        (kpi) => kpi.status === KpiStatus.BEHIND || kpi.status === KpiStatus.AT_RISK,
      );
      if (belowTarget.length > 0) {
        kpiBelowTarget.push({
          studentId: student.id,
          studentName: student.fullName,
          detail: `${belowTarget.length} KPI${belowTarget.length === 1 ? '' : 's'} below target`,
          href: `/students/${student.id}/kpis`,
        });
      }

      for (const kpi of student.kpis) {
        kpiCounts.set(kpi.status, (kpiCounts.get(kpi.status) ?? 0) + 1);
      }

      for (const project of student.projects) {
        if (project.status === StudentProjectStatus.COMPLETED) {
          projectsCompleted += 1;
        }
      }

      for (const skill of student.skills) {
        const current = skillTotals.get(skill.skill.code) ?? {
          label: skill.skill.name,
          total: 0,
          count: 0,
          sortOrder: skill.skill.sortOrder,
        };
        current.total += skill.score;
        current.count += 1;
        skillTotals.set(skill.skill.code, current);
      }

      const roadmapItems = student.roadmap?.phases.flatMap((phase) => phase.items) ?? [];
      const behind = roadmapBehindCounts(roadmapItems, todayStart);
      if (behind.overdue > 0 || behind.blocked > 0) {
        const parts: string[] = [];
        if (behind.overdue > 0) {
          parts.push(`${behind.overdue} overdue`);
        }
        if (behind.blocked > 0) {
          parts.push(`${behind.blocked} blocked`);
        }
        roadmapBehindSchedule.push({
          studentId: student.id,
          studentName: student.fullName,
          detail: parts.join(', '),
          href: `/students/${student.id}/roadmap`,
        });
      }

      const lastActivity = lastActivityAt([
        ...student.orientationSessions.map((session) => session.updatedAt),
        ...student.orientationSessions.map((session) => session.completedAt),
        ...student.progressReviews.map((review) => review.reviewedAt),
        ...student.progressReviews.map((review) => review.updatedAt),
        ...student.kpis.map((kpi) => kpi.updatedAt),
        ...student.projects.map((project) => project.updatedAt),
      ]);
      if (isInactive(lastActivity, cutoff)) {
        noRecentActivity.push({
          studentId: student.id,
          studentName: student.fullName,
          detail: lastActivity ? 'No activity in 14 days' : 'No recorded activity',
          href: `/students/${student.id}`,
        });
      }
    }

    const recentSessions = capItems(
      sessions
        .filter(({ session }) => session.status !== OrientationSessionStatus.DRAFT)
        .sort((left, right) => right.session.updatedAt.getTime() - left.session.updatedAt.getTime())
        .map(({ student, session }) => toSessionItem(session, student.fullName)),
      SESSION_LIMIT,
    );

    const upcomingSessions = capItems(
      sessions
        .filter(({ session }) => session.status === OrientationSessionStatus.DRAFT)
        .sort((left, right) => right.session.createdAt.getTime() - left.session.createdAt.getTime())
        .map(({ student, session }) => toSessionItem(session, student.fullName)),
      SESSION_LIMIT,
    );

    return {
      generatedAt: now.toISOString(),
      cards: {
        totalStudents: students.length,
        activeStudents: students.filter((student) => student.status === StudentStatus.ACTIVE)
          .length,
        todaysSessions,
        pendingAssessments,
        averageProgress: averageLatestProgress(reviews),
        projectsCompleted,
      },
      charts: {
        studentsByLevel: groupNamedCounts(levelBuckets(students)),
        studentsByPath: groupNamedCounts(pathBuckets(students)),
        averageSkillScores: skillScoreBuckets(skillTotals),
        kpiStatus: kpiStatusBuckets(kpiCounts),
        monthlyProgress: monthlyProgress(reviews, now),
      },
      attention: {
        kpiBelowTarget: rankedAttention(kpiBelowTarget),
        assessmentPending: rankedAttention(assessmentPending),
        noRecentActivity: rankedAttention(noRecentActivity),
        roadmapBehindSchedule: rankedAttention(roadmapBehindSchedule),
      },
      recentSessions,
      upcomingSessions,
    };
  }
}

function levelBuckets(students: DashboardStudent[]) {
  const items: Array<{ key: string; label: string; sortOrder: number }> = [];
  for (const student of students) {
    if (!student.currentLevel) {
      continue;
    }
    items.push({
      key: student.currentLevel.code,
      label: student.currentLevel.name,
      sortOrder: student.currentLevel.sortOrder,
    });
  }
  for (const student of students) {
    if (student.currentLevel) {
      continue;
    }
    items.push({
      key: `INTAKE_${student.level}`,
      label: INTAKE_LEVEL_LABELS[student.level],
      sortOrder: 100 + INTAKE_LEVEL_ORDER.indexOf(student.level),
    });
  }
  return items;
}

function pathBuckets(students: DashboardStudent[]) {
  const items: Array<{ key: string; label: string; sortOrder: number }> = [];
  for (const student of students) {
    if (!student.currentPath) {
      continue;
    }
    items.push({
      key: student.currentPath.code,
      label: student.currentPath.name,
      sortOrder: student.currentPath.sortOrder,
    });
  }
  for (const student of students) {
    if (student.currentPath) {
      continue;
    }
    items.push({
      key: student.path,
      label: PATH_LABELS[student.path],
      sortOrder: 100 + PATH_ORDER.indexOf(student.path),
    });
  }
  return items;
}

function skillScoreBuckets(
  totals: Map<string, { label: string; total: number; count: number; sortOrder: number }>,
): ScoreBucket[] {
  return [...totals.entries()]
    .sort(
      (left, right) => left[1].sortOrder - right[1].sortOrder || left[0].localeCompare(right[0]),
    )
    .map(([key, value]) => ({
      key,
      label: value.label,
      score: Math.round(value.total / value.count),
      sampleSize: value.count,
    }));
}

function rankedAttention(items: AttentionItem[]): AttentionItem[] {
  return capItems(
    [...items].sort((left, right) => left.studentName.localeCompare(right.studentName)),
    ATTENTION_LIMIT,
  );
}

function toSessionItem(session: SessionWithResult, studentName: string): DashboardSessionItemDto {
  return {
    id: session.id,
    studentId: session.studentId,
    studentName,
    status: session.status,
    statusLabel: SESSION_STATUS_LABELS[session.status],
    currentStage: session.currentStage,
    stageLabel: STAGE_LABELS[session.currentStage],
    createdAt: session.createdAt.toISOString(),
    startedAt: session.startedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    overallScore: session.result?.overallScore ?? null,
    href: `/students/${session.studentId}/orientation/${session.id}`,
  };
}
