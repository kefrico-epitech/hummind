-- =============================================================================
-- Flow v2.0 — Role overhaul, onboarding workflow, support pipeline
-- =============================================================================
-- DB is empty of production data (dev only): we DROP and RECREATE rather than
-- backfilling. The seed will recreate the admin@hummind.com account after this
-- migration is applied.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Clear data depending on enums we are about to change
-- -----------------------------------------------------------------------------
DELETE FROM "ContactMessage";
DELETE FROM "User";

-- -----------------------------------------------------------------------------
-- 2. User: rename Role -> PlatformRole, add mustChangePassword,
--    extend UserStatus with INVITED
-- -----------------------------------------------------------------------------
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";

CREATE TYPE "PlatformRole" AS ENUM ('ROOT', 'MEMBER');
ALTER TABLE "User"
  ADD COLUMN "platformRole" "PlatformRole" NOT NULL DEFAULT 'MEMBER';

ALTER TABLE "User"
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT FALSE;

-- UserStatus: add INVITED. ALTER TYPE ADD VALUE cannot run inside a transaction,
-- so we recreate the type cleanly.
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE TEXT;
DROP TYPE "UserStatus";
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED', 'BANNED');
ALTER TABLE "User"
  ALTER COLUMN "status" TYPE "UserStatus" USING "status"::"UserStatus";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- -----------------------------------------------------------------------------
-- 3. ContactStatus: restructure to NEW / CONTACTED / ACCEPTED / REJECTED / ARCHIVED
-- -----------------------------------------------------------------------------
ALTER TABLE "ContactMessage" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ContactMessage" ALTER COLUMN "status" TYPE TEXT;
DROP TYPE "ContactStatus";
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'CONTACTED', 'ACCEPTED', 'REJECTED', 'ARCHIVED');
ALTER TABLE "ContactMessage"
  ALTER COLUMN "status" TYPE "ContactStatus" USING "status"::"ContactStatus";
ALTER TABLE "ContactMessage" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- ContactMessage.acceptedUserId : trace le User créé après acceptation
ALTER TABLE "ContactMessage"
  ADD COLUMN "acceptedUserId" TEXT;
ALTER TABLE "ContactMessage"
  ADD CONSTRAINT "ContactMessage_acceptedUserId_fkey"
  FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 4. Entity: subscription tier + quotas (préparation business v2)
-- -----------------------------------------------------------------------------
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE', 'CUSTOM');

ALTER TABLE "Entity"
  ADD COLUMN "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "maxLearners"          INTEGER,
  ADD COLUMN "maxCourses"           INTEGER,
  ADD COLUMN "maxAiCreditsPerMonth" INTEGER;

-- -----------------------------------------------------------------------------
-- 5. PublicJoinLink (rejoindre une salle via /join/[code])
-- -----------------------------------------------------------------------------
CREATE TABLE "PublicJoinLink" (
  "id"          TEXT NOT NULL,
  "code"        TEXT NOT NULL,
  "entityId"    TEXT NOT NULL,
  "enabled"     BOOLEAN NOT NULL DEFAULT TRUE,
  "expiresAt"   TIMESTAMP(3),
  "maxUses"     INTEGER,
  "usedCount"   INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublicJoinLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublicJoinLink_code_key" ON "PublicJoinLink"("code");
CREATE INDEX "PublicJoinLink_entityId_enabled_idx" ON "PublicJoinLink"("entityId", "enabled");
ALTER TABLE "PublicJoinLink"
  ADD CONSTRAINT "PublicJoinLink_entityId_fkey"
  FOREIGN KEY ("entityId") REFERENCES "Entity"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicJoinLink"
  ADD CONSTRAINT "PublicJoinLink_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 6. EmailVerificationCode (OTP 6 chiffres pour les nouveaux apprenants)
-- -----------------------------------------------------------------------------
CREATE TABLE "EmailVerificationCode" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "codeHash"   TEXT NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attempts"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailVerificationCode_userId_consumedAt_idx"
  ON "EmailVerificationCode"("userId", "consumedAt");
CREATE INDEX "EmailVerificationCode_expiresAt_idx"
  ON "EmailVerificationCode"("expiresAt");
ALTER TABLE "EmailVerificationCode"
  ADD CONSTRAINT "EmailVerificationCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 7. AdminAuditLog (traçabilité des actions sensibles)
-- -----------------------------------------------------------------------------
CREATE TABLE "AdminAuditLog" (
  "id"         TEXT NOT NULL,
  "actorId"    TEXT,
  "action"     TEXT NOT NULL,
  "targetType" TEXT,
  "targetId"   TEXT,
  "payload"    JSONB,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx"
  ON "AdminAuditLog"("actorId", "createdAt" DESC);
CREATE INDEX "AdminAuditLog_action_createdAt_idx"
  ON "AdminAuditLog"("action", "createdAt" DESC);
CREATE INDEX "AdminAuditLog_targetType_targetId_idx"
  ON "AdminAuditLog"("targetType", "targetId");
ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
