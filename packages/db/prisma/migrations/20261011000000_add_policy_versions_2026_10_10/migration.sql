-- MVP-040 (docs/final-decisions.md, 2026-10-07, "Comments wording, admin
-- panel, speed check and the Learn module", decision 1): the Terms gain
-- "Comments" and the Privacy notice "Comments and your profile", in the
-- wording the product owner approved. Both get a new version and effective
-- date, as each document promises. Text: apps/web/lib/legal/pages.ts.
--
-- Additive and reversible, the same pattern as
-- 20261009000000_add_policy_versions_2026_10_09. Rollback (only if no
-- ConsentRecord references these rows yet):
--   DELETE FROM "policy_versions" WHERE "id" IN ('policy-tos-2026-10-10', 'policy-privacy-2026-10-10');

INSERT INTO "policy_versions" ("id", "documentType", "version", "effectiveAt", "createdAt") VALUES
  ('policy-tos-2026-10-10', 'TERMS_OF_SERVICE', '2026-10-10', GREATEST(TIMESTAMP '2026-10-10 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
  ('policy-privacy-2026-10-10', 'PRIVACY_POLICY', '2026-10-10', GREATEST(TIMESTAMP '2026-10-10 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);
