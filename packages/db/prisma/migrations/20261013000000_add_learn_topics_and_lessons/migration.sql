-- MVP-048 (docs/final-decisions.md, 2026-10-07, "Learn module design:
-- Workspace"; docs/plans/learn-module.md): Learn topics, their lessons, and an
-- append-only record of every publish. Drafts until the product owner
-- publishes; lesson bodies are Markdown, never raw HTML.
--
-- Additive. Rollback (no other table references these):
--   DROP TABLE "learn_publish_events";
--   DROP TABLE "learn_lessons";
--   DROP TABLE "learn_topics";

-- CreateTable
CREATE TABLE "learn_topics" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "technology" "Technology" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learn_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learn_lessons" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "outcomes" TEXT[],
    "body" TEXT NOT NULL,
    "checkedOn" DATE,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learn_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learn_publish_events" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "lessonId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "action" "ArticlePublishAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learn_publish_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learn_topics_slug_key" ON "learn_topics"("slug");

-- CreateIndex
CREATE INDEX "learn_topics_technology_status_sortOrder_idx" ON "learn_topics"("technology", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "learn_lessons_topicId_slug_key" ON "learn_lessons"("topicId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "learn_lessons_topicId_position_key" ON "learn_lessons"("topicId", "position");

-- CreateIndex
CREATE INDEX "learn_publish_events_topicId_createdAt_idx" ON "learn_publish_events"("topicId", "createdAt");

-- AddForeignKey
ALTER TABLE "learn_topics" ADD CONSTRAINT "learn_topics_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learn_lessons" ADD CONSTRAINT "learn_lessons_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "learn_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learn_lessons" ADD CONSTRAINT "learn_lessons_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learn_publish_events" ADD CONSTRAINT "learn_publish_events_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "learn_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learn_publish_events" ADD CONSTRAINT "learn_publish_events_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "learn_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learn_publish_events" ADD CONSTRAINT "learn_publish_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "learn_topics" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "learn_lessons" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "learn_publish_events" ENABLE ROW LEVEL SECURITY;
