-- RenameEnum
ALTER TYPE "LearningPath" RENAME TO "PathCode";

-- CreateEnum
CREATE TYPE "LevelCode" AS ENUM ('EXPLORER', 'BEGINNER', 'FOUNDATION', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "SkillCode" AS ENUM ('PROGRAMMING_FUNDAMENTALS', 'PROBLEM_SOLVING', 'TECHNICAL_KNOWLEDGE', 'PRACTICAL_SKILLS', 'COMMUNICATION', 'DEBUGGING', 'GIT_GITHUB', 'PROJECT_DEVELOPMENT', 'COMPUTER_SCIENCE_BASICS', 'INDEPENDENCE');

-- CreateTable
CREATE TABLE "Level" (
    "id" UUID NOT NULL,
    "code" "LevelCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelRule" (
    "id" UUID NOT NULL,
    "levelId" UUID NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'OVERALL_SCORE',

    CONSTRAINT "LevelRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" UUID NOT NULL,
    "code" "SkillCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSkill" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "assessmentResultId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" UUID NOT NULL,
    "code" "PathCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathSkill" (
    "id" UUID NOT NULL,
    "pathId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "weightPercent" INTEGER NOT NULL,

    CONSTRAINT "PathSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPlacement" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "assessmentResultId" UUID NOT NULL,
    "systemLevelId" UUID NOT NULL,
    "finalLevelId" UUID NOT NULL,
    "systemPathId" UUID NOT NULL,
    "finalPathId" UUID NOT NULL,
    "alternativePathId" UUID NOT NULL,
    "recommendationReasons" JSONB NOT NULL,
    "alternativeReasons" JSONB NOT NULL,
    "levelChangedById" UUID,
    "pathChangedById" UUID,
    "levelOverrideReason" TEXT,
    "pathOverrideReason" TEXT,
    "levelChangedAt" TIMESTAMP(3),
    "pathChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPlacement_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "currentLevelId" UUID;
ALTER TABLE "Student" ADD COLUMN "currentPathId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Level_code_key" ON "Level"("code");

-- CreateIndex
CREATE INDEX "LevelRule_levelId_idx" ON "LevelRule"("levelId");

-- CreateIndex
CREATE INDEX "LevelRule_minScore_maxScore_idx" ON "LevelRule"("minScore", "maxScore");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_code_key" ON "Skill"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSkill_studentId_skillId_key" ON "StudentSkill"("studentId", "skillId");

-- CreateIndex
CREATE INDEX "StudentSkill_skillId_idx" ON "StudentSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_code_key" ON "LearningPath"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PathSkill_pathId_skillId_key" ON "PathSkill"("pathId", "skillId");

-- CreateIndex
CREATE INDEX "PathSkill_skillId_idx" ON "PathSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentPlacement_assessmentResultId_key" ON "StudentPlacement"("assessmentResultId");

-- CreateIndex
CREATE INDEX "StudentPlacement_studentId_idx" ON "StudentPlacement"("studentId");

-- CreateIndex
CREATE INDEX "StudentPlacement_finalLevelId_idx" ON "StudentPlacement"("finalLevelId");

-- CreateIndex
CREATE INDEX "StudentPlacement_finalPathId_idx" ON "StudentPlacement"("finalPathId");

-- CreateIndex
CREATE INDEX "Student_currentLevelId_idx" ON "Student"("currentLevelId");

-- CreateIndex
CREATE INDEX "Student_currentPathId_idx" ON "Student"("currentPathId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentPathId_fkey" FOREIGN KEY ("currentPathId") REFERENCES "LearningPath"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelRule" ADD CONSTRAINT "LevelRule_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathSkill" ADD CONSTRAINT "PathSkill_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathSkill" ADD CONSTRAINT "PathSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_assessmentResultId_fkey" FOREIGN KEY ("assessmentResultId") REFERENCES "AssessmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_systemLevelId_fkey" FOREIGN KEY ("systemLevelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_finalLevelId_fkey" FOREIGN KEY ("finalLevelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_systemPathId_fkey" FOREIGN KEY ("systemPathId") REFERENCES "LearningPath"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_finalPathId_fkey" FOREIGN KEY ("finalPathId") REFERENCES "LearningPath"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_alternativePathId_fkey" FOREIGN KEY ("alternativePathId") REFERENCES "LearningPath"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_levelChangedById_fkey" FOREIGN KEY ("levelChangedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlacement" ADD CONSTRAINT "StudentPlacement_pathChangedById_fkey" FOREIGN KEY ("pathChangedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
