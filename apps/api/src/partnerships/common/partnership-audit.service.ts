import { Injectable } from '@nestjs/common';
import { PartnershipAuditAction, PartnershipAuditEntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PartnershipAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    entityType: PartnershipAuditEntityType;
    entityId: string;
    action: PartnershipAuditAction;
    performedById: string | null;
    metadata?: Prisma.InputJsonValue;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    const client = params.tx ?? this.prisma;
    await client.partnershipAuditEvent.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        performedById: params.performedById,
        metadata: params.metadata ?? undefined,
      },
    });
  }
}
