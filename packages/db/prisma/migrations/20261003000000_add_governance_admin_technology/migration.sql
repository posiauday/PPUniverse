-- MVP-033 slice B (docs/final-decisions.md, "Governance & admin area and the
-- Updates badge"): Governance & admin becomes an area an article can belong
-- to. In its own migration: Postgres does not allow a newly added enum value
-- to be used in the same transaction that adds it (same reason as
-- 20260930100000_add_kpi_guide_article_type).
--
-- Purely additive. Rollback: no article may use GOVERNANCE_ADMIN first
-- (UPDATE "articles" SET "technology" = NULL, "topic" = NULL WHERE
-- "technology" = 'GOVERNANCE_ADMIN'); Postgres then needs a type rebuild to
-- drop the value, so the approved rollback is to leave the unused value in
-- place.

-- AlterEnum
ALTER TYPE "Technology" ADD VALUE 'GOVERNANCE_ADMIN';
