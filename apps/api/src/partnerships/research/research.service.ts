import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipImportMatchConfidence,
  PartnershipInstitutionStatus,
  PartnershipLeadPriority,
  PartnershipResearchCandidate,
  PartnershipResearchDataQuality,
  PartnershipResearchDuplicateStatus,
  PartnershipResearchEvidence,
  PartnershipResearchJob,
  PartnershipResearchJobStatus,
  PartnershipResearchLanguage,
  PartnershipResearchSourceType,
  PartnershipResearchStatus,
  PartnershipResearchVerificationStatus,
  PartnershipSourceType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { ensureDefaultLeadForInstitution } from '../common/ensure-default-lead';
import {
  isValidEmailFormat,
  isValidUrlFormat,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeWebsiteDomain,
  sanitizeSpreadsheetValue,
} from '../common/partnership.normalize';
import {
  detectDuplicates,
  InstitutionLookup,
} from '../import/dedupe/duplicate-detect';
import { NormalizedImportRow } from '../import/mapping/row-mapper';
import { generateResearchQueries, ResearchQuery } from './discovery/query-generator';
import { aliasGroupId } from './providers/candidate-quality';
import {
  ClearResearchResultsResultDto,
  CreateResearchCandidateDto,
  CreateResearchJobDto,
  MarkDuplicateDto,
  PaginatedResearchCandidatesDto,
  PaginatedResearchJobsDto,
  QueryResearchCandidatesDto,
  QueryResearchJobsDto,
  ResearchCandidateDto,
  ResearchDashboardDto,
  ResearchEvidenceDto,
  ResearchJobDto,
  ResearchProvidersStatusDto,
  UpdateResearchCandidateDto,
} from './dto/research.dto';
import { extractCandidatesFromDiscovery, classifyDiscoverySource } from './providers/candidate-extract';
import { DiscoveryProviderError } from './providers/discovery.errors';
import {
  applyEnrichmentPatches,
  classifyEnrichmentSource,
  enrichmentSourceTypeFromClass,
  extractFieldsFromEnrichmentPage,
  generateEnrichmentQueries,
  listMissingEnrichmentFields,
  matchesSameInstitution,
  sourceDisplayName,
} from './providers/missing-field-enrichment';
import {
  computeDataQuality,
  computeVerificationStatus,
  DiscoveryResult,
  ResearchDiscoveryProvider,
} from './providers/discovery.provider';
import { isDirectoryListingDetailUrl } from './providers/web-search/web-search.mapper';
import { cleanInstitutionTitle } from './providers/web-search/web-search.mapper';
import { normalizeInstitutionDisplayName } from './providers/candidate-quality';
import {
  createResearchProviderBundle,
  listProviderStatuses,
  resolveDiscoveryMode,
  ResearchProviderBundle,
} from './providers/provider.factory';
import { OverpassDiscoveryProvider } from './providers/overpass/overpass.provider';
import { draftFromOverpassDiscovery } from './providers/overpass/overpass.mapper';
import { WebsiteEnrichmentService } from './providers/website-enrichment';
import { FreeContactLookupService } from './providers/free-contact-lookup';
import {
  EGYPT_GOVERNORATES,
  RESEARCH_BASE_PROVIDERS,
  RESEARCH_MAX_CANDIDATES_DEFAULT,
  RESEARCH_MAX_QUERIES_DEFAULT,
  RESEARCH_MAX_RESULTS_PER_QUERY,
  RESEARCH_STALE_DAYS,
} from './research.constants';

type JobWithUser = PartnershipResearchJob & {
  requestedBy?: { displayName: string } | null;
};

type CandidateWithEvidence = PartnershipResearchCandidate & {
  evidence?: PartnershipResearchEvidence[];
};

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);
  private providers!: ResearchProviderBundle;
  private manualProvider!: ResearchDiscoveryProvider;
  private webSearchProvider!: ResearchDiscoveryProvider;
  private overpassProvider!: OverpassDiscoveryProvider;
  private enrichment!: WebsiteEnrichmentService;
  private freeLookup!: FreeContactLookupService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {
    this.applyProviders(createResearchProviderBundle());
  }

  /** Test helper — swaps discovery providers without Nest DI. */
  useProvidersForTests(bundle: ResearchProviderBundle): void {
    this.applyProviders(bundle);
  }

  private applyProviders(bundle: ResearchProviderBundle): void {
    this.providers = bundle;
    this.manualProvider = bundle.manual;
    this.webSearchProvider = bundle.webSearch;
    this.overpassProvider = bundle.overpass;
    this.enrichment = bundle.enrichment;
    this.freeLookup = bundle.freeLookup;
  }

  async dashboard(): Promise<ResearchDashboardDto> {
    const [
      activeJobs,
      candidates,
      needsReview,
      possibleDuplicates,
      verified,
      imported,
      rejected,
      stale,
    ] = await Promise.all([
      this.prisma.partnershipResearchJob.count({
        where: {
          status: {
            in: [
              PartnershipResearchJobStatus.DRAFT,
              PartnershipResearchJobStatus.QUEUED,
              PartnershipResearchJobStatus.RUNNING,
              PartnershipResearchJobStatus.PAUSED,
            ],
          },
        },
      }),
      this.prisma.partnershipResearchCandidate.count(),
      this.prisma.partnershipResearchCandidate.count({
        where: {
          researchStatus: {
            in: [
              PartnershipResearchStatus.DISCOVERED,
              PartnershipResearchStatus.READY_FOR_REVIEW,
              PartnershipResearchStatus.ENRICHING,
            ],
          },
        },
      }),
      this.prisma.partnershipResearchCandidate.count({
        where: {
          duplicateStatus: {
            in: [
              PartnershipResearchDuplicateStatus.EXACT_MATCH,
              PartnershipResearchDuplicateStatus.POSSIBLE_MATCH,
            ],
          },
        },
      }),
      this.prisma.partnershipResearchCandidate.count({
        where: { researchStatus: PartnershipResearchStatus.VERIFIED },
      }),
      this.prisma.partnershipResearchCandidate.count({
        where: { researchStatus: PartnershipResearchStatus.IMPORTED },
      }),
      this.prisma.partnershipResearchCandidate.count({
        where: { researchStatus: PartnershipResearchStatus.REJECTED },
      }),
      this.prisma.partnershipResearchCandidate.count({
        where: { researchStatus: PartnershipResearchStatus.STALE },
      }),
    ]);

    return {
      activeJobs,
      candidates,
      needsReview,
      possibleDuplicates,
      verified,
      imported,
      rejected,
      stale,
      availableProviders: this.availableProviderNames(),
      automatedDiscoveryConfigured:
        this.overpassProvider.available || this.webSearchProvider.available,
      governorates: EGYPT_GOVERNORATES,
      providers: listProviderStatuses(this.providers.config, this.providers.overpassConfig),
    };
  }

  providersStatus(): ResearchProvidersStatusDto {
    return {
      providers: listProviderStatuses(this.providers.config, this.providers.overpassConfig),
      automatedDiscoveryConfigured:
        this.overpassProvider.available || this.webSearchProvider.available,
      engine: this.providers.config.engine,
      enrichmentEnabled: this.providers.config.enrichmentEnabled,
      discoveryMode: this.providers.config.provider,
      overpass: {
        enabled: this.providers.overpassConfig.enabled,
        configured: this.providers.overpassConfig.configured,
        requiresKey: false,
        provider: 'OPENSTREETMAP_OVERPASS',
      },
      serper: {
        enabled:
          this.webSearchProvider.available &&
          (this.providers.config.provider === 'WEB_SEARCH' ||
            this.providers.config.provider === 'HYBRID'),
        configured: this.providers.config.webSearchConfigured,
        requiresKey: true,
        provider: this.providers.config.engine === 'brave' ? 'BRAVE' : 'SERPER',
      },
    };
  }

  async createJob(dto: CreateResearchJobDto, actorId: string): Promise<ResearchJobDto> {
    const technology = dto.technology ?? {};
    const queries = generateResearchQueries({
      governorate: dto.governorate,
      city: dto.city,
      district: dto.district,
      institutionType: dto.institutionType,
      institutionCategory: dto.institutionCategory,
      curriculum: dto.curriculum,
      language: dto.language ?? PartnershipResearchLanguage.BOTH,
      technology,
      maxQueries: dto.maxQueries ?? RESEARCH_MAX_QUERIES_DEFAULT,
    });

    const job = await this.prisma.partnershipResearchJob.create({
      data: {
        name: dto.name.trim(),
        governorate: dto.governorate?.trim() || null,
        city: dto.city?.trim() || null,
        district: dto.district?.trim() || null,
        institutionType: dto.institutionType,
        institutionCategory: dto.institutionCategory,
        curriculum: dto.curriculum,
        language: dto.language ?? PartnershipResearchLanguage.BOTH,
        technologyJson: technology as Prisma.InputJsonValue,
        queriesJson: queries as unknown as Prisma.InputJsonValue,
        maxResultsPerQuery: Math.min(
          dto.maxResultsPerQuery ?? 20,
          RESEARCH_MAX_RESULTS_PER_QUERY,
        ),
        maxQueries: dto.maxQueries ?? RESEARCH_MAX_QUERIES_DEFAULT,
        maxCandidates: dto.maxCandidates ?? RESEARCH_MAX_CANDIDATES_DEFAULT,
        discoveryMode: (dto.discoveryMode ?? this.providers.config.provider ?? 'HYBRID')
          .toString()
          .toUpperCase(),
        requestedById: actorId,
        providerNote: this.buildProviderNote(
          resolveDiscoveryMode(dto.discoveryMode, this.providers.config.provider),
        ),
      },
      include: { requestedBy: { select: { displayName: true } } },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_JOB,
      entityId: job.id,
      action: PartnershipAuditAction.RESEARCH_JOB_CREATED,
      performedById: actorId,
    });

    return this.toJobDto(job);
  }

  async listJobs(query: QueryResearchJobsDto): Promise<PaginatedResearchJobsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.PartnershipResearchJobWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.governorate) {
      where.governorate = { equals: query.governorate, mode: 'insensitive' };
    }

    const [total, rows] = await Promise.all([
      this.prisma.partnershipResearchJob.count({ where }),
      this.prisma.partnershipResearchJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { requestedBy: { select: { displayName: true } } },
      }),
    ]);

    return {
      items: rows.map((row) => this.toJobDto(row)),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async getJob(id: string): Promise<ResearchJobDto> {
    const job = await this.prisma.partnershipResearchJob.findUnique({
      where: { id },
      include: { requestedBy: { select: { displayName: true } } },
    });
    if (!job) {
      throw new NotFoundException('Research job not found');
    }
    return this.toJobDto(job);
  }

  /**
   * Run research job: generate queries, optionally execute WEB_SEARCH, create candidates.
   * Never invents schools. Persists candidates incrementally. Failures keep prior results.
   */
  async runJob(id: string, actorId: string): Promise<ResearchJobDto> {
    const job = await this.requireJob(id);
    if (
      job.status === PartnershipResearchJobStatus.RUNNING ||
      job.status === PartnershipResearchJobStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot run job in status ${job.status}`);
    }

    const queries = generateResearchQueries({
      governorate: job.governorate,
      city: job.city,
      district: job.district,
      institutionType: job.institutionType,
      institutionCategory: job.institutionCategory,
      curriculum: job.curriculum,
      language: job.language,
      technology: (job.technologyJson ?? {}) as CreateResearchJobDto['technology'],
      maxQueries: job.maxQueries,
    });

    const startedAt = job.startedAt ?? new Date();
    await this.prisma.partnershipResearchJob.update({
      where: { id },
      data: {
        status: PartnershipResearchJobStatus.RUNNING,
        queriesJson: queries as unknown as Prisma.InputJsonValue,
        startedAt,
        completedAt: null,
        errorMessage: null,
      },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_JOB,
      entityId: id,
      action: PartnershipAuditAction.RESEARCH_JOB_STARTED,
      performedById: actorId,
    });

    const statistics = {
      provider: 'HYBRID',
      queriesPlanned: queries.length,
      queriesExecuted: 0,
      resultsDiscovered: 0,
      osmResults: 0,
      searchResults: 0,
      uniqueCandidates: 0,
      candidatesCreated: 0,
      duplicatesDetected: 0,
      duplicatesMerged: 0,
      duplicates: 0,
      invalidResultsRejected: 0,
      enrichmentAttempts: 0,
      fieldsEnriched: 0,
      conflictsDetected: 0,
      verified: 0,
      rejected: 0,
      imported: 0,
      needsReview: 0,
      errorsCount: 0,
    };

    void this.manualProvider;

    const discoveryMode = resolveDiscoveryMode(
      job.discoveryMode,
      this.providers.config.provider,
    );
    statistics.provider = discoveryMode;

    const useOverpass =
      (discoveryMode === 'OVERPASS' || discoveryMode === 'HYBRID') &&
      this.overpassProvider.available;
    const useWebSearch =
      (discoveryMode === 'WEB_SEARCH' || discoveryMode === 'HYBRID') &&
      this.webSearchProvider.available;

    if (!useOverpass && !useWebSearch) {
      const candidateCount = await this.prisma.partnershipResearchCandidate.count({
        where: { jobId: id },
      });
      statistics.uniqueCandidates = candidateCount;
      statistics.needsReview = candidateCount;

      const updated = await this.prisma.partnershipResearchJob.update({
        where: { id },
        data: {
          status: PartnershipResearchJobStatus.COMPLETED,
          statisticsJson: statistics,
          completedAt: new Date(),
          providerNote:
            discoveryMode === 'OVERPASS'
              ? 'Overpass provider is disabled. Enable RESEARCH_OVERPASS_ENABLED=true.'
              : discoveryMode === 'WEB_SEARCH'
                ? 'Research discovery provider is not configured. Queries were generated for coverage tracking; no external search was executed and no fake results were created.'
                : 'No discovery provider available. Enable Overpass (free) and/or configure WEB_SEARCH API key for HYBRID mode.',
        },
        include: { requestedBy: { select: { displayName: true } } },
      });

      await this.audit.record({
        entityType: PartnershipAuditEntityType.RESEARCH_JOB,
        entityId: id,
        action: PartnershipAuditAction.RESEARCH_JOB_COMPLETED,
        performedById: actorId,
        metadata: statistics,
      });

      return this.toJobDto(updated);
    }

    const runStarted = Date.now();
    const seenKeys = new Set<string>();
    let fatalError: DiscoveryProviderError | null = null;

    try {
      const existing = await this.prisma.partnershipResearchCandidate.findMany({
        where: { jobId: id },
        select: {
          normalizedWebsiteDomain: true,
          normalizedName: true,
          sourceUrl: true,
          email: true,
          phone: true,
          discoveredName: true,
          osmId: true,
          osmType: true,
        },
      });
      for (const row of existing) {
        if (row.normalizedWebsiteDomain) {
          seenKeys.add(`domain:${row.normalizedWebsiteDomain}`);
        }
        if (row.normalizedName) seenKeys.add(`name:${row.normalizedName}`);
        if (row.osmId) seenKeys.add(`osm:${row.osmType ?? 'node'}/${row.osmId}`);
        const email = normalizeEmail(row.email);
        if (email) seenKeys.add(`email:${email}`);
        const phone = normalizePhone(row.phone);
        if (phone && phone.replace(/\D/g, '').length >= 8) {
          seenKeys.add(`phone:${phone}`);
        }
        const alias = aliasGroupId(row.discoveredName);
        if (alias && (row.normalizedWebsiteDomain || email || phone)) {
          seenKeys.add(alias);
        }
      }

      // --- OVERPASS discovery (FREE, structured) ---
      if (useOverpass && statistics.candidatesCreated < job.maxCandidates) {
        try {
          const osmResults = await this.overpassProvider.discoverByGeo(
            {
              governorate: job.governorate,
              city: job.city,
              district: job.district,
            },
            Math.min(job.maxCandidates, this.providers.overpassConfig.maxResults),
          );
          statistics.queriesExecuted += 1;
          statistics.resultsDiscovered += osmResults.length;
          statistics.osmResults = osmResults.length;

          const osmQuery: ResearchQuery = {
            text: [job.district, job.city, job.governorate].filter(Boolean).join(', ') || 'Egypt',
            language: 'en',
            template: 'overpass',
          };

          for (const result of osmResults) {
            if (statistics.candidatesCreated >= job.maxCandidates) break;
            if (result.osmId && seenKeys.has(`osm:${result.osmType}/${result.osmId}`)) {
              statistics.duplicatesDetected += 1;
              statistics.duplicatesMerged += 1;
              continue;
            }
            const ingest = await this.ingestDiscoveryResult({
              job,
              query: osmQuery,
              result,
              actorId,
              seenKeys,
              remainingSlots: job.maxCandidates - statistics.candidatesCreated,
            });
            statistics.candidatesCreated += ingest.created;
            statistics.duplicatesDetected += ingest.duplicates;
            statistics.duplicatesMerged += ingest.duplicates;
            statistics.invalidResultsRejected += ingest.skipped;
            if (ingest.created > 0) {
              statistics.enrichmentAttempts += ingest.created;
            }
          }
        } catch (error) {
          statistics.errorsCount += 1;
          if (error instanceof DiscoveryProviderError) {
            if (
              error.code === 'NOT_CONFIGURED' ||
              error.code === 'RATE_LIMITED' ||
              error.code === 'AUTHENTICATION_ERROR'
            ) {
              // Overpass rate limit should not kill HYBRID if web search remains
              if (discoveryMode === 'OVERPASS') {
                fatalError = error;
              } else {
                this.logger.warn({
                  msg: 'overpass_discovery_failed',
                  jobId: id,
                  code: error.code,
                });
              }
            } else {
              this.logger.warn({
                msg: 'overpass_discovery_failed',
                jobId: id,
                code: error.code,
              });
            }
          } else {
            this.logger.warn({
              msg: 'overpass_discovery_failed',
              jobId: id,
              error: error instanceof Error ? error.message : 'unknown',
            });
          }
        }
      }

      // --- WEB_SEARCH discovery / enrichment queries ---
      if (useWebSearch && !fatalError && statistics.candidatesCreated < job.maxCandidates) {
        await this.mapPool(queries, this.providers.config.concurrency, async (query) => {
          if (fatalError) return;
          if (statistics.candidatesCreated >= job.maxCandidates) return;

          try {
            if (this.providers.config.requestDelayMs > 0) {
              await sleep(this.providers.config.requestDelayMs);
            }

            const results = await this.webSearchProvider.search(query.text, {
              maxResults: job.maxResultsPerQuery,
              language: query.language,
            });

            statistics.queriesExecuted += 1;
            statistics.resultsDiscovered += results.length;
            statistics.searchResults += results.length;

            for (const result of results) {
              if (statistics.candidatesCreated >= job.maxCandidates) break;

              const ingest = await this.ingestDiscoveryResult({
                job,
                query,
                result,
                actorId,
                seenKeys,
                remainingSlots: job.maxCandidates - statistics.candidatesCreated,
              });
              statistics.candidatesCreated += ingest.created;
              statistics.duplicatesDetected += ingest.duplicates;
              statistics.duplicatesMerged += ingest.duplicates;
              statistics.invalidResultsRejected += ingest.skipped;
              if (ingest.created > 0) {
                statistics.enrichmentAttempts += ingest.created;
              }
            }
          } catch (error) {
            statistics.errorsCount += 1;
            if (error instanceof DiscoveryProviderError) {
              if (
                error.code === 'NOT_CONFIGURED' ||
                error.code === 'AUTHENTICATION_ERROR'
              ) {
                fatalError = error;
                return;
              }
              if (error.code === 'RATE_LIMITED') {
                fatalError = error;
                return;
              }
              this.logger.warn({
                msg: 'research_query_failed',
                jobId: id,
                provider: 'WEB_SEARCH',
                code: error.code,
              });
              return;
            }
            this.logger.warn({
              msg: 'research_query_failed',
              jobId: id,
              provider: 'WEB_SEARCH',
              error: error instanceof Error ? error.message : 'unknown',
            });
          }
        });
      }
    } catch (error) {
      if (error instanceof DiscoveryProviderError) {
        fatalError = error;
      } else {
        fatalError = new DiscoveryProviderError(
          'PROVIDER_ERROR',
          error instanceof Error ? error.message : 'Provider error',
        );
      }
    }

    const candidateStats = await this.prisma.partnershipResearchCandidate.groupBy({
      by: ['researchStatus', 'duplicateStatus'],
      where: { jobId: id },
      _count: true,
    });
    let unique = 0;
    let duplicates = 0;
    let needsReview = 0;
    let verified = 0;
    let rejected = 0;
    let imported = 0;
    for (const row of candidateStats) {
      unique += row._count;
      if (
        row.duplicateStatus === PartnershipResearchDuplicateStatus.EXACT_MATCH ||
        row.duplicateStatus === PartnershipResearchDuplicateStatus.POSSIBLE_MATCH
      ) {
        duplicates += row._count;
      }
      if (
        row.researchStatus === PartnershipResearchStatus.DISCOVERED ||
        row.researchStatus === PartnershipResearchStatus.READY_FOR_REVIEW ||
        row.researchStatus === PartnershipResearchStatus.ENRICHING
      ) {
        needsReview += row._count;
      }
      if (row.researchStatus === PartnershipResearchStatus.VERIFIED) verified += row._count;
      if (row.researchStatus === PartnershipResearchStatus.REJECTED) rejected += row._count;
      if (row.researchStatus === PartnershipResearchStatus.IMPORTED) imported += row._count;
    }

    statistics.uniqueCandidates = unique;
    statistics.duplicates = duplicates;
    statistics.duplicatesDetected = Math.max(statistics.duplicatesDetected, duplicates);
    statistics.needsReview = needsReview;
    statistics.verified = verified;
    statistics.rejected = rejected;
    statistics.imported = imported;

    const failed = fatalError != null;
    const updated = await this.prisma.partnershipResearchJob.update({
      where: { id },
      data: {
        status: failed
          ? PartnershipResearchJobStatus.FAILED
          : PartnershipResearchJobStatus.COMPLETED,
        statisticsJson: statistics,
        completedAt: new Date(),
        errorMessage: fatalError?.toPublicMessage() ?? null,
        providerNote: failed
          ? fatalError!.toPublicMessage()
          : `${discoveryMode} completed (Overpass=${useOverpass}, WEB_SEARCH=${useWebSearch}). Research coverage — not a completeness claim.`,
      },
      include: { requestedBy: { select: { displayName: true } } },
    });

    this.logger.log({
      msg: 'research_job_finished',
      jobId: id,
      provider: discoveryMode,
      queryCount: statistics.queriesExecuted,
      resultCount: statistics.resultsDiscovered,
      osmResults: statistics.osmResults,
      searchResults: statistics.searchResults,
      candidateCount: statistics.candidatesCreated,
      durationMs: Date.now() - runStarted,
      errors: statistics.errorsCount,
      status: updated.status,
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_JOB,
      entityId: id,
      action: failed
        ? PartnershipAuditAction.RESEARCH_JOB_FAILED
        : PartnershipAuditAction.RESEARCH_JOB_COMPLETED,
      performedById: actorId,
      metadata: { ...statistics, error: fatalError?.code },
    });

    return this.toJobDto(updated);
  }

  private buildProviderNote(mode: 'OVERPASS' | 'WEB_SEARCH' | 'HYBRID'): string {
    if (mode === 'OVERPASS') {
      return this.overpassProvider.available
        ? 'OVERPASS (OpenStreetMap) — free structured discovery. No API key required.'
        : 'OVERPASS selected but disabled. Set RESEARCH_OVERPASS_ENABLED=true.';
    }
    if (mode === 'WEB_SEARCH') {
      return this.webSearchProvider.available
        ? `WEB_SEARCH configured (${this.providers.config.engine}). Run executes live public search within job limits.`
        : 'WEB_SEARCH selected but API key is not configured.';
    }
    return `HYBRID — Overpass discovery (${this.overpassProvider.available ? 'on' : 'off'}) + Serper enrichment (${this.webSearchProvider.available ? 'on' : 'off'}).`;
  }


  private async ingestDiscoveryResult(input: {
    job: PartnershipResearchJob;
    query: ResearchQuery;
    result: DiscoveryResult;
    actorId: string;
    seenKeys: Set<string>;
    remainingSlots: number;
  }): Promise<{ created: number; duplicates: number; skipped: number }> {
    const stats = { created: 0, duplicates: 0, skipped: 0 };
    if (input.remainingSlots <= 0) {
      return stats;
    }

    let pageText: string | null = null;
    let drafts;

    if (input.result.structured && input.result.provider === 'OVERPASS') {
      drafts = [draftFromOverpassDiscovery(input.result)];
    } else {
      const kind = classifyDiscoverySource(input.result);
      if (kind === 'DISCOVERY_SOURCE' || kind === 'DIRECTORY_LISTING') {
        try {
          pageText = await this.enrichment.fetchPublicHtml(input.result.url);
        } catch {
          pageText = null;
        }
      }
      drafts = extractCandidatesFromDiscovery(
        input.result,
        pageText ?? input.result.snippet ?? null,
      );
    }
    if (drafts.length === 0) {
      stats.skipped += 1;
      return stats;
    }

    for (const draft of drafts) {
      if (stats.created >= input.remainingSlots) break;
      if (draft.skipAsInstitution) {
        stats.skipped += 1;
        continue;
      }

      const name = sanitizeSpreadsheetValue(draft.discoveredName) ?? draft.discoveredName;
      const normalizedName = normalizeName(name);
      const websiteDomain = normalizeWebsiteDomain(draft.website);
      const aliasKey = aliasGroupId(name);

      // Early domain/name/alias/osm gate before enrichment
      if (
        input.result.osmId &&
        input.seenKeys.has(`osm:${input.result.osmType ?? 'node'}/${input.result.osmId}`)
      ) {
        stats.duplicates += 1;
        continue;
      }
      if (websiteDomain && input.seenKeys.has(`domain:${websiteDomain}`)) {
        stats.duplicates += 1;
        continue;
      }
      if (normalizedName && input.seenKeys.has(`name:${normalizedName}`)) {
        stats.duplicates += 1;
        continue;
      }

      let email = draft.email;
      let phone = draft.phone;
      let facebook = draft.facebook;
      let instagram = draft.instagram;
      let linkedin = draft.linkedin;
      let youtube = draft.youtube;
      let tiktok = draft.tiktok;
      const evidence = [...draft.evidence];
      const signals = { ...draft.signals };

      if (draft.likelyOfficialWebsite && draft.website) {
        try {
          const enriched = await this.enrichment.enrichOfficialContacts(draft.website);
          if (enriched) {
            email = email ?? enriched.email;
            phone = phone ?? enriched.phone;
            facebook = facebook ?? enriched.facebook;
            instagram = instagram ?? enriched.instagram;
            linkedin = linkedin ?? enriched.linkedin;
            youtube = youtube ?? enriched.youtube;
            tiktok = tiktok ?? enriched.tiktok;
            Object.assign(signals, enriched.signals);
            evidence.push(...enriched.evidence);
          }
        } catch {
          // Enrichment is optional and must never fail the job.
        }
      } else if (draft.website && !draft.likelyOfficialWebsite) {
        // Follow-up enrich for websites extracted from directories (optional)
        try {
          const enriched = await this.enrichment.enrichOfficialContacts(draft.website);
          if (enriched) {
            email = email ?? enriched.email;
            phone = phone ?? enriched.phone;
            facebook = facebook ?? enriched.facebook;
            instagram = instagram ?? enriched.instagram;
            linkedin = linkedin ?? enriched.linkedin;
            youtube = youtube ?? enriched.youtube;
            tiktok = tiktok ?? enriched.tiktok;
            Object.assign(signals, enriched.signals);
            evidence.push(...enriched.evidence);
          }
        } catch {
          // ignore
        }
      }

      const emailKey = normalizeEmail(email);
      const phoneKey = normalizePhone(phone);
      if (phoneKey && phoneKey.replace(/\D/g, '').length >= 8 && input.seenKeys.has(`phone:${phoneKey}`)) {
        stats.duplicates += 1;
        continue;
      }
      if (emailKey && input.seenKeys.has(`email:${emailKey}`)) {
        stats.duplicates += 1;
        continue;
      }
      if (
        aliasKey &&
        (websiteDomain || emailKey || phoneKey) &&
        input.seenKeys.has(aliasKey)
      ) {
        stats.duplicates += 1;
        continue;
      }

      try {
        const candidate = await this.createCandidate(
          {
            jobId: input.job.id,
            discoveredName: name,
            discoveredNameAr: input.result.nameAr,
            discoveredNameEn: input.result.nameEn,
            governorate: input.job.governorate ?? undefined,
            city: input.result.city ?? input.job.city ?? undefined,
            district: input.result.district ?? input.job.district ?? undefined,
            institutionType: input.job.institutionType ?? undefined,
            institutionCategory: input.job.institutionCategory ?? undefined,
            curriculum: input.job.curriculum ?? undefined,
            website: draft.website,
            email,
            phone,
            whatsapp: draft.whatsapp,
            address: draft.address,
            facebook,
            instagram,
            linkedin,
            youtube,
            tiktok,
            googleMapsUrl: draft.googleMapsUrl,
            latitude: input.result.latitude,
            longitude: input.result.longitude,
            osmType: input.result.osmType,
            osmId: input.result.osmId,
            osmUrl: input.result.osmUrl,
            sourceType: draft.sourceType,
            sourceName: draft.sourceName || 'WEB_SEARCH',
            sourceUrl: draft.sourceUrl,
            notes: [draft.notes, `Discovered via query: ${input.query.text}`]
              .filter(Boolean)
              .join('\n'),
            hasCoding: signals.hasCoding,
            hasRobotics: signals.hasRobotics,
            hasStem: signals.hasStem,
            hasAi: signals.hasAi,
            hasTechClub: signals.hasTechClub,
            hasAfterSchool: signals.hasAfterSchool,
            hasSummerCamp: signals.hasSummerCamp,
            hasMakerspace: signals.hasMakerspace,
            evidence: evidence.map((item) => ({
              field: item.field,
              value: item.value,
              sourceUrl: item.sourceUrl,
              sourceType: item.sourceType,
              confidence: item.confidence as PartnershipResearchDataQuality,
            })),
          },
          input.actorId,
        );

        // Missing-field enrichment (same candidate — never invents data)
        try {
          await this.enrichMissingFields(candidate.id);
        } catch {
          // Enrichment must never fail the job
        }

        // Refresh keys after possible enrichment
        const refreshed = await this.prisma.partnershipResearchCandidate.findUnique({
          where: { id: candidate.id },
          select: {
            website: true,
            email: true,
            phone: true,
            normalizedWebsiteDomain: true,
            normalizedName: true,
          },
        });
        const refreshedDomain =
          refreshed?.normalizedWebsiteDomain ?? normalizeWebsiteDomain(refreshed?.website);
        const refreshedEmail = normalizeEmail(refreshed?.email);
        const refreshedPhone = normalizePhone(refreshed?.phone);

        if (refreshedDomain) {
          input.seenKeys.add(`domain:${refreshedDomain}`);
        }
        if (normalizedName) {
          input.seenKeys.add(`name:${normalizedName}`);
        }
        if (input.result.osmId) {
          input.seenKeys.add(`osm:${input.result.osmType ?? 'node'}/${input.result.osmId}`);
        }
        if (refreshedEmail) {
          input.seenKeys.add(`email:${refreshedEmail}`);
        }
        if (refreshedPhone && refreshedPhone.replace(/\D/g, '').length >= 8) {
          input.seenKeys.add(`phone:${refreshedPhone}`);
        }
        if (aliasKey && (refreshedDomain || refreshedEmail || refreshedPhone)) {
          input.seenKeys.add(aliasKey);
        }

        if (
          candidate.duplicateStatus === PartnershipResearchDuplicateStatus.EXACT_MATCH ||
          candidate.duplicateStatus === PartnershipResearchDuplicateStatus.POSSIBLE_MATCH
        ) {
          stats.duplicates += 1;
        } else {
          stats.created += 1;
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          stats.skipped += 1;
          continue;
        }
        throw error;
      }
    }

    return stats;
  }

  private async mapPool<T>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>,
  ): Promise<void> {
    const queue = [...items];
    const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) return;
        await worker(next);
      }
    });
    await Promise.all(runners);
  }

  private availableProviderNames(): string[] {
    const names: string[] = [...RESEARCH_BASE_PROVIDERS];
    if (this.overpassProvider.available) {
      names.push('OPENSTREETMAP_OVERPASS');
    }
    if (this.webSearchProvider.available) {
      names.push('WEB_SEARCH');
    }
    return names;
  }

  async cancelJob(id: string, actorId: string): Promise<ResearchJobDto> {
    const job = await this.requireJob(id);
    if (
      job.status === PartnershipResearchJobStatus.COMPLETED ||
      job.status === PartnershipResearchJobStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot cancel job in status ${job.status}`);
    }
    const updated = await this.prisma.partnershipResearchJob.update({
      where: { id },
      data: {
        status: PartnershipResearchJobStatus.CANCELLED,
        completedAt: new Date(),
      },
      include: { requestedBy: { select: { displayName: true } } },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_JOB,
      entityId: id,
      action: PartnershipAuditAction.RESEARCH_JOB_CANCELLED,
      performedById: actorId,
    });
    return this.toJobDto(updated);
  }

  /**
   * Wipe old research scan results so a clean job can be re-run.
   * Does not touch CRM institutions. Keeps IMPORTED candidates by default.
   */
  async clearScanResults(
    actorId: string,
    keepImported = true,
  ): Promise<ClearResearchResultsResultDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      const keptImported = keepImported
        ? await tx.partnershipResearchCandidate.count({
            where: { researchStatus: PartnershipResearchStatus.IMPORTED },
          })
        : 0;

      // Break duplicate self-FK before bulk delete
      await tx.partnershipResearchCandidate.updateMany({
        where: keepImported
          ? { researchStatus: { not: PartnershipResearchStatus.IMPORTED } }
          : undefined,
        data: { duplicateOfCandidateId: null },
      });

      const deletedCandidates = await tx.partnershipResearchCandidate.deleteMany({
        where: keepImported
          ? { researchStatus: { not: PartnershipResearchStatus.IMPORTED } }
          : undefined,
      });

      if (keepImported) {
        await tx.partnershipResearchCandidate.updateMany({
          where: { researchStatus: PartnershipResearchStatus.IMPORTED },
          data: { jobId: null },
        });
      }

      const deletedJobs = await tx.partnershipResearchJob.deleteMany({});

      return {
        deletedCandidates: deletedCandidates.count,
        deletedJobs: deletedJobs.count,
        keptImported,
      };
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_JOB,
      entityId: '00000000-0000-0000-0000-000000000000',
      action: PartnershipAuditAction.RESEARCH_RESULTS_CLEARED,
      performedById: actorId,
      metadata: result,
    });

    return result;
  }

  /**
   * Search for missing contact fields for an existing candidate.
   * Never creates a new candidate. Never invents values.
   * Official website scrape always runs (even without Serper).
   */
  async enrichMissingFields(candidateId: string): Promise<void> {
    const candidate = await this.prisma.partnershipResearchCandidate.findUnique({
      where: { id: candidateId },
      include: { evidence: true },
    });
    if (!candidate) return;

    const snapshot = {
      id: candidate.id,
      discoveredName: candidate.discoveredName,
      governorate: candidate.governorate,
      city: candidate.city,
      address: candidate.address,
      email: candidate.email,
      phone: candidate.phone,
      mobile: candidate.mobile,
      whatsapp: candidate.whatsapp,
      website: candidate.website,
      facebook: candidate.facebook,
      instagram: candidate.instagram,
      linkedin: candidate.linkedin,
      youtube: candidate.youtube,
      tiktok: candidate.tiktok,
      googleMapsUrl: candidate.googleMapsUrl,
    };

    const missing = listMissingEnrichmentFields(snapshot);
    if (missing.length === 0) {
      await this.markEnrichmentAttempted(candidateId, []);
      return;
    }

    const patches: ReturnType<typeof applyEnrichmentPatches> = [];
    let working = { ...snapshot };

    // 1) Prefer fetching the known official website for explicit public contacts
    //    (always available — does not require Serper / RESEARCH_ENRICHMENT_ENABLED)
    if (working.website) {
      try {
        const enriched = await this.enrichment.enrichOfficialContacts(working.website);
        if (enriched) {
          const batch = applyEnrichmentPatches(
            working,
            {
              email: enriched.email,
              phone: enriched.phone,
              facebook: enriched.facebook,
              instagram: enriched.instagram,
              website: working.website,
            },
            {
              sourceUrl: working.website,
              sourceType: PartnershipResearchSourceType.OFFICIAL_WEBSITE,
              sourceName: sourceDisplayName(working.website),
              confidence: PartnershipResearchDataQuality.HIGH,
            },
          );
          for (const patch of batch) {
            patches.push(patch);
            if (patch.action === 'SET') {
              (working as Record<string, string | null | undefined>)[patch.field] =
                patch.value;
            }
          }
        }
      } catch {
        // continue to search enrichment
      }
    }

    // 1b) Free public lookup (KidsDirectory + DuckDuckGo) when Serper is unavailable
    //     or contacts/website are still missing after official-site scrape.
    if (
      listMissingEnrichmentFields(working).some((f) =>
        ['phone', 'email', 'website'].includes(f),
      )
    ) {
      try {
        const freeHits = await this.freeLookup.findCandidatePages(
          working.discoveredName,
          working.city,
        );
        for (const result of freeHits) {
          if (listMissingEnrichmentFields(working).length === 0) break;
          const klass = classifyEnrichmentSource(result);
          if (klass === 'ARTICLE' && !isDirectoryListingDetailUrl(result.url)) {
            continue;
          }
          let html: string | null = null;
          try {
            html = await this.enrichment.fetchPublicHtml(result.url);
          } catch {
            html = null;
          }
          if (!html) continue;

          const fields = extractFieldsFromEnrichmentPage(html, result);
          const hitName = normalizeInstitutionDisplayName(
            cleanInstitutionTitle(result.title),
          );
          if (
            !matchesSameInstitution(working, {
              name: hitName,
              title: result.title,
              website: fields.website ?? (klass === 'OFFICIAL_WEBSITE' ? result.url : undefined),
              email: fields.email,
              phone: fields.phone,
              city: working.city,
              address: fields.address,
            })
          ) {
            continue;
          }

          const sourceType = enrichmentSourceTypeFromClass(klass);
          const batch = applyEnrichmentPatches(working, fields, {
            sourceUrl: result.url,
            sourceType,
            sourceName: sourceDisplayName(result.url),
          });
          for (const patch of batch) {
            patches.push(patch);
            if (patch.action === 'SET') {
              (working as Record<string, string | null | undefined>)[patch.field] =
                patch.value;
            }
          }

          // If directory gave an official website, scrape that too
          if (fields.website && listMissingEnrichmentFields(working).length > 0) {
            try {
              const enriched = await this.enrichment.enrichOfficialContacts(fields.website);
              if (enriched) {
                const siteBatch = applyEnrichmentPatches(
                  working,
                  {
                    email: enriched.email,
                    phone: enriched.phone,
                    facebook: enriched.facebook,
                    instagram: enriched.instagram,
                    website: fields.website,
                  },
                  {
                    sourceUrl: fields.website,
                    sourceType: PartnershipResearchSourceType.OFFICIAL_WEBSITE,
                    sourceName: sourceDisplayName(fields.website),
                    confidence: PartnershipResearchDataQuality.HIGH,
                  },
                );
                for (const patch of siteBatch) {
                  patches.push(patch);
                  if (patch.action === 'SET') {
                    (working as Record<string, string | null | undefined>)[patch.field] =
                      patch.value;
                  }
                }
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // free lookup is best-effort
      }
    }

    // 2) Optional Serper queries for remaining gaps
    if (!this.webSearchProvider.available) {
      await this.applyEnrichmentPatchesToCandidate(candidateId, working, patches, candidate);
      return;
    }

    const queries = generateEnrichmentQueries(working, listMissingEnrichmentFields(working));

    for (const query of queries) {
      if (listMissingEnrichmentFields(working).length === 0) break;
      try {
        if (this.providers.config.requestDelayMs > 0) {
          await sleep(this.providers.config.requestDelayMs);
        }
        const results = await this.webSearchProvider.search(query, {
          maxResults: 5,
        });

        for (const result of results) {
          const klass = classifyEnrichmentSource(result);
          if (klass === 'ARTICLE' && !isDirectoryListingDetailUrl(result.url)) {
            continue;
          }

          let html: string | null = null;
          if (
            klass === 'DIRECTORY' ||
            klass === 'OFFICIAL_WEBSITE' ||
            isDirectoryListingDetailUrl(result.url)
          ) {
            try {
              html = await this.enrichment.fetchPublicHtml(result.url);
            } catch {
              html = null;
            }
          }
          if (!html) continue;

          const fields = extractFieldsFromEnrichmentPage(html, result);
          const hitName = normalizeInstitutionDisplayName(
            cleanInstitutionTitle(result.title),
          );

          if (
            !matchesSameInstitution(working, {
              name: hitName,
              title: result.title,
              website: fields.website ?? (klass === 'OFFICIAL_WEBSITE' ? result.url : undefined),
              email: fields.email,
              phone: fields.phone,
              city: working.city,
              address: fields.address,
            })
          ) {
            continue;
          }

          const sourceType = enrichmentSourceTypeFromClass(klass);
          const batch = applyEnrichmentPatches(working, fields, {
            sourceUrl: result.url,
            sourceType,
            sourceName: sourceDisplayName(result.url),
          });

          for (const patch of batch) {
            patches.push(patch);
            if (patch.action === 'SET') {
              (working as Record<string, string | null | undefined>)[patch.field] =
                patch.value;
            }
          }
        }
      } catch {
        // continue other queries
      }
    }

    await this.applyEnrichmentPatchesToCandidate(candidateId, working, patches, candidate);
  }

  /**
   * Re-scrape official websites for candidates that have a website but missing phone/email.
   * Also copies newly found contacts onto matched CRM institutions when linked.
   */
  async reEnrichMissingContacts(actorId: string): Promise<{
    scanned: number;
    updated: number;
    institutionsUpdated: number;
  }> {
    const rows = await this.prisma.partnershipResearchCandidate.findMany({
      where: {
        OR: [
          {
            AND: [
              { OR: [{ phone: null }, { phone: '' }] },
              { OR: [{ mobile: null }, { mobile: '' }] },
            ],
          },
          { OR: [{ email: null }, { email: '' }] },
          { OR: [{ website: null }, { website: '' }] },
        ],
      },
      select: {
        id: true,
        matchedInstitutionId: true,
        phone: true,
        email: true,
        mobile: true,
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
    });

    let updated = 0;
    let institutionsUpdated = 0;

    for (const row of rows) {
      const before = await this.prisma.partnershipResearchCandidate.findUnique({
        where: { id: row.id },
        select: { phone: true, email: true, mobile: true, website: true },
      });
      await this.enrichMissingFields(row.id);
      const after = await this.prisma.partnershipResearchCandidate.findUnique({
        where: { id: row.id },
        select: {
          phone: true,
          email: true,
          mobile: true,
          whatsapp: true,
          website: true,
          matchedInstitutionId: true,
        },
      });
      if (!after || !before) continue;

      const gainedContact =
        (!before.phone && !before.mobile && !!(after.phone || after.mobile)) ||
        (!before.email && !!after.email) ||
        (!before.website && !!after.website);
      if (!gainedContact) continue;
      updated += 1;

      if (after.matchedInstitutionId) {
        const institution = await this.prisma.partnershipInstitution.findUnique({
          where: { id: after.matchedInstitutionId },
          select: {
            id: true,
            phone: true,
            mobile: true,
            generalEmail: true,
            contactEmail: true,
          },
        });
        if (institution) {
          const data: {
            phone?: string;
            mobile?: string;
            generalEmail?: string;
            contactEmail?: string;
          } = {};
          if (!institution.phone && after.phone) data.phone = after.phone;
          if (!institution.mobile && (after.mobile || after.phone)) {
            data.mobile = after.mobile || after.phone || undefined;
          }
          if (!institution.generalEmail && after.email) data.generalEmail = after.email;
          if (!institution.contactEmail && after.email) data.contactEmail = after.email;
          if (Object.keys(data).length > 0) {
            await this.prisma.partnershipInstitution.update({
              where: { id: institution.id },
              data,
            });
            institutionsUpdated += 1;
            await this.audit.record({
              performedById: actorId,
              action: 'INSTITUTION_UPDATED',
              entityType: 'INSTITUTION',
              entityId: institution.id,
              metadata: {
                kind: 'research_contact_backfill',
                candidateId: row.id,
                ...data,
              },
            });
          }
        }
      }
    }

    return { scanned: rows.length, updated, institutionsUpdated };
  }

  private async markEnrichmentAttempted(
    candidateId: string,
    extraEvidence: Array<{
      field: string;
      value: string;
      sourceUrl?: string | null;
      sourceType?: PartnershipResearchSourceType | null;
      confidence?: PartnershipResearchDataQuality;
    }>,
  ): Promise<void> {
    await this.prisma.partnershipResearchEvidence.create({
      data: {
        candidateId,
        field: 'enrichmentAttempted',
        value: 'true',
        sourceType: PartnershipResearchSourceType.SEARCH_ENGINE,
        confidence: PartnershipResearchDataQuality.MEDIUM,
      },
    });
    if (extraEvidence.length) {
      await this.prisma.partnershipResearchEvidence.createMany({
        data: extraEvidence.map((item) => ({
          candidateId,
          field: item.field,
          value: item.value,
          sourceUrl: item.sourceUrl ?? null,
          sourceType: item.sourceType ?? null,
          confidence: item.confidence ?? PartnershipResearchDataQuality.MEDIUM,
        })),
      });
    }
    await this.prisma.partnershipResearchCandidate.update({
      where: { id: candidateId },
      data: { lastCheckedAt: new Date() },
    });
  }

  private async applyEnrichmentPatchesToCandidate(
    candidateId: string,
    working: {
      email?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
      address?: string | null;
      website?: string | null;
      facebook?: string | null;
      instagram?: string | null;
      googleMapsUrl?: string | null;
    },
    patches: ReturnType<typeof applyEnrichmentPatches>,
    original: {
      email: string | null;
      phone: string | null;
      whatsapp: string | null;
      address: string | null;
      website: string | null;
      facebook: string | null;
      instagram: string | null;
      googleMapsUrl: string | null;
      governorate: string | null;
      city: string | null;
      evidence: PartnershipResearchEvidence[];
    },
  ): Promise<void> {
    const evidenceRows: Array<{
      field: string;
      value: string;
      sourceUrl?: string | null;
      sourceType?: PartnershipResearchSourceType | null;
      confidence?: PartnershipResearchDataQuality;
    }> = [];

    for (const patch of patches) {
      if (patch.action === 'SET') {
        evidenceRows.push({
          field: patch.field,
          value: patch.value,
          sourceUrl: patch.sourceUrl,
          sourceType: patch.sourceType,
          confidence: patch.confidence,
        });
        evidenceRows.push({
          field: 'evidenceSource',
          value: patch.sourceName,
          sourceUrl: patch.sourceUrl,
          sourceType: patch.sourceType,
          confidence: patch.confidence,
        });
      } else if (patch.action === 'CONFLICT') {
        evidenceRows.push({
          field: `${patch.field}_conflict`,
          value: patch.value,
          sourceUrl: patch.sourceUrl,
          sourceType: patch.sourceType,
          confidence: PartnershipResearchDataQuality.MEDIUM,
        });
      }
    }

    const dataQuality = computeDataQuality({
      name: true,
      location: Boolean(original.city || original.governorate || working.address),
      website: Boolean(working.website),
      contact: Boolean(working.email || working.phone || working.whatsapp),
      evidenceCount: (original.evidence?.length ?? 0) + evidenceRows.length + 1,
    });
    const verificationStatus = computeVerificationStatus({
      name: true,
      location: Boolean(original.city || original.governorate || working.address),
      websiteOrContact: Boolean(
        working.website || working.email || working.phone || working.whatsapp,
      ),
      evidenceCount: (original.evidence?.length ?? 0) + evidenceRows.length + 1,
    });

    await this.prisma.partnershipResearchCandidate.update({
      where: { id: candidateId },
      data: {
        email: working.email ?? original.email,
        phone: working.phone ?? original.phone,
        whatsapp: working.whatsapp ?? original.whatsapp,
        address: working.address ?? original.address,
        website: working.website ?? original.website,
        normalizedWebsiteDomain: normalizeWebsiteDomain(
          working.website ?? original.website ?? undefined,
        ),
        facebook: working.facebook ?? original.facebook,
        instagram: working.instagram ?? original.instagram,
        googleMapsUrl: working.googleMapsUrl ?? original.googleMapsUrl,
        dataQuality,
        verificationStatus: verificationStatus as never,
        lastCheckedAt: new Date(),
      },
    });

    await this.markEnrichmentAttempted(candidateId, evidenceRows);
  }

  async createCandidate(
    dto: CreateResearchCandidateDto,
    actorId: string,
  ): Promise<ResearchCandidateDto> {
    const name = sanitizeSpreadsheetValue(dto.discoveredName);
    if (!name || name.length < 2) {
      throw new BadRequestException('discoveredName is required');
    }
    if (dto.email && !isValidEmailFormat(dto.email)) {
      throw new BadRequestException('Invalid email');
    }
    if (dto.website && !isValidUrlFormat(dto.website)) {
      throw new BadRequestException('Invalid website URL');
    }
    if (dto.sourceUrl && !isValidUrlFormat(dto.sourceUrl)) {
      throw new BadRequestException('Invalid source URL');
    }
    if (dto.jobId) {
      await this.requireJob(dto.jobId);
    }

    const normalizedName = normalizeName(name);
    const normalizedPhone = normalizePhone(dto.phone ?? dto.mobile ?? dto.whatsapp);
    const normalizedWebsiteDomain = normalizeWebsiteDomain(dto.website);
    const email = normalizeEmail(dto.email);

    const dedupe = await this.resolveDuplicates({
      normalizedName,
      normalizedPhone,
      normalizedWebsiteDomain,
      normalizedContactEmail: email,
      city: dto.city ?? null,
      governorate: dto.governorate ?? null,
      name,
      generalEmail: email,
      contactEmail: email,
      admissionsEmail: null,
    });

    const evidenceCount = dto.evidence?.length ?? (dto.sourceUrl ? 1 : 0);
    const dataQuality = computeDataQuality({
      name: true,
      location: Boolean(dto.city || dto.governorate),
      website: Boolean(dto.website),
      contact: Boolean(email || normalizedPhone),
      evidenceCount,
    });
    const verificationHint = computeVerificationStatus({
      name: true,
      location: Boolean(dto.city || dto.governorate),
      websiteOrContact: Boolean(dto.website || email || normalizedPhone),
      evidenceCount,
    });

    const candidate = await this.prisma.partnershipResearchCandidate.create({
      data: {
        jobId: dto.jobId,
        discoveredName: name,
        discoveredNameAr: sanitizeSpreadsheetValue(dto.discoveredNameAr) ?? null,
        discoveredNameEn: sanitizeSpreadsheetValue(dto.discoveredNameEn) ?? null,
        normalizedName,
        governorate: dto.governorate?.trim() || null,
        city: dto.city?.trim() || null,
        district: dto.district?.trim() || null,
        address: dto.address?.trim() || null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        osmType: dto.osmType?.trim() || null,
        osmId: dto.osmId?.trim() || null,
        osmUrl: dto.osmUrl?.trim() || null,
        institutionType: dto.institutionType,
        institutionCategory: dto.institutionCategory,
        curriculum: dto.curriculum,
        educationLevel: dto.educationLevel,
        email,
        phone: dto.phone?.trim() || null,
        mobile: dto.mobile?.trim() || null,
        whatsapp: dto.whatsapp?.trim() || null,
        normalizedPhone,
        website: dto.website?.trim() || null,
        normalizedWebsiteDomain,
        facebook: dto.facebook?.trim() || null,
        instagram: dto.instagram?.trim() || null,
        linkedin: dto.linkedin?.trim() || null,
        youtube: dto.youtube?.trim() || null,
        tiktok: dto.tiktok?.trim() || null,
        googleMapsUrl: dto.googleMapsUrl?.trim() || null,
        hasCoding: dto.hasCoding ?? false,
        hasRobotics: dto.hasRobotics ?? false,
        hasStem: dto.hasStem ?? false,
        hasAi: dto.hasAi ?? false,
        hasTechClub: dto.hasTechClub ?? false,
        hasAfterSchool: dto.hasAfterSchool ?? false,
        hasSummerCamp: dto.hasSummerCamp ?? false,
        hasMakerspace: dto.hasMakerspace ?? false,
        sourceType: dto.sourceType ?? PartnershipResearchSourceType.MANUAL,
        sourceName: dto.sourceName?.trim() || null,
        sourceUrl: dto.sourceUrl?.trim() || null,
        researchStatus:
          dedupe.duplicateStatus === PartnershipResearchDuplicateStatus.EXACT_MATCH
            ? PartnershipResearchStatus.DUPLICATE
            : PartnershipResearchStatus.READY_FOR_REVIEW,
        verificationStatus:
          verificationHint === 'VERIFIED'
            ? PartnershipResearchVerificationStatus.PARTIALLY_VERIFIED
            : verificationHint === 'PARTIALLY_VERIFIED'
              ? PartnershipResearchVerificationStatus.PARTIALLY_VERIFIED
              : PartnershipResearchVerificationStatus.UNVERIFIED,
        dataQuality,
        duplicateStatus: dedupe.duplicateStatus,
        duplicateOfCandidateId: dedupe.duplicateOfCandidateId,
        matchedInstitutionId: dedupe.matchedInstitutionId,
        notes: dto.notes?.trim() ?? '',
        evidence: dto.evidence?.length
          ? {
              create: dto.evidence.map((item) => ({
                field: item.field,
                value: item.value,
                sourceUrl: item.sourceUrl ?? dto.sourceUrl ?? null,
                sourceType: item.sourceType ?? dto.sourceType ?? PartnershipResearchSourceType.MANUAL,
                confidence: item.confidence ?? PartnershipResearchDataQuality.MEDIUM,
              })),
            }
          : dto.sourceUrl
            ? {
                create: [
                  {
                    field: 'sourceUrl',
                    value: dto.sourceUrl,
                    sourceUrl: dto.sourceUrl,
                    sourceType: dto.sourceType ?? PartnershipResearchSourceType.MANUAL,
                    confidence: PartnershipResearchDataQuality.MEDIUM,
                  },
                ],
              }
            : undefined,
      },
      include: { evidence: true },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_CANDIDATE,
      entityId: candidate.id,
      action: PartnershipAuditAction.RESEARCH_CANDIDATE_CREATED,
      performedById: actorId,
      metadata: { duplicateStatus: candidate.duplicateStatus },
    });

    return this.toCandidateDto(candidate, dedupe.reasons);
  }

  async listCandidates(
    query: QueryResearchCandidatesDto,
  ): Promise<PaginatedResearchCandidatesDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildCandidateWhere(query);
    const [total, rows] = await Promise.all([
      this.prisma.partnershipResearchCandidate.count({ where }),
      this.prisma.partnershipResearchCandidate.findMany({
        where,
        orderBy: { discoveredAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { evidence: { orderBy: { discoveredAt: 'desc' }, take: 5 } },
      }),
    ]);
    return {
      items: rows.map((row) => this.toCandidateDto(row)),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async getCandidate(id: string): Promise<ResearchCandidateDto> {
    const row = await this.prisma.partnershipResearchCandidate.findUnique({
      where: { id },
      include: { evidence: { orderBy: { discoveredAt: 'desc' } } },
    });
    if (!row) {
      throw new NotFoundException('Research candidate not found');
    }
    return this.toCandidateDto(row);
  }

  async updateCandidate(
    id: string,
    dto: UpdateResearchCandidateDto,
    actorId: string,
  ): Promise<ResearchCandidateDto> {
    await this.requireCandidate(id);
    const data: Prisma.PartnershipResearchCandidateUpdateInput = {};
    if (dto.discoveredName !== undefined) {
      const name = sanitizeSpreadsheetValue(dto.discoveredName);
      if (!name || name.length < 2) {
        throw new BadRequestException('discoveredName is required');
      }
      data.discoveredName = name;
      data.normalizedName = normalizeName(name);
    }
    const stringFields = [
      'discoveredNameAr',
      'discoveredNameEn',
      'governorate',
      'city',
      'district',
      'address',
      'phone',
      'mobile',
      'whatsapp',
      'website',
      'facebook',
      'instagram',
      'linkedin',
      'youtube',
      'tiktok',
      'googleMapsUrl',
      'sourceName',
      'sourceUrl',
      'notes',
    ] as const;
    for (const field of stringFields) {
      if (dto[field] !== undefined) {
        (data as Record<string, unknown>)[field] =
          typeof dto[field] === 'string' ? dto[field]!.trim() || null : dto[field];
      }
    }
    if (dto.email !== undefined) {
      if (dto.email && !isValidEmailFormat(dto.email)) {
        throw new BadRequestException('Invalid email');
      }
      data.email = normalizeEmail(dto.email);
    }
    if (dto.website !== undefined) {
      data.normalizedWebsiteDomain = normalizeWebsiteDomain(dto.website);
    }
    if (dto.phone !== undefined || dto.mobile !== undefined || dto.whatsapp !== undefined) {
      data.normalizedPhone = normalizePhone(
        (dto.phone as string | undefined) ??
          (dto.mobile as string | undefined) ??
          (dto.whatsapp as string | undefined),
      );
    }
    for (const flag of [
      'institutionType',
      'institutionCategory',
      'curriculum',
      'educationLevel',
      'sourceType',
      'hasCoding',
      'hasRobotics',
      'hasStem',
      'hasAi',
      'hasTechClub',
      'hasAfterSchool',
      'hasSummerCamp',
      'hasMakerspace',
    ] as const) {
      if (dto[flag] !== undefined) {
        (data as Record<string, unknown>)[flag] = dto[flag];
      }
    }

    const updated = await this.prisma.partnershipResearchCandidate.update({
      where: { id },
      data: { ...data, lastCheckedAt: new Date() },
      include: { evidence: true },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_CANDIDATE,
      entityId: id,
      action: PartnershipAuditAction.RESEARCH_CANDIDATE_UPDATED,
      performedById: actorId,
    });
    return this.toCandidateDto(updated);
  }

  async verify(id: string, actorId: string): Promise<ResearchCandidateDto> {
    const row = await this.requireCandidate(id);
    if (row.researchStatus === PartnershipResearchStatus.IMPORTED) {
      throw new BadRequestException('Candidate already imported');
    }
    const updated = await this.prisma.partnershipResearchCandidate.update({
      where: { id },
      data: {
        researchStatus: PartnershipResearchStatus.VERIFIED,
        verificationStatus: PartnershipResearchVerificationStatus.VERIFIED,
        lastCheckedAt: new Date(),
      },
      include: { evidence: true },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_CANDIDATE,
      entityId: id,
      action: PartnershipAuditAction.RESEARCH_CANDIDATE_VERIFIED,
      performedById: actorId,
    });
    return this.toCandidateDto(updated);
  }

  async reject(id: string, actorId: string): Promise<ResearchCandidateDto> {
    const updated = await this.prisma.partnershipResearchCandidate.update({
      where: { id },
      data: {
        researchStatus: PartnershipResearchStatus.REJECTED,
        lastCheckedAt: new Date(),
      },
      include: { evidence: true },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_CANDIDATE,
      entityId: id,
      action: PartnershipAuditAction.RESEARCH_CANDIDATE_REJECTED,
      performedById: actorId,
    });
    return this.toCandidateDto(updated);
  }

  async markDuplicate(
    id: string,
    dto: MarkDuplicateDto,
    actorId: string,
  ): Promise<ResearchCandidateDto> {
    const updated = await this.prisma.partnershipResearchCandidate.update({
      where: { id },
      data: {
        researchStatus: PartnershipResearchStatus.DUPLICATE,
        duplicateStatus: PartnershipResearchDuplicateStatus.REVIEWED_DUPLICATE,
        duplicateOfCandidateId: dto.duplicateOfCandidateId ?? null,
        matchedInstitutionId: dto.matchedInstitutionId ?? null,
        notes: dto.notes?.trim() || undefined,
        lastCheckedAt: new Date(),
      },
      include: { evidence: true },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_CANDIDATE,
      entityId: id,
      action: PartnershipAuditAction.RESEARCH_CANDIDATE_DUPLICATE,
      performedById: actorId,
      metadata: {
        duplicateOfCandidateId: dto.duplicateOfCandidateId,
        matchedInstitutionId: dto.matchedInstitutionId,
      },
    });
    return this.toCandidateDto(updated);
  }

  async importToCrm(
    id: string,
    actorId: string,
  ): Promise<{ candidate: ResearchCandidateDto; institutionId: string }> {
    const candidate = await this.requireCandidate(id);
    if (candidate.researchStatus === PartnershipResearchStatus.IMPORTED) {
      throw new ConflictException('Candidate already imported');
    }
    if (candidate.researchStatus === PartnershipResearchStatus.REJECTED) {
      throw new BadRequestException('Cannot import a rejected candidate');
    }

    // Re-check duplicates against CRM using Phase E logic
    const rematch = await this.resolveDuplicates({
      normalizedName: candidate.normalizedName,
      normalizedPhone: candidate.normalizedPhone,
      normalizedWebsiteDomain: candidate.normalizedWebsiteDomain,
      normalizedContactEmail: normalizeEmail(candidate.email),
      city: candidate.city,
      governorate: candidate.governorate,
      name: candidate.discoveredName,
      generalEmail: candidate.email,
      contactEmail: candidate.email,
      admissionsEmail: null,
    });

    if (
      rematch.duplicateStatus === PartnershipResearchDuplicateStatus.EXACT_MATCH &&
      rematch.matchedInstitutionId
    ) {
      await this.prisma.partnershipResearchCandidate.update({
        where: { id },
        data: {
          duplicateStatus: PartnershipResearchDuplicateStatus.EXACT_MATCH,
          matchedInstitutionId: rematch.matchedInstitutionId,
          researchStatus: PartnershipResearchStatus.DUPLICATE,
        },
      });
      throw new ConflictException({
        message: 'Exact match with existing CRM institution — import blocked',
        matchedInstitutionId: rematch.matchedInstitutionId,
        reasons: rematch.reasons,
      });
    }

    let sourceId: string | null = null;
    if (candidate.sourceName || candidate.sourceUrl) {
      const existingSource = candidate.sourceName
        ? await this.prisma.partnershipSource.findFirst({
            where: {
              sourceName: { equals: candidate.sourceName, mode: 'insensitive' },
            },
          })
        : null;
      if (existingSource) {
        sourceId = existingSource.id;
      } else {
        const createdSource = await this.prisma.partnershipSource.create({
          data: {
            sourceType: PartnershipSourceType.MANUAL_RESEARCH,
            sourceName: candidate.sourceName || 'Research candidate',
            sourceUrl: candidate.sourceUrl,
            description: 'Promoted from research candidate',
          },
        });
        sourceId = createdSource.id;
        await this.audit.record({
          entityType: PartnershipAuditEntityType.SOURCE,
          entityId: createdSource.id,
          action: PartnershipAuditAction.SOURCE_CREATED,
          performedById: actorId,
        });
      }
    }

    const institution = await this.prisma.partnershipInstitution.create({
      data: {
        name: candidate.discoveredName,
        arabicName: candidate.discoveredNameAr,
        englishName: candidate.discoveredNameEn,
        normalizedName: candidate.normalizedName,
        institutionType: candidate.institutionType,
        institutionCategory: candidate.institutionCategory,
        curriculum: candidate.curriculum,
        educationLevel: candidate.educationLevel,
        governorate: candidate.governorate,
        city: candidate.city,
        district: candidate.district,
        fullAddress: candidate.address,
        phone: candidate.phone,
        mobile: candidate.mobile,
        whatsapp: candidate.whatsapp,
        normalizedPhone: candidate.normalizedPhone,
        generalEmail: candidate.email,
        website: candidate.website,
        normalizedWebsiteDomain: candidate.normalizedWebsiteDomain,
        facebook: candidate.facebook,
        instagram: candidate.instagram,
        linkedin: candidate.linkedin,
        youtube: candidate.youtube,
        tiktok: candidate.tiktok,
        googleMapsUrl: candidate.googleMapsUrl,
        hasCoding: candidate.hasCoding,
        hasRobotics: candidate.hasRobotics,
        hasStem: candidate.hasStem,
        hasAi: candidate.hasAi,
        hasTechClub: candidate.hasTechClub,
        hasAfterSchool: candidate.hasAfterSchool,
        hasSummerCamp: candidate.hasSummerCamp,
        hasMakerspace: candidate.hasMakerspace,
        leadPriority: PartnershipLeadPriority.UNKNOWN,
        status: PartnershipInstitutionStatus.PROSPECT,
        notes: '',
        sourceId,
      },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.INSTITUTION,
      entityId: institution.id,
      action: PartnershipAuditAction.INSTITUTION_CREATED,
      performedById: actorId,
      metadata: { via: 'research_import', candidateId: id },
    });

    if (candidate.email || candidate.phone || candidate.mobile || candidate.whatsapp) {
      const contactName = candidate.discoveredName;
      const parts = contactName.trim().split(/\s+/);
      await this.prisma.partnershipContact.create({
        data: {
          institutionId: institution.id,
          firstName: parts[0] || 'Contact',
          lastName: parts.slice(1).join(' '),
          fullName: contactName,
          email: candidate.email,
          phone: candidate.phone,
          mobile: candidate.mobile,
          whatsapp: candidate.whatsapp,
          isPrimary: true,
          isPublicContact: true,
        },
      });
    }

    if (candidate.notes?.trim()) {
      await this.prisma.partnershipNote.create({
        data: {
          institutionId: institution.id,
          content: `[Research] ${candidate.notes.trim()}`,
          createdById: actorId,
        },
      });
    }

    await ensureDefaultLeadForInstitution(this.prisma, this.audit, {
      institutionId: institution.id,
      actorId,
      priority: institution.leadPriority,
      sourceId: institution.sourceId,
    });

    const updated = await this.prisma.partnershipResearchCandidate.update({
      where: { id },
      data: {
        researchStatus: PartnershipResearchStatus.IMPORTED,
        matchedInstitutionId: institution.id,
        lastCheckedAt: new Date(),
      },
      include: { evidence: true },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.RESEARCH_CANDIDATE,
      entityId: id,
      action: PartnershipAuditAction.RESEARCH_CANDIDATE_IMPORTED,
      performedById: actorId,
      metadata: { institutionId: institution.id },
    });

    return { candidate: this.toCandidateDto(updated), institutionId: institution.id };
  }

  async markStaleOlderThan(days = RESEARCH_STALE_DAYS): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.prisma.partnershipResearchCandidate.updateMany({
      where: {
        researchStatus: PartnershipResearchStatus.VERIFIED,
        OR: [{ lastCheckedAt: { lt: cutoff } }, { lastCheckedAt: null, discoveredAt: { lt: cutoff } }],
      },
      data: {
        researchStatus: PartnershipResearchStatus.STALE,
        verificationStatus: PartnershipResearchVerificationStatus.STALE,
      },
    });
    return result.count;
  }

  private async resolveDuplicates(input: {
    normalizedName: string | null;
    normalizedPhone: string | null;
    normalizedWebsiteDomain: string | null;
    normalizedContactEmail: string | null;
    city: string | null;
    governorate: string | null;
    name: string;
    generalEmail: string | null;
    contactEmail: string | null;
    admissionsEmail: string | null;
  }): Promise<{
    duplicateStatus: PartnershipResearchDuplicateStatus;
    matchedInstitutionId: string | null;
    duplicateOfCandidateId: string | null;
    reasons: string[];
  }> {
    const or: Prisma.PartnershipInstitutionWhereInput[] = [];
    if (input.normalizedWebsiteDomain) {
      or.push({ normalizedWebsiteDomain: input.normalizedWebsiteDomain });
    }
    if (input.normalizedPhone) {
      or.push({ normalizedPhone: input.normalizedPhone });
    }
    if (input.normalizedName) {
      or.push({ normalizedName: input.normalizedName });
    }
    if (input.normalizedContactEmail) {
      or.push(
        { generalEmail: { equals: input.normalizedContactEmail, mode: 'insensitive' } },
        { contactEmail: { equals: input.normalizedContactEmail, mode: 'insensitive' } },
      );
    }

    const institutions: InstitutionLookup[] =
      or.length === 0
        ? []
        : await this.prisma.partnershipInstitution.findMany({
            where: { deletedAt: null, OR: or },
            select: {
              id: true,
              name: true,
              normalizedName: true,
              normalizedPhone: true,
              normalizedWebsiteDomain: true,
              city: true,
              governorate: true,
              generalEmail: true,
              contactEmail: true,
              admissionsEmail: true,
            },
          });

    const row: NormalizedImportRow = {
      name: input.name,
      city: input.city ?? undefined,
      governorate: input.governorate ?? undefined,
      generalEmail: input.generalEmail ?? undefined,
      contactEmail: input.contactEmail ?? undefined,
      admissionsEmail: input.admissionsEmail ?? undefined,
      normalizedName: input.normalizedName,
      normalizedPhone: input.normalizedPhone,
      normalizedWebsiteDomain: input.normalizedWebsiteDomain,
      normalizedContactEmail: input.normalizedContactEmail,
      normalizedCity: normalizeName(input.city),
      normalizedGovernorate: normalizeName(input.governorate),
    };

    const institutionMatch = detectDuplicates({
      rowNumber: 1,
      row,
      dbCandidates: institutions,
      priorCsvRows: [],
    });

    const candidateOr: Prisma.PartnershipResearchCandidateWhereInput[] = [];
    if (input.normalizedWebsiteDomain) {
      candidateOr.push({ normalizedWebsiteDomain: input.normalizedWebsiteDomain });
    }
    if (input.normalizedPhone) {
      candidateOr.push({ normalizedPhone: input.normalizedPhone });
    }
    if (input.normalizedName) {
      candidateOr.push({ normalizedName: input.normalizedName });
    }

    const otherCandidates =
      candidateOr.length === 0
        ? []
        : await this.prisma.partnershipResearchCandidate.findMany({
            where: { OR: candidateOr },
            take: 20,
          });

    const candidateLookups: InstitutionLookup[] = otherCandidates.map((c) => ({
      id: c.id,
      name: c.discoveredName,
      normalizedName: c.normalizedName,
      normalizedPhone: c.normalizedPhone,
      normalizedWebsiteDomain: c.normalizedWebsiteDomain,
      city: c.city,
      governorate: c.governorate,
      generalEmail: c.email,
      contactEmail: c.email,
      admissionsEmail: null,
    }));

    const candidateMatch = detectDuplicates({
      rowNumber: 1,
      row,
      dbCandidates: candidateLookups,
      priorCsvRows: [],
    });

    if (institutionMatch.confidence === PartnershipImportMatchConfidence.EXACT) {
      return {
        duplicateStatus: PartnershipResearchDuplicateStatus.EXACT_MATCH,
        matchedInstitutionId: institutionMatch.matchedInstitutionId,
        duplicateOfCandidateId: null,
        reasons: institutionMatch.reasons,
      };
    }
    if (candidateMatch.confidence === PartnershipImportMatchConfidence.EXACT) {
      return {
        duplicateStatus: PartnershipResearchDuplicateStatus.EXACT_MATCH,
        matchedInstitutionId: null,
        duplicateOfCandidateId: candidateMatch.matchedInstitutionId,
        reasons: candidateMatch.reasons,
      };
    }
    if (institutionMatch.confidence === PartnershipImportMatchConfidence.POSSIBLE) {
      return {
        duplicateStatus: PartnershipResearchDuplicateStatus.POSSIBLE_MATCH,
        matchedInstitutionId: institutionMatch.matchedInstitutionId,
        duplicateOfCandidateId: null,
        reasons: institutionMatch.reasons,
      };
    }
    if (candidateMatch.confidence === PartnershipImportMatchConfidence.POSSIBLE) {
      return {
        duplicateStatus: PartnershipResearchDuplicateStatus.POSSIBLE_MATCH,
        matchedInstitutionId: null,
        duplicateOfCandidateId: candidateMatch.matchedInstitutionId,
        reasons: candidateMatch.reasons,
      };
    }
    return {
      duplicateStatus: PartnershipResearchDuplicateStatus.NEW,
      matchedInstitutionId: null,
      duplicateOfCandidateId: null,
      reasons: [],
    };
  }

  private buildCandidateWhere(
    query: QueryResearchCandidatesDto,
  ): Prisma.PartnershipResearchCandidateWhereInput {
    const where: Prisma.PartnershipResearchCandidateWhereInput = {};
    if (query.jobId) where.jobId = query.jobId;
    if (query.governorate) {
      where.governorate = { equals: query.governorate, mode: 'insensitive' };
    }
    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.institutionType) where.institutionType = query.institutionType;
    if (query.researchStatus) where.researchStatus = query.researchStatus;
    if (query.verificationStatus) where.verificationStatus = query.verificationStatus;
    if (query.duplicateStatus) where.duplicateStatus = query.duplicateStatus;
    if (query.sourceType) where.sourceType = query.sourceType;
    if (query.hasCoding != null) where.hasCoding = query.hasCoding;
    if (query.hasRobotics != null) where.hasRobotics = query.hasRobotics;
    if (query.hasStem != null) where.hasStem = query.hasStem;
    if (query.hasAi != null) where.hasAi = query.hasAi;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { discoveredName: { contains: search, mode: 'insensitive' } },
        { discoveredNameAr: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private async requireJob(id: string) {
    const job = await this.prisma.partnershipResearchJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Research job not found');
    }
    return job;
  }

  private async requireCandidate(id: string) {
    const row = await this.prisma.partnershipResearchCandidate.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Research candidate not found');
    }
    return row;
  }

  private toJobDto(job: JobWithUser): ResearchJobDto {
    return {
      id: job.id,
      name: job.name,
      governorate: job.governorate,
      city: job.city,
      district: job.district,
      institutionType: job.institutionType,
      institutionCategory: job.institutionCategory,
      curriculum: job.curriculum,
      language: job.language,
      technology: (job.technologyJson ?? {}) as ResearchJobDto['technology'],
      queries: (job.queriesJson as unknown[]) ?? [],
      maxResultsPerQuery: job.maxResultsPerQuery,
      maxQueries: job.maxQueries,
      maxCandidates: job.maxCandidates,
      discoveryMode: job.discoveryMode,
      status: job.status,
      statistics: (job.statisticsJson as Record<string, number> | null) ?? null,
      errorMessage: job.errorMessage,
      providerNote: job.providerNote,
      requestedById: job.requestedById,
      requestedByName: job.requestedBy?.displayName ?? null,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  private toCandidateDto(
    row: CandidateWithEvidence,
    matchReasons?: string[],
  ): ResearchCandidateDto {
    return {
      id: row.id,
      jobId: row.jobId,
      discoveredName: row.discoveredName,
      discoveredNameAr: row.discoveredNameAr,
      discoveredNameEn: row.discoveredNameEn,
      governorate: row.governorate,
      city: row.city,
      district: row.district,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      osmType: row.osmType,
      osmId: row.osmId,
      osmUrl: row.osmUrl,
      institutionType: row.institutionType,
      institutionCategory: row.institutionCategory,
      curriculum: row.curriculum,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      whatsapp: row.whatsapp,
      website: row.website,
      facebook: row.facebook,
      instagram: row.instagram,
      linkedin: row.linkedin,
      youtube: row.youtube,
      tiktok: row.tiktok,
      googleMapsUrl: row.googleMapsUrl,
      hasCoding: row.hasCoding,
      hasRobotics: row.hasRobotics,
      hasStem: row.hasStem,
      hasAi: row.hasAi,
      hasTechClub: row.hasTechClub,
      hasAfterSchool: row.hasAfterSchool,
      hasSummerCamp: row.hasSummerCamp,
      hasMakerspace: row.hasMakerspace,
      sourceType: row.sourceType,
      sourceName: row.sourceName,
      sourceUrl: row.sourceUrl,
      officialWebsite: row.website,
      discoverySource: this.toDiscoverySource(row),
      evidenceSources: this.toEvidenceSources(row.evidence ?? []),
      enrichmentAttempted: (row.evidence ?? []).some((e) => e.field === 'enrichmentAttempted'),
      discoveredAt: row.discoveredAt.toISOString(),
      lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
      researchStatus: row.researchStatus,
      verificationStatus: row.verificationStatus,
      dataQuality: row.dataQuality,
      duplicateStatus: row.duplicateStatus,
      duplicateOfCandidateId: row.duplicateOfCandidateId,
      matchedInstitutionId: row.matchedInstitutionId,
      notes: row.notes,
      evidence: row.evidence?.map((item) => this.toEvidenceDto(item)),
      matchReasons,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDiscoverySource(row: {
    sourceName: string | null;
    sourceUrl: string | null;
    sourceType: PartnershipResearchSourceType;
    osmUrl?: string | null;
  }): { label: string; url: string | null; type: string } {
    const provider = (row.sourceName ?? '').toUpperCase();
    let label = row.sourceName || row.sourceType;
    if (row.sourceType === PartnershipResearchSourceType.OSM || provider.includes('OPENSTREETMAP')) {
      label = 'OpenStreetMap';
    } else if (provider.includes('WEB_SEARCH') || provider === 'SERPER' || provider === 'BRAVE') {
      label = 'Serper / Google Search';
    } else if (row.sourceUrl) {
      label = sourceDisplayName(row.sourceUrl);
    }
    return {
      label,
      url: row.osmUrl || row.sourceUrl,
      type: row.sourceType,
    };
  }

  private toEvidenceSources(
    evidence: PartnershipResearchEvidence[],
  ): Array<{ label: string; url: string | null; type: string | null }> {
    const byKey = new Map<string, { label: string; url: string | null; type: string | null }>();
    for (const item of evidence) {
      if (
        item.field === 'enrichmentAttempted' ||
        item.field === 'discoverySource' ||
        item.field === 'searchResult' ||
        item.field === 'snippet'
      ) {
        continue;
      }
      if (item.field === 'evidenceSource' && item.value) {
        const key = item.value.toLowerCase();
        if (!byKey.has(key)) {
          byKey.set(key, {
            label: item.value,
            url: item.sourceUrl,
            type: item.sourceType,
          });
        }
        continue;
      }
      if (item.sourceUrl) {
        const label = sourceDisplayName(item.sourceUrl);
        const key = label.toLowerCase();
        if (!byKey.has(key)) {
          byKey.set(key, {
            label,
            url: item.sourceUrl,
            type: item.sourceType,
          });
        }
      }
    }
    return [...byKey.values()];
  }

  private toEvidenceDto(row: PartnershipResearchEvidence): ResearchEvidenceDto {
    return {
      id: row.id,
      field: row.field,
      value: row.value,
      sourceUrl: row.sourceUrl,
      sourceType: row.sourceType,
      discoveredAt: row.discoveredAt.toISOString(),
      confidence: row.confidence,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
