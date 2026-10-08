-- MVP-048 (docs/final-decisions.md, 2026-10-08, "Learn: lessons need sign-in;
-- progress saved to the account"): which lessons a signed-in reader marked as
-- done, and when. Deleted with the user or the lesson (Cascade). And the
-- Privacy notice gains "Learn progress" in the approved wording, so it gets a
-- new version and effective date (text: apps/web/lib/legal/pages.ts).
--
-- Additive. Rollback (the policy row only if no ConsentRecord references it):
--   DROP TABLE "lesson_progress";
--   DELETE FROM "policy_versions" WHERE "id" = 'policy-privacy-2026-10-12';

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "learn_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "lesson_progress" ENABLE ROW LEVEL SECURITY;

INSERT INTO "policy_versions" ("id", "documentType", "version", "effectiveAt", "createdAt") VALUES
  ('policy-privacy-2026-10-12', 'PRIVACY_POLICY', '2026-10-12', GREATEST(TIMESTAMP '2026-10-12 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);
