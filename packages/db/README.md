# @ppu/db

Prisma schema (multi-file, one file per domain per `docs/adr/004-technology-decision-record.md`), generated client, and hand-written SQL migrations implementing `docs/06-data-model.md`. Schema is added incrementally, one domain at a time, by the story that first needs persistence for that domain (vertical-slice delivery rule in `CLAUDE.md`).

| Schema file       | Domain                                                             | Added by |
| ----------------- | ------------------------------------------------------------------ | -------- |
| `identity.prisma` | Users, accounts, sessions, verification tokens                     | MVP-002  |
| `files.prisma`    | `FileScan` (upload quarantine and scan status)                     | MVP-006  |
| `catalog.prisma`  | Categories, products                                               | MVP-003  |
| `evidence.prisma` | License tiers, releases, support policy, compatibility records     | MVP-005  |

## Conventions

- **Migrations are hand-written SQL** (no shadow database). Compare against `pnpm --filter @ppu/db run migrate:diff` for exact table/index/FK naming, then add what Prisma can't express.
- **CHECK constraints live only in the SQL migration.** Prisma's schema language can't express them and Prisma Migrate doesn't introspect them, so they never show in `migrate diff` — don't remove them thinking they're stray. `evidence.prisma` lists the ones that exist (release year/wave ranges, notes/summary length, "Tested requires evidence", support-channel rule).
- **Every table enables row-level security** (`ENABLE ROW LEVEL SECURITY`, no policies) so it is closed to any non-owner role by default.
- **Reference data seeded by migration** (the six catalog categories, the three license tiers) is permanent. Tests never delete it. No `Product` rows are ever seeded — there is no fabricated marketplace inventory.
- `DATABASE_URL` is read straight from `process.env` in `prisma.config.ts`, not through Prisma's `env()` helper, which throws while loading the config when the variable is unset and would break `prisma generate` in CI. Copy `.env.example` to `.env` for local use.
