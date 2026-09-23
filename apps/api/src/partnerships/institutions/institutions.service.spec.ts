import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PartnershipFollowUpStatus,
  PartnershipInstitutionStatus,
  PartnershipLeadPriority,
  PartnershipLeadStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { CLOSED_LEAD_STATUSES, OPEN_FOLLOW_UP_STATUS } from './institution-list.constants';
import { InstitutionsService } from './institutions.service';

describe('InstitutionsService', () => {
  let service: InstitutionsService;
  const now = new Date('2026-09-22T00:00:00.000Z');
  const institution = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'ABC International School',
    arabicName: null,
    englishName: 'ABC International School',
    normalizedName: 'abc international school',
    institutionType: null,
    institutionCategory: null,
    curriculum: null,
    educationLevel: null,
    gender: null,
    ageRange: null,
    governorate: 'Cairo',
    city: 'New Cairo',
    district: null,
    fullAddress: null,
    phone: '+201001112233',
    mobile: null,
    whatsapp: null,
    normalizedPhone: '+201001112233',
    generalEmail: 'info@abc.edu.eg',
    admissionsEmail: null,
    contactEmail: null,
    website: 'https://www.abc.edu.eg',
    normalizedWebsiteDomain: 'abc.edu.eg',
    facebook: null,
    instagram: null,
    linkedin: null,
    youtube: null,
    tiktok: null,
    googleMapsUrl: null,
    hasCoding: true,
    hasRobotics: false,
    hasStem: true,
    hasAi: false,
    hasTechClub: false,
    hasAfterSchool: false,
    hasSummerCamp: false,
    hasMakerspace: false,
    partnershipType: null,
    leadPriority: PartnershipLeadPriority.MEDIUM,
    leadPriorityReason: null,
    status: PartnershipInstitutionStatus.PROSPECT,
    notes: '',
    branchName: null,
    parentInstitutionId: null,
    sourceId: null,
    metadata: null,
    lastVerifiedAt: null,
    deletedAt: null,
    deletedById: null,
    createdAt: now,
    updatedAt: now,
  };

  const institutionB = {
    ...institution,
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'Beta Academy',
    normalizedName: 'beta academy',
  };

  const prisma = {
    partnershipInstitution: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    partnershipSource: {
      findUnique: jest.fn(),
    },
    partnershipContact: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    partnershipActivity: {
      groupBy: jest.fn(),
    },
    partnershipFollowUp: {
      groupBy: jest.fn(),
    },
    partnershipLead: {
      groupBy: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const audit = {
    record: jest.fn(),
  };

  function mockEmptyEnrichment() {
    prisma.partnershipContact.findMany.mockResolvedValue([]);
    prisma.partnershipContact.findFirst.mockResolvedValue(null);
    prisma.partnershipActivity.groupBy.mockResolvedValue([]);
    prisma.partnershipFollowUp.groupBy.mockResolvedValue([]);
    prisma.partnershipLead.groupBy.mockResolvedValue([]);
    prisma.partnershipLead.findFirst.mockResolvedValue(null);
    prisma.partnershipLead.create.mockResolvedValue({
      id: 'lead-default',
      institutionId: institution.id,
    });
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockEmptyEnrichment();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnershipAuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(InstitutionsService);
  });

  it('creates an institution with normalization and duplicate warning', async () => {
    prisma.partnershipInstitution.findMany.mockResolvedValue([]);
    prisma.partnershipInstitution.create.mockResolvedValue(institution);

    const result = await service.create(
      {
        name: '  ABC International School  ',
        phone: '+20 100 111 2233',
        website: 'https://www.abc.edu.eg/about',
        generalEmail: 'Info@ABC.edu.eg',
      },
      'user-1',
    );

    expect(result.name).toBe('ABC International School');
    expect(prisma.partnershipInstitution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          normalizedName: 'abc international school',
          normalizedPhone: '+201001112233',
          normalizedWebsiteDomain: 'abc.edu.eg',
          generalEmail: 'info@abc.edu.eg',
        }),
      }),
    );
    expect(audit.record).toHaveBeenCalled();
    expect(prisma.partnershipLead.create).toHaveBeenCalled();
    expect(result.primaryContact).toBeNull();
    expect(result.openFollowUpsCount).toBe(0);
    expect(result.activeLeadsCount).toBe(0);
  });

  it('paginates and excludes soft-deleted by default', async () => {
    prisma.partnershipInstitution.count.mockResolvedValue(1);
    prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.primaryContact).toBeNull();
    expect(result.items[0]?.lastActivityAt).toBeNull();
    expect(result.items[0]?.nextFollowUpAt).toBeNull();
    expect(result.items[0]?.openFollowUpsCount).toBe(0);
    expect(result.items[0]?.activeLeadsCount).toBe(0);
    expect(prisma.partnershipInstitution.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([expect.objectContaining({ deletedAt: null })]),
        }),
      }),
    );
    expect(prisma.partnershipContact.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.partnershipActivity.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.partnershipFollowUp.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.partnershipLead.groupBy).toHaveBeenCalledTimes(1);
  });

  it('soft deletes and restores', async () => {
    prisma.partnershipInstitution.findFirst.mockResolvedValue(institution);
    prisma.partnershipInstitution.update.mockResolvedValue({
      ...institution,
      deletedAt: now,
      deletedById: 'user-1',
    });

    await service.softDelete(institution.id, 'user-1');
    expect(audit.record).toHaveBeenCalled();

    prisma.partnershipInstitution.findUnique.mockResolvedValue({
      ...institution,
      deletedAt: now,
      deletedById: 'user-1',
    });
    prisma.partnershipInstitution.update.mockResolvedValue({
      ...institution,
      deletedAt: null,
      deletedById: null,
    });

    const restored = await service.restore(institution.id, 'user-1');
    expect(restored.deletedAt).toBeNull();
  });

  it('throws when institution missing', async () => {
    prisma.partnershipInstitution.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('detects potential duplicates by normalized website', async () => {
    prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);
    const dupes = await service.findPotentialDuplicates({
      normalizedName: 'other',
      normalizedPhone: null,
      normalizedWebsiteDomain: 'abc.edu.eg',
      city: null,
    });
    expect(dupes[0]?.matchedOn).toContain('normalizedWebsiteDomain');
  });

  describe('list enrichment', () => {
    it('selects primary contact deterministically (isPrimary then earliest createdAt)', async () => {
      prisma.partnershipInstitution.count.mockResolvedValue(1);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);
      prisma.partnershipContact.findMany.mockResolvedValue([
        {
          id: 'contact-primary',
          institutionId: institution.id,
          fullName: 'Primary Contact',
          jobTitle: 'Principal',
          email: 'primary@abc.edu.eg',
          phone: '+201000000001',
          mobile: null,
          whatsapp: null,
        },
        {
          id: 'contact-secondary',
          institutionId: institution.id,
          fullName: 'Secondary Contact',
          jobTitle: 'Admin',
          email: 'admin@abc.edu.eg',
          phone: null,
          mobile: null,
          whatsapp: null,
        },
      ]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.items[0]?.primaryContact).toEqual({
        id: 'contact-primary',
        name: 'Primary Contact',
        jobTitle: 'Principal',
        email: 'primary@abc.edu.eg',
        phone: '+201000000001',
        mobile: null,
        whatsapp: null,
      });
      expect(prisma.partnershipContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { institutionId: { in: [institution.id] } },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        }),
      );
    });

    it('returns null primary contact when institution has no contacts', async () => {
      prisma.partnershipInstitution.count.mockResolvedValue(1);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);

      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.items[0]?.primaryContact).toBeNull();
    });

    it('returns lastActivityAt as max activityDate and null when none', async () => {
      prisma.partnershipInstitution.count.mockResolvedValue(2);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institution, institutionB]);
      prisma.partnershipActivity.groupBy.mockResolvedValue([
        {
          institutionId: institution.id,
          _max: { activityDate: new Date('2026-09-20T15:00:00.000Z') },
        },
      ]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.items[0]?.lastActivityAt).toBe('2026-09-20T15:00:00.000Z');
      expect(result.items[1]?.lastActivityAt).toBeNull();
      expect(prisma.partnershipActivity.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['institutionId'],
          _max: { activityDate: true },
          where: { institutionId: { in: [institution.id, institutionB.id] } },
        }),
      );
    });

    it('returns earliest PENDING follow-up as nextFollowUpAt and open count', async () => {
      prisma.partnershipInstitution.count.mockResolvedValue(1);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);
      prisma.partnershipFollowUp.groupBy.mockResolvedValue([
        {
          institutionId: institution.id,
          _min: { dueDate: new Date('2026-09-25T00:00:00.000Z') },
          _count: { _all: 2 },
        },
      ]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.items[0]?.nextFollowUpAt).toBe('2026-09-25');
      expect(result.items[0]?.openFollowUpsCount).toBe(2);
      expect(prisma.partnershipFollowUp.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            institutionId: { in: [institution.id] },
            status: OPEN_FOLLOW_UP_STATUS,
          },
          _min: { dueDate: true },
          _count: { _all: true },
        }),
      );
      expect(OPEN_FOLLOW_UP_STATUS).toBe(PartnershipFollowUpStatus.PENDING);
    });

    it('returns null nextFollowUpAt and zero open count when no PENDING follow-ups', async () => {
      prisma.partnershipInstitution.count.mockResolvedValue(1);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);

      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.items[0]?.nextFollowUpAt).toBeNull();
      expect(result.items[0]?.openFollowUpsCount).toBe(0);
    });

    it('counts active leads excluding closed statuses', async () => {
      prisma.partnershipInstitution.count.mockResolvedValue(1);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);
      prisma.partnershipLead.groupBy.mockResolvedValue([
        {
          institutionId: institution.id,
          _count: { _all: 3 },
        },
      ]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.items[0]?.activeLeadsCount).toBe(3);
      expect(prisma.partnershipLead.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            institutionId: { in: [institution.id] },
            status: { notIn: CLOSED_LEAD_STATUSES },
          },
        }),
      );
      expect(CLOSED_LEAD_STATUSES).toEqual(
        expect.arrayContaining([
          PartnershipLeadStatus.PARTNER,
          PartnershipLeadStatus.NOT_INTERESTED,
          PartnershipLeadStatus.NO_RESPONSE,
          PartnershipLeadStatus.LOST,
        ]),
      );
    });

    it('enriches each page independently with a constant number of queries', async () => {
      prisma.partnershipInstitution.count.mockResolvedValue(2);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);
      prisma.partnershipContact.findMany.mockResolvedValue([
        {
          id: 'c1',
          institutionId: institution.id,
          fullName: 'Only Contact',
          jobTitle: null,
          email: 'only@abc.edu.eg',
          phone: null,
          mobile: '+201099999999',
          whatsapp: null,
        },
      ]);
      prisma.partnershipActivity.groupBy.mockResolvedValue([
        {
          institutionId: institution.id,
          _max: { activityDate: new Date('2026-09-21T10:00:00.000Z') },
        },
      ]);
      prisma.partnershipFollowUp.groupBy.mockResolvedValue([
        {
          institutionId: institution.id,
          _min: { dueDate: new Date('2026-10-01T00:00:00.000Z') },
          _count: { _all: 1 },
        },
      ]);
      prisma.partnershipLead.groupBy.mockResolvedValue([
        { institutionId: institution.id, _count: { _all: 1 } },
      ]);

      const page1 = await service.findAll({ page: 1, pageSize: 1 });
      expect(page1.items).toHaveLength(1);
      expect(page1.items[0]?.primaryContact?.name).toBe('Only Contact');
      expect(page1.items[0]?.lastActivityAt).toBe('2026-09-21T10:00:00.000Z');
      expect(page1.items[0]?.nextFollowUpAt).toBe('2026-10-01');
      expect(page1.items[0]?.openFollowUpsCount).toBe(1);
      expect(page1.items[0]?.activeLeadsCount).toBe(1);

      jest.clearAllMocks();
      mockEmptyEnrichment();
      prisma.partnershipInstitution.count.mockResolvedValue(2);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institutionB]);

      const page2 = await service.findAll({ page: 2, pageSize: 1 });
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0]?.id).toBe(institutionB.id);
      expect(page2.items[0]?.primaryContact).toBeNull();
      expect(prisma.partnershipContact.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.partnershipActivity.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.partnershipFollowUp.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.partnershipLead.groupBy).toHaveBeenCalledTimes(1);
    });

    it('preserves status filter while enriching', async () => {
      prisma.partnershipInstitution.count.mockResolvedValue(1);
      prisma.partnershipInstitution.findMany.mockResolvedValue([institution]);

      await service.findAll({
        page: 1,
        pageSize: 20,
        status: PartnershipInstitutionStatus.PROSPECT,
      });

      expect(prisma.partnershipInstitution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ status: PartnershipInstitutionStatus.PROSPECT }),
            ]),
          }),
        }),
      );
    });
  });
});
