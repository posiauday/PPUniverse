-- Seeds the 6 locked MVP taxonomy categories (docs/final-decisions.md
-- 2026-09-18 constitution). This is real, defined reference/taxonomy
-- data, not fabricated marketplace inventory (CLAUDE.md explicitly bars
-- fake product listings) -- no Product rows are seeded here or anywhere
-- in this migration history; the catalog pages correctly render an
-- empty "no products yet" state until the creator/moderation pipeline
-- (MVP-011/012/013/014) writes real ones. Readable, deterministic IDs
-- since this is fixed reference data, not user-generated content.

INSERT INTO "categories" ("id", "slug", "name", "description", "assetType", "createdAt", "updatedAt") VALUES
  ('cat-power-apps-components', 'power-apps-components', 'Power Apps Components', 'Reusable Power Apps components for citizen and professional developers.', 'POWER_APPS_COMPONENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-power-apps-templates', 'power-apps-templates', 'Power Apps Templates', 'Ready-to-customize Power Apps application templates.', 'POWER_APPS_TEMPLATE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-power-automate-templates', 'power-automate-templates', 'Power Automate Templates', 'Automation flow templates for common business processes.', 'POWER_AUTOMATE_TEMPLATE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-power-bi-templates', 'power-bi-templates', 'Power BI Templates', 'Report and dashboard templates for Power BI.', 'POWER_BI_TEMPLATE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-architecture-blueprints', 'architecture-blueprints', 'Architecture Blueprints', 'Enterprise architecture guidance and reference designs.', 'ARCHITECTURE_BLUEPRINT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-governance-assets', 'governance-assets', 'Governance Assets', 'Center-of-excellence and governance policy assets.', 'GOVERNANCE_ASSET', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
