-- Partnership program catalog (independent of school offerings / site CMS)

ALTER TYPE "PartnershipAuditEntityType" ADD VALUE 'PROGRAM';

ALTER TYPE "PartnershipAuditAction" ADD VALUE 'PROGRAM_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'PROGRAM_UPDATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'PROGRAM_ARCHIVED';

CREATE TYPE "PartnershipProgramType" AS ENUM ('TECHNICAL', 'EDUCATIONAL');

CREATE TYPE "PartnershipProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TYPE "PartnershipProgramLevel" AS ENUM (
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'BEGINNER_INTERMEDIATE',
  'INTERMEDIATE_ADVANCED'
);

CREATE TYPE "PartnershipDeliveryFormat" AS ENUM (
  'WORKSHOP',
  'AFTER_SCHOOL',
  'CODING_CLUB',
  'SEMESTER',
  'ANNUAL',
  'CUSTOMIZED'
);

CREATE TYPE "PartnershipProgramRequirementKind" AS ENUM ('EQUIPMENT', 'SCHOOL');

CREATE TYPE "PartnershipProgramDocumentType" AS ENUM (
  'CURRICULUM_PDF',
  'PROGRAM_PROFILE',
  'INSTRUCTOR_GUIDE',
  'SAMPLE_PROJECT',
  'ASSESSMENT_TEMPLATE',
  'OTHER'
);

CREATE TABLE "PartnershipProgram" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL DEFAULT '',
    "programType" "PartnershipProgramType" NOT NULL,
    "targetAge" TEXT,
    "targetGrades" TEXT,
    "recommendedLevel" "PartnershipProgramLevel",
    "status" "PartnershipProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "schoolValue" TEXT NOT NULL DEFAULT '',
    "studentValue" TEXT NOT NULL DEFAULT '',
    "finalProjectName" TEXT,
    "finalProjectDescription" TEXT,
    "finalProjectExpectedOutput" TEXT,
    "finalProjectEvaluationMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipProgramObjective" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipProgramObjective_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipProgramCurriculumModule" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipProgramCurriculumModule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipProgramActivity" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "skillsDeveloped" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipProgramActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipProgramSampleProject" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "skills" TEXT NOT NULL DEFAULT '',
    "expectedOutput" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipProgramSampleProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipProgramAssessmentMethod" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipProgramAssessmentMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipProgramDeliverySupport" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "format" "PartnershipDeliveryFormat" NOT NULL,

    CONSTRAINT "PartnershipProgramDeliverySupport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipProgramRequirement" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "kind" "PartnershipProgramRequirementKind" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipProgramRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipProgramDocument" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "documentType" "PartnershipProgramDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnershipProgramDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnershipProgram_programType_idx" ON "PartnershipProgram"("programType");
CREATE INDEX "PartnershipProgram_status_idx" ON "PartnershipProgram"("status");
CREATE INDEX "PartnershipProgram_recommendedLevel_idx" ON "PartnershipProgram"("recommendedLevel");
CREATE INDEX "PartnershipProgram_displayOrder_idx" ON "PartnershipProgram"("displayOrder");
CREATE INDEX "PartnershipProgram_name_idx" ON "PartnershipProgram"("name");

CREATE INDEX "PartnershipProgramObjective_programId_sortOrder_idx" ON "PartnershipProgramObjective"("programId", "sortOrder");
CREATE INDEX "PartnershipProgramCurriculumModule_programId_sortOrder_idx" ON "PartnershipProgramCurriculumModule"("programId", "sortOrder");
CREATE INDEX "PartnershipProgramActivity_programId_sortOrder_idx" ON "PartnershipProgramActivity"("programId", "sortOrder");
CREATE INDEX "PartnershipProgramSampleProject_programId_sortOrder_idx" ON "PartnershipProgramSampleProject"("programId", "sortOrder");
CREATE UNIQUE INDEX "PartnershipProgramAssessmentMethod_programId_key_key" ON "PartnershipProgramAssessmentMethod"("programId", "key");
CREATE INDEX "PartnershipProgramAssessmentMethod_programId_sortOrder_idx" ON "PartnershipProgramAssessmentMethod"("programId", "sortOrder");
CREATE UNIQUE INDEX "PartnershipProgramDeliverySupport_programId_format_key" ON "PartnershipProgramDeliverySupport"("programId", "format");
CREATE INDEX "PartnershipProgramDeliverySupport_programId_idx" ON "PartnershipProgramDeliverySupport"("programId");
CREATE INDEX "PartnershipProgramRequirement_programId_kind_sortOrder_idx" ON "PartnershipProgramRequirement"("programId", "kind", "sortOrder");
CREATE INDEX "PartnershipProgramDocument_programId_sortOrder_idx" ON "PartnershipProgramDocument"("programId", "sortOrder");

ALTER TABLE "PartnershipProgramObjective" ADD CONSTRAINT "PartnershipProgramObjective_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipProgramCurriculumModule" ADD CONSTRAINT "PartnershipProgramCurriculumModule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipProgramActivity" ADD CONSTRAINT "PartnershipProgramActivity_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipProgramSampleProject" ADD CONSTRAINT "PartnershipProgramSampleProject_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipProgramAssessmentMethod" ADD CONSTRAINT "PartnershipProgramAssessmentMethod_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipProgramDeliverySupport" ADD CONSTRAINT "PartnershipProgramDeliverySupport_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipProgramRequirement" ADD CONSTRAINT "PartnershipProgramRequirement_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnershipProgramDocument" ADD CONSTRAINT "PartnershipProgramDocument_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PartnershipProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
