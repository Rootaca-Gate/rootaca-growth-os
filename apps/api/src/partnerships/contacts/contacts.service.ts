import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipContact,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { normalizeEmail, normalizePhone } from '../common/partnership.normalize';
import { InstitutionsService } from '../institutions/institutions.service';
import {
  ContactResponseDto,
  CreateContactDto,
  PaginatedContactsDto,
  QueryContactsDto,
  UpdateContactDto,
} from './dto/contact.dto';

type ContactWithInstitution = PartnershipContact & {
  institution?: { name: string } | null;
};

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
    private readonly institutions: InstitutionsService,
  ) {}

  async create(dto: CreateContactDto, actorId: string): Promise<ContactResponseDto> {
    await this.institutions.ensureActiveInstitution(dto.institutionId);
    const firstName = dto.firstName.trim();
    const lastName = (dto.lastName ?? '').trim();
    const fullName = (dto.fullName?.trim() || `${firstName} ${lastName}`.trim()).trim();
    if (!fullName) {
      throw new BadRequestException('fullName is required');
    }

    const row = await this.prisma.partnershipContact.create({
      data: {
        institutionId: dto.institutionId,
        firstName,
        lastName,
        fullName,
        jobTitle: dto.jobTitle?.trim() || null,
        department: dto.department?.trim() || null,
        email: normalizeEmail(dto.email),
        phone: dto.phone?.trim() || null,
        mobile: dto.mobile?.trim() || null,
        whatsapp: dto.whatsapp?.trim() || null,
        linkedin: dto.linkedin?.trim() || null,
        isPrimary: dto.isPrimary ?? false,
        isDecisionMaker: dto.isDecisionMaker ?? false,
        isPublicContact: dto.isPublicContact ?? false,
        notes: dto.notes?.trim() ?? '',
      },
      include: { institution: { select: { name: true } } },
    });

    // store normalized phone on contact fields as display; normalization utility applied for email
    void normalizePhone(dto.phone ?? dto.mobile);

    await this.audit.record({
      entityType: PartnershipAuditEntityType.CONTACT,
      entityId: row.id,
      action: PartnershipAuditAction.CONTACT_CREATED,
      performedById: actorId,
    });

    return this.toResponse(row);
  }

  async findAll(query: QueryContactsDto): Promise<PaginatedContactsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [total, rows] = await Promise.all([
      this.prisma.partnershipContact.count({ where }),
      this.prisma.partnershipContact.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [query.sortBy ?? 'updatedAt']: query.sortOrder ?? 'desc' },
        include: { institution: { select: { name: true } } },
      }),
    ]);

    return {
      items: rows.map((row) => this.toResponse(row)),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findByInstitution(institutionId: string, query: QueryContactsDto) {
    await this.institutions.ensureActiveInstitution(institutionId);
    return this.findAll({ ...query, institutionId });
  }

  async findOne(id: string): Promise<ContactResponseDto> {
    const row = await this.prisma.partnershipContact.findUnique({
      where: { id },
      include: { institution: { select: { name: true, deletedAt: true } } },
    });
    if (!row || row.institution.deletedAt) {
      throw new NotFoundException('Contact not found');
    }
    return this.toResponse(row);
  }

  async update(id: string, dto: UpdateContactDto, actorId: string): Promise<ContactResponseDto> {
    const existing = await this.prisma.partnershipContact.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Contact not found');
    }
    await this.institutions.ensureActiveInstitution(existing.institutionId);

    const allowClear = dto.allowClear === true;
    const data: Prisma.PartnershipContactUpdateInput = {};

    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.fullName !== undefined) {
      if (dto.fullName.trim() || allowClear) data.fullName = dto.fullName.trim();
    } else if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const first = dto.firstName?.trim() ?? existing.firstName;
      const last = dto.lastName?.trim() ?? existing.lastName;
      data.fullName = `${first} ${last}`.trim();
    }

    if (dto.jobTitle !== undefined) {
      if (dto.jobTitle.trim() || allowClear) data.jobTitle = dto.jobTitle.trim() || null;
    }
    if (dto.department !== undefined) {
      if (dto.department.trim() || allowClear) data.department = dto.department.trim() || null;
    }
    if (dto.email !== undefined) {
      if (dto.email.trim() || allowClear) data.email = normalizeEmail(dto.email);
    }
    if (dto.phone !== undefined) {
      if (dto.phone.trim() || allowClear) data.phone = dto.phone.trim() || null;
    }
    if (dto.mobile !== undefined) {
      if (dto.mobile.trim() || allowClear) data.mobile = dto.mobile.trim() || null;
    }
    if (dto.whatsapp !== undefined) {
      if (dto.whatsapp.trim() || allowClear) data.whatsapp = dto.whatsapp.trim() || null;
    }
    if (dto.linkedin !== undefined) {
      if (dto.linkedin.trim() || allowClear) data.linkedin = dto.linkedin.trim() || null;
    }
    if (dto.isPrimary !== undefined) data.isPrimary = dto.isPrimary;
    if (dto.isDecisionMaker !== undefined) data.isDecisionMaker = dto.isDecisionMaker;
    if (dto.isPublicContact !== undefined) data.isPublicContact = dto.isPublicContact;
    if (dto.notes !== undefined) data.notes = dto.notes.trim();

    const row = await this.prisma.partnershipContact.update({
      where: { id },
      data,
      include: { institution: { select: { name: true } } },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.CONTACT,
      entityId: id,
      action: PartnershipAuditAction.CONTACT_UPDATED,
      performedById: actorId,
    });

    return this.toResponse(row);
  }

  async remove(id: string, actorId: string): Promise<ContactResponseDto> {
    const existing = await this.prisma.partnershipContact.findUnique({
      where: { id },
      include: { institution: { select: { name: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Contact not found');
    }
    await this.institutions.ensureActiveInstitution(existing.institutionId);

    await this.prisma.partnershipContact.delete({ where: { id } });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.CONTACT,
      entityId: id,
      action: PartnershipAuditAction.CONTACT_DELETED,
      performedById: actorId,
    });
    return this.toResponse(existing);
  }

  private buildWhere(query: QueryContactsDto): Prisma.PartnershipContactWhereInput {
    const and: Prisma.PartnershipContactWhereInput[] = [
      { institution: { deletedAt: null } },
    ];
    if (query.institutionId) and.push({ institutionId: query.institutionId });
    if (query.jobTitle) {
      and.push({ jobTitle: { contains: query.jobTitle, mode: 'insensitive' } });
    }
    if (query.isDecisionMaker != null) and.push({ isDecisionMaker: query.isDecisionMaker });
    if (query.isPrimary != null) and.push({ isPrimary: query.isPrimary });
    if (query.hasEmail === true) and.push({ email: { not: null } });
    if (query.hasEmail === false) and.push({ OR: [{ email: null }, { email: '' }] });
    if (query.hasPhone === true) {
      and.push({
        OR: [{ phone: { not: null } }, { mobile: { not: null } }, { whatsapp: { not: null } }],
      });
    }
    if (query.hasPhone === false) {
      and.push({
        AND: [
          { OR: [{ phone: null }, { phone: '' }] },
          { OR: [{ mobile: null }, { mobile: '' }] },
        ],
      });
    }
    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { jobTitle: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    return { AND: and };
  }

  private toResponse(row: ContactWithInstitution): ContactResponseDto {
    return {
      id: row.id,
      institutionId: row.institutionId,
      institutionName: row.institution?.name ?? null,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: row.fullName,
      jobTitle: row.jobTitle,
      department: row.department,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      whatsapp: row.whatsapp,
      linkedin: row.linkedin,
      isPrimary: row.isPrimary,
      isDecisionMaker: row.isDecisionMaker,
      isPublicContact: row.isPublicContact,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
