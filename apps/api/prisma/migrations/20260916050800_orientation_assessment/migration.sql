-- CreateEnum
CREATE TYPE "OrientationSessionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OrientationStage" AS ENUM ('STUDENT_PROFILE', 'TECHNICAL_CHECK', 'PROBLEM_SOLVING', 'INTEREST_PATH', 'SUMMARY');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'RATING', 'MENTOR_EVALUATION', 'PRACTICAL_EVALUATION', 'FREE_TEXT');

-- CreateEnum
CREATE TYPE "AssessmentCategoryCode" AS ENUM ('PROGRAMMING_FUNDAMENTALS', 'PROBLEM_SOLVING', 'TECHNICAL_KNOWLEDGE', 'PRACTICAL_SKILLS', 'COMMUNICATION_LEARNING');

-- CreateTable
CREATE TABLE "AssessmentCategory" (
    "id" UUID NOT NULL,
    "code" "AssessmentCategoryCode" NOT NULL,
    "name" TEXT NOT NULL,
    "weightPercent" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "AssessmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "stage" "OrientationStage" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "helperText" TEXT,
    "skillKey" TEXT,
    "scored" BOOLEAN NOT NULL DEFAULT true,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "scaleMax" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentOption" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "scoreValue" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "AssessmentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrientationSession" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "status" "OrientationSessionStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStage" "OrientationStage" NOT NULL DEFAULT 'STUDENT_PROFILE',
    "notes" TEXT NOT NULL DEFAULT '',
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastResumedAt" TIMESTAMP(3),
    "elapsedMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrientationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAnswer" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "optionId" UUID,
    "numericValue" DOUBLE PRECISION,
    "textValue" TEXT,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "categoryScores" JSONB NOT NULL,
    "skillScores" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCategory_code_key" ON "AssessmentCategory"("code");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_stage_idx" ON "AssessmentQuestion"("stage");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_categoryId_idx" ON "AssessmentQuestion"("categoryId");

-- CreateIndex
CREATE INDEX "AssessmentOption_questionId_idx" ON "AssessmentOption"("questionId");

-- CreateIndex
CREATE INDEX "OrientationSession_studentId_idx" ON "OrientationSession"("studentId");

-- CreateIndex
CREATE INDEX "OrientationSession_status_idx" ON "OrientationSession"("status");

-- CreateIndex
CREATE INDEX "OrientationSession_createdById_idx" ON "OrientationSession"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnswer_sessionId_questionId_key" ON "AssessmentAnswer"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "AssessmentAnswer_questionId_idx" ON "AssessmentAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResult_sessionId_key" ON "AssessmentResult"("sessionId");

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssessmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentOption" ADD CONSTRAINT "AssessmentOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrientationSession" ADD CONSTRAINT "OrientationSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrientationSession" ADD CONSTRAINT "OrientationSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OrientationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "AssessmentOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OrientationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
