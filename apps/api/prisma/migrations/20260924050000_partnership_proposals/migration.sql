-- School Partnership Proposals: commercial proposals layered on Offerings.
-- Pricing lives ONLY here — never on Program or Offering.

-- Enums -----------------------------------------------------------------------
CREATE TYPE "PartnershipProposalStatus" AS ENUM (
  'DRAFT',
  'SENT',
  'VIEWED',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'ARCHIVED'
);

CREATE TYPE "PartnershipPricingModel" AS ENUM (
  'PER_STUDENT',
  'PER_GROUP',
  'PER_SESSION',
  'PER_PROGRAM',
  'FIXED_PARTNERSHIP_FEE',
  'CUSTOM'
);

CREATE TYPE "PartnershipDiscountType" AS ENUM (
  'NONE',
  'PERCENTAGE',
  'FIXED_AMOUNT'
);

-- Audit enum additions --------------------------------------------------------
ALTER TYPE "PartnershipAuditEntityType" ADD VALUE IF NOT EXISTS 'PROPOSAL';

ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'PROPOSAL_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'PROPOSAL_UPDATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'PROPOSAL_SENT';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'PROPOSAL_STATUS_CHANGED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'PROPOSAL_ARCHIVED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'PROPOSAL_DUPLICATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'PROPOSAL_VERSIONED';

-- PartnershipProposal ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipProposal" (
  "id" UUID NOT NULL,
  "proposalNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "institutionId" UUID NOT NULL,
  "status" "PartnershipProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "proposalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "preparedBy" TEXT NOT NULL DEFAULT '',
  "version" TEXT NOT NULL DEFAULT '1.0',
  "executiveSummary" TEXT NOT NULL DEFAULT '',
  "schoolChallenge" TEXT NOT NULL DEFAULT '',
  "schoolObjective" TEXT NOT NULL DEFAULT '',
  "targetStudentGroup" TEXT NOT NULL DEFAULT '',
  "successCriteria" TEXT NOT NULL DEFAULT '',
  "partnershipObjective" TEXT NOT NULL DEFAULT '',
  "implementationApproach" TEXT NOT NULL DEFAULT '',
  "timelineNotes" TEXT NOT NULL DEFAULT '',
  "paymentTerms" TEXT NOT NULL DEFAULT '',
  "nextSteps" TEXT NOT NULL DEFAULT '',
  "termsAndConditions" TEXT NOT NULL DEFAULT '',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "currency" TEXT,
  "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
  "taxRate" DECIMAL(8,4),
  "headerDiscountType" "PartnershipDiscountType" NOT NULL DEFAULT 'NONE',
  "headerDiscountValue" DECIMAL(14,4),
  "subtotal" DECIMAL(14,2),
  "discountAmount" DECIMAL(14,2),
  "taxAmount" DECIMAL(14,2),
  "grandTotal" DECIMAL(14,2),
  "shareToken" TEXT,
  "shareTokenCreatedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "viewedAt" TIMESTAMP(3),
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnershipProposal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnershipProposal_proposalNumber_key"
  ON "PartnershipProposal"("proposalNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PartnershipProposal_shareToken_key"
  ON "PartnershipProposal"("shareToken");
CREATE INDEX IF NOT EXISTS "PartnershipProposal_institutionId_idx"
  ON "PartnershipProposal"("institutionId");
CREATE INDEX IF NOT EXISTS "PartnershipProposal_status_idx"
  ON "PartnershipProposal"("status");
CREATE INDEX IF NOT EXISTS "PartnershipProposal_proposalDate_idx"
  ON "PartnershipProposal"("proposalDate");
CREATE INDEX IF NOT EXISTS "PartnershipProposal_validUntil_idx"
  ON "PartnershipProposal"("validUntil");
CREATE INDEX IF NOT EXISTS "PartnershipProposal_createdAt_idx"
  ON "PartnershipProposal"("createdAt");
CREATE INDEX IF NOT EXISTS "PartnershipProposal_title_idx"
  ON "PartnershipProposal"("title");

ALTER TABLE "PartnershipProposal"
  DROP CONSTRAINT IF EXISTS "PartnershipProposal_institutionId_fkey";
ALTER TABLE "PartnershipProposal"
  ADD CONSTRAINT "PartnershipProposal_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- PartnershipProposalOffering -------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipProposalOffering" (
  "id" UUID NOT NULL,
  "proposalId" UUID NOT NULL,
  "offeringId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "snapshotProgramName" TEXT NOT NULL,
  "snapshotOfferingName" TEXT NOT NULL,
  "snapshotDeliveryFormat" "PartnershipDeliveryFormat" NOT NULL,
  "snapshotTargetGrades" TEXT,
  "snapshotRecommendedLevel" "PartnershipProgramLevel",
  "snapshotDuration" INTEGER,
  "snapshotDurationUnit" "PartnershipDurationUnit",
  "snapshotNumberOfSessions" INTEGER,
  "snapshotSessionDurationMinutes" INTEGER,
  "snapshotSessionFrequency" TEXT,
  "snapshotDeliveryMode" "PartnershipDeliveryMode",
  "snapshotGroupSizeMin" INTEGER,
  "snapshotGroupSizeMax" INTEGER,
  "snapshotNumberOfGroups" INTEGER,
  "snapshotShortDescription" TEXT NOT NULL DEFAULT '',
  "snapshotSchoolValue" TEXT NOT NULL DEFAULT '',
  "snapshotStudentValue" TEXT NOT NULL DEFAULT '',
  "snapshotCurriculumJson" JSONB,
  "snapshotProjectsJson" JSONB,
  "snapshotOutcomesJson" JSONB,
  "snapshotRequirementsJson" JSONB,
  "snapshotAssessmentJson" JSONB,
  "snapshotObjectivesJson" JSONB,
  "snapshotActivitiesJson" JSONB,
  "snapshotCapturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "customizedObjectives" TEXT NOT NULL DEFAULT '',
  "customizedCurriculumNotes" TEXT NOT NULL DEFAULT '',
  "specialRequirements" TEXT NOT NULL DEFAULT '',
  "implementationNotes" TEXT NOT NULL DEFAULT '',
  "deliveryNotes" TEXT NOT NULL DEFAULT '',
  "pricingModel" "PartnershipPricingModel" NOT NULL,
  "quantity" DECIMAL(14,4),
  "unitPrice" DECIMAL(14,4),
  "discountType" "PartnershipDiscountType" NOT NULL DEFAULT 'NONE',
  "discountValue" DECIMAL(14,4),
  "lineSubtotal" DECIMAL(14,2),
  CONSTRAINT "PartnershipProposalOffering_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipProposalOffering_proposalId_sortOrder_idx"
  ON "PartnershipProposalOffering"("proposalId", "sortOrder");
CREATE INDEX IF NOT EXISTS "PartnershipProposalOffering_offeringId_idx"
  ON "PartnershipProposalOffering"("offeringId");

ALTER TABLE "PartnershipProposalOffering"
  DROP CONSTRAINT IF EXISTS "PartnershipProposalOffering_proposalId_fkey";
ALTER TABLE "PartnershipProposalOffering"
  ADD CONSTRAINT "PartnershipProposalOffering_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "PartnershipProposal"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnershipProposalOffering"
  DROP CONSTRAINT IF EXISTS "PartnershipProposalOffering_offeringId_fkey";
ALTER TABLE "PartnershipProposalOffering"
  ADD CONSTRAINT "PartnershipProposalOffering_offeringId_fkey"
  FOREIGN KEY ("offeringId") REFERENCES "PartnershipOffering"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- PartnershipProposalTimelinePhase --------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipProposalTimelinePhase" (
  "id" UUID NOT NULL,
  "proposalId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  CONSTRAINT "PartnershipProposalTimelinePhase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipProposalTimelinePhase_proposalId_sortOrder_idx"
  ON "PartnershipProposalTimelinePhase"("proposalId", "sortOrder");

ALTER TABLE "PartnershipProposalTimelinePhase"
  DROP CONSTRAINT IF EXISTS "PartnershipProposalTimelinePhase_proposalId_fkey";
ALTER TABLE "PartnershipProposalTimelinePhase"
  ADD CONSTRAINT "PartnershipProposalTimelinePhase_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "PartnershipProposal"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- PartnershipProposalOutcome --------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipProposalOutcome" (
  "id" UUID NOT NULL,
  "proposalId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipProposalOutcome_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipProposalOutcome_proposalId_sortOrder_idx"
  ON "PartnershipProposalOutcome"("proposalId", "sortOrder");

ALTER TABLE "PartnershipProposalOutcome"
  DROP CONSTRAINT IF EXISTS "PartnershipProposalOutcome_proposalId_fkey";
ALTER TABLE "PartnershipProposalOutcome"
  ADD CONSTRAINT "PartnershipProposalOutcome_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "PartnershipProposal"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- PartnershipProposalVersion --------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipProposalVersion" (
  "id" UUID NOT NULL,
  "proposalId" UUID NOT NULL,
  "version" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnershipProposalVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipProposalVersion_proposalId_createdAt_idx"
  ON "PartnershipProposalVersion"("proposalId", "createdAt");

ALTER TABLE "PartnershipProposalVersion"
  DROP CONSTRAINT IF EXISTS "PartnershipProposalVersion_proposalId_fkey";
ALTER TABLE "PartnershipProposalVersion"
  ADD CONSTRAINT "PartnershipProposalVersion_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "PartnershipProposal"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
