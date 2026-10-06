-- MVP-033 slice D (docs/final-decisions.md, "Governance & admin area and the
-- Updates badge"; docs/plans/mvp-033-navigation-restructure.md, slice D):
-- platform updates for the /updates page and the header badge, and their
-- append-only publish audit trail, mirroring articles and
-- article_publish_events (20260923000000_add_content).
--
-- Purely additive: new tables and a new type; no existing table is altered,
-- no data migration. Rollback, in order:
--   DROP TABLE "update_publish_events";
--   DROP TABLE "update_items";
--   DROP TYPE "UpdateKind";
--
-- FK onDelete is RESTRICT (not CASCADE) on authorUserId/actorUserId, for the
-- same reason as articles: a user deletion must not destroy the record of who
-- drafted or published an update.

-- CreateEnum
CREATE TYPE "UpdateKind" AS ENUM ('FEATURE', 'LICENSING', 'DEPRECATION', 'RETIREMENT');

-- CreateTable
CREATE TABLE "update_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "technology" "Technology",
    "kind" "UpdateKind" NOT NULL,
    "action" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "effectiveDate" DATE,
    "replacement" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "update_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "update_publish_events" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "ArticlePublishAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "update_publish_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "update_items_slug_key" ON "update_items"("slug");

-- CreateIndex
CREATE INDEX "update_items_status_publishedAt_idx" ON "update_items"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "update_publish_events_updateId_createdAt_idx" ON "update_publish_events"("updateId", "createdAt");

-- AddForeignKey
ALTER TABLE "update_items" ADD CONSTRAINT "update_items_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_publish_events" ADD CONSTRAINT "update_publish_events_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "update_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_publish_events" ADD CONSTRAINT "update_publish_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Row-level security: enabled with zero policies, the same unconditional
-- convention every table in this schema follows (docs/final-decisions.md,
-- 2026-09-17, "RLS is approved and required").
ALTER TABLE "update_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "update_publish_events" ENABLE ROW LEVEL SECURITY;
