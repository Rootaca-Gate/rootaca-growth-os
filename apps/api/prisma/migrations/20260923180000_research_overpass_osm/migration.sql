-- AlterEnum
ALTER TYPE "PartnershipResearchSourceType" ADD VALUE 'OSM';

-- AlterTable
ALTER TABLE "PartnershipResearchJob" ADD COLUMN "discoveryMode" TEXT;

-- AlterTable
ALTER TABLE "PartnershipResearchCandidate" ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "osmType" TEXT,
ADD COLUMN "osmId" TEXT,
ADD COLUMN "osmUrl" TEXT;

-- CreateIndex
CREATE INDEX "PartnershipResearchCandidate_osmId_idx" ON "PartnershipResearchCandidate"("osmId");
