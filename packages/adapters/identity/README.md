# @ppu/adapter-identity

`PrismaSessionRepository` — the Prisma-backed implementation of `@ppu/domain-identity`'s `SessionRepository` port (MVP-002). Auth.js itself (magic-link sign-in, database sessions) is configured directly in `apps/web/lib/auth.ts`, not here — this package is specifically the session-management repository that `apps/web`'s `/api/me/sessions*` routes use for listing and revoking sessions.
