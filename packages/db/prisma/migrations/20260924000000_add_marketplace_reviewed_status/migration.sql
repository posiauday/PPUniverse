-- TD-008 (docs/final-decisions.md, 2026-09-21 "Product-owner responses to
-- MVP-005 open items" section B). Adds the approved MARKETPLACE_REVIEWED
-- status. In its own migration: Postgres does not allow a newly added enum
-- value to be referenced in the same transaction that adds it, so the
-- reviewedAt column and its CHECK constraint (which references this value)
-- are a separate migration (20260924010000).
--
-- Purely additive. No existing value is removed or renamed. TESTED and
-- NOT_VERIFIED are untouched, reserved and legacy respectively -- neither is
-- assignable going forward, but neither is dropped (Postgres cannot drop an
-- enum value without a table rebuild, and no destructive change was
-- approved regardless).

-- AlterEnum
ALTER TYPE "CompatibilityEvidenceStatus" ADD VALUE 'MARKETPLACE_REVIEWED';
