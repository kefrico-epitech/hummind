-- CreateEnum
CREATE TYPE "public"."CourseGenerationJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CourseGenerationJobStep" AS ENUM ('BRIEFING', 'PLANNING', 'WRITING', 'PEDAGOGY_CHECK', 'FINALIZING');

-- CreateTable
CREATE TABLE "public"."CourseGenerationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT,
    "status" "public"."CourseGenerationJobStatus" NOT NULL DEFAULT 'QUEUED',
    "step" "public"."CourseGenerationJobStep" NOT NULL DEFAULT 'BRIEFING',
    "progressLabel" TEXT,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "requestId" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseGenerationJob_userId_idx" ON "public"."CourseGenerationJob"("userId");

-- CreateIndex
CREATE INDEX "CourseGenerationJob_entityId_idx" ON "public"."CourseGenerationJob"("entityId");

-- CreateIndex
CREATE INDEX "CourseGenerationJob_status_idx" ON "public"."CourseGenerationJob"("status");

-- CreateIndex
CREATE INDEX "CourseGenerationJob_createdAt_idx" ON "public"."CourseGenerationJob"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."CourseGenerationJob" ADD CONSTRAINT "CourseGenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
