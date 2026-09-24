-- Phase 1: School Partnership Program profile enhancements

CREATE TYPE "PartnershipProgramRequirementPriority" AS ENUM ('REQUIRED', 'RECOMMENDED');

CREATE TYPE "PartnershipProgramDocumentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

ALTER TYPE "PartnershipAuditAction" ADD VALUE 'PROGRAM_DUPLICATED';

ALTER TABLE "PartnershipProgram"
  ADD COLUMN IF NOT EXISTS "recommendedStudentProfile" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "finalProjectSkills" TEXT;

ALTER TABLE "PartnershipProgramCurriculumModule"
  ADD COLUMN IF NOT EXISTS "skillsDeveloped" TEXT NOT NULL DEFAULT '';

ALTER TABLE "PartnershipProgramAssessmentMethod"
  ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

ALTER TABLE "PartnershipProgramRequirement"
  ADD COLUMN IF NOT EXISTS "priority" "PartnershipProgramRequirementPriority" NOT NULL DEFAULT 'REQUIRED';

CREATE TABLE IF NOT EXISTS "PartnershipProgramOutcome" (
  "id" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipProgramOutcome_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipProgramOutcome_programId_sortOrder_idx"
  ON "PartnershipProgramOutcome"("programId", "sortOrder");

ALTER TABLE "PartnershipProgramOutcome"
  DROP CONSTRAINT IF EXISTS "PartnershipProgramOutcome_programId_fkey";

ALTER TABLE "PartnershipProgramOutcome"
  ADD CONSTRAINT "PartnershipProgramOutcome_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnershipProgramDocument"
  ADD COLUMN IF NOT EXISTS "version" TEXT NOT NULL DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS "status" "PartnershipProgramDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
