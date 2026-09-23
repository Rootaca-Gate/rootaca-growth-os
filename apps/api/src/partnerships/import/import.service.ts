import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipImportMatchConfidence,
  PartnershipImportRow,
  PartnershipImportRowDecision,
  PartnershipImportRowResult,
  PartnershipImportStatus,
  PartnershipInstitutionStatus,
  PartnershipLeadPriority,
  PartnershipSourceType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { ensureDefaultLeadForInstitution } from '../common/ensure-default-lead';
import {
  normalizeEmail,
  normalizePhone,
} from '../common/partnership.normalize';
import { parseCsvText } from './csv/parse-csv';
import {
  defaultDecisionForMatch,
  detectDuplicates,
  InstitutionLookup,
} from './dedupe/duplicate-detect';
import { buildMergeUpdate } from './dedupe/merge-institution';
import {
  ImportJobDto,
  ImportPreviewResponseDto,
  ImportPreviewRowDto,
  ImportResultCountsDto,
  ImportSummaryDto,
  PaginatedImportJobsDto,
  PaginatedImportRowsDto,
  QueryImportHistoryDto,
  QueryImportRowsDto,
  UpdateImportDecisionsDto,
} from './dto/import.dto';
import {
  IMPORT_ALLOWED_MIME,
  IMPORT_EXECUTE_BATCH_SIZE,
  IMPORT_JOB_TTL_HOURS,
  IMPORT_LOOKUP_CHUNK_SIZE,
  IMPORT_MAX_FILE_BYTES,
} from './import.constants';
import {
  autoMapHeaders,
  IMPORT_CRM_FIELDS,
  ImportCrmField,
} from './mapping/field-aliases';
import {
  applyMapping,
  hasContactData,
  MappedImportRow,
  normalizeMappedRow,
  NormalizedImportRow,
  splitContactName,
  validateMappedRow,
} from './mapping/row-mapper';

type SummaryJson = ImportSummaryDto;
type ResultJson = ImportResultCountsDto;

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {}

  async preview(
    file: Express.Multer.File | undefined,
    mappingRaw: string | undefined,
    actorId: string,
  ): Promise<ImportPreviewResponseDto> {
    this.assertFile(file);
    const parsed = parseCsvText(file.buffer);
    const suggestedMapping = autoMapHeaders(parsed.headers);
    const mapping = this.parseMapping(mappingRaw, suggestedMapping, parsed.headers);

    if (!Object.values(mapping).includes('name')) {
      throw new BadRequestException('Mapping must include a column for required field: name');
    }

    const expiresAt = new Date(Date.now() + IMPORT_JOB_TTL_HOURS * 60 * 60 * 1000);
    const analyzed = await this.analyzeRows(parsed.rows, mapping);

    const job = await this.prisma.partnershipImportJob.create({
      data: {
        fileName: file.originalname || 'upload.csv',
        fileSizeBytes: file.size,
        uploadedById: actorId,
        status: PartnershipImportStatus.DRAFT,
        headersJson: parsed.headers,
        mappingJson: mapping,
        summaryJson: analyzed.summary as unknown as Prisma.InputJsonValue,
        expiresAt,
        rows: {
          create: analyzed.rows.map((row) => ({
            rowNumber: row.rowNumber,
            rawJson: row.raw as unknown as Prisma.InputJsonValue,
            mappedJson: row.mapped as unknown as Prisma.InputJsonValue,
            normalizedJson: row.normalized as unknown as Prisma.InputJsonValue,
            isValid: row.isValid,
            validationErrorsJson: row.validationErrors as unknown as Prisma.InputJsonValue,
            matchConfidence: row.matchConfidence,
            matchReasonsJson: row.matchReasons as unknown as Prisma.InputJsonValue,
            matchedInstitutionId: row.matchedInstitutionId,
            matchedInstitutionName: row.matchedInstitutionName,
            csvDuplicateOfRow: row.csvDuplicateOfRow,
            decision: row.decision,
          })),
        },
      },
      include: { uploadedBy: { select: { displayName: true } } },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.IMPORT,
      entityId: job.id,
      action: PartnershipAuditAction.IMPORT_STARTED,
      performedById: actorId,
      metadata: {
        fileName: job.fileName,
        totalRows: analyzed.summary.totalRows,
      },
    });

    const pageRows = analyzed.rows.slice(0, 50).map((row) => this.toPreviewRow(row));

    return {
      job: this.toJobDto(job),
      suggestedMapping,
      crmFields: IMPORT_CRM_FIELDS,
      rows: pageRows,
      rowsTotal: analyzed.rows.length,
      page: 1,
      pageSize: 50,
      pageCount: Math.ceil(analyzed.rows.length / 50) || 0,
    };
  }

  async remap(
    jobId: string,
    mapping: Record<string, ImportCrmField | null>,
    actorId: string,
  ): Promise<ImportPreviewResponseDto> {
    const job = await this.requireDraftJob(jobId);
    const headers = job.headersJson as string[];
    this.validateMappingKeys(mapping, headers);
    if (!Object.values(mapping).includes('name')) {
      throw new BadRequestException('Mapping must include a column for required field: name');
    }

    const existingRows = await this.prisma.partnershipImportRow.findMany({
      where: { jobId },
      orderBy: { rowNumber: 'asc' },
    });
    const rawRows = existingRows.map((row) => row.rawJson as Record<string, string>);
    const analyzed = await this.analyzeRows(rawRows, mapping);

    await this.prisma.$transaction(async (tx) => {
      await tx.partnershipImportRow.deleteMany({ where: { jobId } });
      await tx.partnershipImportJob.update({
        where: { id: jobId },
        data: {
          mappingJson: mapping,
          summaryJson: analyzed.summary as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
      await tx.partnershipImportRow.createMany({
        data: analyzed.rows.map((row) => ({
          jobId,
          rowNumber: row.rowNumber,
          rawJson: row.raw as unknown as Prisma.InputJsonValue,
          mappedJson: row.mapped as unknown as Prisma.InputJsonValue,
          normalizedJson: row.normalized as unknown as Prisma.InputJsonValue,
          isValid: row.isValid,
          validationErrorsJson: row.validationErrors as unknown as Prisma.InputJsonValue,
          matchConfidence: row.matchConfidence,
          matchReasonsJson: row.matchReasons as unknown as Prisma.InputJsonValue,
          matchedInstitutionId: row.matchedInstitutionId,
          matchedInstitutionName: row.matchedInstitutionName,
          csvDuplicateOfRow: row.csvDuplicateOfRow,
          decision: row.decision,
        })),
      });
    });

    void actorId;
    return this.getPreview(jobId, { page: 1, pageSize: 50, filter: 'all' });
  }

  async getPreview(jobId: string, query: QueryImportRowsDto): Promise<ImportPreviewResponseDto> {
    const job = await this.prisma.partnershipImportJob.findUnique({
      where: { id: jobId },
      include: { uploadedBy: { select: { displayName: true } } },
    });
    if (!job) {
      throw new NotFoundException('Import job not found');
    }
    const rowsPage = await this.listRows(jobId, query);
    return {
      job: this.toJobDto(job),
      suggestedMapping: autoMapHeaders(job.headersJson as string[]),
      crmFields: IMPORT_CRM_FIELDS,
      rows: rowsPage.items,
      rowsTotal: rowsPage.total,
      page: rowsPage.page,
      pageSize: rowsPage.pageSize,
      pageCount: rowsPage.pageCount,
    };
  }

  async listRows(jobId: string, query: QueryImportRowsDto): Promise<PaginatedImportRowsDto> {
    await this.requireJob(jobId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const where = this.buildRowFilter(jobId, query.filter);

    const [total, rows] = await Promise.all([
      this.prisma.partnershipImportRow.count({ where }),
      this.prisma.partnershipImportRow.findMany({
        where,
        orderBy: { rowNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => this.toPreviewRowFromDb(row)),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async updateDecisions(jobId: string, dto: UpdateImportDecisionsDto): Promise<ImportJobDto> {
    const job = await this.requireDraftJob(jobId);

    if (dto.bulk === 'SKIP_ALL_EXACT') {
      await this.prisma.partnershipImportRow.updateMany({
        where: {
          jobId,
          isValid: true,
          matchConfidence: PartnershipImportMatchConfidence.EXACT,
        },
        data: { decision: PartnershipImportRowDecision.SKIP },
      });
    }

    if (dto.bulk === 'IMPORT_ALL_NEW') {
      await this.prisma.partnershipImportRow.updateMany({
        where: {
          jobId,
          isValid: true,
          matchConfidence: PartnershipImportMatchConfidence.NONE,
          csvDuplicateOfRow: null,
        },
        data: { decision: PartnershipImportRowDecision.IMPORT },
      });
    }

    for (const item of dto.decisions ?? []) {
      const row = await this.prisma.partnershipImportRow.findUnique({
        where: { jobId_rowNumber: { jobId, rowNumber: item.rowNumber } },
      });
      if (!row) {
        throw new BadRequestException(`Unknown row ${item.rowNumber}`);
      }
      if (!row.isValid && item.decision !== PartnershipImportRowDecision.SKIP) {
        throw new BadRequestException(`Row ${item.rowNumber} is invalid and can only be skipped`);
      }
      if (
        item.decision === PartnershipImportRowDecision.MERGE &&
        !item.mergeTargetId &&
        !row.matchedInstitutionId
      ) {
        throw new BadRequestException(`Row ${item.rowNumber} MERGE requires a target institution`);
      }
      if (
        item.decision === PartnershipImportRowDecision.IMPORT_ANYWAY &&
        row.matchConfidence === PartnershipImportMatchConfidence.NONE &&
        row.csvDuplicateOfRow == null
      ) {
        // allowed but equivalent to IMPORT
      }

      await this.prisma.partnershipImportRow.update({
        where: { id: row.id },
        data: {
          decision: item.decision,
          ...(item.mergeTargetId
            ? {
                matchedInstitutionId: item.mergeTargetId,
              }
            : {}),
        },
      });
    }

    const updated = await this.prisma.partnershipImportJob.findUnique({
      where: { id: job.id },
      include: { uploadedBy: { select: { displayName: true } } },
    });
    return this.toJobDto(updated!);
  }

  async execute(jobId: string, actorId: string): Promise<ImportJobDto> {
    const job = await this.requireDraftJob(jobId);
    if (job.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Import preview expired. Upload the CSV again.');
    }

    await this.prisma.partnershipImportJob.update({
      where: { id: jobId },
      data: { status: PartnershipImportStatus.PROCESSING },
    });

    const counts: ResultJson = {
      imported: 0,
      merged: 0,
      skipped: 0,
      failed: 0,
      invalid: 0,
    };

    try {
      const rows = await this.prisma.partnershipImportRow.findMany({
        where: { jobId },
        orderBy: { rowNumber: 'asc' },
      });

      for (let i = 0; i < rows.length; i += IMPORT_EXECUTE_BATCH_SIZE) {
        const batch = rows.slice(i, i + IMPORT_EXECUTE_BATCH_SIZE);
        for (const row of batch) {
          await this.executeRow(row, actorId, counts);
        }
      }

      const status =
        counts.failed > 0
          ? PartnershipImportStatus.COMPLETED_WITH_ERRORS
          : PartnershipImportStatus.COMPLETED;

      const updated = await this.prisma.partnershipImportJob.update({
        where: { id: jobId },
        data: {
          status,
          resultJson: counts as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
        include: { uploadedBy: { select: { displayName: true } } },
      });

      await this.audit.record({
        entityType: PartnershipAuditEntityType.IMPORT,
        entityId: jobId,
        action: PartnershipAuditAction.IMPORT_COMPLETED,
        performedById: actorId,
        metadata: counts as unknown as Prisma.InputJsonValue,
      });

      return this.toJobDto(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      await this.prisma.partnershipImportJob.update({
        where: { id: jobId },
        data: {
          status: PartnershipImportStatus.FAILED,
          errorMessage: message,
          completedAt: new Date(),
          resultJson: counts as unknown as Prisma.InputJsonValue,
        },
      });
      await this.audit.record({
        entityType: PartnershipAuditEntityType.IMPORT,
        entityId: jobId,
        action: PartnershipAuditAction.IMPORT_FAILED,
        performedById: actorId,
        metadata: { message, ...counts },
      });
      throw error;
    }
  }

  async history(query: QueryImportHistoryDto): Promise<PaginatedImportJobsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [total, rows] = await Promise.all([
      this.prisma.partnershipImportJob.count(),
      this.prisma.partnershipImportJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { uploadedBy: { select: { displayName: true } } },
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

  async historyOne(id: string): Promise<ImportPreviewResponseDto> {
    return this.getPreview(id, { page: 1, pageSize: 50, filter: 'all' });
  }

  private async executeRow(
    row: PartnershipImportRow,
    actorId: string,
    counts: ResultJson,
  ): Promise<void> {
    if (!row.isValid || row.decision === PartnershipImportRowDecision.SKIP) {
      if (!row.isValid) {
        counts.invalid += 1;
        await this.markRow(row.id, PartnershipImportRowResult.INVALID, 'Invalid row');
      } else {
        counts.skipped += 1;
        await this.markRow(row.id, PartnershipImportRowResult.SKIPPED);
      }
      return;
    }

    const mapped = row.mappedJson as MappedImportRow;
    const normalized = row.normalizedJson as NormalizedImportRow;

    try {
      if (row.decision === PartnershipImportRowDecision.MERGE) {
        const targetId = row.matchedInstitutionId;
        if (!targetId) {
          throw new Error('MERGE requires matchedInstitutionId');
        }
        const existing = await this.prisma.partnershipInstitution.findFirst({
          where: { id: targetId, deletedAt: null },
        });
        if (!existing) {
          throw new Error('Merge target institution no longer exists');
        }

        // Re-check: if another stronger exact match appeared, still merge into chosen target.
        const updateData = buildMergeUpdate(existing, mapped);
        const updated = await this.prisma.partnershipInstitution.update({
          where: { id: existing.id },
          data: updateData,
        });

        await this.maybeCreateContact(updated.id, mapped, actorId);
        await this.maybeAppendNote(updated.id, mapped.notes, actorId);
        await this.maybeAttachSource(updated.id, mapped, existing.sourceId, actorId);

        await this.audit.record({
          entityType: PartnershipAuditEntityType.INSTITUTION,
          entityId: updated.id,
          action: PartnershipAuditAction.INSTITUTION_MERGED,
          performedById: actorId,
          metadata: { importJobId: row.jobId, rowNumber: row.rowNumber },
        });

        counts.merged += 1;
        await this.markRow(row.id, PartnershipImportRowResult.MERGED, null, updated.id);
        return;
      }

      // IMPORT or IMPORT_ANYWAY — re-check duplicates for safety
      if (row.decision === PartnershipImportRowDecision.IMPORT) {
        const fresh = await this.findDbMatchesForNormalized(normalized);
        const rematch = detectDuplicates({
          rowNumber: row.rowNumber,
          row: normalized,
          dbCandidates: fresh,
          priorCsvRows: [],
        });
        if (rematch.confidence === PartnershipImportMatchConfidence.EXACT && rematch.matchedInstitutionId) {
          counts.skipped += 1;
          await this.markRow(
            row.id,
            PartnershipImportRowResult.SKIPPED,
            'Exact duplicate appeared after preview; skipped to protect existing record',
            rematch.matchedInstitutionId,
          );
          return;
        }
      }

      const created = await this.createInstitutionFromMapped(mapped, normalized, actorId);
      await this.maybeCreateContact(created.id, mapped, actorId);
      await this.maybeAppendNote(created.id, mapped.notes, actorId);
      await ensureDefaultLeadForInstitution(this.prisma, this.audit, {
        institutionId: created.id,
        actorId,
        priority: created.leadPriority,
        sourceId: created.sourceId,
      });

      counts.imported += 1;
      await this.markRow(row.id, PartnershipImportRowResult.IMPORTED, null, created.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Row failed';
      counts.failed += 1;
      await this.markRow(row.id, PartnershipImportRowResult.FAILED, message);
    }
  }

  private async createInstitutionFromMapped(
    mapped: MappedImportRow,
    normalized: NormalizedImportRow,
    actorId: string,
  ) {
    const sourceId = await this.resolveSourceId(mapped, actorId);
    const row = await this.prisma.partnershipInstitution.create({
      data: {
        name: mapped.name!.trim(),
        arabicName: mapped.arabicName ?? null,
        englishName: mapped.englishName ?? null,
        normalizedName: normalized.normalizedName,
        institutionType: mapped.institutionType,
        institutionCategory: mapped.institutionCategory,
        curriculum: mapped.curriculum,
        educationLevel: mapped.educationLevel,
        governorate: mapped.governorate ?? null,
        city: mapped.city ?? null,
        district: mapped.district ?? null,
        fullAddress: mapped.fullAddress ?? null,
        phone: mapped.phone ?? null,
        mobile: mapped.mobile ?? null,
        whatsapp: mapped.whatsapp ?? null,
        normalizedPhone: normalized.normalizedPhone,
        generalEmail: normalizeEmail(mapped.generalEmail),
        admissionsEmail: normalizeEmail(mapped.admissionsEmail),
        contactEmail: normalizeEmail(mapped.contactEmail),
        website: mapped.website ?? null,
        normalizedWebsiteDomain: normalized.normalizedWebsiteDomain,
        facebook: mapped.facebook ?? null,
        instagram: mapped.instagram ?? null,
        linkedin: mapped.linkedin ?? null,
        youtube: mapped.youtube ?? null,
        tiktok: mapped.tiktok ?? null,
        googleMapsUrl: mapped.googleMapsUrl ?? null,
        hasCoding: mapped.hasCoding ?? false,
        hasRobotics: mapped.hasRobotics ?? false,
        hasStem: mapped.hasStem ?? false,
        hasAi: mapped.hasAi ?? false,
        hasTechClub: mapped.hasTechClub ?? false,
        hasAfterSchool: mapped.hasAfterSchool ?? false,
        hasSummerCamp: mapped.hasSummerCamp ?? false,
        hasMakerspace: mapped.hasMakerspace ?? false,
        leadPriority: mapped.leadPriority ?? PartnershipLeadPriority.UNKNOWN,
        status: PartnershipInstitutionStatus.PROSPECT,
        notes: '',
        branchName: mapped.branchName ?? null,
        sourceId,
      },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.INSTITUTION,
      entityId: row.id,
      action: PartnershipAuditAction.INSTITUTION_CREATED,
      performedById: actorId,
      metadata: { via: 'csv_import' },
    });

    return row;
  }

  private async maybeCreateContact(
    institutionId: string,
    mapped: MappedImportRow,
    actorId: string,
  ): Promise<void> {
    if (!hasContactData(mapped)) {
      return;
    }
    const email = normalizeEmail(mapped.contactEmail);
    const phone = normalizePhone(mapped.phone ?? mapped.mobile ?? mapped.whatsapp);

    if (email || phone) {
      const existing = await this.prisma.partnershipContact.findMany({
        where: { institutionId },
        select: { email: true, phone: true, mobile: true, whatsapp: true },
      });
      const duplicate = existing.some((contact) => {
        const emails = [contact.email].filter(Boolean).map((v) => v!.toLowerCase());
        const phones = [contact.phone, contact.mobile, contact.whatsapp]
          .map((v) => normalizePhone(v))
          .filter(Boolean);
        return (email && emails.includes(email)) || (phone && phones.includes(phone));
      });
      if (duplicate) {
        return;
      }
    }

    const nameParts = splitContactName(mapped.contactName || mapped.contactEmail || 'Contact');
    const contact = await this.prisma.partnershipContact.create({
      data: {
        institutionId,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        fullName: nameParts.fullName,
        jobTitle: mapped.contactJobTitle ?? null,
        email,
        phone: mapped.phone ?? null,
        mobile: mapped.mobile ?? null,
        whatsapp: mapped.whatsapp ?? null,
        isPrimary: true,
      },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.CONTACT,
      entityId: contact.id,
      action: PartnershipAuditAction.CONTACT_CREATED,
      performedById: actorId,
      metadata: { via: 'csv_import', institutionId },
    });
  }

  private async maybeAppendNote(
    institutionId: string,
    notes: string | undefined,
    actorId: string,
  ): Promise<void> {
    if (!notes?.trim()) {
      return;
    }
    const note = await this.prisma.partnershipNote.create({
      data: {
        institutionId,
        content: `[Imported] ${notes.trim()}`,
        createdById: actorId,
      },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.NOTE,
      entityId: note.id,
      action: PartnershipAuditAction.NOTE_CREATED,
      performedById: actorId,
      metadata: { via: 'csv_import', institutionId },
    });
  }

  private async maybeAttachSource(
    institutionId: string,
    mapped: MappedImportRow,
    existingSourceId: string | null,
    actorId: string,
  ): Promise<void> {
    if (existingSourceId || !mapped.sourceName) {
      return;
    }
    const sourceId = await this.resolveSourceId(mapped, actorId);
    if (!sourceId) {
      return;
    }
    await this.prisma.partnershipInstitution.update({
      where: { id: institutionId },
      data: { sourceId },
    });
  }

  private async resolveSourceId(
    mapped: MappedImportRow,
    actorId: string,
  ): Promise<string | null> {
    if (!mapped.sourceName?.trim()) {
      return null;
    }
    const name = mapped.sourceName.trim();
    const existing = await this.prisma.partnershipSource.findFirst({
      where: { sourceName: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      return existing.id;
    }
    const created = await this.prisma.partnershipSource.create({
      data: {
        sourceType: PartnershipSourceType.IMPORT,
        sourceName: name,
        sourceUrl: mapped.sourceUrl ?? null,
        description: 'Created from CSV import',
      },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOURCE,
      entityId: created.id,
      action: PartnershipAuditAction.SOURCE_CREATED,
      performedById: actorId,
      metadata: { via: 'csv_import' },
    });
    return created.id;
  }

  private async markRow(
    id: string,
    resultStatus: PartnershipImportRowResult,
    resultError: string | null = null,
    resultInstitutionId: string | null = null,
  ): Promise<void> {
    await this.prisma.partnershipImportRow.update({
      where: { id },
      data: { resultStatus, resultError, resultInstitutionId },
    });
  }

  private async analyzeRows(
    rawRows: Record<string, string>[],
    mapping: Record<string, ImportCrmField | null>,
  ) {
    type Analyzed = {
      rowNumber: number;
      raw: Record<string, string>;
      mapped: MappedImportRow;
      normalized: NormalizedImportRow;
      isValid: boolean;
      validationErrors: { field: string; reason: string }[];
      matchConfidence: PartnershipImportMatchConfidence;
      matchReasons: string[];
      matchedInstitutionId: string | null;
      matchedInstitutionName: string | null;
      csvDuplicateOfRow: number | null;
      decision: PartnershipImportRowDecision;
    };

    const prepared: Array<{
      rowNumber: number;
      raw: Record<string, string>;
      mapped: MappedImportRow;
      normalized: NormalizedImportRow;
      isValid: boolean;
      validationErrors: { field: string; reason: string }[];
    }> = rawRows.map((raw, index) => {
      const { mapped, errors } = applyMapping(raw, mapping);
      const validationErrors = validateMappedRow(mapped, errors);
      const normalized = normalizeMappedRow(mapped);
      return {
        rowNumber: index + 1,
        raw,
        mapped,
        normalized,
        isValid: validationErrors.length === 0,
        validationErrors,
      };
    });

    const domains = [
      ...new Set(
        prepared
          .map((r) => r.normalized.normalizedWebsiteDomain)
          .filter((v): v is string => Boolean(v)),
      ),
    ];
    const phones = [
      ...new Set(
        prepared.map((r) => r.normalized.normalizedPhone).filter((v): v is string => Boolean(v)),
      ),
    ];
    const names = [
      ...new Set(
        prepared.map((r) => r.normalized.normalizedName).filter((v): v is string => Boolean(v)),
      ),
    ];
    const emails = [
      ...new Set(
        prepared
          .map((r) => r.normalized.normalizedContactEmail)
          .filter((v): v is string => Boolean(v)),
      ),
    ];

    const dbInstitutions = await this.loadInstitutionsByKeys({ domains, phones, names, emails });

    const analyzed: Analyzed[] = [];
    const priorCsv: Array<{ rowNumber: number; row: NormalizedImportRow; name?: string }> = [];

    for (const item of prepared) {
      const candidates = this.filterCandidates(dbInstitutions, item.normalized);
      const match = detectDuplicates({
        rowNumber: item.rowNumber,
        row: item.normalized,
        dbCandidates: candidates,
        priorCsvRows: priorCsv,
      });

      const decision = defaultDecisionForMatch(
        match.confidence,
        item.isValid,
        match.csvDuplicateOfRow,
      ) as PartnershipImportRowDecision;

      analyzed.push({
        ...item,
        matchConfidence: match.confidence,
        matchReasons: match.reasons,
        matchedInstitutionId: match.matchedInstitutionId?.startsWith('csv:')
          ? null
          : match.matchedInstitutionId,
        matchedInstitutionName: match.matchedInstitutionName,
        csvDuplicateOfRow: match.csvDuplicateOfRow,
        decision,
      });

      priorCsv.push({
        rowNumber: item.rowNumber,
        row: item.normalized,
        name: item.mapped.name,
      });
    }

    const summary = this.buildSummary(analyzed);
    return { rows: analyzed, summary };
  }

  private buildSummary(
    rows: Array<{
      isValid: boolean;
      matchConfidence: PartnershipImportMatchConfidence;
      csvDuplicateOfRow: number | null;
      decision: PartnershipImportRowDecision;
    }>,
  ): SummaryJson {
    let validRows = 0;
    let invalidRows = 0;
    let newInstitutions = 0;
    let exactDuplicates = 0;
    let possibleDuplicates = 0;
    let csvDuplicates = 0;
    let needsReview = 0;

    for (const row of rows) {
      if (row.isValid) validRows += 1;
      else invalidRows += 1;

      if (row.csvDuplicateOfRow != null) csvDuplicates += 1;
      if (row.matchConfidence === PartnershipImportMatchConfidence.EXACT) exactDuplicates += 1;
      if (row.matchConfidence === PartnershipImportMatchConfidence.POSSIBLE) {
        possibleDuplicates += 1;
        needsReview += 1;
      }
      if (
        row.isValid &&
        row.matchConfidence === PartnershipImportMatchConfidence.NONE &&
        row.csvDuplicateOfRow == null
      ) {
        newInstitutions += 1;
      }
      if (!row.isValid || row.csvDuplicateOfRow != null) {
        needsReview += 1;
      }
    }

    return {
      totalRows: rows.length,
      validRows,
      invalidRows,
      newInstitutions,
      exactDuplicates,
      possibleDuplicates,
      csvDuplicates,
      needsReview,
    };
  }

  private async loadInstitutionsByKeys(keys: {
    domains: string[];
    phones: string[];
    names: string[];
    emails: string[];
  }): Promise<InstitutionLookup[]> {
    if (
      keys.domains.length === 0 &&
      keys.phones.length === 0 &&
      keys.names.length === 0 &&
      keys.emails.length === 0
    ) {
      return [];
    }

    const or: Prisma.PartnershipInstitutionWhereInput[] = [];
    for (let i = 0; i < keys.domains.length; i += IMPORT_LOOKUP_CHUNK_SIZE) {
      or.push({
        normalizedWebsiteDomain: {
          in: keys.domains.slice(i, i + IMPORT_LOOKUP_CHUNK_SIZE),
        },
      });
    }
    for (let i = 0; i < keys.phones.length; i += IMPORT_LOOKUP_CHUNK_SIZE) {
      or.push({
        normalizedPhone: { in: keys.phones.slice(i, i + IMPORT_LOOKUP_CHUNK_SIZE) },
      });
    }
    for (let i = 0; i < keys.names.length; i += IMPORT_LOOKUP_CHUNK_SIZE) {
      or.push({
        normalizedName: { in: keys.names.slice(i, i + IMPORT_LOOKUP_CHUNK_SIZE) },
      });
    }
    for (let i = 0; i < keys.emails.length; i += IMPORT_LOOKUP_CHUNK_SIZE) {
      const chunk = keys.emails.slice(i, i + IMPORT_LOOKUP_CHUNK_SIZE);
      or.push(
        { generalEmail: { in: chunk, mode: 'insensitive' } },
        { contactEmail: { in: chunk, mode: 'insensitive' } },
        { admissionsEmail: { in: chunk, mode: 'insensitive' } },
      );
    }

    const rows = await this.prisma.partnershipInstitution.findMany({
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
    return rows;
  }

  private async findDbMatchesForNormalized(
    normalized: NormalizedImportRow,
  ): Promise<InstitutionLookup[]> {
    return this.loadInstitutionsByKeys({
      domains: normalized.normalizedWebsiteDomain ? [normalized.normalizedWebsiteDomain] : [],
      phones: normalized.normalizedPhone ? [normalized.normalizedPhone] : [],
      names: normalized.normalizedName ? [normalized.normalizedName] : [],
      emails: normalized.normalizedContactEmail ? [normalized.normalizedContactEmail] : [],
    });
  }

  private filterCandidates(
    all: InstitutionLookup[],
    row: NormalizedImportRow,
  ): InstitutionLookup[] {
    return all.filter((inst) => {
      if (
        row.normalizedWebsiteDomain &&
        inst.normalizedWebsiteDomain === row.normalizedWebsiteDomain
      ) {
        return true;
      }
      if (row.normalizedPhone && inst.normalizedPhone === row.normalizedPhone) {
        return true;
      }
      if (row.normalizedName && inst.normalizedName === row.normalizedName) {
        return true;
      }
      if (row.normalizedContactEmail) {
        const emails = [inst.generalEmail, inst.contactEmail, inst.admissionsEmail]
          .filter(Boolean)
          .map((v) => v!.toLowerCase());
        if (emails.includes(row.normalizedContactEmail)) {
          return true;
        }
      }
      return false;
    });
  }

  private assertFile(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    if (file.size > IMPORT_MAX_FILE_BYTES) {
      throw new BadRequestException(
        `File too large (${file.size} bytes). Maximum is ${IMPORT_MAX_FILE_BYTES} bytes.`,
      );
    }
    const name = (file.originalname || '').toLowerCase();
    if (!name.endsWith('.csv')) {
      throw new BadRequestException('Unsupported file type. Only .csv is allowed.');
    }
    if (file.mimetype && !IMPORT_ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported MIME type: ${file.mimetype}`);
    }
    if (!file.buffer?.length) {
      throw new BadRequestException('CSV is empty');
    }
  }

  private parseMapping(
    mappingRaw: string | undefined,
    suggested: Record<string, ImportCrmField | null>,
    headers: string[],
  ): Record<string, ImportCrmField | null> {
    if (!mappingRaw?.trim()) {
      return suggested;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(mappingRaw);
    } catch {
      throw new BadRequestException('mapping must be valid JSON');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('mapping must be an object');
    }
    const mapping = parsed as Record<string, ImportCrmField | null>;
    this.validateMappingKeys(mapping, headers);
    return mapping;
  }

  private validateMappingKeys(
    mapping: Record<string, ImportCrmField | null>,
    headers: string[],
  ): void {
    const headerSet = new Set(headers);
    const allowed = new Set<string>(IMPORT_CRM_FIELDS);
    for (const [header, field] of Object.entries(mapping)) {
      if (!headerSet.has(header)) {
        throw new BadRequestException(`Unknown CSV header in mapping: ${header}`);
      }
      if (field != null && !allowed.has(field)) {
        throw new BadRequestException(`Unknown CRM field in mapping: ${field}`);
      }
    }
  }

  private buildRowFilter(
    jobId: string,
    filter?: QueryImportRowsDto['filter'],
  ): Prisma.PartnershipImportRowWhereInput {
    const where: Prisma.PartnershipImportRowWhereInput = { jobId };
    switch (filter) {
      case 'valid':
        where.isValid = true;
        break;
      case 'invalid':
        where.isValid = false;
        break;
      case 'duplicates':
        where.OR = [
          { matchConfidence: { not: PartnershipImportMatchConfidence.NONE } },
          { csvDuplicateOfRow: { not: null } },
        ];
        break;
      case 'new':
        where.isValid = true;
        where.matchConfidence = PartnershipImportMatchConfidence.NONE;
        where.csvDuplicateOfRow = null;
        break;
      case 'needs_review':
        where.OR = [
          { isValid: false },
          { matchConfidence: PartnershipImportMatchConfidence.POSSIBLE },
          { csvDuplicateOfRow: { not: null } },
        ];
        break;
      default:
        break;
    }
    return where;
  }

  private async requireJob(jobId: string) {
    const job = await this.prisma.partnershipImportJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Import job not found');
    }
    return job;
  }

  private async requireDraftJob(jobId: string) {
    const job = await this.requireJob(jobId);
    if (job.status !== PartnershipImportStatus.DRAFT) {
      throw new BadRequestException('Import job is no longer editable');
    }
    return job;
  }

  private toJobDto(job: {
    id: string;
    fileName: string;
    fileSizeBytes: number;
    uploadedById: string;
    uploadedBy?: { displayName: string } | null;
    status: PartnershipImportStatus;
    headersJson: Prisma.JsonValue;
    mappingJson: Prisma.JsonValue;
    summaryJson: Prisma.JsonValue | null;
    resultJson: Prisma.JsonValue | null;
    errorMessage: string | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
  }): ImportJobDto {
    return {
      id: job.id,
      fileName: job.fileName,
      fileSizeBytes: job.fileSizeBytes,
      uploadedById: job.uploadedById,
      uploadedByName: job.uploadedBy?.displayName ?? null,
      status: job.status,
      headers: job.headersJson as string[],
      mapping: job.mappingJson as Record<string, string | null>,
      summary: (job.summaryJson as SummaryJson | null) ?? null,
      result: (job.resultJson as ResultJson | null) ?? null,
      errorMessage: job.errorMessage,
      expiresAt: job.expiresAt.toISOString(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
    };
  }

  private toPreviewRow(row: {
    rowNumber: number;
    mapped: MappedImportRow;
    isValid: boolean;
    validationErrors: { field: string; reason: string }[];
    matchConfidence: PartnershipImportMatchConfidence;
    matchReasons: string[];
    matchedInstitutionId: string | null;
    matchedInstitutionName: string | null;
    csvDuplicateOfRow: number | null;
    decision: PartnershipImportRowDecision;
  }): ImportPreviewRowDto {
    return {
      rowNumber: row.rowNumber,
      name: row.mapped.name ?? null,
      governorate: row.mapped.governorate ?? null,
      city: row.mapped.city ?? null,
      website: row.mapped.website ?? null,
      phone: row.mapped.phone ?? row.mapped.mobile ?? row.mapped.whatsapp ?? null,
      isValid: row.isValid,
      validationErrors: row.validationErrors,
      matchConfidence: row.matchConfidence,
      matchReasons: row.matchReasons,
      matchedInstitutionId: row.matchedInstitutionId,
      matchedInstitutionName: row.matchedInstitutionName,
      csvDuplicateOfRow: row.csvDuplicateOfRow,
      decision: row.decision,
      resultStatus: PartnershipImportRowResult.PENDING,
      resultError: null,
      resultInstitutionId: null,
    };
  }

  private toPreviewRowFromDb(row: PartnershipImportRow): ImportPreviewRowDto {
    const mapped = (row.mappedJson ?? {}) as MappedImportRow;
    return {
      rowNumber: row.rowNumber,
      name: mapped.name ?? null,
      governorate: mapped.governorate ?? null,
      city: mapped.city ?? null,
      website: mapped.website ?? null,
      phone: mapped.phone ?? mapped.mobile ?? mapped.whatsapp ?? null,
      isValid: row.isValid,
      validationErrors:
        (row.validationErrorsJson as { field: string; reason: string }[] | null) ?? [],
      matchConfidence: row.matchConfidence,
      matchReasons: (row.matchReasonsJson as string[] | null) ?? [],
      matchedInstitutionId: row.matchedInstitutionId,
      matchedInstitutionName: row.matchedInstitutionName,
      csvDuplicateOfRow: row.csvDuplicateOfRow,
      decision: row.decision,
      resultStatus: row.resultStatus,
      resultError: row.resultError,
      resultInstitutionId: row.resultInstitutionId,
    };
  }
}
