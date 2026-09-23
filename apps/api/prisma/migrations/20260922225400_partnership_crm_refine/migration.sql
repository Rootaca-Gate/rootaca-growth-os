-- Phase B.1: soft delete, separate lead status, institution lifecycle status.
-- CRM tables are expected empty or mappable; no destructive data loss for Growth OS.

-- CreateEnum
CREATE TYPE "PartnershipLeadStatus" AS ENUM (
  'NEW',
  'QUALIFIED',
  'CONTACTED',
  'REPLIED',
  'MEETING_SCHEDULED',
  'MEETING_DONE',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'PARTNER',
  'NOT_INTERESTED',
  'NO_RESPONSE',
  'LOST'
);

-- Move Lead.status onto dedicated pipeline enum (same textual values).
ALTER TABLE "PartnershipLead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PartnershipLead"
  ALTER COLUMN "status" TYPE "PartnershipLeadStatus"
  USING ("status"::text::"PartnershipLeadStatus");
ALTER TABLE "PartnershipLead"
  ALTER COLUMN "status" SET DEFAULT 'NEW'::"PartnershipLeadStatus";

-- Replace institution status with lifecycle values (not opportunity pipeline).
CREATE TYPE "PartnershipInstitutionStatus_new" AS ENUM (
  'PROSPECT',
  'ACTIVE',
  'INACTIVE',
  'DO_NOT_CONTACT',
  'ARCHIVED'
);

ALTER TABLE "PartnershipInstitution" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PartnershipInstitution"
  ALTER COLUMN "status" TYPE "PartnershipInstitutionStatus_new"
  USING (
    CASE "status"::text
      WHEN 'PARTNER' THEN 'ACTIVE'::"PartnershipInstitutionStatus_new"
      WHEN 'NOT_INTERESTED' THEN 'DO_NOT_CONTACT'::"PartnershipInstitutionStatus_new"
      WHEN 'LOST' THEN 'DO_NOT_CONTACT'::"PartnershipInstitutionStatus_new"
      WHEN 'NO_RESPONSE' THEN 'INACTIVE'::"PartnershipInstitutionStatus_new"
      ELSE 'PROSPECT'::"PartnershipInstitutionStatus_new"
    END
  );

DROP TYPE "PartnershipInstitutionStatus";
ALTER TYPE "PartnershipInstitutionStatus_new" RENAME TO "PartnershipInstitutionStatus";

ALTER TABLE "PartnershipInstitution"
  ALTER COLUMN "status" SET DEFAULT 'PROSPECT'::"PartnershipInstitutionStatus";

-- Soft delete (restore-capable)
ALTER TABLE "PartnershipInstitution" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" UUID;

-- Audit actions
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'INSTITUTION_RESTORED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'NOTE_DELETED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOURCE_UPDATED';

-- Indexes + FK
CREATE INDEX "PartnershipInstitution_deletedAt_idx" ON "PartnershipInstitution"("deletedAt");
CREATE INDEX "PartnershipInstitution_deletedById_idx" ON "PartnershipInstitution"("deletedById");

ALTER TABLE "PartnershipInstitution"
  ADD CONSTRAINT "PartnershipInstitution_deletedById_fkey"
  FOREIGN KEY ("deletedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
