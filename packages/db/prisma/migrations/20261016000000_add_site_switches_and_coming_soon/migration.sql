-- Component library: a switch in the admin, and Coming soon (docs/final-decisions.md,
-- 2026-10-09). Site switches the product owner flips in /admin/settings, with an
-- append-only record of every change for the audit log; and a draft component
-- shown as "Coming soon". A switch with no row falls back to its environment
-- variable, so nothing changes until it is first flipped.
--
-- Additive. Rollback (no other table references these):
--   DROP TABLE "site_switch_events";
--   DROP TABLE "site_switches";
--   ALTER TABLE "library_components" DROP COLUMN "comingSoon";

-- AlterTable
ALTER TABLE "library_components" ADD COLUMN     "comingSoon" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "site_switches" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_switches_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "site_switch_events" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_switch_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_switch_events_createdAt_idx" ON "site_switch_events"("createdAt");

-- AddForeignKey
ALTER TABLE "site_switches" ADD CONSTRAINT "site_switches_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_switch_events" ADD CONSTRAINT "site_switch_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

