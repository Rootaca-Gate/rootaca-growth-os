-- CreateEnum
CREATE TYPE "ReviewKind" AS ENUM ('INITIAL_ASSESSMENT', 'MONTHLY_REVIEW');

-- CreateTable
CREATE TABLE "ProgressReview" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "kind" "ReviewKind" NOT NULL,
    "reviewedAt" DATE NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "reviewerId" UUID NOT NULL,
    "technicalSkills" INTEGER NOT NULL,
    "problemSolving" INTEGER NOT NULL,
    "projects" INTEGER NOT NULL,
    "independence" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "kpiOverallPercent" INTEGER NOT NULL DEFAULT 0,
    "projectOverallPercent" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "strengths" TEXT NOT NULL DEFAULT '',
    "nextFocus" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressReview_studentId_kind_periodStart_key" ON "ProgressReview"("studentId", "kind", "periodStart");

-- CreateIndex
CREATE INDEX "ProgressReview_studentId_reviewedAt_idx" ON "ProgressReview"("studentId", "reviewedAt");

-- CreateIndex
CREATE INDEX "ProgressReview_reviewerId_idx" ON "ProgressReview"("reviewerId");

-- CreateIndex
CREATE INDEX "ProgressReview_kind_idx" ON "ProgressReview"("kind");

-- AddForeignKey
ALTER TABLE "ProgressReview" ADD CONSTRAINT "ProgressReview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReview" ADD CONSTRAINT "ProgressReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
