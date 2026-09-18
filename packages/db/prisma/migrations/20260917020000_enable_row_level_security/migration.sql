-- Row Level Security (docs/final-decisions.md 2026-09-17, closes
-- planning/tech-debt/TD-003.md). Enabled with zero policies defined on
-- every table: standard PostgreSQL default-denies all access to any role
-- without table ownership or BYPASSRLS once RLS is enabled, which is
-- exactly the desired behavior here — the app never grants the
-- anon/authenticated roles (Supabase PostgREST/supabase-js) any legitimate
-- access, since it only ever connects directly as the table-owning role via
-- Prisma. Table owners bypass RLS by default, so the app's own queries are
-- unaffected. Pure standard SQL, no Supabase-specific auth.uid()/PostgREST
-- dependency, so this is portable to any PostgreSQL host.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "file_scans" ENABLE ROW LEVEL SECURITY;
