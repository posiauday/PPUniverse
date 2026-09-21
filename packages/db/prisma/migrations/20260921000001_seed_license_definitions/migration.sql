-- Seeds the three locked license tiers (docs/final-decisions.md 2026-09-18):
-- Personal, Team, Enterprise. Real reference data, explicitly sanctioned as
-- seed data by docs/13-implementation-readiness-plan.md ("categories, tags,
-- license definitions, ..."). Pricing, seat limits and contract terms are
-- NOT modeled or seeded - still open (open question 7). No Product rows
-- and no ProductLicense rows are seeded (no fabricated inventory).

INSERT INTO "license_definitions" ("id", "slug", "name", "description", "sortOrder", "createdAt", "updatedAt") VALUES
  ('lic-personal', 'personal', 'Personal', 'Single user, individual use.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lic-team', 'team', 'Team', 'Small team usage, shared organizational use.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lic-enterprise', 'enterprise', 'Enterprise', 'Organization-wide use, custom commercial agreements possible.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
