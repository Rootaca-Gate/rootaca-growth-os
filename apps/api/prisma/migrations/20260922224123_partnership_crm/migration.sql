-- CreateEnum
CREATE TYPE "PartnershipInstitutionType" AS ENUM ('SCHOOL', 'EDUCATION_CENTER', 'CODING_CENTER', 'STEM_CENTER', 'ROBOTICS_CENTER', 'AI_CENTER', 'LEARNING_CENTER', 'AFTER_SCHOOL_CENTER', 'MAKERSPACE', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipInstitutionCategory" AS ENUM ('INTERNATIONAL', 'MULTINATIONAL', 'MULTI_INTERNATIONAL', 'SEMI_INTERNATIONAL', 'SEMI_NATIONAL', 'NATIONAL', 'PRIVATE', 'LANGUAGE_SCHOOL', 'STEM', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipCurriculum" AS ENUM ('BRITISH', 'AMERICAN', 'IB', 'CANADIAN', 'GERMAN', 'FRENCH', 'ITALIAN', 'NATIONAL', 'STEM', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PartnershipInstitutionStatus" AS ENUM ('NEW', 'QUALIFIED', 'CONTACTED', 'REPLIED', 'MEETING_SCHEDULED', 'MEETING_DONE', 'PROPOSAL_SENT', 'NEGOTIATION', 'PARTNER', 'NOT_INTERESTED', 'NO_RESPONSE', 'LOST');

-- CreateEnum
CREATE TYPE "PartnershipLeadPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PartnershipType" AS ENUM ('SCHOOL_PARTNERSHIP', 'AFTER_SCHOOL', 'CODING_CLUB', 'STEM_PROGRAM', 'ROBOTICS_PROGRAM', 'AI_PROGRAM', 'SUMMER_CAMP', 'WORKSHOP', 'TECHNOLOGY_ACTIVITIES', 'STUDENT_PROJECTS', 'TEACHER_TRAINING', 'PARENT_WORKSHOP', 'ONLINE_PROGRAM', 'HYBRID_PROGRAM', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipEducationLevel" AS ENUM ('KG', 'PRIMARY', 'PREPARATORY', 'SECONDARY', 'MIXED', 'HIGHER_EDUCATION', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PartnershipGender" AS ENUM ('MALE', 'FEMALE', 'COED', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PartnershipActivityType" AS ENUM ('EMAIL', 'PHONE_CALL', 'WHATSAPP', 'MEETING', 'NOTE', 'FOLLOW_UP', 'RESEARCH', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipFollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartnershipFollowUpPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PartnershipSourceType" AS ENUM ('OFFICIAL_WEBSITE', 'FACEBOOK', 'GOOGLE_MAPS', 'LINKEDIN', 'EDUCATION_DIRECTORY', 'MANUAL_RESEARCH', 'IMPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipAuditEntityType" AS ENUM ('INSTITUTION', 'CONTACT', 'LEAD', 'ACTIVITY', 'FOLLOW_UP', 'NOTE', 'SOURCE', 'IMPORT');

-- CreateEnum
CREATE TYPE "PartnershipAuditAction" AS ENUM ('INSTITUTION_CREATED', 'INSTITUTION_UPDATED', 'INSTITUTION_DELETED', 'CONTACT_CREATED', 'CONTACT_UPDATED', 'CONTACT_DELETED', 'LEAD_CREATED', 'LEAD_UPDATED', 'STATUS_CHANGED', 'ACTIVITY_CREATED', 'FOLLOWUP_CREATED', 'FOLLOWUP_UPDATED', 'FOLLOWUP_COMPLETED', 'NOTE_CREATED', 'NOTE_UPDATED', 'SOURCE_CREATED', 'IMPORT_COMPLETED');

-- CreateTable
CREATE TABLE "PartnershipSource" (
    "id" UUID NOT NULL,
    "sourceType" "PartnershipSourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipInstitution" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "arabicName" TEXT,
    "englishName" TEXT,
    "normalizedName" TEXT,
    "institutionType" "PartnershipInstitutionType",
    "institutionCategory" "PartnershipInstitutionCategory",
    "curriculum" "PartnershipCurriculum",
    "educationLevel" "PartnershipEducationLevel",
    "gender" "PartnershipGender",
    "ageRange" TEXT,
    "governorate" TEXT,
    "city" TEXT,
    "district" TEXT,
    "fullAddress" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "whatsapp" TEXT,
    "normalizedPhone" TEXT,
    "generalEmail" TEXT,
    "admissionsEmail" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "normalizedWebsiteDomain" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "youtube" TEXT,
    "tiktok" TEXT,
    "googleMapsUrl" TEXT,
    "hasCoding" BOOLEAN NOT NULL DEFAULT false,
    "hasRobotics" BOOLEAN NOT NULL DEFAULT false,
    "hasStem" BOOLEAN NOT NULL DEFAULT false,
    "hasAi" BOOLEAN NOT NULL DEFAULT false,
    "hasTechClub" BOOLEAN NOT NULL DEFAULT false,
    "hasAfterSchool" BOOLEAN NOT NULL DEFAULT false,
    "hasSummerCamp" BOOLEAN NOT NULL DEFAULT false,
    "hasMakerspace" BOOLEAN NOT NULL DEFAULT false,
    "partnershipType" "PartnershipType",
    "leadPriority" "PartnershipLeadPriority" NOT NULL DEFAULT 'UNKNOWN',
    "leadPriorityReason" TEXT,
    "status" "PartnershipInstitutionStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT NOT NULL DEFAULT '',
    "branchName" TEXT,
    "parentInstitutionId" UUID,
    "sourceId" UUID,
    "metadata" JSONB,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipInstitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipContact" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL DEFAULT '',
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "whatsapp" TEXT,
    "linkedin" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
    "isPublicContact" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipLead" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "primaryContactId" UUID,
    "status" "PartnershipInstitutionStatus" NOT NULL DEFAULT 'NEW',
    "priority" "PartnershipLeadPriority" NOT NULL DEFAULT 'UNKNOWN',
    "sourceId" UUID,
    "qualificationReason" TEXT,
    "estimatedStudentCount" INTEGER,
    "estimatedOpportunity" TEXT,
    "nextAction" TEXT,
    "nextActionDate" DATE,
    "ownerId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipActivity" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "contactId" UUID,
    "leadId" UUID,
    "activityType" "PartnershipActivityType" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "activityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipFollowUp" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "contactId" UUID,
    "leadId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "dueDate" DATE NOT NULL,
    "priority" "PartnershipFollowUpPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "PartnershipFollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" UUID,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipNote" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "contactId" UUID,
    "leadId" UUID,
    "content" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipAuditEvent" (
    "id" UUID NOT NULL,
    "entityType" "PartnershipAuditEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "action" "PartnershipAuditAction" NOT NULL,
    "metadata" JSONB,
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnershipAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnershipSource_sourceType_idx" ON "PartnershipSource"("sourceType");

-- CreateIndex
CREATE INDEX "PartnershipSource_sourceName_idx" ON "PartnershipSource"("sourceName");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_status_idx" ON "PartnershipInstitution"("status");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_institutionType_idx" ON "PartnershipInstitution"("institutionType");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_institutionCategory_idx" ON "PartnershipInstitution"("institutionCategory");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_curriculum_idx" ON "PartnershipInstitution"("curriculum");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_governorate_idx" ON "PartnershipInstitution"("governorate");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_city_idx" ON "PartnershipInstitution"("city");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_leadPriority_idx" ON "PartnershipInstitution"("leadPriority");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_createdAt_idx" ON "PartnershipInstitution"("createdAt");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_updatedAt_idx" ON "PartnershipInstitution"("updatedAt");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_normalizedName_idx" ON "PartnershipInstitution"("normalizedName");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_normalizedPhone_idx" ON "PartnershipInstitution"("normalizedPhone");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_normalizedWebsiteDomain_idx" ON "PartnershipInstitution"("normalizedWebsiteDomain");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_parentInstitutionId_idx" ON "PartnershipInstitution"("parentInstitutionId");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_sourceId_idx" ON "PartnershipInstitution"("sourceId");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_name_idx" ON "PartnershipInstitution"("name");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_hasCoding_idx" ON "PartnershipInstitution"("hasCoding");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_hasStem_idx" ON "PartnershipInstitution"("hasStem");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_hasRobotics_idx" ON "PartnershipInstitution"("hasRobotics");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_hasAi_idx" ON "PartnershipInstitution"("hasAi");

-- CreateIndex
CREATE INDEX "PartnershipInstitution_hasAfterSchool_idx" ON "PartnershipInstitution"("hasAfterSchool");

-- CreateIndex
CREATE INDEX "PartnershipContact_institutionId_idx" ON "PartnershipContact"("institutionId");

-- CreateIndex
CREATE INDEX "PartnershipContact_email_idx" ON "PartnershipContact"("email");

-- CreateIndex
CREATE INDEX "PartnershipContact_isDecisionMaker_idx" ON "PartnershipContact"("isDecisionMaker");

-- CreateIndex
CREATE INDEX "PartnershipContact_isPrimary_idx" ON "PartnershipContact"("isPrimary");

-- CreateIndex
CREATE INDEX "PartnershipContact_fullName_idx" ON "PartnershipContact"("fullName");

-- CreateIndex
CREATE INDEX "PartnershipLead_institutionId_idx" ON "PartnershipLead"("institutionId");

-- CreateIndex
CREATE INDEX "PartnershipLead_status_idx" ON "PartnershipLead"("status");

-- CreateIndex
CREATE INDEX "PartnershipLead_priority_idx" ON "PartnershipLead"("priority");

-- CreateIndex
CREATE INDEX "PartnershipLead_nextActionDate_idx" ON "PartnershipLead"("nextActionDate");

-- CreateIndex
CREATE INDEX "PartnershipLead_ownerId_idx" ON "PartnershipLead"("ownerId");

-- CreateIndex
CREATE INDEX "PartnershipLead_primaryContactId_idx" ON "PartnershipLead"("primaryContactId");

-- CreateIndex
CREATE INDEX "PartnershipLead_sourceId_idx" ON "PartnershipLead"("sourceId");

-- CreateIndex
CREATE INDEX "PartnershipLead_createdAt_idx" ON "PartnershipLead"("createdAt");

-- CreateIndex
CREATE INDEX "PartnershipLead_updatedAt_idx" ON "PartnershipLead"("updatedAt");

-- CreateIndex
CREATE INDEX "PartnershipActivity_institutionId_idx" ON "PartnershipActivity"("institutionId");

-- CreateIndex
CREATE INDEX "PartnershipActivity_leadId_idx" ON "PartnershipActivity"("leadId");

-- CreateIndex
CREATE INDEX "PartnershipActivity_contactId_idx" ON "PartnershipActivity"("contactId");

-- CreateIndex
CREATE INDEX "PartnershipActivity_activityDate_idx" ON "PartnershipActivity"("activityDate");

-- CreateIndex
CREATE INDEX "PartnershipActivity_activityType_idx" ON "PartnershipActivity"("activityType");

-- CreateIndex
CREATE INDEX "PartnershipActivity_createdById_idx" ON "PartnershipActivity"("createdById");

-- CreateIndex
CREATE INDEX "PartnershipActivity_createdAt_idx" ON "PartnershipActivity"("createdAt");

-- CreateIndex
CREATE INDEX "PartnershipFollowUp_institutionId_idx" ON "PartnershipFollowUp"("institutionId");

-- CreateIndex
CREATE INDEX "PartnershipFollowUp_status_idx" ON "PartnershipFollowUp"("status");

-- CreateIndex
CREATE INDEX "PartnershipFollowUp_dueDate_idx" ON "PartnershipFollowUp"("dueDate");

-- CreateIndex
CREATE INDEX "PartnershipFollowUp_assignedToId_idx" ON "PartnershipFollowUp"("assignedToId");

-- CreateIndex
CREATE INDEX "PartnershipFollowUp_priority_idx" ON "PartnershipFollowUp"("priority");

-- CreateIndex
CREATE INDEX "PartnershipFollowUp_leadId_idx" ON "PartnershipFollowUp"("leadId");

-- CreateIndex
CREATE INDEX "PartnershipFollowUp_contactId_idx" ON "PartnershipFollowUp"("contactId");

-- CreateIndex
CREATE INDEX "PartnershipNote_institutionId_idx" ON "PartnershipNote"("institutionId");

-- CreateIndex
CREATE INDEX "PartnershipNote_contactId_idx" ON "PartnershipNote"("contactId");

-- CreateIndex
CREATE INDEX "PartnershipNote_leadId_idx" ON "PartnershipNote"("leadId");

-- CreateIndex
CREATE INDEX "PartnershipNote_createdById_idx" ON "PartnershipNote"("createdById");

-- CreateIndex
CREATE INDEX "PartnershipNote_createdAt_idx" ON "PartnershipNote"("createdAt");

-- CreateIndex
CREATE INDEX "PartnershipAuditEvent_entityType_entityId_idx" ON "PartnershipAuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PartnershipAuditEvent_action_idx" ON "PartnershipAuditEvent"("action");

-- CreateIndex
CREATE INDEX "PartnershipAuditEvent_performedById_idx" ON "PartnershipAuditEvent"("performedById");

-- CreateIndex
CREATE INDEX "PartnershipAuditEvent_createdAt_idx" ON "PartnershipAuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "PartnershipInstitution" ADD CONSTRAINT "PartnershipInstitution_parentInstitutionId_fkey" FOREIGN KEY ("parentInstitutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipInstitution" ADD CONSTRAINT "PartnershipInstitution_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PartnershipSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipContact" ADD CONSTRAINT "PartnershipContact_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipLead" ADD CONSTRAINT "PartnershipLead_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipLead" ADD CONSTRAINT "PartnershipLead_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "PartnershipContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipLead" ADD CONSTRAINT "PartnershipLead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PartnershipSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipLead" ADD CONSTRAINT "PartnershipLead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipActivity" ADD CONSTRAINT "PartnershipActivity_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipActivity" ADD CONSTRAINT "PartnershipActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "PartnershipContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipActivity" ADD CONSTRAINT "PartnershipActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "PartnershipLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipActivity" ADD CONSTRAINT "PartnershipActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipFollowUp" ADD CONSTRAINT "PartnershipFollowUp_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipFollowUp" ADD CONSTRAINT "PartnershipFollowUp_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "PartnershipContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipFollowUp" ADD CONSTRAINT "PartnershipFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "PartnershipLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipFollowUp" ADD CONSTRAINT "PartnershipFollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipNote" ADD CONSTRAINT "PartnershipNote_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "PartnershipInstitution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipNote" ADD CONSTRAINT "PartnershipNote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "PartnershipContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipNote" ADD CONSTRAINT "PartnershipNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "PartnershipLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipNote" ADD CONSTRAINT "PartnershipNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipAuditEvent" ADD CONSTRAINT "PartnershipAuditEvent_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
