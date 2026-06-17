BEGIN;

-- Preserve legacy data outside Prisma-managed `public` before pruning remote-only structures.
CREATE SCHEMA IF NOT EXISTS "archive";

CREATE TABLE IF NOT EXISTS "archive"."sync_20260416_user_legacy" (
  "user_id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "archived_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "archive"."sync_20260416_user_legacy" ("user_id", "email", "snapshot")
SELECT u."id", u."email", to_jsonb(u)
FROM "User" u
WHERE u."role"::text = 'ROOT'
   OR u."invitedById" IS NOT NULL
   OR COALESCE(u."mustChangePassword", false) = true
ON CONFLICT ("user_id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "archive"."sync_20260416_entity_legacy" (
  "entity_id" TEXT PRIMARY KEY,
  "entity_name" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "archived_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "archive"."sync_20260416_entity_legacy" ("entity_id", "entity_name", "snapshot")
SELECT e."id", e."name", to_jsonb(e)
FROM "Entity" e
WHERE e."learnerQuota" IS NOT NULL
   OR e."subscribedUntil" IS NOT NULL
   OR e."trialEndsAt" IS NOT NULL
   OR e."tier" IS NOT NULL
   OR e."status"::text IN ('TRIAL', 'SUSPENDED')
ON CONFLICT ("entity_id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "archive"."sync_20260416_organization_request_legacy" (
  "request_id" TEXT PRIMARY KEY,
  "snapshot" JSONB NOT NULL,
  "archived_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "archive"."sync_20260416_organization_request_legacy" ("request_id", "snapshot")
SELECT o."id", to_jsonb(o)
FROM "OrganizationRequest" o
ON CONFLICT ("request_id") DO NOTHING;

-- Normalize values not supported by the local schema before shrinking enums.
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "role"::text = 'ROOT';

UPDATE "Entity"
SET "status" = 'ACTIVE'
WHERE "status"::text = 'TRIAL';

UPDATE "Entity"
SET "status" = 'ARCHIVED'
WHERE "status"::text = 'SUSPENDED';

CREATE TYPE "EntityStatus_new" AS ENUM ('ACTIVE', 'ARCHIVED', 'BANNED');
ALTER TABLE "Entity" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Entity"
  ALTER COLUMN "status" TYPE "EntityStatus_new"
  USING ("status"::text::"EntityStatus_new");
ALTER TYPE "EntityStatus" RENAME TO "EntityStatus_old";
ALTER TYPE "EntityStatus_new" RENAME TO "EntityStatus";
DROP TYPE "EntityStatus_old";
ALTER TABLE "Entity" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new"
  USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

ALTER TABLE "OrganizationRequest" DROP CONSTRAINT IF EXISTS "OrganizationRequest_reviewedById_fkey";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_invitedById_fkey";

ALTER TABLE "Entity"
  DROP COLUMN IF EXISTS "learnerQuota",
  DROP COLUMN IF EXISTS "subscribedUntil",
  DROP COLUMN IF EXISTS "tier",
  DROP COLUMN IF EXISTS "trialEndsAt";

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "invitedById",
  DROP COLUMN IF EXISTS "mustChangePassword";

DROP TABLE IF EXISTS "OrganizationRequest";

DROP TYPE IF EXISTS "EntityTier";
DROP TYPE IF EXISTS "OrgRequestStatus";
DROP TYPE IF EXISTS "OrgRequestType";

COMMIT;
