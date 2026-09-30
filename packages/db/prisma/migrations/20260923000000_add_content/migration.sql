-- MVP-017, FR-014 (Content: tutorials, patterns, comparison pages via
-- Article; LearningPath/SEORecord deferred). Purely additive: no existing
-- table is altered, no data migration. Fully reversible — DROP TABLE both,
-- in reverse dependency order (article_publish_events, articles), is the
-- rollback.
--
-- FK onDelete is RESTRICT (not CASCADE) on authorUserId/actorUserId — the
-- same audit-trail-adjacent rationale as privacy.prisma/notifications.prisma:
-- a cascade would let a future user-deletion destroy the record of who
-- authored or published content.

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('TUTORIAL', 'PATTERN', 'COMPARISON');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ArticlePublishAction" AS ENUM ('PUBLISHED');

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ArticleType" NOT NULL,
    "body" TEXT NOT NULL,
    "excerpt" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_publish_events" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "ArticlePublishAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_publish_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_type_idx" ON "articles"("type");

-- CreateIndex
CREATE INDEX "article_publish_events_articleId_createdAt_idx" ON "article_publish_events"("articleId", "createdAt");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_publish_events" ADD CONSTRAINT "article_publish_events_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_publish_events" ADD CONSTRAINT "article_publish_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security: enabled with zero policies, the same unconditional
-- convention every table in this schema follows (docs/final-decisions.md,
-- 2026-09-17, "RLS is approved and required").
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "article_publish_events" ENABLE ROW LEVEL SECURITY;
