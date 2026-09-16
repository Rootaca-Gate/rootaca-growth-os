import {
  KpiStatus,
  LevelCode,
  OrientationSessionStatus,
  OrientationStage,
  PathCode,
  RoadmapItemStatus,
  StudentLevel,
  StudentProjectStatus,
  StudentStatus,
} from '@prisma/client';
import { DashboardService } from './dashboard.service';

const NOW = new Date('2026-09-16T12:00:00.000Z');

describe('DashboardService', () => {
  const prisma = { student: { findMany: jest.fn() } };
  const service = new DashboardService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates live cards, charts, attention, and sessions', async () => {
    prisma.student.findMany.mockResolvedValue([activeStudent(), intakeStudent(), idleStudent()]);

    const dashboard = await service.getDashboard(NOW);

    expect(dashboard.cards).toEqual({
      totalStudents: 3,
      activeStudents: 1,
      todaysSessions: 2,
      pendingAssessments: 2,
      averageProgress: 72,
      projectsCompleted: 1,
    });
    expect(dashboard.charts.studentsByLevel.map((item) => item.key)).toEqual([
      LevelCode.BEGINNER,
      'INTAKE_JUNIOR',
    ]);
    expect(dashboard.charts.studentsByPath.map((item) => item.key)).toEqual([
      PathCode.WEB,
      PathCode.MOBILE,
    ]);
    expect(dashboard.charts.averageSkillScores).toEqual([
      { key: 'PROGRAMMING_FUNDAMENTALS', label: 'Programming', score: 80, sampleSize: 1 },
    ]);
    expect(dashboard.charts.kpiStatus.find((item) => item.key === KpiStatus.BEHIND)?.count).toBe(1);
    expect(dashboard.charts.monthlyProgress[5]).toMatchObject({
      month: '2026-09',
      average: 72,
      reviewCount: 1,
    });
    expect(dashboard.attention.kpiBelowTarget[0].studentName).toBe('AAA Dashboard Active');
    expect(dashboard.attention.assessmentPending.map((item) => item.studentName)).toEqual([
      'AAA Dashboard Idle',
      'AAA Dashboard Intake',
    ]);
    expect(dashboard.attention.noRecentActivity[0].studentName).toBe('AAA Dashboard Idle');
    expect(dashboard.attention.roadmapBehindSchedule[0].detail).toBe('1 overdue');
    expect(dashboard.recentSessions[0].status).toBe(OrientationSessionStatus.IN_PROGRESS);
    expect(dashboard.upcomingSessions[0].studentName).toBe('AAA Dashboard Intake');
  });

  it('returns empty operational zeros when there are no students', async () => {
    prisma.student.findMany.mockResolvedValue([]);
    const dashboard = await service.getDashboard(NOW);
    expect(dashboard.cards.totalStudents).toBe(0);
    expect(dashboard.cards.averageProgress).toBeNull();
    expect(dashboard.charts.averageSkillScores).toEqual([]);
    expect(dashboard.charts.kpiStatus.every((item) => item.count === 0)).toBe(true);
    expect(dashboard.recentSessions).toEqual([]);
    expect(dashboard.upcomingSessions).toEqual([]);
  });
});

function activeStudent() {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    fullName: 'AAA Dashboard Active',
    status: StudentStatus.ACTIVE,
    level: StudentLevel.JUNIOR,
    path: PathCode.WEB,
    currentLevel: { code: LevelCode.BEGINNER, name: 'Beginner', sortOrder: 2 },
    currentPath: { code: PathCode.WEB, name: 'Web', sortOrder: 1 },
    orientationSessions: [
      session({
        id: 'sess-live',
        status: OrientationSessionStatus.IN_PROGRESS,
        startedAt: NOW,
        updatedAt: NOW,
      }),
      session({
        id: 'sess-done',
        status: OrientationSessionStatus.COMPLETED,
        startedAt: new Date('2026-09-01T00:00:00.000Z'),
        completedAt: new Date('2026-09-01T00:20:00.000Z'),
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-01T00:20:00.000Z'),
        result: { overallScore: 68 },
      }),
    ],
    skills: [
      {
        score: 80,
        skill: { code: 'PROGRAMMING_FUNDAMENTALS', name: 'Programming', sortOrder: 1 },
      },
    ],
    kpis: [
      {
        status: KpiStatus.BEHIND,
        updatedAt: NOW,
      },
    ],
    projects: [
      {
        status: StudentProjectStatus.COMPLETED,
        updatedAt: NOW,
      },
    ],
    progressReviews: [
      {
        overallScore: 72,
        reviewedAt: new Date('2026-09-16T00:00:00.000Z'),
        updatedAt: NOW,
      },
    ],
    roadmap: {
      phases: [
        {
          items: [
            {
              dueDate: new Date('2026-09-01T00:00:00.000Z'),
              status: RoadmapItemStatus.IN_PROGRESS,
            },
          ],
        },
      ],
    },
  };
}

function intakeStudent() {
  const createdAt = new Date('2026-09-16T08:00:00.000Z');
  return {
    id: '22222222-2222-4222-8222-222222222222',
    fullName: 'AAA Dashboard Intake',
    status: StudentStatus.INTAKE,
    level: StudentLevel.JUNIOR,
    path: PathCode.MOBILE,
    currentLevel: null,
    currentPath: null,
    orientationSessions: [
      session({
        id: 'sess-draft',
        studentId: '22222222-2222-4222-8222-222222222222',
        status: OrientationSessionStatus.DRAFT,
        createdAt,
        updatedAt: createdAt,
      }),
    ],
    skills: [],
    kpis: [],
    projects: [],
    progressReviews: [],
    roadmap: null,
  };
}

function idleStudent() {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    fullName: 'AAA Dashboard Idle',
    status: StudentStatus.INTAKE,
    level: StudentLevel.JUNIOR,
    path: PathCode.WEB,
    currentLevel: null,
    currentPath: null,
    orientationSessions: [],
    skills: [],
    kpis: [],
    projects: [],
    progressReviews: [],
    roadmap: null,
  };
}

function session(overrides: Record<string, unknown>) {
  return {
    id: 'sess',
    studentId: '11111111-1111-4111-8111-111111111111',
    status: OrientationSessionStatus.DRAFT,
    currentStage: OrientationStage.STUDENT_PROFILE,
    startedAt: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    result: null,
    ...overrides,
  };
}
