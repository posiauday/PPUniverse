-- Scheduled publishing for guides and platform updates (MVP-050;
-- docs/final-decisions.md, 2026-10-09). A draft can carry a planned publish
-- time; it stays a draft until the first visit after that time publishes it.
-- Every schedule set, changed or cancelled is recorded, append-only, for the
-- audit log.
--
-- Additive: nothing existing changes, and every new column is nullable. Both
-- new tables have row-level security on with no policies, like every table
-- (docs/final-decisions.md, "RLS implementation note").
-- Rollback (no other table references these):
--   DROP TABLE "update_schedule_events";
--   DROP TABLE "article_schedule_events";
--   DROP TYPE "ScheduleAction";
--   DROP INDEX "update_items_status_scheduledFor_idx";
--   DROP INDEX "articles_status_scheduledFor_idx";
--   ALTER TABLE "update_items" DROP COLUMN "scheduledFor";
--   ALTER TABLE "articles" DROP COLUMN "scheduledFor";


-- CreateEnum
CREATE TYPE "ScheduleAction" AS ENUM ('SCHEDULED', 'CANCELLED');

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "scheduledFor" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "update_items" ADD COLUMN     "scheduledFor" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "article_schedule_events" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "ScheduleAction" NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_schedule_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "update_schedule_events" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "ScheduleAction" NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "update_schedule_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_schedule_events_articleId_createdAt_idx" ON "article_schedule_events"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "article_schedule_events_createdAt_idx" ON "article_schedule_events"("createdAt");

-- CreateIndex
CREATE INDEX "update_schedule_events_updateId_createdAt_idx" ON "update_schedule_events"("updateId", "createdAt");

-- CreateIndex
CREATE INDEX "update_schedule_events_createdAt_idx" ON "update_schedule_events"("createdAt");

-- CreateIndex
CREATE INDEX "articles_status_scheduledFor_idx" ON "articles"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "update_items_status_scheduledFor_idx" ON "update_items"("status", "scheduledFor");

-- AddForeignKey
ALTER TABLE "article_schedule_events" ADD CONSTRAINT "article_schedule_events_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_schedule_events" ADD CONSTRAINT "article_schedule_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_schedule_events" ADD CONSTRAINT "update_schedule_events_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "update_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_schedule_events" ADD CONSTRAINT "update_schedule_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security, with no policies (default deny for any role but the owner).
ALTER TABLE "article_schedule_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "update_schedule_events" ENABLE ROW LEVEL SECURITY;
