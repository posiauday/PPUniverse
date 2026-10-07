-- MVP-040 (docs/final-decisions.md, 2026-10-07, "Top bar names, AI search
-- readiness, and comments"): comments on guides, and each reader's public
-- profile (a display name and a generated avatar). Comments show at once; an
-- admin removes them after reports. The feature stays off (FEATURE_COMMENTS)
-- until the product owner approves the Terms and Privacy wording.
--
-- Additive only: three nullable user columns and two new tables. RLS on, with
-- no policies, like every table.
--
-- Rollback (only if no comments are worth keeping):
--   DROP TABLE "comment_reports";
--   DROP TABLE "article_comments";
--   DROP INDEX "users_displayNameKey_key";
--   ALTER TABLE "users" DROP COLUMN "avatarSeed", DROP COLUMN "displayNameKey", DROP COLUMN "displayName";

ALTER TABLE "users" ADD COLUMN "displayName" TEXT,
ADD COLUMN "displayNameKey" TEXT,
ADD COLUMN "avatarSeed" TEXT;

CREATE UNIQUE INDEX "users_displayNameKey_key" ON "users"("displayNameKey");

CREATE TABLE "article_comments" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_reports" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_comments_articleId_createdAt_idx" ON "article_comments"("articleId", "createdAt");

CREATE INDEX "article_comments_userId_createdAt_idx" ON "article_comments"("userId", "createdAt");

CREATE INDEX "comment_reports_commentId_idx" ON "comment_reports"("commentId");

ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "article_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "article_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comment_reports" ENABLE ROW LEVEL SECURITY;
