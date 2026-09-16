import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReviewKind } from '@prisma/client';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  const reviewer = { id: 'mentor-1', displayName: 'ROOTACA Mentor' };
  const initial = {
    id: 'rev-1',
    studentId: 'student-1',
    kind: ReviewKind.INITIAL_ASSESSMENT,
    reviewedAt: new Date('2026-08-01T00:00:00.000Z'),
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-08-01T00:00:00.000Z'),
    reviewerId: reviewer.id,
    reviewer,
    technicalSkills: 40,
    problemSolving: 30,
    projects: 20,
    independence: 35,
    communication: 50,
    overallScore: 35,
    kpiOverallPercent: 10,
    projectOverallPercent: 6,
    notes: 'Baseline',
    strengths: 'Asks questions',
    nextFocus: 'Planning',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };
  const monthly = {
    ...initial,
    id: 'rev-2',
    kind: ReviewKind.MONTHLY_REVIEW,
    reviewedAt: new Date('2026-09-16T00:00:00.000Z'),
    periodStart: new Date('2026-09-01T00:00:00.000Z'),
    periodEnd: new Date('2026-09-30T00:00:00.000Z'),
    technicalSkills: 55,
    problemSolving: 45,
    projects: 40,
    independence: 50,
    communication: 60,
    overallScore: 50,
    kpiOverallPercent: 22,
    projectOverallPercent: 12,
    notes: 'Clearer plans',
    createdAt: new Date('2026-09-16T00:00:00.000Z'),
    updatedAt: new Date('2026-09-16T00:00:00.000Z'),
  };

  const prisma = {
    student: { findUnique: jest.fn() },
    progressReview: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    studentKpi: { findMany: jest.fn() },
    studentProject: { findMany: jest.fn() },
    kpiRecord: { findMany: jest.fn() },
  };

  const service = new ProgressService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.student.findUnique.mockResolvedValue({ id: 'student-1' });
    prisma.studentKpi.findMany.mockResolvedValue([]);
    prisma.studentProject.findMany.mockResolvedValue([]);
    prisma.kpiRecord.findMany.mockResolvedValue([]);
    prisma.progressReview.findFirst.mockResolvedValue(null);
  });

  it('creates a monthly review with growth versus the initial assessment', async () => {
    prisma.progressReview.create.mockResolvedValue(monthly);
    prisma.progressReview.findMany.mockResolvedValue([initial, monthly]);

    const result = await service.create('student-1', reviewer.id, {
      kind: ReviewKind.MONTHLY_REVIEW,
      reviewedAt: '2026-09-16',
      technicalSkills: 55,
      problemSolving: 45,
      projects: 40,
      independence: 50,
      communication: 60,
      notes: 'Clearer plans',
    });

    expect(prisma.progressReview.create).toHaveBeenCalled();
    expect(result.overallScore).toBe(50);
    expect(result.previousOverallScore).toBe(35);
    expect(result.overallGrowth).toBe(15);
    expect(result.dimensions.find((item) => item.key === 'technicalSkills')?.growth).toBe(15);
  });

  it('rejects a second initial assessment', async () => {
    prisma.progressReview.findFirst.mockResolvedValue(initial);
    await expect(
      service.create('student-1', reviewer.id, {
        kind: ReviewKind.INITIAL_ASSESSMENT,
        technicalSkills: 10,
        problemSolving: 10,
        projects: 10,
        independence: 10,
        communication: 10,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 when the student is missing', async () => {
    prisma.student.findUnique.mockResolvedValue(null);
    await expect(service.list('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('builds skill, KPI, and project growth charts', async () => {
    prisma.progressReview.findMany.mockResolvedValue([initial, monthly]);
    prisma.kpiRecord.findMany.mockResolvedValue([
      {
        periodStart: new Date('2026-08-01T00:00:00.000Z'),
        progressPercent: 10,
        studentKpi: { kpi: { weight: 1, name: 'Coding Problems' } },
      },
      {
        periodStart: new Date('2026-09-01T00:00:00.000Z'),
        progressPercent: 40,
        studentKpi: { kpi: { weight: 1, name: 'Coding Problems' } },
      },
    ]);
    prisma.studentProject.findMany.mockResolvedValue([
      {
        id: 'sp-1',
        assignedAt: new Date('2026-08-15T00:00:00.000Z'),
        progressPercent: 6,
        project: { name: 'First Web Page Studio' },
      },
    ]);

    const dashboard = await service.getDashboard('student-1');
    expect(dashboard.latest?.overallScore).toBe(50);
    expect(dashboard.growth).toBe(15);
    expect(dashboard.skillGrowth.series).toHaveLength(5);
    expect(dashboard.skillGrowth.labels).toEqual(['2026-08-01', '2026-09-16']);
    expect(dashboard.kpiGrowth.title).toBe('KPI Growth');
    expect(dashboard.projectGrowth.title).toBe('Project Growth');
    expect(dashboard.projectGrowth.series.some((item) => item.label === 'Classroom projects')).toBe(
      true,
    );
  });
});
