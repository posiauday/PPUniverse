-- MVP-053 (docs/final-decisions.md, 2026-10-10, "Team posts start the
-- conversation on components"): an admin can post one pinned team post on a
-- component's page, shown first under the site's name. A team post is a
-- comment whose pinnedAt is set; the application keeps one live team post per
-- component.
--
-- Additive: a nullable column, so every existing comment stays a reader's
-- comment. RLS is already on for this table, with no policies, like every table.
--
-- Rollback (team posts become ordinary comments under the admin's name, so
-- delete them first):
--   DELETE FROM "article_comments" WHERE "pinnedAt" IS NOT NULL;
--   ALTER TABLE "article_comments" DROP COLUMN "pinnedAt";

-- AlterTable
ALTER TABLE "article_comments" ADD COLUMN "pinnedAt" TIMESTAMP(3);
