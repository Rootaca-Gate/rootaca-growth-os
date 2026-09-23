import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PartnershipImportMatchConfidence,
  PartnershipImportRowDecision,
  PartnershipImportStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { ImportService } from './import.service';

describe('ImportService', () => {
  let service: ImportService;

  const prisma = {
    partnershipImportJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    partnershipImportRow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    partnershipInstitution: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    partnershipContact: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    partnershipNote: {
      create: jest.fn(),
    },
    partnershipSource: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };

  const audit = { record: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.partnershipInstitution.findMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnershipAuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(ImportService);
  });

  function mockFile(content: string, name = 'schools.csv'): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: name,
      encoding: '7bit',
      mimetype: 'text/csv',
      size: Buffer.byteLength(content),
      buffer: Buffer.from(content),
      destination: '',
      filename: name,
      path: '',
      stream: null as never,
    };
  }

  it('rejects non-csv uploads', async () => {
    await expect(
      service.preview(mockFile('name\nA\n', 'schools.xlsx'), undefined, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a preview job with auto-mapping and default IMPORT for new rows', async () => {
    const csv = 'name,city,website\nExample School,Cairo,https://example.edu.eg\n';
    const now = new Date();
    prisma.partnershipImportJob.create.mockResolvedValue({
      id: 'job-1',
      fileName: 'schools.csv',
      fileSizeBytes: Buffer.byteLength(csv),
      uploadedById: 'user-1',
      uploadedBy: { displayName: 'Admin' },
      status: PartnershipImportStatus.DRAFT,
      headersJson: ['name', 'city', 'website'],
      mappingJson: { name: 'name', city: 'city', website: 'website' },
      summaryJson: {
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        newInstitutions: 1,
        exactDuplicates: 0,
        possibleDuplicates: 0,
        csvDuplicates: 0,
        needsReview: 0,
      },
      resultJson: null,
      errorMessage: null,
      expiresAt: new Date(now.getTime() + 86400000),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const result = await service.preview(mockFile(csv), undefined, 'user-1');

    expect(result.job.id).toBe('job-1');
    expect(result.suggestedMapping.name).toBe('name');
    expect(result.rows[0]?.decision).toBe(PartnershipImportRowDecision.IMPORT);
    expect(result.rows[0]?.matchConfidence).toBe(PartnershipImportMatchConfidence.NONE);
    expect(prisma.partnershipImportJob.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalled();
  });

  it('defaults EXACT database duplicates to SKIP', async () => {
    const csv = 'name,website\nExample School,https://example.edu.eg\n';
    prisma.partnershipInstitution.findMany.mockResolvedValue([
      {
        id: 'inst-1',
        name: 'Example School',
        normalizedName: 'example school',
        normalizedPhone: null,
        normalizedWebsiteDomain: 'example.edu.eg',
        city: null,
        governorate: null,
        generalEmail: null,
        contactEmail: null,
        admissionsEmail: null,
      },
    ]);
    const now = new Date();
    prisma.partnershipImportJob.create.mockImplementation(async ({ data }: { data: { rows: { create: unknown[] } } }) => {
      expect(data.rows.create).toHaveLength(1);
      const createdRow = data.rows.create[0] as {
        decision: PartnershipImportRowDecision;
        matchConfidence: PartnershipImportMatchConfidence;
      };
      expect(createdRow.matchConfidence).toBe(PartnershipImportMatchConfidence.EXACT);
      expect(createdRow.decision).toBe(PartnershipImportRowDecision.SKIP);
      return {
        id: 'job-2',
        fileName: 'schools.csv',
        fileSizeBytes: 10,
        uploadedById: 'user-1',
        uploadedBy: { displayName: 'Admin' },
        status: PartnershipImportStatus.DRAFT,
        headersJson: ['name', 'website'],
        mappingJson: { name: 'name', website: 'website' },
        summaryJson: {
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
          newInstitutions: 0,
          exactDuplicates: 1,
          possibleDuplicates: 0,
          csvDuplicates: 0,
          needsReview: 0,
        },
        resultJson: null,
        errorMessage: null,
        expiresAt: new Date(now.getTime() + 86400000),
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };
    });

    const result = await service.preview(mockFile(csv), undefined, 'user-1');
    expect(result.rows[0]?.decision).toBe(PartnershipImportRowDecision.SKIP);
  });

  it('applies bulk SKIP_ALL_EXACT decisions', async () => {
    prisma.partnershipImportJob.findUnique
      .mockResolvedValueOnce({
        id: 'job-3',
        status: PartnershipImportStatus.DRAFT,
        expiresAt: new Date(Date.now() + 100000),
      })
      .mockResolvedValueOnce({
        id: 'job-3',
        fileName: 'a.csv',
        fileSizeBytes: 1,
        uploadedById: 'user-1',
        uploadedBy: { displayName: 'Admin' },
        status: PartnershipImportStatus.DRAFT,
        headersJson: [],
        mappingJson: {},
        summaryJson: null,
        resultJson: null,
        errorMessage: null,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      });
    prisma.partnershipImportRow.updateMany.mockResolvedValue({ count: 2 });

    await service.updateDecisions('job-3', { bulk: 'SKIP_ALL_EXACT' });
    expect(prisma.partnershipImportRow.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { decision: PartnershipImportRowDecision.SKIP },
      }),
    );
  });
});
