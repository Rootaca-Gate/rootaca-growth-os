import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipInstitutionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeWebsiteDomain,
} from '../common/partnership.normalize';
import { CreateInstitutionDto, UpdateInstitutionDto } from './dto/create-institution.dto';
import { PaginatedInstitutionsDto, PotentialDuplicateDto } from './dto/institution-response.dto';
import { QueryInstitutionsDto } from './dto/query-institutions.dto';
import { ensureDefaultLeadForInstitution } from '../common/ensure-default-lead';
import {
  CLOSED_LEAD_STATUSES,
  OPEN_FOLLOW_UP_STATUS,
  PRIMARY_CONTACT_ORDER,
} from './institution-list.constants';
import {
  EMPTY_INSTITUTION_ENRICHMENT,
  InstitutionListEnrichment,
  toInstitutionResponse,
} from './institution.mapper';
import { InstitutionResponseDto } from './dto/institution-response.dto';

@Injectable()
export class InstitutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {}

  async create(
    dto: CreateInstitutionDto,
    actorId: string,
  ): Promise<InstitutionResponseDto> {
    if (dto.parentInstitutionId) {
      await this.ensureActiveInstitution(dto.parentInstitutionId);
    }
    if (dto.sourceId) {
      await this.ensureSource(dto.sourceId);
    }

    const data = this.toCreateData(dto);
    const potentialDuplicates = await this.findPotentialDuplicates({
      excludeId: undefined,
      normalizedName: data.normalizedName,
      normalizedPhone: data.normalizedPhone,
      normalizedWebsiteDomain: data.normalizedWebsiteDomain,
      city: data.city ?? null,
    });

    const row = await this.prisma.partnershipInstitution.create({ data });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.INSTITUTION,
      entityId: row.id,
      action: PartnershipAuditAction.INSTITUTION_CREATED,
      performedById: actorId,
    });
    await ensureDefaultLeadForInstitution(this.prisma, this.audit, {
      institutionId: row.id,
      actorId,
      priority: row.leadPriority,
      sourceId: row.sourceId,
    });

    return toInstitutionResponse(row, potentialDuplicates);
  }

  async findAll(query: QueryInstitutionsDto): Promise<PaginatedInstitutionsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'updatedAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.partnershipInstitution.count({ where }),
      this.prisma.partnershipInstitution.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const enrichmentById = await this.loadListEnrichment(rows.map((row) => row.id));

    return {
      items: rows.map((row) =>
        toInstitutionResponse(
          row,
          undefined,
          enrichmentById.get(row.id) ?? EMPTY_INSTITUTION_ENRICHMENT,
        ),
      ),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findOne(id: string, includeDeleted = false): Promise<InstitutionResponseDto> {
    const row = await this.prisma.partnershipInstitution.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
    if (!row) {
      throw new NotFoundException('Institution not found');
    }
    return toInstitutionResponse(row);
  }

  async update(
    id: string,
    dto: UpdateInstitutionDto,
    actorId: string,
  ): Promise<InstitutionResponseDto> {
    const existing = await this.requireActive(id);
    if (dto.parentInstitutionId) {
      if (dto.parentInstitutionId === id) {
        throw new BadRequestException('Institution cannot be its own parent');
      }
      await this.ensureActiveInstitution(dto.parentInstitutionId);
    }
    if (dto.sourceId) {
      await this.ensureSource(dto.sourceId);
    }

    const data = this.toUpdateData(dto, existing);
    const potentialDuplicates = await this.findPotentialDuplicates({
      excludeId: id,
      normalizedName:
        (data.normalizedName as string | null | undefined) ?? existing.normalizedName,
      normalizedPhone:
        (data.normalizedPhone as string | null | undefined) ?? existing.normalizedPhone,
      normalizedWebsiteDomain:
        (data.normalizedWebsiteDomain as string | null | undefined) ??
        existing.normalizedWebsiteDomain,
      city: (data.city as string | null | undefined) ?? existing.city,
    });

    const row = await this.prisma.partnershipInstitution.update({
      where: { id },
      data,
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.INSTITUTION,
      entityId: id,
      action: PartnershipAuditAction.INSTITUTION_UPDATED,
      performedById: actorId,
    });

    return toInstitutionResponse(row, potentialDuplicates);
  }

  async softDelete(id: string, actorId: string): Promise<InstitutionResponseDto> {
    await this.requireActive(id);
    const row = await this.prisma.partnershipInstitution.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.INSTITUTION,
      entityId: id,
      action: PartnershipAuditAction.INSTITUTION_DELETED,
      performedById: actorId,
    });
    return toInstitutionResponse(row);
  }

  async restore(id: string, actorId: string): Promise<InstitutionResponseDto> {
    const row = await this.prisma.partnershipInstitution.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Institution not found');
    }
    if (!row.deletedAt) {
      throw new BadRequestException('Institution is not deleted');
    }
    const restored = await this.prisma.partnershipInstitution.update({
      where: { id },
      data: { deletedAt: null, deletedById: null },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.INSTITUTION,
      entityId: id,
      action: PartnershipAuditAction.INSTITUTION_RESTORED,
      performedById: actorId,
    });
    return toInstitutionResponse(restored);
  }

  async ensureActiveInstitution(id: string): Promise<void> {
    await this.requireActive(id);
  }

  /**
   * Batched enrichment for the current page only (constant query count).
   * Queries: contacts + activity max + follow-up min/count + active lead count.
   */
  private async loadListEnrichment(
    institutionIds: string[],
  ): Promise<Map<string, InstitutionListEnrichment>> {
    const result = new Map<string, InstitutionListEnrichment>();
    for (const id of institutionIds) {
      result.set(id, { ...EMPTY_INSTITUTION_ENRICHMENT });
    }
    if (institutionIds.length === 0) {
      return result;
    }

    const idFilter = { institutionId: { in: institutionIds } };

    const [contacts, activityGroups, followUpGroups, leadGroups] = await Promise.all([
      this.prisma.partnershipContact.findMany({
        where: idFilter,
        orderBy: PRIMARY_CONTACT_ORDER,
        select: {
          id: true,
          institutionId: true,
          fullName: true,
          jobTitle: true,
          email: true,
          phone: true,
          mobile: true,
          whatsapp: true,
        },
      }),
      this.prisma.partnershipActivity.groupBy({
        by: ['institutionId'],
        where: idFilter,
        _max: { activityDate: true },
      }),
      this.prisma.partnershipFollowUp.groupBy({
        by: ['institutionId'],
        where: {
          ...idFilter,
          status: OPEN_FOLLOW_UP_STATUS,
        },
        _min: { dueDate: true },
        _count: { _all: true },
      }),
      this.prisma.partnershipLead.groupBy({
        by: ['institutionId'],
        where: {
          ...idFilter,
          status: { notIn: CLOSED_LEAD_STATUSES },
        },
        _count: { _all: true },
      }),
    ]);

    for (const contact of contacts) {
      const current = result.get(contact.institutionId);
      if (!current || current.primaryContact) {
        continue;
      }
      current.primaryContact = {
        id: contact.id,
        name: contact.fullName,
        jobTitle: contact.jobTitle,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        whatsapp: contact.whatsapp,
      };
    }

    for (const group of activityGroups) {
      const current = result.get(group.institutionId);
      if (!current) {
        continue;
      }
      current.lastActivityAt = group._max.activityDate?.toISOString() ?? null;
    }

    for (const group of followUpGroups) {
      const current = result.get(group.institutionId);
      if (!current) {
        continue;
      }
      current.nextFollowUpAt = group._min.dueDate
        ? group._min.dueDate.toISOString().slice(0, 10)
        : null;
      current.openFollowUpsCount = group._count._all;
    }

    for (const group of leadGroups) {
      const current = result.get(group.institutionId);
      if (!current) {
        continue;
      }
      current.activeLeadsCount = group._count._all;
    }

    return result;
  }

  private async requireActive(id: string) {
    const row = await this.prisma.partnershipInstitution.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) {
      throw new NotFoundException('Institution not found');
    }
    return row;
  }

  private async ensureSource(id: string): Promise<void> {
    const source = await this.prisma.partnershipSource.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!source) {
      throw new NotFoundException('Source not found');
    }
  }

  private buildWhere(query: QueryInstitutionsDto): Prisma.PartnershipInstitutionWhereInput {
    const search = query.search?.trim();
    const and: Prisma.PartnershipInstitutionWhereInput[] = [];

    if (!query.includeDeleted) {
      and.push({ deletedAt: null });
    }

    if (query.status) and.push({ status: query.status });
    if (query.institutionType) and.push({ institutionType: query.institutionType });
    if (query.institutionCategory) and.push({ institutionCategory: query.institutionCategory });
    if (query.curriculum) and.push({ curriculum: query.curriculum });
    if (query.educationLevel) and.push({ educationLevel: query.educationLevel });
    if (query.governorate) and.push({ governorate: { equals: query.governorate, mode: 'insensitive' } });
    if (query.city) and.push({ city: { equals: query.city, mode: 'insensitive' } });
    if (query.leadPriority) and.push({ leadPriority: query.leadPriority });

    if (query.hasCoding != null) and.push({ hasCoding: query.hasCoding });
    if (query.hasRobotics != null) and.push({ hasRobotics: query.hasRobotics });
    if (query.hasStem != null) and.push({ hasStem: query.hasStem });
    if (query.hasAi != null) and.push({ hasAi: query.hasAi });
    if (query.hasTechClub != null) and.push({ hasTechClub: query.hasTechClub });
    if (query.hasAfterSchool != null) and.push({ hasAfterSchool: query.hasAfterSchool });
    if (query.hasSummerCamp != null) and.push({ hasSummerCamp: query.hasSummerCamp });
    if (query.hasMakerspace != null) and.push({ hasMakerspace: query.hasMakerspace });

    if (query.hasEmail === true) {
      and.push({
        OR: [
          { generalEmail: { not: null } },
          { contactEmail: { not: null } },
          { admissionsEmail: { not: null } },
        ],
      });
      and.push({
        NOT: {
          AND: [{ generalEmail: '' }, { contactEmail: '' }, { admissionsEmail: '' }],
        },
      });
    } else if (query.hasEmail === false) {
      and.push({
        AND: [
          { OR: [{ generalEmail: null }, { generalEmail: '' }] },
          { OR: [{ contactEmail: null }, { contactEmail: '' }] },
          { OR: [{ admissionsEmail: null }, { admissionsEmail: '' }] },
        ],
      });
    }

    if (query.hasPhone === true) {
      and.push({
        OR: [
          { phone: { not: null } },
          { mobile: { not: null } },
          { whatsapp: { not: null } },
        ],
      });
    } else if (query.hasPhone === false) {
      and.push({
        AND: [
          { OR: [{ phone: null }, { phone: '' }] },
          { OR: [{ mobile: null }, { mobile: '' }] },
          { OR: [{ whatsapp: null }, { whatsapp: '' }] },
        ],
      });
    }

    if (query.hasWebsite === true) {
      and.push({ website: { not: null } });
      and.push({ NOT: { website: '' } });
    } else if (query.hasWebsite === false) {
      and.push({ OR: [{ website: null }, { website: '' }] });
    }

    if (query.hasDecisionMaker === true) {
      and.push({ contacts: { some: { isDecisionMaker: true } } });
    } else if (query.hasDecisionMaker === false) {
      and.push({ contacts: { none: { isDecisionMaker: true } } });
    }

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { arabicName: { contains: search, mode: 'insensitive' } },
          { englishName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search, mode: 'insensitive' } },
          { generalEmail: { contains: search, mode: 'insensitive' } },
          { contactEmail: { contains: search, mode: 'insensitive' } },
          { website: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { district: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return and.length ? { AND: and } : {};
  }

  private toCreateData(dto: CreateInstitutionDto): Prisma.PartnershipInstitutionCreateInput {
    const name = dto.name.trim();
    const phone = dto.phone?.trim() || null;
    const website = dto.website?.trim() || null;

    return {
      name,
      arabicName: dto.arabicName?.trim() || null,
      englishName: dto.englishName?.trim() || null,
      normalizedName: normalizeName(name),
      institutionType: dto.institutionType,
      institutionCategory: dto.institutionCategory,
      curriculum: dto.curriculum,
      educationLevel: dto.educationLevel,
      gender: dto.gender,
      ageRange: dto.ageRange?.trim() || null,
      governorate: dto.governorate?.trim() || null,
      city: dto.city?.trim() || null,
      district: dto.district?.trim() || null,
      fullAddress: dto.fullAddress?.trim() || null,
      phone,
      mobile: dto.mobile?.trim() || null,
      whatsapp: dto.whatsapp?.trim() || null,
      normalizedPhone: normalizePhone(phone ?? dto.mobile ?? dto.whatsapp),
      generalEmail: normalizeEmail(dto.generalEmail),
      admissionsEmail: normalizeEmail(dto.admissionsEmail),
      contactEmail: normalizeEmail(dto.contactEmail),
      website,
      normalizedWebsiteDomain: normalizeWebsiteDomain(website),
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
      partnershipType: dto.partnershipType,
      leadPriority: dto.leadPriority,
      leadPriorityReason: dto.leadPriorityReason?.trim() || null,
      status: dto.status ?? PartnershipInstitutionStatus.PROSPECT,
      notes: dto.notes?.trim() ?? '',
      branchName: dto.branchName?.trim() || null,
      parentInstitution: dto.parentInstitutionId
        ? { connect: { id: dto.parentInstitutionId } }
        : undefined,
      source: dto.sourceId ? { connect: { id: dto.sourceId } } : undefined,
    };
  }

  private toUpdateData(
    dto: UpdateInstitutionDto,
    existing: {
      name: string;
      phone: string | null;
      mobile: string | null;
      whatsapp: string | null;
      website: string | null;
    },
  ): Prisma.PartnershipInstitutionUpdateInput {
    const allowClear = dto.allowClear === true;
    const data: Prisma.PartnershipInstitutionUpdateInput = {};

    const assignString = (
      key: keyof Prisma.PartnershipInstitutionUpdateInput,
      value: string | undefined,
    ) => {
      if (value === undefined) return;
      const trimmed = value.trim();
      if (!trimmed && !allowClear) return;
      (data as Record<string, unknown>)[key] = trimmed || null;
    };

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('name cannot be empty');
      }
      data.name = name;
      data.normalizedName = normalizeName(name);
    }

    assignString('arabicName', dto.arabicName);
    assignString('englishName', dto.englishName);
    assignString('ageRange', dto.ageRange);
    assignString('governorate', dto.governorate);
    assignString('city', dto.city);
    assignString('district', dto.district);
    assignString('fullAddress', dto.fullAddress);
    assignString('facebook', dto.facebook);
    assignString('instagram', dto.instagram);
    assignString('linkedin', dto.linkedin);
    assignString('youtube', dto.youtube);
    assignString('tiktok', dto.tiktok);
    assignString('leadPriorityReason', dto.leadPriorityReason);
    assignString('branchName', dto.branchName);

    if (dto.notes !== undefined) {
      data.notes = dto.notes.trim();
    }

    if (dto.phone !== undefined) {
      if (!dto.phone.trim() && !allowClear) {
        /* skip empty overwrite */
      } else {
        data.phone = dto.phone.trim() || null;
      }
    }
    if (dto.mobile !== undefined) {
      if (dto.mobile.trim() || allowClear) data.mobile = dto.mobile.trim() || null;
    }
    if (dto.whatsapp !== undefined) {
      if (dto.whatsapp.trim() || allowClear) data.whatsapp = dto.whatsapp.trim() || null;
    }
    if (dto.website !== undefined) {
      if (dto.website.trim() || allowClear) {
        data.website = dto.website.trim() || null;
        data.normalizedWebsiteDomain = normalizeWebsiteDomain(dto.website);
      }
    }
    if (dto.googleMapsUrl !== undefined) {
      if (dto.googleMapsUrl.trim() || allowClear) {
        data.googleMapsUrl = dto.googleMapsUrl.trim() || null;
      }
    }

    if (dto.generalEmail !== undefined) {
      if (dto.generalEmail.trim() || allowClear) {
        data.generalEmail = normalizeEmail(dto.generalEmail);
      }
    }
    if (dto.admissionsEmail !== undefined) {
      if (dto.admissionsEmail.trim() || allowClear) {
        data.admissionsEmail = normalizeEmail(dto.admissionsEmail);
      }
    }
    if (dto.contactEmail !== undefined) {
      if (dto.contactEmail.trim() || allowClear) {
        data.contactEmail = normalizeEmail(dto.contactEmail);
      }
    }

    if (dto.institutionType !== undefined) data.institutionType = dto.institutionType;
    if (dto.institutionCategory !== undefined) data.institutionCategory = dto.institutionCategory;
    if (dto.curriculum !== undefined) data.curriculum = dto.curriculum;
    if (dto.educationLevel !== undefined) data.educationLevel = dto.educationLevel;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.partnershipType !== undefined) data.partnershipType = dto.partnershipType;
    if (dto.leadPriority !== undefined) data.leadPriority = dto.leadPriority;
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.hasCoding !== undefined) data.hasCoding = dto.hasCoding;
    if (dto.hasRobotics !== undefined) data.hasRobotics = dto.hasRobotics;
    if (dto.hasStem !== undefined) data.hasStem = dto.hasStem;
    if (dto.hasAi !== undefined) data.hasAi = dto.hasAi;
    if (dto.hasTechClub !== undefined) data.hasTechClub = dto.hasTechClub;
    if (dto.hasAfterSchool !== undefined) data.hasAfterSchool = dto.hasAfterSchool;
    if (dto.hasSummerCamp !== undefined) data.hasSummerCamp = dto.hasSummerCamp;
    if (dto.hasMakerspace !== undefined) data.hasMakerspace = dto.hasMakerspace;

    if (dto.parentInstitutionId !== undefined) {
      data.parentInstitution = dto.parentInstitutionId
        ? { connect: { id: dto.parentInstitutionId } }
        : allowClear
          ? { disconnect: true }
          : undefined;
    }
    if (dto.sourceId !== undefined) {
      data.source = dto.sourceId
        ? { connect: { id: dto.sourceId } }
        : allowClear
          ? { disconnect: true }
          : undefined;
    }

    const nextPhone =
      (data.phone as string | null | undefined) !== undefined
        ? (data.phone as string | null)
        : existing.phone;
    const nextMobile =
      (data.mobile as string | null | undefined) !== undefined
        ? (data.mobile as string | null)
        : existing.mobile;
    const nextWhatsapp =
      (data.whatsapp as string | null | undefined) !== undefined
        ? (data.whatsapp as string | null)
        : existing.whatsapp;

    if (
      dto.phone !== undefined ||
      dto.mobile !== undefined ||
      dto.whatsapp !== undefined
    ) {
      data.normalizedPhone = normalizePhone(nextPhone ?? nextMobile ?? nextWhatsapp);
    }

    return data;
  }

  async findPotentialDuplicates(params: {
    excludeId?: string;
    normalizedName: string | null | undefined;
    normalizedPhone: string | null | undefined;
    normalizedWebsiteDomain: string | null | undefined;
    city: string | null | undefined;
  }): Promise<PotentialDuplicateDto[]> {
    const or: Prisma.PartnershipInstitutionWhereInput[] = [];
    if (params.normalizedName) {
      or.push({ normalizedName: params.normalizedName });
      if (params.city) {
        or.push({
          AND: [
            { normalizedName: params.normalizedName },
            { city: { equals: params.city, mode: 'insensitive' } },
          ],
        });
      }
    }
    if (params.normalizedPhone) {
      or.push({ normalizedPhone: params.normalizedPhone });
    }
    if (params.normalizedWebsiteDomain) {
      or.push({ normalizedWebsiteDomain: params.normalizedWebsiteDomain });
    }
    if (!or.length) {
      return [];
    }

    const rows = await this.prisma.partnershipInstitution.findMany({
      where: {
        deletedAt: null,
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
        OR: or,
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => {
      const matchedOn: string[] = [];
      if (params.normalizedName && row.normalizedName === params.normalizedName) {
        matchedOn.push('normalizedName');
      }
      if (params.normalizedPhone && row.normalizedPhone === params.normalizedPhone) {
        matchedOn.push('normalizedPhone');
      }
      if (
        params.normalizedWebsiteDomain &&
        row.normalizedWebsiteDomain === params.normalizedWebsiteDomain
      ) {
        matchedOn.push('normalizedWebsiteDomain');
      }
      if (
        params.normalizedName &&
        params.city &&
        row.normalizedName === params.normalizedName &&
        row.city?.toLowerCase() === params.city.toLowerCase()
      ) {
        matchedOn.push('name+city');
      }
      return {
        id: row.id,
        name: row.name,
        city: row.city,
        website: row.website,
        phone: row.phone,
        matchedOn: [...new Set(matchedOn)],
      };
    });
  }
}
