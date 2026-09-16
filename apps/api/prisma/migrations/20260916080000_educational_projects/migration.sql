-- CreateEnum
CREATE TYPE "ProjectPurpose" AS ENUM ('EDUCATIONAL');

-- CreateEnum
CREATE TYPE "StudentProjectStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "MilestoneKind" AS ENUM ('PLANNING', 'UI_UX', 'FRONTEND', 'BACKEND', 'DATABASE', 'TESTING', 'DEPLOYMENT', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "learningGoal" TEXT NOT NULL,
    "purpose" "ProjectPurpose" NOT NULL DEFAULT 'EDUCATIONAL',
    "path" "PathCode" NOT NULL,
    "level" "LevelCode" NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProject" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "status" "StudentProjectStatus" NOT NULL DEFAULT 'ASSIGNED',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATE,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" UUID NOT NULL,
    "studentProjectId" UUID NOT NULL,
    "kind" "MilestoneKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "dueDate" DATE,
    "mentorFeedback" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE INDEX "Project_active_idx" ON "Project"("active");

-- CreateIndex
CREATE INDEX "Project_path_idx" ON "Project"("path");

-- CreateIndex
CREATE INDEX "Project_level_idx" ON "Project"("level");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProject_studentId_projectId_key" ON "StudentProject"("studentId", "projectId");

-- CreateIndex
CREATE INDEX "StudentProject_projectId_idx" ON "StudentProject"("projectId");

-- CreateIndex
CREATE INDEX "StudentProject_status_idx" ON "StudentProject"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMilestone_studentProjectId_kind_key" ON "ProjectMilestone"("studentProjectId", "kind");

-- CreateIndex
CREATE INDEX "ProjectMilestone_kind_idx" ON "ProjectMilestone"("kind");

-- CreateIndex
CREATE INDEX "ProjectMilestone_status_idx" ON "ProjectMilestone"("status");

-- AddForeignKey
ALTER TABLE "StudentProject" ADD CONSTRAINT "StudentProject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProject" ADD CONSTRAINT "StudentProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_studentProjectId_fkey" FOREIGN KEY ("studentProjectId") REFERENCES "StudentProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
