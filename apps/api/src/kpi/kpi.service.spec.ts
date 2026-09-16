import { ConflictException, NotFoundException } from '@nestjs/common';
import { KpiCategory, KpiFrequency, KpiRecordSource, KpiStatus } from '@prisma/client';
import { KpiService } from './kpi.service';

describe('KpiService', () => {
  const kpi = {
    id: 'kpi-1',
    code: 'CODING_PROBLEMS',
    name: 'Coding Problems',
    description: 'Weekly problems',
    category: KpiCategory.CODING,
    target: 10,
    unit: 'problems',
    frequency: KpiFrequency.WEEKLY,
    weight: 15,
    active: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const studentKpi = {
    id: 'sk-1',
    studentId: 'student-1',
    kpiId: kpi.id,
    kpi,
    target: 10,
    actual: 0,
    progressPercent: 0,
    status: KpiStatus.ON_TRACK,
    active: true,
    records: [] as unknown[],
  };
  const record = {
    id: 'rec-1',
    studentKpiId: studentKpi.id,
    frequency: KpiFrequency.WEEKLY,
    periodStart: new Date('2026-09-14T00:00:00.000Z'),
    periodEnd: new Date('2026-09-20T00:00:00.000Z'),
    target: 10,
    actual: 0,
    progressPercent: 0,
    status: KpiStatus.ON_TRACK,
    notes: '',
    source: KpiRecordSource.SYSTEM,
  };

  const prisma = {
    kpi: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    student: { findUnique: jest.fn() },
    studentKpi: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    studentSkill: { findMany: jest.fn() },
    roadmap: { findUnique: jest.fn() },
    kpiRecord: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const service = new KpiService(prisma as never);
  const now = new Date('2026-09-16T12:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.kpi.findMany.mockResolvedValue([kpi]);
    prisma.student.findUnique.mockResolvedValue({
      id: 'student-1',
      availableHoursPerWeek: 6,
    });
    prisma.studentKpi.upsert.mockResolvedValue(studentKpi);
    prisma.studentKpi.findMany.mockResolvedValue([
      {
        ...studentKpi,
        records: [
          { ...record, frequency: KpiFrequency.WEEKLY },
          { ...record, id: 'rec-m', frequency: KpiFrequency.MONTHLY },
        ],
      },
    ]);
    prisma.studentKpi.findFirst.mockResolvedValue(studentKpi);
    prisma.studentKpi.update.mockResolvedValue(studentKpi);
    prisma.studentSkill.findMany.mockResolvedValue([]);
    prisma.roadmap.findUnique.mockResolvedValue(null);
    prisma.kpiRecord.upsert.mockResolvedValue(record);
    prisma.kpiRecord.findUnique.mockResolvedValue(record);
    prisma.kpiRecord.findMany.mockResolvedValue([record]);
    prisma.kpiRecord.update.mockResolvedValue({
      ...record,
      actual: 8,
      progressPercent: 80,
      status: KpiStatus.ON_TRACK,
    });
  });

  it('records actuals and derives progress plus status', async () => {
    const result = await service.recordActual('student-1', 'sk-1', { actual: 8 }, now);
    expect(prisma.kpiRecord.update).toHaveBeenCalled();
    const payload = prisma.kpiRecord.update.mock.calls
      .map(
        (call) =>
          call[0] as {
            data: {
              actual?: number;
              progressPercent?: number;
              status?: KpiStatus;
              source?: KpiRecordSource;
            };
          },
      )
      .find((call) => call.data.actual === 8);
    expect(payload?.data.progressPercent).toBe(80);
    expect(payload?.data.status).toBe(KpiStatus.ON_TRACK);
    expect(payload?.data.source).toBe(KpiRecordSource.MANUAL);
    expect(result.studentId).toBe('student-1');
  });

  it('rejects recording against a missing student KPI', async () => {
    prisma.studentKpi.findFirst.mockResolvedValue(null);
    await expect(
      service.recordActual('student-1', 'missing', { actual: 1 }, now),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects duplicate KPI codes', async () => {
    prisma.kpi.findFirst.mockResolvedValue(kpi);
    prisma.kpi.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.createDefinition({
        name: 'Coding Problems',
        description: 'Duplicate default KPI name here.',
        category: KpiCategory.CODING,
        target: 10,
        unit: 'problems',
        frequency: KpiFrequency.WEEKLY,
        weight: 10,
        code: 'CODING_PROBLEMS',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
