-- School Partnership Offerings: packaging layer on top of PartnershipProgram.

-- Enums -----------------------------------------------------------------------
CREATE TYPE "PartnershipOfferingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TYPE "PartnershipDurationUnit" AS ENUM ('WEEKS', 'MONTHS', 'SEMESTER', 'ANNUAL');

CREATE TYPE "PartnershipDeliveryMode" AS ENUM ('ON_SITE', 'ONLINE', 'HYBRID');

-- Audit enum additions --------------------------------------------------------
ALTER TYPE "PartnershipAuditEntityType" ADD VALUE IF NOT EXISTS 'OFFERING';

ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'OFFERING_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'OFFERING_UPDATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'OFFERING_ARCHIVED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'OFFERING_DUPLICATED';

-- PartnershipOffering ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipOffering" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "programId" UUID NOT NULL,
  "deliveryFormat" "PartnershipDeliveryFormat" NOT NULL,
  "status" "PartnershipOfferingStatus" NOT NULL DEFAULT 'DRAFT',
  "targetAge" TEXT,
  "targetGrades" TEXT,
  "recommendedLevel" "PartnershipProgramLevel",
  "learnerProfile" TEXT,
  "duration" INTEGER,
  "durationUnit" "PartnershipDurationUnit",
  "numberOfSessions" INTEGER,
  "sessionDurationMinutes" INTEGER,
  "sessionFrequency" TEXT,
  "deliveryMode" "PartnershipDeliveryMode",
  "locationNotes" TEXT NOT NULL DEFAULT '',
  "groupSizeMin" INTEGER,
  "groupSizeMax" INTEGER,
  "numberOfGroups" INTEGER,
  "instructorRequirement" TEXT NOT NULL DEFAULT '',
  "coordinatorRequirement" TEXT NOT NULL DEFAULT '',
  "curriculumCustomizationNotes" TEXT NOT NULL DEFAULT '',
  "projectCustomizationNotes" TEXT NOT NULL DEFAULT '',
  "includeFinalProject" BOOLEAN NOT NULL DEFAULT true,
  "assessmentFrequency" TEXT NOT NULL DEFAULT '',
  "includeInitialAssessment" BOOLEAN NOT NULL DEFAULT true,
  "includeMidAssessment" BOOLEAN NOT NULL DEFAULT true,
  "includeFinalAssessment" BOOLEAN NOT NULL DEFAULT true,
  "studentProgressReport" BOOLEAN NOT NULL DEFAULT true,
  "schoolSummaryReport" BOOLEAN NOT NULL DEFAULT true,
  "internalNotes" TEXT NOT NULL DEFAULT '',
  "commercialNotes" TEXT NOT NULL DEFAULT '',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnershipOffering_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipOffering_programId_idx" ON "PartnershipOffering"("programId");
CREATE INDEX IF NOT EXISTS "PartnershipOffering_status_idx" ON "PartnershipOffering"("status");
CREATE INDEX IF NOT EXISTS "PartnershipOffering_deliveryFormat_idx" ON "PartnershipOffering"("deliveryFormat");
CREATE INDEX IF NOT EXISTS "PartnershipOffering_displayOrder_idx" ON "PartnershipOffering"("displayOrder");
CREATE INDEX IF NOT EXISTS "PartnershipOffering_name_idx" ON "PartnershipOffering"("name");

ALTER TABLE "PartnershipOffering"
  DROP CONSTRAINT IF EXISTS "PartnershipOffering_programId_fkey";
ALTER TABLE "PartnershipOffering"
  ADD CONSTRAINT "PartnershipOffering_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- PartnershipOfferingSelectedModule -------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipOfferingSelectedModule" (
  "id" UUID NOT NULL,
  "offeringId" UUID NOT NULL,
  "moduleId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipOfferingSelectedModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnershipOfferingSelectedModule_offeringId_moduleId_key"
  ON "PartnershipOfferingSelectedModule"("offeringId", "moduleId");
CREATE INDEX IF NOT EXISTS "PartnershipOfferingSelectedModule_offeringId_sortOrder_idx"
  ON "PartnershipOfferingSelectedModule"("offeringId", "sortOrder");
CREATE INDEX IF NOT EXISTS "PartnershipOfferingSelectedModule_moduleId_idx"
  ON "PartnershipOfferingSelectedModule"("moduleId");

ALTER TABLE "PartnershipOfferingSelectedModule"
  DROP CONSTRAINT IF EXISTS "PartnershipOfferingSelectedModule_offeringId_fkey";
ALTER TABLE "PartnershipOfferingSelectedModule"
  ADD CONSTRAINT "PartnershipOfferingSelectedModule_offeringId_fkey"
  FOREIGN KEY ("offeringId") REFERENCES "PartnershipOffering"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnershipOfferingSelectedModule"
  DROP CONSTRAINT IF EXISTS "PartnershipOfferingSelectedModule_moduleId_fkey";
ALTER TABLE "PartnershipOfferingSelectedModule"
  ADD CONSTRAINT "PartnershipOfferingSelectedModule_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "PartnershipProgramCurriculumModule"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- PartnershipOfferingSelectedProject ------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipOfferingSelectedProject" (
  "id" UUID NOT NULL,
  "offeringId" UUID NOT NULL,
  "sampleProjectId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipOfferingSelectedProject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnershipOfferingSelectedProject_offeringId_sampleProjectId_key"
  ON "PartnershipOfferingSelectedProject"("offeringId", "sampleProjectId");
CREATE INDEX IF NOT EXISTS "PartnershipOfferingSelectedProject_offeringId_sortOrder_idx"
  ON "PartnershipOfferingSelectedProject"("offeringId", "sortOrder");
CREATE INDEX IF NOT EXISTS "PartnershipOfferingSelectedProject_sampleProjectId_idx"
  ON "PartnershipOfferingSelectedProject"("sampleProjectId");

ALTER TABLE "PartnershipOfferingSelectedProject"
  DROP CONSTRAINT IF EXISTS "PartnershipOfferingSelectedProject_offeringId_fkey";
ALTER TABLE "PartnershipOfferingSelectedProject"
  ADD CONSTRAINT "PartnershipOfferingSelectedProject_offeringId_fkey"
  FOREIGN KEY ("offeringId") REFERENCES "PartnershipOffering"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnershipOfferingSelectedProject"
  DROP CONSTRAINT IF EXISTS "PartnershipOfferingSelectedProject_sampleProjectId_fkey";
ALTER TABLE "PartnershipOfferingSelectedProject"
  ADD CONSTRAINT "PartnershipOfferingSelectedProject_sampleProjectId_fkey"
  FOREIGN KEY ("sampleProjectId") REFERENCES "PartnershipProgramSampleProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- PartnershipOfferingRequirement ----------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipOfferingRequirement" (
  "id" UUID NOT NULL,
  "offeringId" UUID NOT NULL,
  "kind" "PartnershipProgramRequirementKind" NOT NULL,
  "priority" "PartnershipProgramRequirementPriority" NOT NULL DEFAULT 'REQUIRED',
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipOfferingRequirement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipOfferingRequirement_offeringId_kind_sortOrder_idx"
  ON "PartnershipOfferingRequirement"("offeringId", "kind", "sortOrder");

ALTER TABLE "PartnershipOfferingRequirement"
  DROP CONSTRAINT IF EXISTS "PartnershipOfferingRequirement_offeringId_fkey";
ALTER TABLE "PartnershipOfferingRequirement"
  ADD CONSTRAINT "PartnershipOfferingRequirement_offeringId_fkey"
  FOREIGN KEY ("offeringId") REFERENCES "PartnershipOffering"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
