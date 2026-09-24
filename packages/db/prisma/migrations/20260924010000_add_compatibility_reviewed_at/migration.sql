-- TD-008 (docs/final-decisions.md, 2026-09-21 "Product-owner responses to
-- MVP-005 open items" section B). Adds the nullable reviewedAt timestamp:
-- null for every status except MARKETPLACE_REVIEWED, set only by the
-- trusted server-side moderation workflow (not built yet -- MVP-013), never
-- accepted from a client. Purely additive: no existing column is altered,
-- no existing row exists to backfill (verified empty on every environment
-- reachable at MVP-005 -- see planning/tech-debt/TD-008.md section 5), so
-- no data migration runs here.

-- AlterTable
ALTER TABLE "compatibility_records" ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- The two must never drift apart: a MARKETPLACE_REVIEWED row always has a
-- reviewedAt, and no other status ever does.
ALTER TABLE "compatibility_records" ADD CONSTRAINT "compatibility_records_reviewed_at_check" CHECK (("evidenceStatus" = 'MARKETPLACE_REVIEWED') = ("reviewedAt" IS NOT NULL));
