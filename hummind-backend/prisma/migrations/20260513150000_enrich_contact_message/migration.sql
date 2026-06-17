-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SCHOOL_PRIMARY', 'SCHOOL_SECONDARY', 'UNIVERSITY', 'VOCATIONAL_CENTER', 'TRAINING_ORG', 'CORPORATE', 'INDEPENDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "LearnerVolume" AS ENUM ('UNDER_50', 'BETWEEN_50_200', 'BETWEEN_200_1000', 'OVER_1000');

-- CreateEnum
CREATE TYPE "ProjectHorizon" AS ENUM ('IMMEDIATE', 'WITHIN_1_MONTH', 'WITHIN_3_MONTHS', 'EXPLORING');

-- AlterTable
ALTER TABLE "ContactMessage"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "organizationName" TEXT,
  ADD COLUMN "organizationType" "OrganizationType",
  ADD COLUMN "learnerVolume" "LearnerVolume",
  ADD COLUMN "website" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "horizon" "ProjectHorizon",
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: remove default once column exists (column was added with default to backfill existing rows)
ALTER TABLE "ContactMessage" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "ContactMessage_kind_status_idx" ON "ContactMessage"("kind", "status");
