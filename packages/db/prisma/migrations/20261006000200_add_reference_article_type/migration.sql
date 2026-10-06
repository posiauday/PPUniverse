-- MVP-038 (docs/final-decisions.md, 2026-10-06, "Hub framing, reference
-- pages, trust signals and community solutions"): a REFERENCE article type
-- for the quick-lookup pages in each hub's Daily reference row (error codes,
-- limits, cheat sheets, checklists). In its own migration: Postgres doesn't
-- allow a new enum value to be used in the transaction that adds it (same
-- reason as 20260930100000_add_kpi_guide_article_type).
--
-- Purely additive. Rollback: no article may use REFERENCE first; Postgres then
-- needs a type rebuild to drop the value, so the approved rollback is to leave
-- the unused value in place.

-- AlterEnum
ALTER TYPE "ArticleType" ADD VALUE 'REFERENCE';
