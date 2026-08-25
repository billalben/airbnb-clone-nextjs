-- Create Role enum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- Add role column to User with default USER
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';

-- Drop existing foreign keys (we will recreate them with ON DELETE CASCADE)
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_homeId_fkey";
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_userId_fkey";
ALTER TABLE "Reservation" DROP CONSTRAINT IF EXISTS "Reservation_homeId_fkey";
ALTER TABLE "Reservation" DROP CONSTRAINT IF EXISTS "Reservation_userId_fkey";
ALTER TABLE "Home" DROP CONSTRAINT IF EXISTS "Home_userId_fkey";

-- Recreate foreign keys with ON DELETE CASCADE
ALTER TABLE "Favorite"
  ADD CONSTRAINT "Favorite_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite"
  ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Home"
  ADD CONSTRAINT "Home_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create HomeImage table
CREATE TABLE "HomeImage" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomeImage_pkey" PRIMARY KEY ("id")
);

-- Index on homeId for fast lookup
CREATE INDEX "HomeImage_homeId_idx" ON "HomeImage"("homeId");

-- Foreign key with cascade delete
ALTER TABLE "HomeImage"
  ADD CONSTRAINT "HomeImage_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: move existing Home.photo into HomeImage as primary
INSERT INTO "HomeImage" ("id", "homeId", "path", "isPrimary", "position", "createdAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "photo",
    true,
    0,
    CURRENT_TIMESTAMP
FROM "Home"
WHERE "photo" IS NOT NULL;

-- Drop legacy photo column
ALTER TABLE "Home" DROP COLUMN "photo";
