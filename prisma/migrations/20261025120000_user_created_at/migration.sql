-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing hosts from their earliest listing where possible.
UPDATE "User" u
SET "createdAt" = COALESCE(
  (SELECT MIN(h."createdAT") FROM "Home" h WHERE h."userId" = u."id"),
  u."createdAt"
);
