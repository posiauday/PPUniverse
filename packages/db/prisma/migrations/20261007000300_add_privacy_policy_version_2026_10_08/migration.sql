-- MVP-039 and MVP-038 (docs/final-decisions.md, 2026-10-07, "Votes and
-- reports"): the Privacy notice gains "Feedback on guides" (what a vote and
-- a "Something here changed?" note store, that notes are deleted once
-- checked, and the hashed per-address counters), so it gets a new version and
-- effective date, as the notice itself promises. The Terms are unchanged.
-- Text: apps/web/lib/legal/pages.ts.
--
-- Additive and reversible, the same pattern as
-- 20261007000100_add_privacy_policy_version_2026_10_07. Rollback (only if no
-- ConsentRecord references this row yet):
--   DELETE FROM "policy_versions" WHERE "id" = 'policy-privacy-2026-10-08';

INSERT INTO "policy_versions" ("id", "documentType", "version", "effectiveAt", "createdAt") VALUES
  ('policy-privacy-2026-10-08', 'PRIVACY_POLICY', '2026-10-08', GREATEST(TIMESTAMP '2026-10-08 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);
