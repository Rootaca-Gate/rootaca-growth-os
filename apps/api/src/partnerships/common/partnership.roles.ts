import { Role } from '@prisma/client';

/** Any authenticated CRM staff may read. */
export const CRM_READ_ROLES = [Role.ADMIN, Role.MENTOR, Role.COUNSELOR] as const;

/**
 * Create / update CRM records.
 * ADMIN + COUNSELOR per Phase C policy; MENTOR included for Growth OS editor parity
 * (mentors manage school outreach). Soft-delete/restore remains ADMIN-only.
 */
export const CRM_WRITE_ROLES = [Role.ADMIN, Role.MENTOR, Role.COUNSELOR] as const;

/** Soft delete, restore, and other destructive CRM ops. */
export const CRM_ADMIN_ROLES = [Role.ADMIN] as const;
