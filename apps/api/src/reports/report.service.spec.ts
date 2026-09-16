import { NotFoundException } from '@nestjs/common';
import { KpiStatus } from '@prisma/client';
import { ReportService } from './report.service';

describe('ReportService', () => {
  const student = {
    id: 'student-1',
    fullName: 'Yara Hassan',
    dateOfBirth: '2012-04-18',
    schoolGrade: 'Grade 8',
    phone: '+201000000001',
    parentContact: 'Parent',
    programmingExperience: 'BEGINNER',
    programmingLanguages: ['Scratch'],
    interests: ['Web'],
    learningGoal: 'Build websites',
    availableHoursPerWeek: 6,
    englishLevel: 'INTERMEDIATE',
    status: 'ACTIVE',
    level: 'JUNIOR',
    path: 'WEB',
    currentLevel: {
      id: 'level-1',
      code: 'BEGINNER',
      name: 'Beginner',
      description: 'First independent pages',
      sortOrder: 1,
    },
    currentPath: {
      id: 'path-1',
      code: 'WEB',
      name: 'Web Development',
      description: 'HTML, CSS, and JavaScript',
      sortOrder: 0,
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const prisma = {
    orientationSession: { findFirst: jest.fn() },
  };
  const studentsService = { findOne: jest.fn() };
  const placementService = {
    listStudentSkills: jest.fn(),
    getStudentPlacement: jest.fn(),
  };
  const roadmapService = { getForStudent: jest.fn() };
  const kpiService = { getStudentDashboard: jest.fn() };
  const projectService = { listStudentProjects: jest.fn() };
  const progressService = { getDashboard: jest.fn() };

  const service = new ReportService(
    prisma as never,
    studentsService as never,
    placementService as never,
    roadmapService as never,
    kpiService as never,
    projectService as never,
    progressService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    studentsService.findOne.mockResolvedValue(student);
    placementService.listStudentSkills.mockResolvedValue([
      {
        skillId: 's1',
        code: 'PROGRAMMING_FUNDAMENTALS',
        name: 'Programming Fundamentals',
        score: 72,
      },
    ]);
    placementService.getStudentPlacement.mockRejectedValue(
      new NotFoundException('Placement is not available until an assessment is completed'),
    );
    roadmapService.getForStudent.mockRejectedValue(
      new NotFoundException('Roadmap is not available'),
    );
    kpiService.getStudentDashboard.mockResolvedValue({
      studentId: student.id,
      overallPercent: 0,
      overallStatus: KpiStatus.BEHIND,
      onTrackCount: 0,
      atRiskCount: 0,
      behindCount: 0,
      completedCount: 0,
      items: [],
    });
    projectService.listStudentProjects.mockResolvedValue({
      studentId: student.id,
      overallPercent: 0,
      assignedCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      items: [],
    });
    progressService.getDashboard.mockResolvedValue({
      studentId: student.id,
      latest: null,
      dimensions: [],
      currentScore: 0,
      previousScore: null,
      growth: null,
      history: [],
      skillGrowth: { title: '', labels: [], series: [] },
      kpiGrowth: { title: '', labels: [], series: [] },
      projectGrowth: { title: '', labels: [], series: [] },
    });
    prisma.orientationSession.findFirst.mockResolvedValue(null);
  });

  it('assembles a flattened progress report when optional sections are missing', async () => {
    const report = await service.getReport('student-1', 'en');

    expect(report.student.fullName).toBe('Yara Hassan');
    expect(report.currentLevel?.name).toBe('Beginner');
    expect(report.recommendedPath?.name).toBe('Web Development');
    expect(report.assessment).toBeNull();
    expect(report.roadmap).toBeNull();
    expect(report.skills).toHaveLength(1);
    expect(report.title).toBe('Student Progress Report');
    expect(report.fileName).toContain('ROOTACA-Progress-Yara-Hassan');
  });

  it('localizes section copy for Arabic reports', async () => {
    const report = await service.getReport('student-1', 'ar');
    expect(report.locale).toBe('ar');
    expect(report.title).toBe('تقرير تقدم الطالب');
    expect(report.student.fields[0].label).toBe('الاسم الكامل');
    expect(report.student.fields.find((field) => field.label === 'الصف الدراسي')?.value).toBe(
      'الصف 8',
    );
    expect(report.student.fields.find((field) => field.label === 'الاهتمامات')?.value).toBe(
      'الويب',
    );
    expect(report.skills[0].name).toBe('أساسيات البرمجة');
    expect(report.currentLevel?.name).toBe('مبتدئ');
  });
});
