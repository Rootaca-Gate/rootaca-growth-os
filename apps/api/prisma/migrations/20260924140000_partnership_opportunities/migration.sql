-- CreateEnum
CREATE TYPE "PartnershipOpportunityType" AS ENUM ('RENEWAL', 'EXPANSION', 'RENEWAL_AND_EXPANSION');

-- CreateEnum
CREATE TYPE "PartnershipOpportunityStatus" AS ENUM ('IDENTIFIED', 'PLANNING', 'PROPOSAL_DRAFT', 'PROPOSAL_SENT', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PartnershipOpportunityExpansionKind" AS ENUM ('NEW_PROGRAM', 'MORE_STUDENTS', 'MORE_GROUPS', 'NEW_GRADES', 'NEW_CAMPUS', 'NEW_DELIVERY_FORMAT', 'EXTENDED_DURATION', 'CUSTOMIZED_PROGRAM');

-- CreateEnum
CREATE TYPE "PartnershipOpportunityTimelineKind" AS ENUM ('OPPORTUNITY_CREATED', 'PREVIOUS_REPORT_REVIEWED', 'SCHOOL_CONTACTED', 'MEETING', 'REQUIREMENT_RECEIVED', 'PROPOSAL_CREATED', 'PROPOSAL_SENT', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'CONVERTED', 'CLOSED', 'CUSTOM');

-- AlterEnum
ALTER TYPE "PartnershipAuditEntityType" ADD VALUE 'OPPORTUNITY';

-- AlterEnum
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_UPDATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_STATUS_CHANGED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_PROPOSAL_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_PROPOSAL_LINKED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_PROPOSAL_ACCEPTED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_SOW_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_CONVERTED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_CLOSED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'OPPORTUNITY_ARCHIVED';

-- CreateTable
CREATE TABLE "PartnershipOpportunity" (
    "id" UUID NOT NULL,
    "opportunityNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PartnershipOpportunityType" NOT NULL,
    "status" "PartnershipOpportunityStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "institutionId" UUID NOT NULL,
    "campusInstitutionId" UUID,
    "previousProposalId" UUID,
    "previousSowId" UUID,
    "previousDeliveryId" UUID,
    "previousReportId" UUID,
    "newProposalId" UUID,
    "newSowId" UUID,
    "ownerId" UUID,
    "expectedDate" TIMESTAMP(3),
    "historicalSnapshot" JSONB,
    "renewalProgramIds" JSONB,
    "renewalOfferingIds" JSONB,
    "renewalGrades" TEXT NOT NULL DEFAULT '',
    "renewalGroupsNote" TEXT NOT NULL DEFAULT '',
    "renewalDurationNote" TEXT NOT NULL DEFAULT '',
    "renewalDeliveryMode" TEXT NOT NULL DEFAULT '',
    "renewalScopeNotes" TEXT NOT NULL DEFAULT '',
    "expansionScopeNotes" TEXT NOT NULL DEFAULT '',
    "proposedScopeNotes" TEXT NOT NULL DEFAULT '',
    "existingScopeNotes" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT '',
    "schoolFeedback" TEXT NOT NULL DEFAULT '',
    "successFactors" TEXT NOT NULL DEFAULT '',
    "challenges" TEXT NOT NULL DEFAULT '',
    "requestedChanges" TEXT NOT NULL DEFAULT '',
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "nextSteps" TEXT NOT NULL DEFAULT '',
    "feedbackSummary" TEXT NOT NULL DEFAULT '',
    "feedbackScore" DECIMAL(4,2),
    "feedbackRequestedPrograms" TEXT NOT NULL DEFAULT '',
    "feedbackRequestedChanges" TEXT NOT NULL DEFAULT '',
    "feedbackKeyComments" TEXT NOT NULL DEFAULT '',
    "feedbackDate" TIMESTAMP(3),
    "feedbackRecordedBy" TEXT NOT NULL DEFAULT '',
    "archivedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipOpportunityExpansionType" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "kind" "PartnershipOpportunityExpansionKind" NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipOpportunityExpansionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipOpportunityTimelineEvent" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "kind" "PartnershipOpportunityTimelineKind" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL DEFAULT '',
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipOpportunityTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipOpportunityActivityLog" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipOpportunityActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnershipOpportunity_opportunityNumber_key" ON "PartnershipOpportunity"("opportunityNumber");
CREATE INDEX "PartnershipOpportunity_institutionId_idx" ON "PartnershipOpportunity"("institutionId");
CREATE INDEX "PartnershipOpportunity_campusInstitutionId_idx" ON "PartnershipOpportunity"("campusInstitutionId");
CREATE INDEX "PartnershipOpportunity_previousProposalId_idx" ON "PartnershipOpportunity"("previousProposalId");
CREATE INDEX "PartnershipOpportunity_previousSowId_idx" ON "PartnershipOpportunity"("previousSowId");
CREATE INDEX "PartnershipOpportunity_previousDeliveryId_idx" ON "PartnershipOpportunity"("previousDeliveryId");
CREATE INDEX "PartnershipOpportunity_previousReportId_idx" ON "PartnershipOpportunity"("previousReportId");
CREATE INDEX "PartnershipOpportunity_newProposalId_idx" ON "PartnershipOpportunity"("newProposalId");
CREATE INDEX "PartnershipOpportunity_newSowId_idx" ON "PartnershipOpportunity"("newSowId");
CREATE INDEX "PartnershipOpportunity_ownerId_idx" ON "PartnershipOpportunity"("ownerId");
CREATE INDEX "PartnershipOpportunity_type_idx" ON "PartnershipOpportunity"("type");
CREATE INDEX "PartnershipOpportunity_status_idx" ON "PartnershipOpportunity"("status");
CREATE INDEX "PartnershipOpportunity_expectedDate_idx" ON "PartnershipOpportunity"("expectedDate");
CREATE INDEX "PartnershipOpportunity_createdAt_idx" ON "PartnershipOpportunity"("createdAt");
CREATE INDEX "PartnershipOpportunity_title_idx" ON "PartnershipOpportunity"("title");
CREATE UNIQUE INDEX "PartnershipOpportunityExpansionType_opportunityId_kind_key" ON "PartnershipOpportunityExpansionType"("opportunityId", "kind");
CREATE INDEX "PartnershipOpportunityExpansionType_opportunityId_sortOrder_idx" ON "PartnershipOpportunityExpansionType"("opportunityId", "sortOrder");
CREATE INDEX "PartnershipOpportunityTimelineEvent_opportunityId_occurredAt_idx" ON "PartnershipOpportunityTimelineEvent"("opportunityId", "occurredAt");
CREATE INDEX "PartnershipOpportunityTimelineEvent_performedById_idx" ON "PartnershipOpportunityTimelineEvent"("performedById");
CREATE INDEX "PartnershipOpportunityActivityLog_opportunityId_createdAt_idx" ON "PartnershipOpportunityActivityLog"("opportunityId", "createdAt");
CREATE INDEX "PartnershipOpportunityActivityLog_performedById_idx" ON "PartnershipOpportunityActivityLog"("performedById");

-- AddForeignKey
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_campusInstitutionId_fkey" FOREIGN KEY ("campusInstitutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_previousProposalId_fkey" FOREIGN KEY ("previousProposalId") REFERENCES "PartnershipProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_previousSowId_fkey" FOREIGN KEY ("previousSowId") REFERENCES "PartnershipSow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_previousDeliveryId_fkey" FOREIGN KEY ("previousDeliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_previousReportId_fkey" FOREIGN KEY ("previousReportId") REFERENCES "PartnershipReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_newProposalId_fkey" FOREIGN KEY ("newProposalId") REFERENCES "PartnershipProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_newSowId_fkey" FOREIGN KEY ("newSowId") REFERENCES "PartnershipSow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunity" ADD CONSTRAINT "PartnershipOpportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunityExpansionType" ADD CONSTRAINT "PartnershipOpportunityExpansionType_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "PartnershipOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunityTimelineEvent" ADD CONSTRAINT "PartnershipOpportunityTimelineEvent_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "PartnershipOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunityTimelineEvent" ADD CONSTRAINT "PartnershipOpportunityTimelineEvent_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunityActivityLog" ADD CONSTRAINT "PartnershipOpportunityActivityLog_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "PartnershipOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipOpportunityActivityLog" ADD CONSTRAINT "PartnershipOpportunityActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
