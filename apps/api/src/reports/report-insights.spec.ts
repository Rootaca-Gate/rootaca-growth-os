import { KpiStatus } from '@prisma/client';
import { AssessmentResultResponseDto } from '../orientation/dto/session-response.dto';
import { StudentKpiDashboardDto } from '../kpi/dto/kpi-response.dto';
import { StudentSkillResponseDto } from '../placement/dto/placement-response.dto';
import { StudentProgressDashboardDto } from '../progress/dto/progress-response.dto';
import { StudentProjectSummaryDto } from '../projects/dto/project-response.dto';
import { RoadmapResponseDto } from '../roadmap/dto/roadmap-response.dto';
import { reportCopy } from './report-copy';
import { buildReportInsights } from './report-insights';

describe('buildReportInsights', () => {
  const copy = reportCopy('en');

  it('collects achievements, gaps, and next goals from live student data', () => {
    const insights = buildReportInsights({
      copy,
      skills: [skill('Programming Fundamentals', 82), skill('Debugging', 28)],
      assessment: assessment([
        { name: 'Problem Solving', score: 75, weightPercent: 30 },
        { name: 'Technical Knowledge', score: 32, weightPercent: 15 },
      ]),
      kpis: kpiDashboard([
        { name: 'Coding Problems', status: KpiStatus.COMPLETED },
        { name: 'Weekly Practice Hours', status: KpiStatus.BEHIND },
      ]),
      projects: projectSummary([
        { name: 'Personal Portfolio Page', status: 'COMPLETED', progressPercent: 100 },
        { name: 'Quiz App', status: 'IN_PROGRESS', progressPercent: 20 },
      ]),
      roadmap: roadmap({
        completedCount: 4,
        blockedTitle: 'Set up GitHub',
        inProgressTitle: 'Build a first page',
      }),
      progress: progressDashboard('Clear questions in class', 'Finish the first HTML page'),
      learningGoal: 'Become confident building small websites.',
    });

    expect(insights.achievements).toEqual(
      expect.arrayContaining([
        'Programming Fundamentals is a strength at 82/100.',
        'Completed KPI: Coding Problems.',
        'Completed classroom project: Personal Portfolio Page.',
        '4 roadmap items completed.',
        'Clear questions in class',
      ]),
    );
    expect(insights.areasForImprovement).toEqual(
      expect.arrayContaining([
        'Debugging needs practice (28/100).',
        'Weekly Practice Hours is behind target.',
        'Quiz App is at 20% and needs follow-through.',
        'Unblock roadmap item: Set up GitHub.',
      ]),
    );
    expect(insights.nextGoals).toEqual(
      expect.arrayContaining([
        'Finish the first HTML page',
        'Continue roadmap item: Build a first page.',
        'Unblock roadmap item: Set up GitHub.',
        'Stay aligned with the learning goal: Become confident building small websites.',
      ]),
    );
  });

  it('returns empty lists when there is nothing to report', () => {
    const insights = buildReportInsights({
      copy,
      skills: [],
      assessment: null,
      kpis: kpiDashboard([]),
      projects: projectSummary([]),
      roadmap: null,
      progress: progressDashboard('', ''),
      learningGoal: '',
    });

    expect(insights.achievements).toEqual([]);
    expect(insights.areasForImprovement).toEqual([]);
    expect(insights.nextGoals).toEqual([]);
  });

  it('localizes KPI, project, and roadmap insight names in Arabic', () => {
    const insights = buildReportInsights({
      copy: reportCopy('ar'),
      skills: [skill('Programming Fundamentals', 82)],
      assessment: null,
      kpis: kpiDashboard([{ name: 'CODING_PROBLEMS', status: KpiStatus.COMPLETED }]),
      projects: projectSummary([
        { name: 'First Web Page Studio', status: 'COMPLETED', progressPercent: 100 },
      ]),
      roadmap: roadmap({
        completedCount: 2,
        blockedTitle: 'Set up the web workspace',
        inProgressTitle: 'Practice a web pattern',
      }),
      progress: progressDashboard('', ''),
      learningGoal: '',
    });

    expect(insights.achievements.join(' ')).toContain('أساسيات البرمجة');
    expect(insights.achievements.join(' ')).toContain('مسائل برمجية');
    expect(insights.nextGoals.join(' ')).toContain('إعداد بيئة الويب');
  });
});

function skill(name: string, score: number): StudentSkillResponseDto {
  return { skillId: name, code: 'PROGRAMMING_FUNDAMENTALS', name, score };
}

function assessment(
  categories: Array<{ name: string; score: number; weightPercent: number }>,
): AssessmentResultResponseDto {
  return {
    id: 'result-1',
    sessionId: 'session-1',
    overallScore: 61,
    categoryScores: categories.map((item) => ({
      code: 'PROBLEM_SOLVING',
      name: item.name,
      weightPercent: item.weightPercent,
      score: item.score,
    })),
    skillScores: [],
    summary: 'Solid start',
    completedAt: '2026-09-01T00:00:00.000Z',
  };
}

function kpiDashboard(items: Array<{ name: string; status: KpiStatus }>): StudentKpiDashboardDto {
  return {
    studentId: 'student-1',
    overallPercent: 40,
    overallStatus: KpiStatus.AT_RISK,
    onTrackCount: 0,
    atRiskCount: 1,
    behindCount: 1,
    completedCount: 1,
    items: items.map((item, index) => ({
      id: `kpi-${index}`,
      kpi: {
        id: `def-${index}`,
        code: item.name,
        name: item.name,
        description: '',
        category: 'CODING',
        target: 10,
        unit: 'items',
        frequency: 'WEEKLY',
        weight: 1,
        active: true,
        sortOrder: index,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
      target: 10,
      actual: item.status === KpiStatus.COMPLETED ? 10 : 2,
      progressPercent: item.status === KpiStatus.COMPLETED ? 100 : 20,
      status: item.status,
      current: {
        id: `rec-${index}`,
        frequency: 'WEEKLY',
        periodStart: '2026-09-15',
        periodEnd: '2026-09-21',
        target: 10,
        actual: 2,
        progressPercent: 20,
        status: item.status,
        notes: '',
        source: 'MANUAL',
      },
      history: [],
    })),
  };
}

function projectSummary(
  items: Array<{
    name: string;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
    progressPercent: number;
  }>,
): StudentProjectSummaryDto {
  return {
    studentId: 'student-1',
    overallPercent: 40,
    assignedCount: items.length,
    inProgressCount: items.filter((item) => item.status === 'IN_PROGRESS').length,
    completedCount: items.filter((item) => item.status === 'COMPLETED').length,
    items: items.map((item, index) => ({
      id: `proj-${index}`,
      studentId: 'student-1',
      studentName: 'Yara',
      project: {
        id: `def-${index}`,
        code: `P${index}`,
        name: item.name,
        description: '',
        learningGoal: '',
        purpose: 'EDUCATIONAL',
        path: 'WEB',
        level: 'BEGINNER',
        durationDays: 14,
        active: true,
        sortOrder: index,
        assignmentCount: 1,
      },
      status: item.status,
      progressPercent: item.progressPercent,
      assignedAt: '2026-09-01T00:00:00.000Z',
      notes: '',
      milestones: [],
    })),
  };
}

function roadmap(input: {
  completedCount: number;
  blockedTitle: string;
  inProgressTitle: string;
}): RoadmapResponseDto {
  return {
    id: 'roadmap-1',
    studentId: 'student-1',
    pathId: 'path-1',
    pathCode: 'WEB',
    pathName: 'Web',
    levelId: 'level-1',
    levelCode: 'BEGINNER',
    levelName: 'Beginner',
    generatedAt: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    progress: {
      overallPercent: 35,
      itemCount: 6,
      completedCount: input.completedCount,
      inProgressCount: 1,
      blockedCount: 1,
      phases: [
        {
          phaseId: 'phase-1',
          title: 'Foundations',
          percent: 35,
          completedCount: input.completedCount,
          itemCount: 6,
          blockedCount: 1,
        },
      ],
      blockedItems: [
        {
          id: 'item-blocked',
          phaseId: 'phase-1',
          title: input.blockedTitle,
          description: '',
          durationDays: 3,
          status: 'BLOCKED',
          completionPercentage: 10,
          notes: '',
          sortOrder: 1,
        },
      ],
    },
    phases: [
      {
        id: 'phase-1',
        title: 'Foundations',
        description: '',
        sortOrder: 0,
        progressPercent: 35,
        items: [
          {
            id: 'item-progress',
            phaseId: 'phase-1',
            title: input.inProgressTitle,
            description: '',
            durationDays: 5,
            status: 'IN_PROGRESS',
            completionPercentage: 40,
            notes: '',
            sortOrder: 0,
          },
          {
            id: 'item-blocked',
            phaseId: 'phase-1',
            title: input.blockedTitle,
            description: '',
            durationDays: 3,
            status: 'BLOCKED',
            completionPercentage: 10,
            notes: '',
            sortOrder: 1,
          },
        ],
      },
    ],
  };
}

function progressDashboard(strengths: string, nextFocus: string): StudentProgressDashboardDto {
  return {
    studentId: 'student-1',
    latest:
      strengths || nextFocus
        ? {
            id: 'rev-1',
            studentId: 'student-1',
            kind: 'MONTHLY_REVIEW',
            reviewedAt: '2026-09-16',
            periodStart: '2026-09-01',
            periodEnd: '2026-09-30',
            reviewer: { id: 'mentor-1', displayName: 'Mentor' },
            technicalSkills: 50,
            problemSolving: 50,
            projects: 40,
            independence: 45,
            communication: 55,
            overallScore: 48,
            previousOverallScore: 35,
            overallGrowth: 13,
            kpiOverallPercent: 22,
            projectOverallPercent: 18,
            notes: '',
            strengths,
            nextFocus,
            dimensions: [],
            createdAt: '2026-09-16T00:00:00.000Z',
            updatedAt: '2026-09-16T00:00:00.000Z',
          }
        : null,
    dimensions: [],
    currentScore: 48,
    previousScore: 35,
    growth: 13,
    history: [],
    skillGrowth: { title: '', labels: [], series: [] },
    kpiGrowth: { title: '', labels: [], series: [] },
    projectGrowth: { title: '', labels: [], series: [] },
  };
}
