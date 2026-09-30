-- MVP-028 (docs/final-decisions.md, "Technology sections (MVP-028)"): the
-- KPI_GUIDE article type, which feeds each technology section's KPIs tab.
-- In its own migration: Postgres does not allow a newly added enum value to
-- be used in the same transaction that adds it (same reason as
-- 20260924000000_add_marketplace_reviewed_status).
--
-- Purely additive. Rollback: no article may use KPI_GUIDE first; Postgres
-- then needs a type rebuild to drop the value, so the approved rollback is to
-- leave the unused value in place.

-- AlterEnum
ALTER TYPE "ArticleType" ADD VALUE 'KPI_GUIDE';
