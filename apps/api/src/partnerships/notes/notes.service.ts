import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipNote,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import { InstitutionsService } from '../institutions/institutions.service';
import {
  CreateNoteDto,
  NoteResponseDto,
  PaginatedNotesDto,
  QueryNotesDto,
  UpdateNoteDto,
} from './dto/note.dto';

type NoteRow = PartnershipNote & { createdBy?: { displayName: string } | null };

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
    private readonly institutions: InstitutionsService,
  ) {}

  async create(
    institutionId: string,
    dto: CreateNoteDto,
    actorId: string,
  ): Promise<NoteResponseDto> {
    await this.institutions.ensureActiveInstitution(institutionId);
    await this.validateRefs(institutionId, dto.contactId, dto.leadId);

    const row = await this.prisma.partnershipNote.create({
      data: {
        institutionId,
        contactId: dto.contactId,
        leadId: dto.leadId,
        content: dto.content.trim(),
        createdById: actorId,
      },
      include: { createdBy: { select: { displayName: true } } },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.NOTE,
      entityId: row.id,
      action: PartnershipAuditAction.NOTE_CREATED,
      performedById: actorId,
    });

    return this.toResponse(row);
  }

  async findByInstitution(
    institutionId: string,
    query: QueryNotesDto,
  ): Promise<PaginatedNotesDto> {
    await this.institutions.ensureActiveInstitution(institutionId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { institutionId };

    const [total, rows] = await Promise.all([
      this.prisma.partnershipNote.count({ where }),
      this.prisma.partnershipNote.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { displayName: true } } },
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

  async update(id: string, dto: UpdateNoteDto, actorId: string): Promise<NoteResponseDto> {
    const existing = await this.prisma.partnershipNote.findFirst({
      where: { id, institution: { deletedAt: null } },
    });
    if (!existing) {
      throw new NotFoundException('Note not found');
    }

    const row = await this.prisma.partnershipNote.update({
      where: { id },
      data: { content: dto.content.trim() },
      include: { createdBy: { select: { displayName: true } } },
    });

    await this.audit.record({
      entityType: PartnershipAuditEntityType.NOTE,
      entityId: id,
      action: PartnershipAuditAction.NOTE_UPDATED,
      performedById: actorId,
    });

    return this.toResponse(row);
  }

  async remove(id: string, actorId: string): Promise<NoteResponseDto> {
    const existing = await this.prisma.partnershipNote.findFirst({
      where: { id, institution: { deletedAt: null } },
      include: { createdBy: { select: { displayName: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Note not found');
    }

    await this.prisma.partnershipNote.delete({ where: { id } });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.NOTE,
      entityId: id,
      action: PartnershipAuditAction.NOTE_DELETED,
      performedById: actorId,
    });

    return this.toResponse(existing);
  }

  private async validateRefs(
    institutionId: string,
    contactId?: string,
    leadId?: string,
  ): Promise<void> {
    if (contactId) {
      const contact = await this.prisma.partnershipContact.findUnique({ where: { id: contactId } });
      if (!contact) throw new NotFoundException('Contact not found');
      if (contact.institutionId !== institutionId) {
        throw new BadRequestException('Contact does not belong to institution');
      }
    }
    if (leadId) {
      const lead = await this.prisma.partnershipLead.findUnique({ where: { id: leadId } });
      if (!lead) throw new NotFoundException('Lead not found');
      if (lead.institutionId !== institutionId) {
        throw new BadRequestException('Lead does not belong to institution');
      }
    }
  }

  private toResponse(row: NoteRow): NoteResponseDto {
    return {
      id: row.id,
      institutionId: row.institutionId,
      contactId: row.contactId,
      leadId: row.leadId,
      content: row.content,
      createdById: row.createdById,
      createdByName: row.createdBy?.displayName ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
