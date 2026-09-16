-- CreateEnum
CREATE TYPE "KpiCategory" AS ENUM ('CODING', 'PROJECTS', 'PRACTICE', 'PROBLEM_SOLVING', 'INDEPENDENCE');

-- CreateEnum
CREATE TYPE "KpiFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "KpiStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED');

-- CreateEnum
CREATE TYPE "KpiRecordSource" AS ENUM ('MANUAL', 'SYSTEM');

-- CreateTable
CREATE TABLE "Kpi" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "KpiCategory" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" "KpiFrequency" NOT NULL,
    "weight" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentKpi" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "kpiId" UUID NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "status" "KpiStatus" NOT NULL DEFAULT 'BEHIND',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiRecord" (
    "id" UUID NOT NULL,
    "studentKpiId" UUID NOT NULL,
    "frequency" "KpiFrequency" NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "status" "KpiStatus" NOT NULL DEFAULT 'BEHIND',
    "notes" TEXT NOT NULL DEFAULT '',
    "source" "KpiRecordSource" NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kpi_code_key" ON "Kpi"("code");

-- CreateIndex
CREATE INDEX "Kpi_active_idx" ON "Kpi"("active");

-- CreateIndex
CREATE INDEX "Kpi_category_idx" ON "Kpi"("category");

-- CreateIndex
CREATE UNIQUE INDEX "StudentKpi_studentId_kpiId_key" ON "StudentKpi"("studentId", "kpiId");

-- CreateIndex
CREATE INDEX "StudentKpi_kpiId_idx" ON "StudentKpi"("kpiId");

-- CreateIndex
CREATE INDEX "StudentKpi_status_idx" ON "StudentKpi"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KpiRecord_studentKpiId_frequency_periodStart_key" ON "KpiRecord"("studentKpiId", "frequency", "periodStart");

-- CreateIndex
CREATE INDEX "KpiRecord_frequency_periodStart_idx" ON "KpiRecord"("frequency", "periodStart");

-- CreateIndex
CREATE INDEX "KpiRecord_status_idx" ON "KpiRecord"("status");

-- AddForeignKey
ALTER TABLE "StudentKpi" ADD CONSTRAINT "StudentKpi_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentKpi" ADD CONSTRAINT "StudentKpi_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiRecord" ADD CONSTRAINT "KpiRecord_studentKpiId_fkey" FOREIGN KEY ("studentKpiId") REFERENCES "StudentKpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
