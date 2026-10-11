-- P1 data model: numeric capacities, required foreign keys, indexes, and
-- database-level invariants (one primary photo per home, no overlapping
-- reservations). Base SQL generated via `prisma migrate diff`, then finished by
-- hand so columns are cast in place (no data loss) and constraints can be added
-- after cleaning up rows that would violate them.

-- 1) Capacity columns: String? -> Int. Blank / non-numeric values backfill to 1.
ALTER TABLE "Home" ALTER COLUMN "guests" SET DATA TYPE INTEGER
  USING COALESCE(NULLIF(regexp_replace("guests", '\D', '', 'g'), ''), '1')::integer;
ALTER TABLE "Home" ALTER COLUMN "bedrooms" SET DATA TYPE INTEGER
  USING COALESCE(NULLIF(regexp_replace("bedrooms", '\D', '', 'g'), ''), '1')::integer;
ALTER TABLE "Home" ALTER COLUMN "bathrooms" SET DATA TYPE INTEGER
  USING COALESCE(NULLIF(regexp_replace("bathrooms", '\D', '', 'g'), ''), '1')::integer;

ALTER TABLE "Home" ALTER COLUMN "guests" SET NOT NULL;
ALTER TABLE "Home" ALTER COLUMN "bedrooms" SET NOT NULL;
ALTER TABLE "Home" ALTER COLUMN "bathrooms" SET NOT NULL;

-- 2) Remove orphan rows so the foreign keys can become required.
DELETE FROM "Favorite" WHERE "userId" IS NULL OR "homeId" IS NULL;
DELETE FROM "Reservation" WHERE "userId" IS NULL OR "homeId" IS NULL;
DELETE FROM "Home" WHERE "userId" IS NULL;

ALTER TABLE "Home" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Favorite" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Favorite" ALTER COLUMN "homeId" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "homeId" SET NOT NULL;

-- 3) Guarantee at most one primary photo per home: demote any extra primaries
--    (keeping the first by position), then add a partial unique index.
WITH ranked AS (
  SELECT "id",
         ROW_NUMBER() OVER (
           PARTITION BY "homeId"
           ORDER BY "position" ASC, "createdAt" ASC, "id" ASC
         ) AS rn
  FROM "HomeImage"
  WHERE "isPrimary" = true
)
UPDATE "HomeImage" AS hi
SET "isPrimary" = false
FROM ranked
WHERE hi."id" = ranked."id" AND ranked.rn > 1;

CREATE UNIQUE INDEX "HomeImage_homeId_key" ON "HomeImage"("homeId") WHERE ("isPrimary" = true);

-- 4) Query indexes.
CREATE INDEX "Home_createdAT_idx" ON "Home"("createdAT" DESC);
CREATE INDEX "Home_categoryName_idx" ON "Home"("categoryName");
CREATE INDEX "Home_country_idx" ON "Home"("country");
CREATE INDEX "Reservation_homeId_idx" ON "Reservation"("homeId");
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- 5) Reservation overlap guard: an exclusion constraint on (homeId, [start,end))
--    backs the application-level check. btree_gist provides the equality
--    operator for the text "homeId" column.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop overlapping reservations first, greedily keeping the oldest non-
-- conflicting reservation per home so the constraint can be added.
DO $$
DECLARE
  rec RECORD;
  kept text[] := ARRAY[]::text[];
BEGIN
  FOR rec IN
    SELECT "id", "homeId", "startDate", "endDate"
    FROM "Reservation"
    ORDER BY "createdAt" ASC, "id" ASC
  LOOP
    IF EXISTS (
      SELECT 1
      FROM "Reservation" r
      WHERE r."id" = ANY(kept)
        AND r."homeId" = rec."homeId"
        AND r."startDate" < rec."endDate"
        AND r."endDate" > rec."startDate"
    ) THEN
      DELETE FROM "Reservation" WHERE "id" = rec."id";
    ELSE
      kept := kept || rec."id";
    END IF;
  END LOOP;
END $$;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_no_overlap"
  EXCLUDE USING gist ("homeId" WITH =, tsrange("startDate", "endDate", '[)') WITH &&);
