import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  LevelCode,
  MilestoneKind,
  MilestoneStatus,
  PathCode,
  ProjectPurpose,
  StudentProjectStatus,
} from '@prisma/client';
import { MILESTONE_CATALOG } from './catalog/milestone-catalog';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  const project = {
    id: 'proj-1',
    code: 'FIRST_WEB_PAGE',
    name: 'First Web Page Studio',
    description: 'A classroom web practice for mentor review.',
    learningGoal: 'Ship a personal practice page.',
    purpose: ProjectPurpose.EDUCATIONAL,
    path: PathCode.WEB,
    level: LevelCode.EXPLORER,
    durationDays: 38,
    active: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const student = { id: 'student-1', fullName: 'Yara Hassan' };
  const assignment = {
    id: 'sp-1',
    studentId: student.id,
    projectId: project.id,
    status: StudentProjectStatus.ASSIGNED,
    progressPercent: 0,
    assignedAt: new Date('2026-09-16T00:00:00.000Z'),
    dueDate: new Date('2026-10-24T00:00:00.000Z'),
    notes: '',
    project,
    student,
    milestones: MILESTONE_CATALOG.map((item, index) => ({
      id: `m-${index + 1}`,
      studentProjectId: 'sp-1',
      kind: item.kind,
      title: item.title,
      description: item.description,
      sortOrder: item.sortOrder,
      completionPercent: 0,
      status: MilestoneStatus.NOT_STARTED,
      dueDate: new Date('2026-09-20T00:00:00.000Z'),
      mentorFeedback: '',
    })),
  };

  const prisma = {
    project: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    student: { findUnique: jest.fn() },
    studentProject: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    projectMilestone: { update: jest.fn() },
  };

  const service = new ProjectService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.project.findUnique.mockResolvedValue(project);
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.student.findUnique.mockResolvedValue(student);
    prisma.studentProject.create.mockResolvedValue(assignment);
    prisma.studentProject.findFirst.mockResolvedValue(assignment);
    prisma.studentProject.findMany.mockResolvedValue([assignment]);
    prisma.studentProject.count.mockResolvedValue(1);
    prisma.studentProject.update.mockResolvedValue(assignment);
    prisma.projectMilestone.update.mockResolvedValue(assignment.milestones[0]);
  });

  it('assigns eight milestones and rejects client-case-study copy', async () => {
    const result = await service.assign('proj-1', { studentId: 'student-1' });
    expect(result.milestones).toHaveLength(8);
    expect(result.milestones[0].kind).toBe(MilestoneKind.PLANNING);
    expect(result.milestones[7].kind).toBe(MilestoneKind.PRESENTATION);
    await expect(
      service.createProject({
        name: 'Client portal',
        description: 'A client case study for a local shop.',
        learningGoal: 'Deliver a storefront.',
        path: PathCode.WEB,
        level: LevelCode.EXPLORER,
        durationDays: 38,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates milestone completion and overall progress', async () => {
    const planning = assignment.milestones[0];
    const afterMilestone = {
      ...assignment,
      milestones: assignment.milestones.map((item) =>
        item.id === planning.id
          ? { ...item, completionPercent: 50, status: MilestoneStatus.IN_PROGRESS }
          : item,
      ),
    };
    prisma.studentProject.findFirst
      .mockResolvedValueOnce(assignment)
      .mockResolvedValueOnce(afterMilestone)
      .mockResolvedValueOnce({
        ...afterMilestone,
        progressPercent: 6,
        status: StudentProjectStatus.IN_PROGRESS,
      });

    const result = await service.updateMilestone('student-1', 'sp-1', planning.id, {
      completionPercent: 50,
    });
    expect(prisma.projectMilestone.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          completionPercent: 50,
          status: MilestoneStatus.IN_PROGRESS,
        }),
      }),
    );
    expect(result.progressPercent).toBe(6);
    expect(result.status).toBe(StudentProjectStatus.IN_PROGRESS);
  });

  it('rejects a second assignment of the same project', async () => {
    prisma.studentProject.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.assign('proj-1', { studentId: 'student-1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects a missing milestone', async () => {
    await expect(
      service.updateMilestone('student-1', 'sp-1', 'missing', { completionPercent: 10 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
