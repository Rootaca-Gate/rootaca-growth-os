-- Phase E: Partnership CSV import staging tables + audit actions

ALTER TYPE "PartnershipAuditAction" ADD VALUE 'IMPORT_STARTED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'IMPORT_FAILED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'INSTITUTION_MERGED';

CREATE TYPE "PartnershipImportStatus" AS ENUM (
  'DRAFT',
  'PROCESSING',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED'
);

CREATE TYPE "PartnershipImportRowDecision" AS ENUM (
  'PENDING',
  'SKIP',
  'MERGE',
  'IMPORT',
  'IMPORT_ANYWAY'
);

CREATE TYPE "PartnershipImportMatchConfidence" AS ENUM (
  'NONE',
  'POSSIBLE',
  'EXACT'
);

CREATE TYPE "PartnershipImportRowResult" AS ENUM (
  'PENDING',
  'IMPORTED',
  'MERGED',
  'SKIPPED',
  'FAILED',
  'INVALID'
);

CREATE TABLE "PartnershipImportJob" (
  "id" UUID NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSizeBytes" INTEGER NOT NULL,
  "uploadedById" UUID NOT NULL,
  "status" "PartnershipImportStatus" NOT NULL DEFAULT 'DRAFT',
  "headersJson" JSONB NOT NULL,
  "mappingJson" JSONB NOT NULL,
  "summaryJson" JSONB,
  "resultJson" JSONB,
  "errorMessage" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "PartnershipImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipImportRow" (
  "id" UUID NOT NULL,
  "jobId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "rawJson" JSONB NOT NULL,
  "mappedJson" JSONB,
  "normalizedJson" JSONB,
  "isValid" BOOLEAN NOT NULL DEFAULT false,
  "validationErrorsJson" JSONB,
  "matchConfidence" "PartnershipImportMatchConfidence" NOT NULL DEFAULT 'NONE',
  "matchReasonsJson" JSONB,
  "matchedInstitutionId" UUID,
  "matchedInstitutionName" TEXT,
  "csvDuplicateOfRow" INTEGER,
  "decision" "PartnershipImportRowDecision" NOT NULL DEFAULT 'PENDING',
  "resultStatus" "PartnershipImportRowResult" NOT NULL DEFAULT 'PENDING',
  "resultError" TEXT,
  "resultInstitutionId" UUID,

  CONSTRAINT "PartnershipImportRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnershipImportJob_uploadedById_idx" ON "PartnershipImportJob"("uploadedById");
CREATE INDEX "PartnershipImportJob_status_idx" ON "PartnershipImportJob"("status");
CREATE INDEX "PartnershipImportJob_createdAt_idx" ON "PartnershipImportJob"("createdAt");
CREATE INDEX "PartnershipImportJob_expiresAt_idx" ON "PartnershipImportJob"("expiresAt");

CREATE UNIQUE INDEX "PartnershipImportRow_jobId_rowNumber_key" ON "PartnershipImportRow"("jobId", "rowNumber");
CREATE INDEX "PartnershipImportRow_jobId_idx" ON "PartnershipImportRow"("jobId");
CREATE INDEX "PartnershipImportRow_decision_idx" ON "PartnershipImportRow"("decision");
CREATE INDEX "PartnershipImportRow_matchConfidence_idx" ON "PartnershipImportRow"("matchConfidence");
CREATE INDEX "PartnershipImportRow_isValid_idx" ON "PartnershipImportRow"("isValid");
CREATE INDEX "PartnershipImportRow_resultStatus_idx" ON "PartnershipImportRow"("resultStatus");

ALTER TABLE "PartnershipImportJob"
  ADD CONSTRAINT "PartnershipImportJob_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnershipImportRow"
  ADD CONSTRAINT "PartnershipImportRow_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "PartnershipImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
