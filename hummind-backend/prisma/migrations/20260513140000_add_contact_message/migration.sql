-- CreateEnum
CREATE TYPE "ContactKind" AS ENUM ('DEMO', 'SUPPORT', 'GENERAL');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ANSWERED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "kind" "ContactKind" NOT NULL DEFAULT 'GENERAL',
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContactMessage_email_idx" ON "ContactMessage"("email");
