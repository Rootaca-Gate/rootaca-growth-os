import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipSource,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from '../common/partnership-audit.service';
import {
  CreateSourceDto,
  PaginatedSourcesDto,
  QuerySourcesDto,
  SourceResponseDto,
  UpdateSourceDto,
} from './dto/source.dto';

@Injectable()
export class SourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PartnershipAuditService,
  ) {}

  async create(dto: CreateSourceDto, actorId: string): Promise<SourceResponseDto> {
    const row = await this.prisma.partnershipSource.create({
      data: {
        sourceType: dto.sourceType,
        sourceName: dto.sourceName.trim(),
        sourceUrl: dto.sourceUrl?.trim() || null,
        description: dto.description?.trim() ?? '',
      },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOURCE,
      entityId: row.id,
      action: PartnershipAuditAction.SOURCE_CREATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async findAll(query: QuerySourcesDto): Promise<PaginatedSourcesDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const [total, rows] = await Promise.all([
      this.prisma.partnershipSource.count(),
      this.prisma.partnershipSource.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sourceName: 'asc' },
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

  async update(id: string, dto: UpdateSourceDto, actorId: string): Promise<SourceResponseDto> {
    const existing = await this.prisma.partnershipSource.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Source not found');
    }
    const row = await this.prisma.partnershipSource.update({
      where: { id },
      data: {
        ...(dto.sourceType !== undefined ? { sourceType: dto.sourceType } : {}),
        ...(dto.sourceName !== undefined ? { sourceName: dto.sourceName.trim() } : {}),
        ...(dto.sourceUrl !== undefined ? { sourceUrl: dto.sourceUrl.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      },
    });
    await this.audit.record({
      entityType: PartnershipAuditEntityType.SOURCE,
      entityId: id,
      action: PartnershipAuditAction.SOURCE_UPDATED,
      performedById: actorId,
    });
    return this.toResponse(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.partnershipSource.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Source not found');
    }
    const [institutions, leads] = await Promise.all([
      this.prisma.partnershipInstitution.count({ where: { sourceId: id } }),
      this.prisma.partnershipLead.count({ where: { sourceId: id } }),
    ]);
    if (institutions > 0 || leads > 0) {
      throw new ConflictException('Source is referenced and cannot be deleted');
    }
    await this.prisma.partnershipSource.delete({ where: { id } });
  }

  private toResponse(row: PartnershipSource): SourceResponseDto {
    return {
      id: row.id,
      sourceType: row.sourceType,
      sourceName: row.sourceName,
      sourceUrl: row.sourceUrl,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
