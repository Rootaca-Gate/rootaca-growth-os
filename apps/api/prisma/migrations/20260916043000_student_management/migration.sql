-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('INTAKE', 'ACTIVE', 'PAUSED', 'COMPLETED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EnglishLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'FLUENT');

-- CreateEnum
CREATE TYPE "ProgrammingExperience" AS ENUM ('NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "StudentLevel" AS ENUM ('FOUNDATION', 'JUNIOR', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "LearningPath" AS ENUM ('WEB', 'MOBILE', 'DATA', 'GAME', 'GENERAL');

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "schoolGrade" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "parentContact" TEXT NOT NULL,
    "programmingExperience" "ProgrammingExperience" NOT NULL,
    "programmingLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learningGoal" TEXT NOT NULL,
    "availableHoursPerWeek" INTEGER NOT NULL,
    "englishLevel" "EnglishLevel" NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'INTAKE',
    "level" "StudentLevel" NOT NULL,
    "path" "LearningPath" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "Student_level_idx" ON "Student"("level");

-- CreateIndex
CREATE INDEX "Student_path_idx" ON "Student"("path");

-- CreateIndex
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");
