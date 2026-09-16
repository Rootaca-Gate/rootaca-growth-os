-- CreateEnum
CREATE TYPE "RoadmapItemStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateTable
CREATE TABLE "RoadmapTemplate" (
    "id" UUID NOT NULL,
    "pathId" UUID NOT NULL,
    "levelId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RoadmapTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapTemplatePhase" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "RoadmapTemplatePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapTemplateItem" (
    "id" UUID NOT NULL,
    "phaseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillId" UUID NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "RoadmapTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "templateId" UUID,
    "pathId" UUID NOT NULL,
    "levelId" UUID NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapPhase" (
    "id" UUID NOT NULL,
    "roadmapId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "RoadmapPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapItem" (
    "id" UUID NOT NULL,
    "phaseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillId" UUID,
    "durationDays" INTEGER NOT NULL,
    "startDate" DATE,
    "dueDate" DATE,
    "status" "RoadmapItemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "projectId" UUID,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapTemplate_pathId_levelId_key" ON "RoadmapTemplate"("pathId", "levelId");

-- CreateIndex
CREATE INDEX "RoadmapTemplate_levelId_idx" ON "RoadmapTemplate"("levelId");

-- CreateIndex
CREATE INDEX "RoadmapTemplatePhase_templateId_idx" ON "RoadmapTemplatePhase"("templateId");

-- CreateIndex
CREATE INDEX "RoadmapTemplateItem_phaseId_idx" ON "RoadmapTemplateItem"("phaseId");

-- CreateIndex
CREATE INDEX "RoadmapTemplateItem_skillId_idx" ON "RoadmapTemplateItem"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_studentId_key" ON "Roadmap"("studentId");

-- CreateIndex
CREATE INDEX "Roadmap_pathId_idx" ON "Roadmap"("pathId");

-- CreateIndex
CREATE INDEX "Roadmap_levelId_idx" ON "Roadmap"("levelId");

-- CreateIndex
CREATE INDEX "Roadmap_templateId_idx" ON "Roadmap"("templateId");

-- CreateIndex
CREATE INDEX "RoadmapPhase_roadmapId_idx" ON "RoadmapPhase"("roadmapId");

-- CreateIndex
CREATE INDEX "RoadmapItem_phaseId_idx" ON "RoadmapItem"("phaseId");

-- CreateIndex
CREATE INDEX "RoadmapItem_skillId_idx" ON "RoadmapItem"("skillId");

-- CreateIndex
CREATE INDEX "RoadmapItem_status_idx" ON "RoadmapItem"("status");

-- AddForeignKey
ALTER TABLE "RoadmapTemplate" ADD CONSTRAINT "RoadmapTemplate_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTemplate" ADD CONSTRAINT "RoadmapTemplate_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTemplatePhase" ADD CONSTRAINT "RoadmapTemplatePhase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoadmapTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTemplateItem" ADD CONSTRAINT "RoadmapTemplateItem_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "RoadmapTemplatePhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTemplateItem" ADD CONSTRAINT "RoadmapTemplateItem_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoadmapTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapPhase" ADD CONSTRAINT "RoadmapPhase_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapItem" ADD CONSTRAINT "RoadmapItem_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "RoadmapPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapItem" ADD CONSTRAINT "RoadmapItem_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
