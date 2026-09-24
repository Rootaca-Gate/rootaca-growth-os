-- CreateEnum
CREATE TYPE "PartnershipReportType" AS ENUM ('STUDENT_PROGRESS', 'GROUP_PROGRESS', 'SCHOOL_SUMMARY', 'PROGRAM_COMPLETION', 'FINAL_PARTNERSHIP');

-- CreateEnum
CREATE TYPE "PartnershipReportStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PartnershipReportRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PartnershipReportStudentTrackStatus" AS ENUM ('ON_TRACK', 'NEEDS_ATTENTION', 'COMPLETED', 'NOT_ASSESSED');

-- AlterEnum
ALTER TYPE "PartnershipAuditEntityType" ADD VALUE 'REPORT';

-- AlterEnum
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'REPORT_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'REPORT_UPDATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'REPORT_STATUS_CHANGED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'REPORT_VERSIONED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'REPORT_PUBLISHED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'REPORT_PDF_GENERATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'REPORT_ARCHIVED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'REPORT_DUPLICATED';

-- CreateTable
CREATE TABLE "PartnershipReport" (
    "id" UUID NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PartnershipReportType" NOT NULL,
    "status" "PartnershipReportStatus" NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "institutionId" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "sowId" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "institutionNameSnapshot" TEXT NOT NULL DEFAULT '',
    "deliveryNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "sowNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "proposalNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "programNameSnapshot" TEXT NOT NULL DEFAULT '',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "periodLabel" TEXT NOT NULL DEFAULT '',
    "preparedBy" TEXT NOT NULL DEFAULT '',
    "executiveSummary" TEXT NOT NULL DEFAULT '',
    "achievements" TEXT NOT NULL DEFAULT '',
    "nextSteps" TEXT NOT NULL DEFAULT '',
    "renewalNotes" TEXT NOT NULL DEFAULT '',
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "dataSnapshot" JSONB,
    "publishedSnapshot" JSONB,
    "publishedAt" TIMESTAMP(3),
    "publishedById" UUID,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipReportRecommendation" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "priority" "PartnershipReportRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "owner" TEXT NOT NULL DEFAULT '',
    "targetDate" TIMESTAMP(3),
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipReportRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipReportVersion" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "changeNote" TEXT NOT NULL DEFAULT '',
    "snapshot" JSONB NOT NULL,
    "publishedSnapshot" JSONB,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipReportVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipReportActivityLog" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipReportActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnershipReport_reportNumber_key" ON "PartnershipReport"("reportNumber");

-- CreateIndex
CREATE INDEX "PartnershipReport_institutionId_idx" ON "PartnershipReport"("institutionId");

-- CreateIndex
CREATE INDEX "PartnershipReport_deliveryId_idx" ON "PartnershipReport"("deliveryId");

-- CreateIndex
CREATE INDEX "PartnershipReport_sowId_idx" ON "PartnershipReport"("sowId");

-- CreateIndex
CREATE INDEX "PartnershipReport_proposalId_idx" ON "PartnershipReport"("proposalId");

-- CreateIndex
CREATE INDEX "PartnershipReport_type_idx" ON "PartnershipReport"("type");

-- CreateIndex
CREATE INDEX "PartnershipReport_status_idx" ON "PartnershipReport"("status");

-- CreateIndex
CREATE INDEX "PartnershipReport_periodStart_idx" ON "PartnershipReport"("periodStart");

-- CreateIndex
CREATE INDEX "PartnershipReport_periodEnd_idx" ON "PartnershipReport"("periodEnd");

-- CreateIndex
CREATE INDEX "PartnershipReport_createdAt_idx" ON "PartnershipReport"("createdAt");

-- CreateIndex
CREATE INDEX "PartnershipReport_title_idx" ON "PartnershipReport"("title");

-- CreateIndex
CREATE INDEX "PartnershipReportRecommendation_reportId_sortOrder_idx" ON "PartnershipReportRecommendation"("reportId", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipReportVersion_reportId_createdAt_idx" ON "PartnershipReportVersion"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "PartnershipReportVersion_createdById_idx" ON "PartnershipReportVersion"("createdById");

-- CreateIndex
CREATE INDEX "PartnershipReportActivityLog_reportId_createdAt_idx" ON "PartnershipReportActivityLog"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "PartnershipReportActivityLog_performedById_idx" ON "PartnershipReportActivityLog"("performedById");

-- AddForeignKey
ALTER TABLE "PartnershipReport" ADD CONSTRAINT "PartnershipReport_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReport" ADD CONSTRAINT "PartnershipReport_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReport" ADD CONSTRAINT "PartnershipReport_sowId_fkey" FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReport" ADD CONSTRAINT "PartnershipReport_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PartnershipProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReport" ADD CONSTRAINT "PartnershipReport_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReportRecommendation" ADD CONSTRAINT "PartnershipReportRecommendation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PartnershipReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReportVersion" ADD CONSTRAINT "PartnershipReportVersion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PartnershipReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReportVersion" ADD CONSTRAINT "PartnershipReportVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReportActivityLog" ADD CONSTRAINT "PartnershipReportActivityLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PartnershipReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipReportActivityLog" ADD CONSTRAINT "PartnershipReportActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
