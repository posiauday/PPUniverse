-- MVP-039 and MVP-038 (docs/final-decisions.md, 2026-10-07, "Votes and
-- reports"): "Did this fix it?" votes and "Something here changed?" reports.
-- Additive only: two new tables, nothing existing changes. Neither stores
-- anything about the visitor. RLS on, with no policies, like every table.
--
-- Rollback:
--   DROP TABLE "article_reports";
--   DROP TABLE "article_votes";

CREATE TABLE "article_votes" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "article_reports" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "article_votes_articleId_helpful_idx" ON "article_votes"("articleId", "helpful");

CREATE INDEX "article_reports_createdAt_idx" ON "article_reports"("createdAt");

ALTER TABLE "article_votes" ADD CONSTRAINT "article_votes_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "article_reports" ADD CONSTRAINT "article_reports_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "article_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "article_reports" ENABLE ROW LEVEL SECURITY;
