-- Partnership SOWs: Statement of Work after approved Proposal.
-- Execution agreement only — no commercial recalculation.

-- Enums -----------------------------------------------------------------------
CREATE TYPE "PartnershipSowStatus" AS ENUM (
  'DRAFT',
  'PENDING_SIGNATURE',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE "PartnershipSowDeliverableStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'ACCEPTED'
);

CREATE TYPE "PartnershipSowMilestoneStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DELAYED',
  'CANCELLED'
);

CREATE TYPE "PartnershipSowScopeKind" AS ENUM (
  'IN_SCOPE',
  'OUT_OF_SCOPE'
);

CREATE TYPE "PartnershipSowParty" AS ENUM (
  'ROOTACA',
  'SCHOOL'
);

CREATE TYPE "PartnershipSowChangeRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "PartnershipSowChangeImpact" AS ENUM (
  'MINOR',
  'MAJOR'
);

-- Audit -----------------------------------------------------------------------
ALTER TYPE "PartnershipAuditEntityType" ADD VALUE IF NOT EXISTS 'SOW';

ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOW_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOW_UPDATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOW_STATUS_CHANGED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOW_ARCHIVED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOW_DUPLICATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOW_VERSIONED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOW_CHANGE_REQUEST';
ALTER TYPE "PartnershipAuditAction" ADD VALUE IF NOT EXISTS 'SOW_PDF_GENERATED';

-- PartnershipSow --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSow" (
  "id" UUID NOT NULL,
  "sowNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "institutionId" UUID NOT NULL,
  "proposalId" UUID NOT NULL,
  "status" "PartnershipSowStatus" NOT NULL DEFAULT 'DRAFT',
  "sowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveDate" TIMESTAMP(3),
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "version" TEXT NOT NULL DEFAULT '1.0',
  "preparedBy" TEXT NOT NULL DEFAULT '',
  "approvedBy" TEXT NOT NULL DEFAULT '',
  "purpose" TEXT NOT NULL DEFAULT '',
  "targetStudents" TEXT NOT NULL DEFAULT '',
  "deliveryModelNotes" TEXT NOT NULL DEFAULT '',
  "activitiesNotes" TEXT NOT NULL DEFAULT '',
  "projectsNotes" TEXT NOT NULL DEFAULT '',
  "assessmentNotes" TEXT NOT NULL DEFAULT '',
  "reportingNotes" TEXT NOT NULL DEFAULT '',
  "clientName" TEXT NOT NULL DEFAULT '',
  "clientAddress" TEXT NOT NULL DEFAULT '',
  "primaryContactName" TEXT NOT NULL DEFAULT '',
  "primaryContactEmail" TEXT NOT NULL DEFAULT '',
  "primaryContactPhone" TEXT NOT NULL DEFAULT '',
  "attendanceExpectations" TEXT NOT NULL DEFAULT '',
  "minimumParticipation" TEXT NOT NULL DEFAULT '',
  "studentReplacementRules" TEXT NOT NULL DEFAULT '',
  "makeupSessionRules" TEXT NOT NULL DEFAULT '',
  "equipmentRequirements" TEXT NOT NULL DEFAULT '',
  "internetRequirements" TEXT NOT NULL DEFAULT '',
  "classroomLabRequirements" TEXT NOT NULL DEFAULT '',
  "studentDevicesRequirements" TEXT NOT NULL DEFAULT '',
  "softwareRequirements" TEXT NOT NULL DEFAULT '',
  "accountsAccessRequirements" TEXT NOT NULL DEFAULT '',
  "facultyLiaisonRequirements" TEXT NOT NULL DEFAULT '',
  "termsAndConditions" TEXT NOT NULL DEFAULT '',
  "proposalNumberSnapshot" TEXT NOT NULL DEFAULT '',
  "agreedValueSnapshot" DECIMAL(14,2),
  "currencySnapshot" TEXT,
  "paymentTermsSnapshot" TEXT NOT NULL DEFAULT '',
  "rootacaSignatoryName" TEXT NOT NULL DEFAULT '',
  "rootacaSignatoryTitle" TEXT NOT NULL DEFAULT '',
  "rootacaSignedAt" TIMESTAMP(3),
  "rootacaSignatureImage" TEXT NOT NULL DEFAULT '',
  "schoolSignatoryName" TEXT NOT NULL DEFAULT '',
  "schoolSignatoryTitle" TEXT NOT NULL DEFAULT '',
  "schoolSignedAt" TIMESTAMP(3),
  "schoolSignatureImage" TEXT NOT NULL DEFAULT '',
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "documentSnapshot" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnershipSow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnershipSow_sowNumber_key" ON "PartnershipSow"("sowNumber");
CREATE INDEX IF NOT EXISTS "PartnershipSow_institutionId_idx" ON "PartnershipSow"("institutionId");
CREATE INDEX IF NOT EXISTS "PartnershipSow_proposalId_idx" ON "PartnershipSow"("proposalId");
CREATE INDEX IF NOT EXISTS "PartnershipSow_status_idx" ON "PartnershipSow"("status");
CREATE INDEX IF NOT EXISTS "PartnershipSow_startDate_idx" ON "PartnershipSow"("startDate");
CREATE INDEX IF NOT EXISTS "PartnershipSow_endDate_idx" ON "PartnershipSow"("endDate");
CREATE INDEX IF NOT EXISTS "PartnershipSow_createdAt_idx" ON "PartnershipSow"("createdAt");
CREATE INDEX IF NOT EXISTS "PartnershipSow_title_idx" ON "PartnershipSow"("title");

ALTER TABLE "PartnershipSow"
  ADD CONSTRAINT "PartnershipSow_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnershipSow"
  ADD CONSTRAINT "PartnershipSow_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "PartnershipProposal"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Scope offerings -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowScopeOffering" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "offeringId" UUID,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "programName" TEXT NOT NULL,
  "offeringName" TEXT NOT NULL,
  "deliveryFormat" "PartnershipDeliveryFormat",
  "targetGrades" TEXT,
  "recommendedLevel" "PartnershipProgramLevel",
  "duration" INTEGER,
  "durationUnit" "PartnershipDurationUnit",
  "numberOfSessions" INTEGER,
  "sessionDurationMinutes" INTEGER,
  "sessionFrequency" TEXT,
  "deliveryMode" "PartnershipDeliveryMode",
  "groupSizeMin" INTEGER,
  "groupSizeMax" INTEGER,
  "numberOfGroups" INTEGER,
  "shortDescription" TEXT NOT NULL DEFAULT '',
  "curriculumJson" JSONB,
  "activitiesJson" JSONB,
  "projectsJson" JSONB,
  "assessmentJson" JSONB,
  "requirementsJson" JSONB,
  "outcomesJson" JSONB,
  "objectivesJson" JSONB,
  CONSTRAINT "PartnershipSowScopeOffering_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipSowScopeOffering_sowId_sortOrder_idx"
  ON "PartnershipSowScopeOffering"("sowId", "sortOrder");

ALTER TABLE "PartnershipSowScopeOffering"
  ADD CONSTRAINT "PartnershipSowScopeOffering_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Scope items -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowScopeItem" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "kind" "PartnershipSowScopeKind" NOT NULL,
  "text" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipSowScopeItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipSowScopeItem_sowId_kind_sortOrder_idx"
  ON "PartnershipSowScopeItem"("sowId", "kind", "sortOrder");

ALTER TABLE "PartnershipSowScopeItem"
  ADD CONSTRAINT "PartnershipSowScopeItem_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Deliverables ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowDeliverable" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "owner" TEXT NOT NULL DEFAULT '',
  "dueDate" TIMESTAMP(3),
  "acceptanceCriteria" TEXT NOT NULL DEFAULT '',
  "status" "PartnershipSowDeliverableStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipSowDeliverable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipSowDeliverable_sowId_sortOrder_idx"
  ON "PartnershipSowDeliverable"("sowId", "sortOrder");

ALTER TABLE "PartnershipSowDeliverable"
  ADD CONSTRAINT "PartnershipSowDeliverable_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Milestones ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowMilestone" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "owner" TEXT NOT NULL DEFAULT '',
  "status" "PartnershipSowMilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipSowMilestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipSowMilestone_sowId_sortOrder_idx"
  ON "PartnershipSowMilestone"("sowId", "sortOrder");

ALTER TABLE "PartnershipSowMilestone"
  ADD CONSTRAINT "PartnershipSowMilestone_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Responsibilities ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowResponsibility" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "activity" TEXT NOT NULL,
  "rootacaRole" TEXT NOT NULL DEFAULT '',
  "schoolRole" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipSowResponsibility_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipSowResponsibility_sowId_sortOrder_idx"
  ON "PartnershipSowResponsibility"("sowId", "sortOrder");

ALTER TABLE "PartnershipSowResponsibility"
  ADD CONSTRAINT "PartnershipSowResponsibility_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Team members ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowTeamMember" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "party" "PartnershipSowParty" NOT NULL,
  "role" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "responsibility" TEXT NOT NULL DEFAULT '',
  "contact" TEXT NOT NULL DEFAULT '',
  "assignedUserId" UUID,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipSowTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipSowTeamMember_sowId_party_sortOrder_idx"
  ON "PartnershipSowTeamMember"("sowId", "party", "sortOrder");

ALTER TABLE "PartnershipSowTeamMember"
  ADD CONSTRAINT "PartnershipSowTeamMember_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Assessment items ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowAssessmentItem" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "responsibleParty" TEXT NOT NULL DEFAULT '',
  "frequency" TEXT NOT NULL DEFAULT '',
  "format" TEXT NOT NULL DEFAULT '',
  "dueDate" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PartnershipSowAssessmentItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipSowAssessmentItem_sowId_sortOrder_idx"
  ON "PartnershipSowAssessmentItem"("sowId", "sortOrder");

ALTER TABLE "PartnershipSowAssessmentItem"
  ADD CONSTRAINT "PartnershipSowAssessmentItem_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Change requests -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowChangeRequest" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "changeRequestNumber" TEXT NOT NULL,
  "requestedBy" TEXT NOT NULL DEFAULT '',
  "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "description" TEXT NOT NULL DEFAULT '',
  "impact" "PartnershipSowChangeImpact" NOT NULL DEFAULT 'MINOR',
  "approvalStatus" "PartnershipSowChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT NOT NULL DEFAULT '',
  "decisionDate" TIMESTAMP(3),
  "changeSummary" TEXT NOT NULL DEFAULT '',
  "resultingVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnershipSowChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnershipSowChangeRequest_sowId_changeRequestNumber_key"
  ON "PartnershipSowChangeRequest"("sowId", "changeRequestNumber");
CREATE INDEX IF NOT EXISTS "PartnershipSowChangeRequest_sowId_createdAt_idx"
  ON "PartnershipSowChangeRequest"("sowId", "createdAt");

ALTER TABLE "PartnershipSowChangeRequest"
  ADD CONSTRAINT "PartnershipSowChangeRequest_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Versions --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PartnershipSowVersion" (
  "id" UUID NOT NULL,
  "sowId" UUID NOT NULL,
  "version" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "changeSummary" TEXT NOT NULL DEFAULT '',
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnershipSowVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PartnershipSowVersion_sowId_createdAt_idx"
  ON "PartnershipSowVersion"("sowId", "createdAt");

ALTER TABLE "PartnershipSowVersion"
  ADD CONSTRAINT "PartnershipSowVersion_sowId_fkey"
  FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
