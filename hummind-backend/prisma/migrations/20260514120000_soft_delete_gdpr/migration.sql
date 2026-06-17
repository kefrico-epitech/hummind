-- Flow v2.0 Phase 9 — soft-delete on User and Entity for GDPR-safe deletion.
-- Keeps the row in place (so referential integrity & history are preserved)
-- but flags it as deleted; queries must filter `deletedAt IS NULL`.

-- User.deletedAt
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- Entity.deletedAt
ALTER TABLE "Entity" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Entity_deletedAt_idx" ON "Entity"("deletedAt");
