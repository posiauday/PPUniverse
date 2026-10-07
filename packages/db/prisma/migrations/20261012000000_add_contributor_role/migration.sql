-- MVP-047 (docs/final-decisions.md, 2026-10-07, "No personal details on the
-- site; guide text and the admin panel"): a CONTRIBUTOR role, whose abilities
-- are still to be decided (until then exactly a MEMBER's), and an append-only
-- record of every role change an admin makes, for the audit log.
--
-- Additive. Rollback: DROP TABLE "role_change_events"; the enum value can only
-- be removed by recreating the type, after setting any CONTRIBUTOR back to
-- MEMBER:
--   UPDATE "users" SET "role" = 'MEMBER' WHERE "role" = 'CONTRIBUTOR';
--   ALTER TYPE "UserRole" RENAME TO "UserRole_old";
--   CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'ADMIN');
--   ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT,
--     ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole",
--     ALTER COLUMN "role" SET DEFAULT 'MEMBER';
--   DROP TYPE "UserRole_old";

ALTER TYPE "UserRole" ADD VALUE 'CONTRIBUTOR' BEFORE 'ADMIN';

CREATE TABLE "role_change_events" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "fromRole" "UserRole" NOT NULL,
    "toRole" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_change_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "role_change_events_createdAt_idx" ON "role_change_events"("createdAt");

ALTER TABLE "role_change_events" ADD CONSTRAINT "role_change_events_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "role_change_events" ADD CONSTRAINT "role_change_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "role_change_events" ENABLE ROW LEVEL SECURITY;
