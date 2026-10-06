-- MVP-036 (docs/final-decisions.md, 2026-10-06, "Email and password sign-in:
-- rules"): the Privacy notice gains email and password sign-in (passwords
-- stored only as salted hashes, the Have I Been Pwned check, failed-attempt
-- counts and password links), so it gets a new version and effective date, as
-- the notice itself promises. The Terms of use are unchanged. Text:
-- apps/web/lib/legal/pages.ts.
--
-- Additive and reversible, the same pattern as
-- 20261006000000_add_privacy_policy_version_2026_10_06 (see
-- 20261002000000_add_policy_versions_2026_10_02 for why effectiveAt is
-- GREATEST(date, now)). Rollback (only if no ConsentRecord references this row
-- yet):
--   DELETE FROM "policy_versions" WHERE "id" = 'policy-privacy-2026-10-07';

INSERT INTO "policy_versions" ("id", "documentType", "version", "effectiveAt", "createdAt") VALUES
  ('policy-privacy-2026-10-07', 'PRIVACY_POLICY', '2026-10-07', GREATEST(TIMESTAMP '2026-10-07 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);
