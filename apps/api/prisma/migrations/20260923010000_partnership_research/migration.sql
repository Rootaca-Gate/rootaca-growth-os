-- Phase F: Partnership research jobs, candidates, evidence

ALTER TYPE "PartnershipAuditEntityType" ADD VALUE 'RESEARCH_JOB';
ALTER TYPE "PartnershipAuditEntityType" ADD VALUE 'RESEARCH_CANDIDATE';

ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_JOB_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_JOB_STARTED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_JOB_COMPLETED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_JOB_FAILED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_JOB_CANCELLED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_CANDIDATE_CREATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_CANDIDATE_UPDATED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_CANDIDATE_VERIFIED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_CANDIDATE_REJECTED';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_CANDIDATE_DUPLICATE';
ALTER TYPE "PartnershipAuditAction" ADD VALUE 'RESEARCH_CANDIDATE_IMPORTED';

CREATE TYPE "PartnershipResearchJobStatus" AS ENUM (
  'DRAFT', 'QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'
);

CREATE TYPE "PartnershipResearchStatus" AS ENUM (
  'DISCOVERED', 'ENRICHING', 'READY_FOR_REVIEW', 'VERIFIED', 'REJECTED', 'DUPLICATE', 'IMPORTED', 'STALE'
);

CREATE TYPE "PartnershipResearchVerificationStatus" AS ENUM (
  'UNVERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED', 'STALE'
);

CREATE TYPE "PartnershipResearchDuplicateStatus" AS ENUM (
  'NEW', 'EXACT_MATCH', 'POSSIBLE_MATCH', 'REVIEWED_DUPLICATE'
);

CREATE TYPE "PartnershipResearchSourceType" AS ENUM (
  'SEARCH_ENGINE', 'OFFICIAL_WEBSITE', 'PUBLIC_DIRECTORY', 'PUBLIC_MAPS_LISTING',
  'PUBLIC_SOCIAL_PAGE', 'GOVERNMENT_LISTING', 'MANUAL', 'OTHER'
);

CREATE TYPE "PartnershipResearchLanguage" AS ENUM ('EN', 'AR', 'BOTH');

CREATE TYPE "PartnershipResearchDataQuality" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "PartnershipResearchJob" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "governorate" TEXT,
  "city" TEXT,
  "district" TEXT,
  "institutionType" "PartnershipInstitutionType",
  "institutionCategory" "PartnershipInstitutionCategory",
  "curriculum" "PartnershipCurriculum",
  "language" "PartnershipResearchLanguage" NOT NULL DEFAULT 'BOTH',
  "technologyJson" JSONB NOT NULL DEFAULT '{}',
  "queriesJson" JSONB NOT NULL DEFAULT '[]',
  "maxResultsPerQuery" INTEGER NOT NULL DEFAULT 20,
  "maxQueries" INTEGER NOT NULL DEFAULT 24,
  "maxCandidates" INTEGER NOT NULL DEFAULT 200,
  "status" "PartnershipResearchJobStatus" NOT NULL DEFAULT 'DRAFT',
  "statisticsJson" JSONB,
  "errorMessage" TEXT,
  "providerNote" TEXT,
  "requestedById" UUID NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnershipResearchJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipResearchCandidate" (
  "id" UUID NOT NULL,
  "jobId" UUID,
  "discoveredName" TEXT NOT NULL,
  "discoveredNameAr" TEXT,
  "discoveredNameEn" TEXT,
  "normalizedName" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Egypt',
  "governorate" TEXT,
  "city" TEXT,
  "district" TEXT,
  "address" TEXT,
  "institutionType" "PartnershipInstitutionType",
  "institutionCategory" "PartnershipInstitutionCategory",
  "curriculum" "PartnershipCurriculum",
  "educationLevel" "PartnershipEducationLevel",
  "email" TEXT,
  "phone" TEXT,
  "mobile" TEXT,
  "whatsapp" TEXT,
  "normalizedPhone" TEXT,
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
  "sourceType" "PartnershipResearchSourceType" NOT NULL DEFAULT 'MANUAL',
  "sourceName" TEXT,
  "sourceUrl" TEXT,
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastCheckedAt" TIMESTAMP(3),
  "researchStatus" "PartnershipResearchStatus" NOT NULL DEFAULT 'DISCOVERED',
  "verificationStatus" "PartnershipResearchVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "dataQuality" "PartnershipResearchDataQuality" NOT NULL DEFAULT 'LOW',
  "duplicateStatus" "PartnershipResearchDuplicateStatus" NOT NULL DEFAULT 'NEW',
  "duplicateOfCandidateId" UUID,
  "matchedInstitutionId" UUID,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnershipResearchCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnershipResearchEvidence" (
  "id" UUID NOT NULL,
  "candidateId" UUID NOT NULL,
  "field" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceType" "PartnershipResearchSourceType",
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confidence" "PartnershipResearchDataQuality" NOT NULL DEFAULT 'MEDIUM',
  CONSTRAINT "PartnershipResearchEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnershipResearchJob_status_idx" ON "PartnershipResearchJob"("status");
CREATE INDEX "PartnershipResearchJob_governorate_idx" ON "PartnershipResearchJob"("governorate");
CREATE INDEX "PartnershipResearchJob_city_idx" ON "PartnershipResearchJob"("city");
CREATE INDEX "PartnershipResearchJob_requestedById_idx" ON "PartnershipResearchJob"("requestedById");
CREATE INDEX "PartnershipResearchJob_createdAt_idx" ON "PartnershipResearchJob"("createdAt");

CREATE INDEX "PartnershipResearchCandidate_jobId_idx" ON "PartnershipResearchCandidate"("jobId");
CREATE INDEX "PartnershipResearchCandidate_researchStatus_idx" ON "PartnershipResearchCandidate"("researchStatus");
CREATE INDEX "PartnershipResearchCandidate_verificationStatus_idx" ON "PartnershipResearchCandidate"("verificationStatus");
CREATE INDEX "PartnershipResearchCandidate_duplicateStatus_idx" ON "PartnershipResearchCandidate"("duplicateStatus");
CREATE INDEX "PartnershipResearchCandidate_governorate_idx" ON "PartnershipResearchCandidate"("governorate");
CREATE INDEX "PartnershipResearchCandidate_city_idx" ON "PartnershipResearchCandidate"("city");
CREATE INDEX "PartnershipResearchCandidate_normalizedName_idx" ON "PartnershipResearchCandidate"("normalizedName");
CREATE INDEX "PartnershipResearchCandidate_normalizedWebsiteDomain_idx" ON "PartnershipResearchCandidate"("normalizedWebsiteDomain");
CREATE INDEX "PartnershipResearchCandidate_normalizedPhone_idx" ON "PartnershipResearchCandidate"("normalizedPhone");
CREATE INDEX "PartnershipResearchCandidate_discoveredAt_idx" ON "PartnershipResearchCandidate"("discoveredAt");
CREATE INDEX "PartnershipResearchCandidate_matchedInstitutionId_idx" ON "PartnershipResearchCandidate"("matchedInstitutionId");
CREATE INDEX "PartnershipResearchCandidate_sourceType_idx" ON "PartnershipResearchCandidate"("sourceType");

CREATE INDEX "PartnershipResearchEvidence_candidateId_idx" ON "PartnershipResearchEvidence"("candidateId");
CREATE INDEX "PartnershipResearchEvidence_field_idx" ON "PartnershipResearchEvidence"("field");
CREATE INDEX "PartnershipResearchEvidence_discoveredAt_idx" ON "PartnershipResearchEvidence"("discoveredAt");

ALTER TABLE "PartnershipResearchJob"
  ADD CONSTRAINT "PartnershipResearchJob_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartnershipResearchCandidate"
  ADD CONSTRAINT "PartnershipResearchCandidate_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "PartnershipResearchJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PartnershipResearchCandidate"
  ADD CONSTRAINT "PartnershipResearchCandidate_duplicateOfCandidateId_fkey"
  FOREIGN KEY ("duplicateOfCandidateId") REFERENCES "PartnershipResearchCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PartnershipResearchEvidence"
  ADD CONSTRAINT "PartnershipResearchEvidence_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "PartnershipResearchCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
