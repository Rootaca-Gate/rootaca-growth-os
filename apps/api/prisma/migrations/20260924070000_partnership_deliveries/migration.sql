-- CreateEnum
CREATE TYPE "PartnershipDeliveryStatus" AS ENUM ('PREPARING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryPhaseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryMilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryTaskStatus" AS ENUM ('TO_DO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "PartnershipDeliverySessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryDeliverableStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryIssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryIssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryRaidType" AS ENUM ('RISK', 'ASSUMPTION', 'ISSUE', 'DEPENDENCY');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryRaidStatus" AS ENUM ('OPEN', 'MITIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryCommType" AS ENUM ('MEETING', 'EMAIL', 'CALL', 'WHATSAPP', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryCheckpointKind" AS ENUM ('KICKOFF', 'MIDPOINT_REVIEW', 'PROJECT_REVIEW', 'FINAL_REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryCheckpointStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryReportType" AS ENUM ('STUDENT_PROGRESS', 'GROUP_PROGRESS', 'SCHOOL_SUMMARY', 'PROGRAM_COMPLETION', 'FINAL_PARTNERSHIP');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'SHARED', 'FINAL');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryDocumentType" AS ENUM ('SOW', 'PROPOSAL', 'SESSION_MATERIAL', 'STUDENT_REPORT', 'PROJECT_FILE', 'SCHOOL_REPORT', 'FINAL_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipDeliveryGroupStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PartnershipAuditAction" ADD VALUE 'DELIVERY_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'DELIVERY_UPDATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'DELIVERY_STATUS_CHANGED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'DELIVERY_ARCHIVED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'DELIVERY_COMPLETED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'DELIVERY_REPORT_GENERATED';

-- AlterEnum
ALTER TYPE "PartnershipAuditEntityType" ADD VALUE 'DELIVERY';

-- CreateTable
CREATE TABLE "PartnershipDelivery" (
    "id" UUID NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionId" UUID NOT NULL,
    "sowId" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "status" "PartnershipDeliveryStatus" NOT NULL DEFAULT 'PREPARING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sowNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "proposalNumberSnapshot" TEXT NOT NULL DEFAULT '',
    "scopeSnapshot" JSONB,
    "responsibilitiesSnapshot" JSONB,
    "requirementsSnapshot" JSONB,
    "finalReportRequired" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryPhase" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "owner" TEXT NOT NULL DEFAULT '',
    "status" "PartnershipDeliveryPhaseStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipDeliveryPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryMilestone" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "phaseId" UUID,
    "sourceSowMilestoneId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "owner" TEXT NOT NULL DEFAULT '',
    "status" "PartnershipDeliveryMilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "requiredForCompletion" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipDeliveryMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryTask" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "phaseId" UUID,
    "milestoneId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "assigneeId" UUID,
    "priority" "PartnershipDeliveryTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" "PartnershipDeliveryTaskStatus" NOT NULL DEFAULT 'TO_DO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipDeliveryTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryGroup" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT '',
    "instructorId" UUID,
    "schedule" TEXT NOT NULL DEFAULT '',
    "status" "PartnershipDeliveryGroupStatus" NOT NULL DEFAULT 'PLANNED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipDeliveryGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryGroupStudent" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipDeliveryGroupStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryTeamMember" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "userId" UUID,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "responsibilities" TEXT NOT NULL DEFAULT '',
    "availability" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipDeliveryTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliverySession" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "groupId" UUID,
    "sessionNumber" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3),
    "startTime" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "durationMinutes" INTEGER,
    "instructorId" UUID,
    "instructorName" TEXT NOT NULL DEFAULT '',
    "topic" TEXT NOT NULL DEFAULT '',
    "status" "PartnershipDeliverySessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "learningObjectives" TEXT NOT NULL DEFAULT '',
    "activities" TEXT NOT NULL DEFAULT '',
    "projects" TEXT NOT NULL DEFAULT '',
    "homework" TEXT NOT NULL DEFAULT '',
    "instructorNotes" TEXT NOT NULL DEFAULT '',
    "sessionOutcome" TEXT NOT NULL DEFAULT '',
    "issuesNotes" TEXT NOT NULL DEFAULT '',
    "nextSessionPrep" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipDeliverySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryAttendance" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "PartnershipDeliveryAttendanceStatus" NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PartnershipDeliveryAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryDeliverable" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "sourceSowDeliverableId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "dueDate" TIMESTAMP(3),
    "acceptanceCriteria" TEXT NOT NULL DEFAULT '',
    "status" "PartnershipDeliveryDeliverableStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "requiredForCompletion" BOOLEAN NOT NULL DEFAULT true,
    "rejectionReason" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipDeliveryDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryDeliverableSubmission" (
    "id" UUID NOT NULL,
    "deliverableId" UUID NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "fileName" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT NOT NULL DEFAULT '',
    "submittedBy" TEXT NOT NULL DEFAULT '',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1',
    "status" "PartnershipDeliveryDeliverableStatus" NOT NULL DEFAULT 'SUBMITTED',
    "rejectionReason" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PartnershipDeliveryDeliverableSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryIssue" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "severity" "PartnershipDeliveryIssueSeverity" NOT NULL DEFAULT 'MEDIUM',
    "owner" TEXT NOT NULL DEFAULT '',
    "dueDate" TIMESTAMP(3),
    "status" "PartnershipDeliveryIssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipDeliveryIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryRaidItem" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "type" "PartnershipDeliveryRaidType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "impact" TEXT NOT NULL DEFAULT '',
    "probability" TEXT NOT NULL DEFAULT '',
    "mitigation" TEXT NOT NULL DEFAULT '',
    "dueDate" TIMESTAMP(3),
    "status" "PartnershipDeliveryRaidStatus" NOT NULL DEFAULT 'OPEN',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipDeliveryRaidItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryCommunication" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "type" "PartnershipDeliveryCommType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participants" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "actionItems" TEXT NOT NULL DEFAULT '',
    "owner" TEXT NOT NULL DEFAULT '',
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipDeliveryCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryCheckpoint" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "kind" "PartnershipDeliveryCheckpointKind" NOT NULL DEFAULT 'CUSTOM',
    "name" TEXT NOT NULL,
    "checkpointDate" TIMESTAMP(3),
    "participants" TEXT NOT NULL DEFAULT '',
    "discussion" TEXT NOT NULL DEFAULT '',
    "decisions" TEXT NOT NULL DEFAULT '',
    "actionItems" TEXT NOT NULL DEFAULT '',
    "status" "PartnershipDeliveryCheckpointStatus" NOT NULL DEFAULT 'PLANNED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipDeliveryCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryReport" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "type" "PartnershipDeliveryReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "status" "PartnershipDeliveryReportStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3),
    "fileName" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT NOT NULL DEFAULT '',
    "contentSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipDeliveryReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryDocument" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnershipDeliveryDocumentType" NOT NULL DEFAULT 'OTHER',
    "version" TEXT NOT NULL DEFAULT '1',
    "uploadedBy" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipDeliveryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipDeliveryActivityLog" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipDeliveryActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnershipDelivery_deliveryNumber_key" ON "PartnershipDelivery"("deliveryNumber");

-- CreateIndex
CREATE INDEX "PartnershipDelivery_institutionId_idx" ON "PartnershipDelivery"("institutionId");

-- CreateIndex
CREATE INDEX "PartnershipDelivery_sowId_idx" ON "PartnershipDelivery"("sowId");

-- CreateIndex
CREATE INDEX "PartnershipDelivery_proposalId_idx" ON "PartnershipDelivery"("proposalId");

-- CreateIndex
CREATE INDEX "PartnershipDelivery_status_idx" ON "PartnershipDelivery"("status");

-- CreateIndex
CREATE INDEX "PartnershipDelivery_startDate_idx" ON "PartnershipDelivery"("startDate");

-- CreateIndex
CREATE INDEX "PartnershipDelivery_endDate_idx" ON "PartnershipDelivery"("endDate");

-- CreateIndex
CREATE INDEX "PartnershipDelivery_createdAt_idx" ON "PartnershipDelivery"("createdAt");

-- CreateIndex
CREATE INDEX "PartnershipDelivery_name_idx" ON "PartnershipDelivery"("name");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryPhase_deliveryId_sortOrder_idx" ON "PartnershipDeliveryPhase"("deliveryId", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryMilestone_deliveryId_sortOrder_idx" ON "PartnershipDeliveryMilestone"("deliveryId", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryMilestone_phaseId_idx" ON "PartnershipDeliveryMilestone"("phaseId");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryTask_deliveryId_sortOrder_idx" ON "PartnershipDeliveryTask"("deliveryId", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryTask_assigneeId_idx" ON "PartnershipDeliveryTask"("assigneeId");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryTask_status_idx" ON "PartnershipDeliveryTask"("status");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryGroup_deliveryId_sortOrder_idx" ON "PartnershipDeliveryGroup"("deliveryId", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryGroupStudent_studentId_idx" ON "PartnershipDeliveryGroupStudent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnershipDeliveryGroupStudent_groupId_studentId_key" ON "PartnershipDeliveryGroupStudent"("groupId", "studentId");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryTeamMember_deliveryId_sortOrder_idx" ON "PartnershipDeliveryTeamMember"("deliveryId", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryTeamMember_userId_idx" ON "PartnershipDeliveryTeamMember"("userId");

-- CreateIndex
CREATE INDEX "PartnershipDeliverySession_deliveryId_sessionDate_idx" ON "PartnershipDeliverySession"("deliveryId", "sessionDate");

-- CreateIndex
CREATE INDEX "PartnershipDeliverySession_groupId_idx" ON "PartnershipDeliverySession"("groupId");

-- CreateIndex
CREATE INDEX "PartnershipDeliverySession_instructorId_idx" ON "PartnershipDeliverySession"("instructorId");

-- CreateIndex
CREATE INDEX "PartnershipDeliverySession_status_idx" ON "PartnershipDeliverySession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PartnershipDeliverySession_deliveryId_sessionNumber_key" ON "PartnershipDeliverySession"("deliveryId", "sessionNumber");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryAttendance_studentId_idx" ON "PartnershipDeliveryAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnershipDeliveryAttendance_sessionId_studentId_key" ON "PartnershipDeliveryAttendance"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryDeliverable_deliveryId_sortOrder_idx" ON "PartnershipDeliveryDeliverable"("deliveryId", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryDeliverable_status_idx" ON "PartnershipDeliveryDeliverable"("status");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryDeliverableSubmission_deliverableId_subm_idx" ON "PartnershipDeliveryDeliverableSubmission"("deliverableId", "submittedAt");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryIssue_deliveryId_status_idx" ON "PartnershipDeliveryIssue"("deliveryId", "status");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryIssue_severity_idx" ON "PartnershipDeliveryIssue"("severity");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryRaidItem_deliveryId_type_sortOrder_idx" ON "PartnershipDeliveryRaidItem"("deliveryId", "type", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryCommunication_deliveryId_occurredAt_idx" ON "PartnershipDeliveryCommunication"("deliveryId", "occurredAt");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryCheckpoint_deliveryId_sortOrder_idx" ON "PartnershipDeliveryCheckpoint"("deliveryId", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryReport_deliveryId_type_idx" ON "PartnershipDeliveryReport"("deliveryId", "type");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryDocument_deliveryId_type_idx" ON "PartnershipDeliveryDocument"("deliveryId", "type");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryActivityLog_deliveryId_createdAt_idx" ON "PartnershipDeliveryActivityLog"("deliveryId", "createdAt");

-- CreateIndex
CREATE INDEX "PartnershipDeliveryActivityLog_performedById_idx" ON "PartnershipDeliveryActivityLog"("performedById");

-- AddForeignKey
ALTER TABLE "PartnershipDelivery" ADD CONSTRAINT "PartnershipDelivery_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDelivery" ADD CONSTRAINT "PartnershipDelivery_sowId_fkey" FOREIGN KEY ("sowId") REFERENCES "PartnershipSow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDelivery" ADD CONSTRAINT "PartnershipDelivery_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PartnershipProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryPhase" ADD CONSTRAINT "PartnershipDeliveryPhase_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryMilestone" ADD CONSTRAINT "PartnershipDeliveryMilestone_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryMilestone" ADD CONSTRAINT "PartnershipDeliveryMilestone_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "PartnershipDeliveryPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryTask" ADD CONSTRAINT "PartnershipDeliveryTask_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryTask" ADD CONSTRAINT "PartnershipDeliveryTask_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "PartnershipDeliveryPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryTask" ADD CONSTRAINT "PartnershipDeliveryTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "PartnershipDeliveryMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryTask" ADD CONSTRAINT "PartnershipDeliveryTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryGroup" ADD CONSTRAINT "PartnershipDeliveryGroup_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryGroupStudent" ADD CONSTRAINT "PartnershipDeliveryGroupStudent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PartnershipDeliveryGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryGroupStudent" ADD CONSTRAINT "PartnershipDeliveryGroupStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryTeamMember" ADD CONSTRAINT "PartnershipDeliveryTeamMember_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryTeamMember" ADD CONSTRAINT "PartnershipDeliveryTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliverySession" ADD CONSTRAINT "PartnershipDeliverySession_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliverySession" ADD CONSTRAINT "PartnershipDeliverySession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PartnershipDeliveryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliverySession" ADD CONSTRAINT "PartnershipDeliverySession_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryAttendance" ADD CONSTRAINT "PartnershipDeliveryAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PartnershipDeliverySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryAttendance" ADD CONSTRAINT "PartnershipDeliveryAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryDeliverable" ADD CONSTRAINT "PartnershipDeliveryDeliverable_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryDeliverableSubmission" ADD CONSTRAINT "PartnershipDeliveryDeliverableSubmission_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "PartnershipDeliveryDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryIssue" ADD CONSTRAINT "PartnershipDeliveryIssue_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryRaidItem" ADD CONSTRAINT "PartnershipDeliveryRaidItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryCommunication" ADD CONSTRAINT "PartnershipDeliveryCommunication_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryCheckpoint" ADD CONSTRAINT "PartnershipDeliveryCheckpoint_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryReport" ADD CONSTRAINT "PartnershipDeliveryReport_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryDocument" ADD CONSTRAINT "PartnershipDeliveryDocument_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryActivityLog" ADD CONSTRAINT "PartnershipDeliveryActivityLog_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "PartnershipDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipDeliveryActivityLog" ADD CONSTRAINT "PartnershipDeliveryActivityLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "PartnershipOfferingSelectedProject_offeringId_sampleProjectId_k" RENAME TO "PartnershipOfferingSelectedProject_offeringId_sampleProject_key";
