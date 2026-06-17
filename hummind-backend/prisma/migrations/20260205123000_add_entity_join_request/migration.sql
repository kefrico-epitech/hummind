-- AlterTable
ALTER TABLE "public"."EntityInvitation"
ADD COLUMN "requesterId" TEXT;

-- CreateIndex
CREATE INDEX "EntityInvitation_requesterId_idx" ON "public"."EntityInvitation"("requesterId");

-- AddForeignKey
ALTER TABLE "public"."EntityInvitation"
ADD CONSTRAINT "EntityInvitation_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
