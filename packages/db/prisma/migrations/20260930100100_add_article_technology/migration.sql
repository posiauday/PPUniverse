-- MVP-028 (docs/final-decisions.md, "Technology sections (MVP-028)"): the six
-- technology sections, and the section an article belongs to (nullable: an
-- article with none is cross-cutting and still appears on /learn).
--
-- Purely additive: a new type, a nullable column, an index. No existing row
-- changes. Rollback, in order:
--   DROP INDEX "articles_technology_status_idx";
--   ALTER TABLE "articles" DROP COLUMN "technology";
--   DROP TYPE "Technology";
-- The articles table already has row-level security enabled
-- (20260923 content migration); a new column needs no policy change.

-- CreateEnum
CREATE TYPE "Technology" AS ENUM ('POWER_APPS', 'POWER_AUTOMATE', 'POWER_BI', 'COPILOT_STUDIO', 'DATAVERSE', 'POWER_PAGES');

-- AlterTable
ALTER TABLE "articles" ADD COLUMN "technology" "Technology";

-- CreateIndex
CREATE INDEX "articles_technology_status_idx" ON "articles"("technology", "status");
