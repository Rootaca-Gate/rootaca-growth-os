import { PartnershipFollowUpStatus, PartnershipLeadStatus } from '@prisma/client';

/**
 * Lead statuses that are no longer open opportunities.
 * activeLeadsCount = leads whose status is NOT in this set.
 */
export const CLOSED_LEAD_STATUSES: PartnershipLeadStatus[] = [
  PartnershipLeadStatus.PARTNER,
  PartnershipLeadStatus.NOT_INTERESTED,
  PartnershipLeadStatus.NO_RESPONSE,
  PartnershipLeadStatus.LOST,
];

export const OPEN_FOLLOW_UP_STATUS = PartnershipFollowUpStatus.PENDING;

/**
 * Primary contact selection (deterministic):
 * 1. Prefer contacts with isPrimary === true
 * 2. Among ties (or when none primary), earliest createdAt
 * Implemented by ordering isPrimary DESC, createdAt ASC and taking the first row per institution.
 */
export const PRIMARY_CONTACT_ORDER = [
  { isPrimary: 'desc' as const },
  { createdAt: 'asc' as const },
];
