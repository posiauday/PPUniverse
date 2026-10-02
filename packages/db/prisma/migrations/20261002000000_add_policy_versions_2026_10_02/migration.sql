-- MVP-032 (docs/final-decisions.md, "About, Privacy and Terms pages",
-- 2026-10-02): the first real versions of the Terms of use and the Privacy
-- notice, published at /terms and /privacy. The text lives in
-- apps/web/lib/legal/pages.ts; this row is metadata only, as before.
--
-- Additive and reversible. The placeholder rows from
-- 20260922030000_seed_policy_versions stay: consent records may already
-- reference them, and those FKs are Restrict by design. Terms acceptance
-- picks the latest effectiveAt, so new acceptances reference these rows.
--
-- effectiveAt is GREATEST(2026-10-02, now): the placeholder rows were stamped
-- with the time their own migration ran, so on a database first migrated
-- after 2026-10-02 a fixed date would leave a placeholder as the latest
-- version. Each migration runs in its own transaction, after the previous
-- one, so now() here is always later than the placeholders'. The version
-- string carries the published effective date.
--
-- Rollback (only if no ConsentRecord references these rows yet):
--   DELETE FROM "policy_versions"
--   WHERE "id" IN ('policy-tos-2026-10-02', 'policy-privacy-2026-10-02');

INSERT INTO "policy_versions" ("id", "documentType", "version", "effectiveAt", "createdAt") VALUES
  ('policy-tos-2026-10-02', 'TERMS_OF_SERVICE', '2026-10-02', GREATEST(TIMESTAMP '2026-10-02 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
  ('policy-privacy-2026-10-02', 'PRIVACY_POLICY', '2026-10-02', GREATEST(TIMESTAMP '2026-10-02 00:00:00', CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);
