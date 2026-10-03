-- MVP-033 slice D (docs/final-decisions.md, "Governance & admin area and the
-- Updates badge": "The Privacy notice must say so in the same change that
-- ships the badge"): the Privacy notice gains a "Stored in your browser"
-- section for the Updates badge's last-visit date (kept in local storage
-- only), so it gets a new version and effective date, as the notice itself
-- promises. The Terms of use are unchanged. Text: apps/web/lib/legal/pages.ts.
--
-- Additive and reversible, the same pattern as
-- 20261002000000_add_policy_versions_2026_10_02 (see its header for why
-- effectiveAt is GREATEST(date, now)). Rollback (only if no ConsentRecord
-- references this row yet):
--   DELETE FROM "policy_versions" WHERE "id" = 'policy-privacy-2026-10-03';

INSERT INTO "policy_versions" ("id", "documentType", "version", "effectiveAt", "createdAt") VALUES
  ('policy-privacy-2026-10-03', 'PRIVACY_POLICY', '2026-10-03', GREATEST(TIMESTAMP '2026-10-03 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);
