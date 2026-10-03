-- MVP-033 slice B (docs/final-decisions.md, "Structure boards approved";
-- resolves TD-025): the hub section an article appears in, one of its
-- technology's sections (TECHNOLOGY_TOPICS in @ppu/domain-content, checked by
-- the admin API and the content importer). Nullable: an article with none is
-- shown in its area's first section.
--
-- Additive: a nullable column, then a one-time backfill of the 24 launch
-- guides from the map the hubs used until now (TD-025). The backfill touches
-- only rows whose slug AND technology still match and whose topic is unset,
-- so it is safe on any database and never overwrites an editor's choice.
-- Rollback:
--   ALTER TABLE "articles" DROP COLUMN "topic";
-- The articles table already has row-level security enabled
-- (20260923 content migration); a new column needs no policy change.

-- AlterTable
ALTER TABLE "articles" ADD COLUMN "topic" TEXT;

-- Backfill (launch guides)
UPDATE "articles" AS a
SET "topic" = v.topic
FROM (VALUES
  ('agent-kpis', 'COPILOT_STUDIO', 'monitor-and-cost'),
  ('grounding-an-agent-safely', 'COPILOT_STUDIO', 'knowledge-and-grounding'),
  ('knowledge-sources-compared', 'COPILOT_STUDIO', 'knowledge-and-grounding'),
  ('your-first-agent', 'COPILOT_STUDIO', 'build-your-agent'),
  ('data-quality-kpis', 'DATAVERSE', 'data-quality'),
  ('dataverse-or-sharepoint-lists', 'DATAVERSE', 'choose-dataverse'),
  ('design-your-first-dataverse-schema', 'DATAVERSE', 'tables-and-schema'),
  ('security-roles-business-units-teams', 'DATAVERSE', 'security-model'),
  ('canvas-vs-model-driven-apps', 'POWER_APPS', 'choose-and-plan'),
  ('measuring-power-apps-adoption', 'POWER_APPS', 'adoption-and-usage'),
  ('named-formulas-and-components', 'POWER_APPS', 'formulas-and-components'),
  ('power-apps-delegation-500-rows', 'POWER_APPS', 'data-and-delegation'),
  ('approvals-that-dont-stall', 'POWER_AUTOMATE', 'approvals'),
  ('cloud-flows-or-logic-apps', 'POWER_AUTOMATE', 'choose-the-tool'),
  ('flow-health-kpis', 'POWER_AUTOMATE', 'run-and-monitor'),
  ('try-catch-finally-scopes', 'POWER_AUTOMATE', 'errors-and-limits'),
  ('designing-a-kpi-card', 'POWER_BI', 'reports-and-kpis'),
  ('one-semantic-model-many-reports', 'POWER_BI', 'data-modelling'),
  ('star-schema-from-messy-exports', 'POWER_BI', 'data-modelling'),
  ('why-are-my-totals-wrong', 'POWER_BI', 'dax'),
  ('first-power-pages-site', 'POWER_PAGES', 'build-your-site'),
  ('portal-kpis', 'POWER_PAGES', 'go-live-and-monitor'),
  ('power-pages-or-sharepoint', 'POWER_PAGES', 'choose'),
  ('web-roles-and-table-permissions', 'POWER_PAGES', 'access-and-permissions')
) AS v(slug, technology, topic)
WHERE a."slug" = v.slug
  AND a."technology"::text = v.technology
  AND a."topic" IS NULL;
