-- MVP-051 (docs/final-decisions.md, 2026-10-10, "Comments on component
-- pages"): readers ask questions and help each other on a component's page,
-- with the same rules, reports and moderation as comments on guides. A
-- comment is on a guide or on a component: exactly one of the two is set.
--
-- Additive for existing rows: every comment today has an articleId, so the
-- CHECK holds for all of them. The new column is nullable; RLS is already on
-- for this table, with no policies, like every table.
--
-- Rollback (deletes the comments on components):
--   DELETE FROM "article_comments" WHERE "componentId" IS NOT NULL;
--   ALTER TABLE "article_comments" DROP CONSTRAINT "article_comments_one_target";
--   ALTER TABLE "article_comments" DROP CONSTRAINT "article_comments_componentId_fkey";
--   DROP INDEX "article_comments_componentId_createdAt_idx";
--   ALTER TABLE "article_comments" DROP COLUMN "componentId";
--   ALTER TABLE "article_comments" ALTER COLUMN "articleId" SET NOT NULL;

-- AlterTable
ALTER TABLE "article_comments" ALTER COLUMN "articleId" DROP NOT NULL,
ADD COLUMN     "componentId" TEXT;

-- CreateIndex
CREATE INDEX "article_comments_componentId_createdAt_idx" ON "article_comments"("componentId", "createdAt");

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "library_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One target per comment: a guide or a component.
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_one_target" CHECK (num_nonnulls("articleId", "componentId") = 1);
