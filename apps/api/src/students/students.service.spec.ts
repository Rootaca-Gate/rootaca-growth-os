import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EnglishLevel,
  PathCode,
  ProgrammingExperience,
  StudentLevel,
  StudentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let service: StudentsService;
  const now = new Date('2026-01-15T00:00:00.000Z');
  const student = {
    id: '22222222-2222-4222-8222-222222222222',
    fullName: 'Yara Hassan',
    dateOfBirth: new Date('2012-04-18T00:00:00.000Z'),
    schoolGrade: 'Grade 8',
    phone: '+201001112233',
    parentContact: 'Parent: +201009998877',
    programmingExperience: ProgrammingExperience.BEGINNER,
    programmingLanguages: ['Python'],
    interests: ['Games'],
    learningGoal: 'Build games and learn Python fundamentals.',
    availableHoursPerWeek: 6,
    englishLevel: EnglishLevel.INTERMEDIATE,
    status: StudentStatus.ACTIVE,
    level: StudentLevel.JUNIOR,
    path: PathCode.GAME,
    currentLevelId: null,
    currentPathId: null,
    createdAt: now,
    updatedAt: now,
  };

  const prisma = {
    student: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(StudentsService);
  });

  it('creates a student with a default intake status', async () => {
    prisma.student.create.mockResolvedValue({ ...student, status: StudentStatus.INTAKE });

    const result = await service.create({
      fullName: 'Yara Hassan',
      dateOfBirth: '2012-04-18',
      schoolGrade: 'Grade 8',
      phone: '+201001112233',
      parentContact: 'Parent: +201009998877',
      programmingExperience: ProgrammingExperience.BEGINNER,
      programmingLanguages: ['Python'],
      interests: ['Games'],
      learningGoal: 'Build games and learn Python fundamentals.',
      availableHoursPerWeek: 6,
      englishLevel: EnglishLevel.INTERMEDIATE,
      level: StudentLevel.JUNIOR,
      path: PathCode.GAME,
    });

    expect(result.status).toBe(StudentStatus.INTAKE);
    expect(result.dateOfBirth).toBe('2012-04-18');
    expect(prisma.student.create).toHaveBeenCalled();
  });

  it('rejects an invalid age', async () => {
    await expect(
      service.create({
        fullName: 'Too Young',
        dateOfBirth: '2024-01-01',
        schoolGrade: 'KG',
        phone: '+201001112233',
        parentContact: 'Parent: +201009998877',
        programmingExperience: ProgrammingExperience.NONE,
        programmingLanguages: [],
        interests: [],
        learningGoal: 'Explore programming with a mentor.',
        availableHoursPerWeek: 4,
        englishLevel: EnglishLevel.BEGINNER,
        level: StudentLevel.FOUNDATION,
        path: PathCode.GENERAL,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('paginates and filters students', async () => {
    prisma.$transaction.mockResolvedValue([1, [student]]);

    const result = await service.findAll({
      search: 'Yara',
      status: StudentStatus.ACTIVE,
      level: StudentLevel.JUNIOR,
      path: PathCode.GAME,
      page: 1,
      pageSize: 20,
      sortBy: 'fullName',
      sortOrder: 'asc',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.fullName).toBe('Yara Hassan');
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('throws when a student is missing', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(service.findOne(student.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates status only', async () => {
    prisma.student.findUnique.mockResolvedValue({ id: student.id });
    prisma.student.update.mockResolvedValue({ ...student, status: StudentStatus.PAUSED });

    const result = await service.updateStatus(student.id, StudentStatus.PAUSED);

    expect(result.status).toBe(StudentStatus.PAUSED);
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: student.id },
      data: { status: StudentStatus.PAUSED },
    });
  });
});
