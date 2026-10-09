-- BUG-038: row-level security on the component library and site switch tables.
--
-- Every table has RLS enabled with zero policies (docs/final-decisions.md,
-- "RLS implementation note"; migration 20260917020000_enable_row_level_security).
-- 20261015000000_add_component_library and
-- 20261016000000_add_site_switches_and_coming_soon created these four tables
-- without it. On Supabase that leaves them open to the anon and
-- authenticated roles through the PostgREST API, for anyone holding the
-- project's anon key: reading every component's YAML, including those that
-- need sign-in, and changing components or flipping the site switches.
--
-- The app connects as the tables' owner, which bypasses RLS, so nothing it
-- does changes. Enabling RLS on a table that already has it is a no-op.
-- packages/db/src/row-level-security.test.ts now fails CI for any table
-- created without it.
--
-- Rollback (not advised): ALTER TABLE ... DISABLE ROW LEVEL SECURITY on each.
ALTER TABLE "library_components" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "component_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_switches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_switch_events" ENABLE ROW LEVEL SECURITY;
