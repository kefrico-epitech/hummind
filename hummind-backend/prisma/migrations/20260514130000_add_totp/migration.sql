-- Flow v2.0 Sprint C.3 — TOTP 2FA support on User
ALTER TABLE "User"
  ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "totpSecret" TEXT;
