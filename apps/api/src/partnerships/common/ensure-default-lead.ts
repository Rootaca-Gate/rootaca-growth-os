import {
  PartnershipAuditAction,
  PartnershipAuditEntityType,
  PartnershipLeadPriority,
  PartnershipLeadStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnershipAuditService } from './partnership-audit.service';

export type EnsureDefaultLeadInput = {
  institutionId: string;
  actorId: string;
  priority?: PartnershipLeadPriority | null;
  sourceId?: string | null;
  primaryContactId?: string | null;
  ownerId?: string | null;
};

/**
 * Ensures an institution has at least one PartnershipLead.
 * Creates a NEW lead when none exist — used by institution create, CSV import,
 * and research import so the Leads screen is populated from real CRM records.
 */
export async function ensureDefaultLeadForInstitution(
  prisma: PrismaService,
  audit: PartnershipAuditService,
  input: EnsureDefaultLeadInput,
  tx?: Prisma.TransactionClient,
): Promise<{ id: string; created: boolean }> {
  const db = tx ?? prisma;
  const existing = await db.partnershipLead.findFirst({
    where: { institutionId: input.institutionId },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) {
    return { id: existing.id, created: false };
  }

  const primaryContactId =
    input.primaryContactId ??
    (
      await db.partnershipContact.findFirst({
        where: { institutionId: input.institutionId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: { id: true },
      })
    )?.id ??
    null;

  const row = await db.partnershipLead.create({
    data: {
      institutionId: input.institutionId,
      status: PartnershipLeadStatus.NEW,
      priority: input.priority ?? PartnershipLeadPriority.UNKNOWN,
      sourceId: input.sourceId ?? null,
      primaryContactId,
      ownerId: input.ownerId ?? null,
    },
  });

  await audit.record({
    entityType: PartnershipAuditEntityType.LEAD,
    entityId: row.id,
    action: PartnershipAuditAction.LEAD_CREATED,
    performedById: input.actorId,
    metadata: { via: 'default_for_institution', institutionId: input.institutionId },
    tx,
  });

  return { id: row.id, created: true };
}
