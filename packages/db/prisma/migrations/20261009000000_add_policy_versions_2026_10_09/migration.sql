-- docs/final-decisions.md, 2026-10-07, "No personal details on the site":
-- the Privacy notice and the Terms no longer name the owner or where they
-- live, and the Terms' sign-in sentence now covers Google and passwords. Both
-- get a new version and effective date, as each document promises.
-- Text: apps/web/lib/legal/pages.ts.
--
-- Additive and reversible, the same pattern as
-- 20261007000300_add_privacy_policy_version_2026_10_08. Rollback (only if no
-- ConsentRecord references these rows yet):
--   DELETE FROM "policy_versions" WHERE "id" IN ('policy-tos-2026-10-09', 'policy-privacy-2026-10-09');

INSERT INTO "policy_versions" ("id", "documentType", "version", "effectiveAt", "createdAt") VALUES
  ('policy-tos-2026-10-09', 'TERMS_OF_SERVICE', '2026-10-09', GREATEST(TIMESTAMP '2026-10-09 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
  ('policy-privacy-2026-10-09', 'PRIVACY_POLICY', '2026-10-09', GREATEST(TIMESTAMP '2026-10-09 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);
