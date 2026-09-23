import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PartnershipResearchDuplicateStatus,
  PartnershipResearchJobStatus,
  PartnershipResearchStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { loadResearchDiscoveryConfig } from './providers/discovery.config';
import { createResearchProviderBundle } from './providers/provider.factory';
import { ResearchService } from './research.service';

describe('ResearchService', () => {
  let service: ResearchService;

  const prisma = {
    partnershipResearchJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    partnershipResearchEvidence: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    partnershipResearchCandidate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
    },
    partnershipInstitution: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    partnershipContact: { create: jest.fn() },
    partnershipNote: { create: jest.fn() },
    partnershipSource: { findFirst: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };

  const audit = { record: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.partnershipInstitution.findMany.mockResolvedValue([]);
    prisma.partnershipResearchCandidate.findMany.mockResolvedValue([]);
    prisma.partnershipResearchCandidate.count.mockResolvedValue(0);
    prisma.partnershipResearchCandidate.groupBy.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnershipAuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(ResearchService);
    service.useProvidersForTests(createResearchProviderBundle({}));
  });

  it('creates a job with planned queries and no fake results', async () => {
    const now = new Date();
    prisma.partnershipResearchJob.create.mockResolvedValue({
      id: 'job-1',
      name: 'Giza research',
      governorate: 'Giza',
      city: '6th of October',
      district: null,
      institutionType: 'SCHOOL',
      institutionCategory: null,
      curriculum: null,
      language: 'BOTH',
      technologyJson: { hasCoding: true },
      queriesJson: [{ language: 'en', text: 'schools in 6th of October, Giza Egypt' }],
      maxResultsPerQuery: 20,
      maxQueries: 24,
      maxCandidates: 200,
      status: PartnershipResearchJobStatus.DRAFT,
      statisticsJson: null,
      errorMessage: null,
      providerNote: 'Automated discovery provider not configured.',
      requestedById: 'user-1',
      requestedBy: { displayName: 'Admin' },
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const job = await service.createJob(
      {
        name: 'Giza research',
        governorate: 'Giza',
        city: '6th of October',
        institutionType: 'SCHOOL' as never,
        technology: { hasCoding: true },
      },
      'user-1',
    );

    expect(job.id).toBe('job-1');
    expect(job.queries.length).toBeGreaterThan(0);
    expect(job.providerNote).toContain('not configured');
    expect(audit.record).toHaveBeenCalled();
  });

  it('runJob completes without inventing search results when provider not configured', async () => {
    const now = new Date();
    prisma.partnershipResearchJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: PartnershipResearchJobStatus.DRAFT,
      governorate: 'Cairo',
      city: 'New Cairo',
      district: null,
      institutionType: 'SCHOOL',
      institutionCategory: null,
      curriculum: null,
      language: 'EN',
      technologyJson: {},
      maxQueries: 10,
      maxResultsPerQuery: 20,
      maxCandidates: 200,
      startedAt: null,
    });
    prisma.partnershipResearchJob.update
      .mockResolvedValueOnce({
        id: 'job-1',
        status: PartnershipResearchJobStatus.RUNNING,
      })
      .mockResolvedValueOnce({
        id: 'job-1',
        name: 'Cairo',
        governorate: 'Cairo',
        city: 'New Cairo',
        district: null,
        institutionType: 'SCHOOL',
        institutionCategory: null,
        curriculum: null,
        language: 'EN',
        technologyJson: {},
        queriesJson: [],
        maxResultsPerQuery: 20,
        maxQueries: 10,
        maxCandidates: 200,
        status: PartnershipResearchJobStatus.COMPLETED,
        statisticsJson: {
          queriesPlanned: 1,
          queriesExecuted: 0,
          resultsDiscovered: 0,
          uniqueCandidates: 0,
        },
        errorMessage: null,
        providerNote: 'Research discovery provider is not configured.',
        requestedById: 'user-1',
        requestedBy: { displayName: 'Admin' },
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      });

    const result = await service.runJob('job-1', 'user-1');
    expect(result.status).toBe(PartnershipResearchJobStatus.COMPLETED);
    expect(result.statistics?.queriesExecuted).toBe(0);
    expect(result.statistics?.resultsDiscovered).toBe(0);
    expect(result.providerNote).toMatch(/not configured/i);
  });

  it('runJob executes WEB_SEARCH and creates candidates from fixtures', async () => {
    const now = new Date();
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        organic: [
          {
            title: 'Example International School | Official Site',
            link: 'https://example-school.test',
            snippet: 'British curriculum STEM robotics in Cairo',
            position: 1,
          },
          {
            title: 'Top 10 International Schools in Cairo',
            link: 'https://edarabia.com/top-schools',
            snippet: 'Directory listing',
            position: 2,
          },
        ],
      }),
    });

    const configured = createResearchProviderBundle(
      {
        RESEARCH_DISCOVERY_PROVIDER: 'WEB_SEARCH',
        RESEARCH_DISCOVERY_API_KEY: 'test-key',
        RESEARCH_DISCOVERY_ENGINE: 'serper',
        RESEARCH_DISCOVERY_REQUEST_DELAY_MS: '0',
        RESEARCH_DISCOVERY_CONCURRENCY: '1',
        RESEARCH_ENRICHMENT_ENABLED: 'false',
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: async () => undefined },
    );

    const configuredService = new ResearchService(
      prisma as unknown as PrismaService,
      audit as unknown as PartnershipAuditService,
    );
    configuredService.useProvidersForTests(configured);

    prisma.partnershipResearchJob.findUnique.mockResolvedValue({
      id: 'job-2',
      status: PartnershipResearchJobStatus.DRAFT,
      governorate: 'Cairo',
      city: 'Cairo',
      district: null,
      institutionType: 'SCHOOL',
      institutionCategory: null,
      curriculum: null,
      language: 'EN',
      technologyJson: { hasStem: true },
      maxQueries: 2,
      maxResultsPerQuery: 5,
      maxCandidates: 50,
      startedAt: null,
    });

    prisma.partnershipResearchJob.update
      .mockResolvedValueOnce({ id: 'job-2', status: 'RUNNING' })
      .mockResolvedValueOnce({
        id: 'job-2',
        name: 'Cairo search',
        governorate: 'Cairo',
        city: 'Cairo',
        district: null,
        institutionType: 'SCHOOL',
        institutionCategory: null,
        curriculum: null,
        language: 'EN',
        technologyJson: {},
        queriesJson: [],
        maxResultsPerQuery: 5,
        maxQueries: 2,
        maxCandidates: 50,
        status: PartnershipResearchJobStatus.COMPLETED,
        statisticsJson: {
          queriesExecuted: 1,
          resultsDiscovered: 2,
          candidatesCreated: 1,
        },
        errorMessage: null,
        providerNote: 'WEB_SEARCH',
        requestedById: 'user-1',
        requestedBy: { displayName: 'Admin' },
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      });

    prisma.partnershipResearchCandidate.create.mockImplementation(async ({ data }) => ({
      id: 'cand-new',
      ...data,
      discoveredNameAr: null,
      discoveredNameEn: null,
      country: 'Egypt',
      address: null,
      educationLevel: null,
      mobile: null,
      whatsapp: null,
      googleMapsUrl: null,
      discoveredAt: now,
      lastCheckedAt: null,
      createdAt: now,
      updatedAt: now,
      evidence: [],
      normalizedName: data.normalizedName ?? 'example international school',
      normalizedPhone: null,
      normalizedWebsiteDomain: data.normalizedWebsiteDomain ?? 'example-school.test',
      duplicateStatus: PartnershipResearchDuplicateStatus.NEW,
      researchStatus: PartnershipResearchStatus.READY_FOR_REVIEW,
      verificationStatus: 'UNVERIFIED',
      dataQuality: 'MEDIUM',
      duplicateOfCandidateId: null,
      matchedInstitutionId: null,
    }));

    prisma.partnershipResearchCandidate.groupBy.mockResolvedValue([
      {
        researchStatus: PartnershipResearchStatus.READY_FOR_REVIEW,
        duplicateStatus: PartnershipResearchDuplicateStatus.NEW,
        _count: 1,
      },
    ]);

    const result = await configuredService.runJob('job-2', 'user-1');
    expect(fetchImpl).toHaveBeenCalled();
    expect(prisma.partnershipResearchCandidate.create).toHaveBeenCalled();
    expect(result.status).toBe(PartnershipResearchJobStatus.COMPLETED);
    const createCalls = prisma.partnershipResearchCandidate.create.mock.calls;
    const names = createCalls.map((call) => call[0].data.discoveredName as string);
    expect(names.some((n) => /Example International School/i.test(n))).toBe(true);
    expect(names.every((n) => !/Top 10 International Schools/i.test(n))).toBe(true);
    const schoolCreate = createCalls.find((call) =>
      /Example International School/i.test(call[0].data.discoveredName),
    );
    expect(schoolCreate[0].data.sourceUrl).toBe('https://example-school.test');
  });

  it('creates a manual candidate and marks NEW when no duplicate', async () => {
    const now = new Date();
    prisma.partnershipResearchCandidate.create.mockResolvedValue({
      id: 'cand-1',
      jobId: null,
      discoveredName: 'Example School',
      discoveredNameAr: null,
      discoveredNameEn: null,
      normalizedName: 'example school',
      country: 'Egypt',
      governorate: 'Cairo',
      city: 'New Cairo',
      district: null,
      address: null,
      institutionType: null,
      institutionCategory: null,
      curriculum: null,
      educationLevel: null,
      email: 'info@example.edu.eg',
      phone: null,
      mobile: null,
      whatsapp: null,
      normalizedPhone: null,
      website: 'https://example.edu.eg',
      normalizedWebsiteDomain: 'example.edu.eg',
      facebook: null,
      instagram: null,
      linkedin: null,
      youtube: null,
      tiktok: null,
      googleMapsUrl: null,
      hasCoding: false,
      hasRobotics: false,
      hasStem: false,
      hasAi: false,
      hasTechClub: false,
      hasAfterSchool: false,
      hasSummerCamp: false,
      hasMakerspace: false,
      sourceType: 'MANUAL',
      sourceName: 'Manual',
      sourceUrl: 'https://example.edu.eg',
      discoveredAt: now,
      lastCheckedAt: null,
      researchStatus: PartnershipResearchStatus.READY_FOR_REVIEW,
      verificationStatus: 'PARTIALLY_VERIFIED',
      dataQuality: 'MEDIUM',
      duplicateStatus: PartnershipResearchDuplicateStatus.NEW,
      duplicateOfCandidateId: null,
      matchedInstitutionId: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
      evidence: [],
    });

    const candidate = await service.createCandidate(
      {
        discoveredName: 'Example School',
        governorate: 'Cairo',
        city: 'New Cairo',
        website: 'https://example.edu.eg',
        email: 'info@example.edu.eg',
        sourceType: 'MANUAL' as never,
        sourceUrl: 'https://example.edu.eg',
      },
      'user-1',
    );

    expect(candidate.duplicateStatus).toBe(PartnershipResearchDuplicateStatus.NEW);
    expect(candidate.discoveredName).toBe('Example School');
  });

  it('blocks CRM import when exact institution match exists', async () => {
    prisma.partnershipResearchCandidate.findUnique.mockResolvedValue({
      id: 'cand-2',
      discoveredName: 'Dup School',
      discoveredNameAr: null,
      discoveredNameEn: null,
      normalizedName: 'dup school',
      normalizedPhone: null,
      normalizedWebsiteDomain: 'dup.edu.eg',
      email: null,
      city: 'Cairo',
      governorate: 'Cairo',
      researchStatus: PartnershipResearchStatus.VERIFIED,
      notes: '',
      phone: null,
      mobile: null,
      whatsapp: null,
      sourceName: null,
      sourceUrl: null,
    });
    prisma.partnershipInstitution.findMany.mockResolvedValue([
      {
        id: 'inst-1',
        name: 'Dup School',
        normalizedName: 'dup school',
        normalizedPhone: null,
        normalizedWebsiteDomain: 'dup.edu.eg',
        city: 'Cairo',
        governorate: 'Cairo',
        generalEmail: null,
        contactEmail: null,
        admissionsEmail: null,
      },
    ]);
    prisma.partnershipResearchCandidate.update.mockResolvedValue({});

    await expect(service.importToCrm('cand-2', 'user-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when job missing', async () => {
    prisma.partnershipResearchJob.findUnique.mockResolvedValue(null);
    await expect(service.getJob('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('dashboard reports Overpass as free automated discovery without Serper', async () => {
    prisma.partnershipResearchJob.count.mockResolvedValue(1);
    prisma.partnershipResearchCandidate.count.mockResolvedValue(0);
    const dash = await service.dashboard();
    expect(dash.automatedDiscoveryConfigured).toBe(true);
    expect(dash.availableProviders).toContain('MANUAL');
    expect(dash.availableProviders).toContain('OPENSTREETMAP_OVERPASS');
    expect(dash.providers?.some((p) => p.type === 'OPENSTREETMAP_OVERPASS' && p.configured)).toBe(
      true,
    );
    expect(dash.governorates).toContain('Cairo');
    expect(dash.governorates).toContain('Aswan');
  });

  it('providersStatus never exposes secrets', () => {
    const status = service.providersStatus();
    expect(JSON.stringify(status)).not.toMatch(/apiKey|secret|token/i);
    expect(status.automatedDiscoveryConfigured).toBe(true);
    expect(status.overpass?.requiresKey).toBe(false);
  });

  it('clearScanResults deletes non-imported candidates and all jobs', async () => {
    prisma.partnershipResearchCandidate.count.mockResolvedValue(2);
    prisma.partnershipResearchCandidate.updateMany.mockResolvedValue({ count: 10 });
    prisma.partnershipResearchCandidate.deleteMany.mockResolvedValue({ count: 10 });
    prisma.partnershipResearchJob.deleteMany.mockResolvedValue({ count: 3 });

    const result = await service.clearScanResults('user-1', true);

    expect(result).toEqual({
      deletedCandidates: 10,
      deletedJobs: 3,
      keptImported: 2,
    });
    expect(prisma.partnershipResearchCandidate.deleteMany).toHaveBeenCalledWith({
      where: { researchStatus: { not: PartnershipResearchStatus.IMPORTED } },
    });
    expect(prisma.partnershipResearchJob.deleteMany).toHaveBeenCalledWith({});
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RESEARCH_RESULTS_CLEARED',
        performedById: 'user-1',
      }),
    );
  });
});

describe('loadResearchDiscoveryConfig', () => {
  it('is not configured without API key', () => {
    const config = loadResearchDiscoveryConfig({
      RESEARCH_DISCOVERY_PROVIDER: 'WEB_SEARCH',
    });
    expect(config.configured).toBe(false);
  });

  it('is configured with key', () => {
    const config = loadResearchDiscoveryConfig({
      RESEARCH_DISCOVERY_PROVIDER: 'WEB_SEARCH',
      RESEARCH_DISCOVERY_API_KEY: 'abc',
    });
    expect(config.configured).toBe(true);
    expect(config.engine).toBe('serper');
  });
});
