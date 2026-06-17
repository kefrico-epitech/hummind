/*
  Warnings:

  - The `content` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `createdById` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "createdById" TEXT NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB;

-- CreateIndex
CREATE INDEX "Course_createdById_idx" ON "public"."Course"("createdById");

-- AddForeignKey
ALTER TABLE "public"."Course" ADD CONSTRAINT "Course_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
