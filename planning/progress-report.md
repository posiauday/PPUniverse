# Progress Report

One section per completed story, newest last. Do not overwrite prior entries — append.

## MVP-001 — Repository and CI Baseline

### Story completed
**MVP-001 — Repository and CI Baseline** (Epic: Foundation, Requirement: NFR-007, Priority: P0, Sprint 1, 5 pts)

Acceptance criteria, all met:
- [x] Build runs successfully
- [x] Lint runs successfully
- [x] Type checking runs successfully
- [x] Unit testing framework configured
- [x] GitHub Actions CI pipeline created
- [x] Repository structure aligns with TRD
- [x] Documentation updated

### Files changed

**Root tooling**
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `pnpm-lock.yaml`

**CI**
- `.github/workflows/ci.yml` — format-check, lint, typecheck, test, build, dependency audit (non-blocking), secret scan (gitleaks, blocking)

**apps/web** (Next.js 16 / TypeScript / React 19, real working app shell)
- `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`
- `app/layout.tsx`, `app/page.tsx`
- `lib/build-info.ts` + `lib/build-info.test.ts`

**apps/worker** (Node/TypeScript, real working process shell)
- `package.json`, `tsconfig.json`, `src/index.ts` + `src/index.test.ts`

**packages/shared** (real working package — API error envelope + pagination helper, per `docs/07-api-contracts.md`)
- `package.json`, `tsconfig.json`, `src/error-envelope.ts`, `src/pagination.ts`, `src/index.ts`, `src/index.test.ts`

**Structural placeholders** (folder + `README.md` naming purpose and owning future story; no code, per TRD's domain/adapter list — see `docs/13-implementation-readiness-plan.md` §1, §3)
- `packages/config`, `packages/telemetry`, `packages/ui`, `packages/db`
- `packages/domain/{identity,catalog,content,commerce,entitlements,creator,moderation,reviews,search,notifications,analytics,administration}` (12)
- `packages/adapters/{identity,payments,storage,scanning,search,email,error-monitoring}` (7)

**Documentation**
- `CLAUDE.md` — Commands section filled in with real commands and prerequisites; story-completion protocol's bug-record line clarified
- `README.md` — added Development and Repository structure sections

**Planning/tracking**
- `planning/backlog.csv` — MVP-001 → Done; MVP-002, MVP-003, MVP-006, MVP-022 → Ready
- `planning/status.md` — board, metrics, and remaining-work summary recalculated; MVP-001 moved to Completed
- `planning/requirement-traceability.csv` — NFR-007 row updated (added MVP-001 to Backlog, status set to partially implemented)
- `planning/bugs/README.md` (new) — established `BUG-XXX.md` record location

`planning/mvp-backlog.csv` was **not** modified — see "Note on planning/mvp-backlog.csv vs. planning/backlog.csv" below.

### Commands executed

All run from the repo root after `pnpm install`:

| Command | Result |
|---|---|
| `pnpm typecheck` | Pass (3/3 packages) |
| `pnpm lint` | Pass (3/3 packages) |
| `pnpm test` | Pass — 7 tests across 3 test files (`apps/web`, `apps/worker`, `packages/shared`) |
| `pnpm build` | Pass (3/3 packages; `apps/web` statically generated `/` and `/_not-found`) |
| `pnpm format:check` | Pass (source code scope) |
| `pnpm audit --audit-level=high` | Pass — no known vulnerabilities |

Environment setup performed as part of this story: enabled pnpm via `npm install -g pnpm` (corepack's own activation hit a Windows permissions error writing to `Program Files`; the npm-global-prefix install path worked and is what CI also uses via `pnpm/action-setup`).

### Issues found and fixed during implementation

Not filed as bugs (caught and fixed before the story was marked Done — see the story-completion protocol in `CLAUDE.md`):

1. **`apps/worker` typecheck failed** — `process`/`console` were unresolved even with `@types/node` installed. Fix: added `"types": ["node"]` explicitly to `apps/worker/tsconfig.json`.
2. **Lint failed repo-wide: "typescript-eslint does not support TS 7.0."** — `pnpm add typescript` resolved to `7.0.2` (the new native/Go-ported compiler), which `typescript-eslint@8.70.0` doesn't yet support. Fix: pinned `typescript` to `6.0.3` (the last classic-compiler line) across the root and all three real packages. Recorded as a risk below since this will need revisiting.
3. **`pnpm format:check` failed on 39 pre-existing documentation files** — Prettier has never run against `docs/`, `planning/`, `prompts/`, `schemas/`, `.claude/`, or the root `CLAUDE.md`/`README.md`. Reformatting approval-gated documents as a side effect of adding a code formatter was out of scope and risked unintended diffs to business documents. Fix: scoped `.prettierignore` to exclude those paths, so the formatter governs source code only.
4. **Stray malformed file** — an earlier shell redirect (`> G:\lint-output.txt`) was misinterpreted and created a garbage filename in the repo root. Deleted before finishing; it was never committed.

### Risks identified

- **TypeScript 7 vs. tooling ecosystem**: `typescript@7.0.2` is now `latest`, but `typescript-eslint` (and likely other TS-AST-based tools) haven't caught up yet. Pinning to `6.0.3` is a deliberate, reversible choice, not a long-term decision — revisit when `typescript-eslint` ships TS 7 support (tracked upstream at `typescript-eslint/typescript-eslint#10940`).
- **Dependency audit is non-blocking in CI**: `pnpm audit` step uses `continue-on-error: true` since there's no real dependency tree yet to triage; this should be revisited (made blocking, or given a documented exception process) once the dependency surface grows with MVP-002+. Logged as [TD-001](tech-debt/TD-001.md).
- **No integration tests or migration validation in CI yet**: correctly out of scope — there is no database or migration content until a story that needs persistence lands (earliest: MVP-002). Flagged so it isn't forgotten once `packages/db` gets its first schema.
- **Branch protection / required status checks are not configured**: that's a GitHub repository *setting*, not something a workflow file can establish, and was already recorded as open question 17 in `docs/open-questions.md`. The CI workflow exists and passes locally in spirit (same commands), but hasn't been verified running on GitHub Actions itself since this session made no push.
- **C: drive on this machine is at 100% capacity** (`df -h` showed `C:/Program Files/Git` and `D:` both fully used); some direct `npm`/`tail` invocations failed with `ENOSPC` because npm's default cache lives on `C:`. Work was routed around it (pnpm's content-addressable store is already configured on `G:`; command output was redirected to `G:` instead of piped through tools that stage on `C:`), so this story wasn't blocked — but it's a real, standing environment risk for this machine worth the user's attention outside this repo.

### Note on planning/mvp-backlog.csv vs. planning/backlog.csv

At MVP-001 completion, `planning/mvp-backlog.csv` had no `Status` column and was treated as an immutable requirements source; status lived only in `planning/backlog.csv`. The follow-up "Project management rules" update resolved this: `planning/mvp-backlog.csv` now has a `Status` column and is canonical, with `planning/backlog.csv` kept as the mirrored sprint/points view. Both files were updated accordingly as part of that policy change.

### Remaining work

24 of 25 stories remain (160 of 165 points). See `planning/status.md` for the full sprint-by-sprint breakdown. Immediate next-unblocked candidates (all depend only on MVP-001, now Done): MVP-002 (Auth), MVP-003 (Catalog), MVP-006 (Files), MVP-022 (Observability).

### Next story recommendation

**MVP-002 — Auth** (Identity epic, FR-004, P0, Sprint 2, 8 pts) — recommended over the other three newly-unblocked stories because the most downstream work depends on it (MVP-007 checkout, MVP-010 free entitlement, MVP-011 creator application, MVP-018 email, MVP-020 consent/deletion all need it directly). **Not implemented in this session** — stopping here per instruction.

## MVP-002 — Account registration and session

### Story status: QA (not Done)
**MVP-002 — Account registration and session** (Epic: Identity, Requirement: FR-004, Priority: P0, Sprint 2, 8 pts)

Acceptance summary: "Verified account can sign in/out and manage sessions." Implemented as passwordless (magic-link) sign-in via Auth.js's Email provider — the same link both creates and verifies a new account and signs in a returning one — database-backed sessions (revocable server-side), and self-service session listing/revocation excluding the current session.

Per the new "Project management rules" Definition-of-Done gate (`CLAUDE.md`), a story stays out of Done until tests pass, docs are updated, traceability is updated, and a security review is completed. Docs, traceability, and the security review are done. **Tests do not fully pass yet**: the `PrismaSessionRepository` integration test suite (`packages/adapters/identity/src/session-repository.integration.test.ts`) has never actually executed — this sandbox has no Docker and no local Postgres, so the suite correctly self-skips (`describe.skipIf(!DATABASE_URL)`) rather than silently claiming success. Everything else described below (schema, constraints, unit tests, build) was independently and directly verified — see "Real verification achieved" below — but the literal integration-test-suite-passing bar hasn't been met, so this story is QA, not Done, until that runs green (CI, once pushed, or locally with Docker).

### Files changed

**Schema/persistence** (packages/db is real for the first time — Identity domain only, per vertical-slice scope)
- `packages/db/prisma/schema/schema.prisma`, `identity.prisma` — `User`, `Account`, `Session`, `VerificationToken` (Auth.js's required shape) plus a `role` enum (`MEMBER` default) for future authorization; UserProfile/Role-table/Organization/Team/ConsentRecord deliberately deferred to the stories that need them
- `packages/db/prisma.config.ts`, `.env.example`, `.env` — Prisma 7 connection config (see "Issues found" below)
- `packages/db/prisma/migrations/20260917000000_init_identity/migration.sql`, `migration_lock.toml`
- `packages/db/src/index.ts` — Prisma client singleton, now driver-adapter-based (`@prisma/adapter-pg`)
- `packages/db/src/index.test.ts`, `vitest.config.ts`

**Domain logic** (`packages/domain/identity`, promoted from placeholder)
- `src/types.ts`, `session-authorization.ts` (+ test) — the one real business rule this story owns: a session can be revoked by its owner, except the current session (that's sign-out)
- `src/session-repository.ts` (+ test) — repository port + in-memory fake

**Adapters** (`packages/adapters/identity`, `packages/adapters/email`, promoted from placeholders)
- `packages/adapters/identity/src/session-repository.ts` — real Prisma-backed repository; `session-repository.integration.test.ts` (DB-gated, see status above)
- `packages/adapters/email/src/email-adapter.ts` (+ test) — minimal `EmailAdapter` interface + `ConsoleEmailAdapter` dev implementation

**apps/web**
- `lib/auth.ts` — Auth.js configuration (Email provider, database sessions, `session.user.id` callback)
- `lib/current-session.ts` — resolves the current DB session id from the session cookie
- `types/next-auth.d.ts` — `Session.user.id` type augmentation
- `app/api/auth/[...nextauth]/route.ts`, `app/api/me/route.ts`, `app/api/me/sessions/route.ts`, `app/api/me/sessions/[id]/route.ts`
- `app/signin/page.tsx`, `app/account/sessions/page.tsx`, `SessionRevokeButton.tsx`, `SignOutButton.tsx`, `app/globals.css` (minimal `sr-only`/focus-visible baseline — full design system stays packages/ui's scope)
- `app/page.tsx` — added a sign-in link
- `.env.example`, `.env`

**Infra**
- `docker-compose.yml` (new) — local Postgres for `docker compose up -d`
- `.github/workflows/ci.yml` — Postgres service container, `prisma migrate deploy` step, dependency-audit step made blocking (was `continue-on-error`, see TD-001)
- `turbo.json` — `typecheck`/`test` now `dependsOn: ["^build"]` (real gap found and fixed, see below)
- `apps/web/next.config.ts` — `serverExternalPackages: ["pg"]`
- `package.json`, `pnpm-workspace.yaml` — `overrides` for two vulnerable transitive deps (TD-002)

**Documentation**
- `docs/07-api-contracts.md` — added the session-management endpoints (`GET /api/me/sessions`, `DELETE /api/me/sessions/{id}`) the original outline didn't spell out
- `docs/adr/004-technology-decision-record.md` — amendment resolving the OIDC-vs-app-owned-registration tension, and recording the real stable versions used (`next-auth@4.24.15`, `prisma@7.10.0`)
- `docs/open-questions.md` — item 16 given concrete evidence (TD-003)
- `README.md`, `CLAUDE.md` — Development/Commands sections updated for the database workflow

**Planning**
- `planning/mvp-backlog.csv`, `planning/backlog.csv` — MVP-002 → QA; requirement-traceability, status.md updated (see their own entries)
- `planning/tech-debt.csv`, `planning/tech-debt/TD-001.md` (resolved), `TD-002.md` (new, resolved), `TD-003.md` (new, open)

### Commands executed

| Command | Result |
|---|---|
| `pnpm typecheck` | Pass (7/7 packages) |
| `pnpm lint` | Pass (7/7 packages) |
| `pnpm test` | Pass — unit tests across 6 packages; `@ppu/adapter-identity`'s integration suite correctly skipped (no `DATABASE_URL`) |
| `pnpm build` | Pass (7/7 packages), verified from a genuinely clean state (all `dist/`, `.next/`, generated client, and `.turbo` caches deleted first) |
| `pnpm format:check` | Pass |
| `pnpm audit --audit-level=high` | Pass — 0 vulnerabilities (2 HIGH findings triaged and fixed, see TD-002) |

Also verified directly against a real PostgreSQL database (see "Real verification achieved").

### Real verification achieved (despite no local Docker/Postgres)

A temporary Supabase project (`ppuniverse-dev`, org `PosiaOrgs`, free tier — required pausing an unrelated existing project, `Posia's Project`, to free a slot; user chose this path explicitly) was used, via the Supabase MCP tools, to get genuine database verification without ever handling a raw database password (a request to set one via `ALTER ROLE` was correctly blocked by the permission classifier and not worked around):
- The exact migration SQL generated offline (`prisma migrate diff --from-empty`) was applied via `apply_migration` and re-inspected via `list_tables` — every table, column, type, default, primary key, and foreign key matches the schema exactly.
- Constraint behavior was verified with real `INSERT`/`DELETE` statements via `execute_sql`: the unique-email constraint correctly rejects a duplicate, and deleting a user correctly cascades to delete their sessions (`ON DELETE CASCADE`).
- `get_advisors` (security) was run: one finding, RLS disabled on all 4 tables — logged as TD-003, not auto-remediated (the tool's own guidance: enabling RLS with no policies would block all access).

### Security review (Definition-of-Done gate item)

Checked against the threats named in `docs/08-security-privacy-compliance.md` that this story's surface touches:
- **Account takeover**: no passwords exist to be stolen, brute-forced, or reused from a breach elsewhere (passwordless email-link only). Verification/sign-in tokens are single-use and short-lived (Auth.js's Email provider default: hashed at rest via the adapter, consumed on first use).
- **Broken object authorization**: every session-scoped endpoint (`GET/DELETE /api/me/sessions*`) re-derives ownership server-side (`decideRevokeSession` checks `targetSession.userId === requestingUserId`) — never trusts a client-supplied owner/role claim. Verified by 5 unit tests covering not-found, not-owner, and is-current-session denial paths.
- **Deny-by-default (NFR-002)**: every route calls `getServerSession(authOptions)` first and returns `401` before touching any repository if unauthenticated.
- **Session revocation is real, not cosmetic**: sign-out and session-revoke both delete the DB `Session` row (database strategy), not just a client cookie — confirmed by the cascade-delete test against real Postgres.
- **New finding, logged not ignored**: RLS disabled on the dev/test database (TD-003) — assessed as low risk for current usage (direct Postgres connection, no anon-key/client-library path) and tied to the still-open hosting decision (open question 5, 16).
- **New finding, logged and fixed**: 2 HIGH dependency-audit findings, both transitive/build-time-only (TD-002) — fixed via override, audit now clean, and the audit step was promoted from non-blocking to blocking as a result.
- **Not yet applicable to this slice**: CSP, rate limiting on auth endpoints, and MFA are named in the security doc but have no dedicated story yet in the approved MVP backlog — noted as a gap below, not silently built ahead of scope.

### Issues found and fixed during implementation

Not filed as bugs (caught and fixed before Done — see `CLAUDE.md`'s bug-vs-shortcut distinction). This story hit real, current ecosystem drift multiple times; each was verified against actual behavior or fetched docs, not assumed from training knowledge:

1. **`typescript-eslint` doesn't support TS 7** — already known from MVP-001; re-pinned `typescript@6.0.3` in the 3 new packages that needed it.
2. **Prisma 7 removed `datasource.url` from schema files** — connection config now lives in `prisma.config.ts` (`defineConfig` + `dotenv`), confirmed via the actual CLI error message and Prisma's docs, not guessed.
3. **`prisma migrate diff --to-schema-datamodel` was renamed to `--to-schema`** — again, the CLI's own error message named the fix.
4. **`new PrismaClient()` with no arguments no longer works in Prisma 7** — a driver adapter (`@prisma/adapter-pg`) is now required; this materially changed `packages/db/src/index.ts`.
5. **Prisma's `prisma-client-js` generator output doesn't bundle cleanly with Turbopack** (`Can't resolve '@prisma/client-runtime-utils'`, a bare specifier the classic generator's compiled output uses internally). Root-caused via Prisma's current docs to the newer `prisma-client` generator, which emits real ESM imports instead. Switched generators and relocated the output into `packages/db/src/generated/` so our own build step compiles it, rather than fighting bundler-external-package matching for a path outside `node_modules`.
6. **`packages/db`'s generated client was gitignored with nothing regenerating it** — worked locally only because a manual `prisma generate` from earlier in the session was still on disk; a genuinely fresh checkout (CI) would have failed at the first `tsc`. Fixed by chaining `prisma generate &&` into `build`/`typecheck`/`test`, and by adding `typecheck`/`test` to `turbo.json`'s `dependsOn: ["^build"]` — then **re-verified from an actually clean state** (deleted every `dist/`, `.next/`, generated client, and `.turbo` cache and re-ran all four commands) rather than trusting the first green run.
7. **Cross-package library consumption**: pointing `main`/`types` at raw `./src/index.ts` (MVP-001's pattern) works for `tsc`/Vitest but not Turbopack bundling a Next.js app. Fixed by compiling these packages to `dist/` with declarations and pointing `main`/`types` there — a real limitation of the MVP-001 pattern that only surfaced once a second app (`apps/web`) actually consumed these packages across a bundler boundary.
8. **`ALTER ROLE` on the Supabase dev database was blocked by the permission classifier** — not worked around; the session proceeded on the fallback plan (MCP-tool-based schema/constraint verification) instead.

### Risks identified

- **Integration test suite unverified in this session** (see status above) — the single biggest open item. Resolves automatically on first CI run once pushed, or locally with Docker.
- **RLS disabled on the dev Supabase project** — TD-003, tied to open questions 5/16.
- **No CSP, auth-endpoint rate limiting, or MFA yet** — named in `docs/08-security-privacy-compliance.md` but not in MVP-002's (or any current) backlog story's acceptance criteria. Flagged so it isn't forgotten, not built ahead of scope.
- **Email delivery is dev-only (console log)** — real delivery is MVP-018's scope; until then, sign-in only "works" for someone who can read server logs (fine for automated tests and local dev, not for a real user).
- **Supabase org is now down to 1 active project slot** (`Posia's Project` paused to make room for `ppuniverse-dev`) — the user knows and chose this; noting it here so it isn't a surprise later. `ppuniverse-dev` should be deleted once its dev/test purpose is done, or once the real hosting decision (open question 5) lands.

### Remaining work to reach Done
1. Run the integration test suite against a real Postgres (CI Postgres service container, first push; or `docker compose up -d` locally) and confirm green.
2. Then flip `planning/mvp-backlog.csv` / `planning/backlog.csv` MVP-002 status from QA to Done.

### Next story recommendation

Unchanged from MVP-001's recommendation in spirit, but MVP-002 is not yet Done, so per the story-completion protocol the next *unblocked* story is still gated on it. Once MVP-002 flips to Done: **MVP-003 (Catalog)** or **MVP-006 (Files)** or **MVP-022 (Observability)** become the candidates depending on priority (all three were already Ready alongside MVP-002, unblocked by MVP-001 alone). Recommend **MVP-006 (Quarantine scan and private storage)** next given it's the largest remaining P0 item (13 pts) and several other P0 stories (MVP-009, MVP-010, MVP-012) depend on it.

## MVP-006 — Quarantine scan and private storage

### Story status: QA (not Done)
**MVP-006 — Quarantine scan and private storage** (Epic: Files, Requirement: FR-007, Priority: P0, Sprint 2, 13 pts)

Acceptance summary: "Unscanned or rejected file cannot be delivered."

**Provenance note**: this story's implementation was found already complete in the working tree at the start of this continuation — built by a separate Claude Code session on this machine that had already ended (file timestamps show ~18 hours of no activity, and `ListAgents` confirmed no other session was reachable). None of the implementation below was written in this session; what follows is this session's independent review, bug-fixing, verification, and tracking-doc catch-up, done with the same rigor as MVP-002 rather than taken on faith. `planning/tech-debt/TD-003.md` had also already been updated externally (by that same prior session) to include the `file_scans` table in its RLS finding — left as-is per instruction, not reverted.

Same Definition-of-Done gate as MVP-002 applies: **tests do not fully pass**. The `PrismaFileScanRepository`, `S3StorageAdapter`, and `ClamavScanAdapter` integration test suites all correctly self-skip (`describe.skipIf`) — no Docker/MinIO/ClamAV/Postgres available in this sandboxed environment to actually exercise them. The prior session had gotten `file_scans`' schema/constraints verified against real Postgres (same shared Supabase dev project as MVP-002 — confirmed independently this session via `list_tables`), but the storage and malware-scan adapters, and the full `completeFileUpload()` pipeline they compose into, have never actually run end-to-end. Docs, traceability, and this security review are done in this session.

### Files reviewed (all pre-existing on disk at session start; not written by this session)

- `packages/domain/files/src/` — `types.ts` (`FileScanRecord`, `FileScanStatus`), `state-machine.ts` (explicit valid-transition table + `assertValidTransition`), `deliverability.ts` (the core `isDeliverable`/`assertDeliverable` gate — CLEAN-only), `upload-policy.ts` (50MB limit, allow-listed MIME types, filename sanitization), `magic-bytes.ts` (binary-signature sniffing for zip/png/jpeg/pdf; text types explicitly marked unverifiable), `file-scan-repository.ts` (port + in-memory fake) — plus a full test file per module
- `packages/adapters/files/src/file-scan-repository.ts` (+ integration test, DB-gated) — Prisma-backed; **re-enforces the state-machine transition check at the repository layer**, not just trusting the caller
- `packages/adapters/storage/src/` — `storage-adapter.ts` (port: `quarantine`/`clean` zone model, signed upload/download URLs, range reads, move, delete), `s3-storage-adapter.ts` (+ integration test, MinIO/S3-gated), `in-memory-storage-adapter.ts` (+ test)
- `packages/adapters/scanning/src/` — `scan-adapter.ts` (port), `clamav-scan-adapter.ts` (+ integration test, ClamAV-gated — raw INSTREAM TCP protocol, no client library), `fake-scan-adapter.ts` (+ test, includes the real EICAR test string for the fake's "infected" path)
- `packages/db/prisma/schema/files.prisma`, `migrations/20260917010000_add_file_scans/`
- `apps/web/app/api/files/uploads/route.ts` (issues quarantine-zone signed upload URL), `apps/web/app/api/files/uploads/complete/route.ts` (triggers the pipeline), `apps/web/app/api/files/[id]/route.ts` (status check, owner-scoped), `apps/web/lib/complete-file-upload.ts` (pipeline orchestration), `apps/web/lib/storage.ts`, `apps/web/lib/scanning.ts` (env-configured adapter wiring)

### Issues found and fixed this session

Not filed as bugs — caught before this story reaches Done, so per `CLAUDE.md`'s bug-vs-shortcut distinction these belong here:

1. **Real concurrency bug in `turbo.json`'s task graph** (actually introduced by this session's own MVP-002 work, not MVP-006's — surfaced now because more packages changed turbo's scheduling): `@ppu/db`'s `build` and `typecheck` scripts each independently chained `prisma generate &&`. Turbo has no ordering relationship between two different tasks (`db:build` pulled in as a prerequisite of `apps/web:typecheck` via `^build`, and `db:typecheck` requested directly) for the *same* package, so both ran concurrently and raced on `mkdir` inside the shared generated-client output directory — reproduced directly: `EEXIST: file already exists, mkdir '...\src\generated\client\models'`. Fixed properly: added a dedicated, cacheable `generate` task to `turbo.json` and made `build`/`typecheck`/`test` depend on it (`dependsOn: ["^build", "generate"]`); removed the chained `prisma generate &&` from `packages/db/package.json`'s scripts. Re-verified from a genuinely clean state (all `dist/`, `.next/`, generated client, and `.turbo` caches deleted) across multiple consecutive runs — no more races.
2. **`docker-compose.yml` and `.github/workflows/ci.yml` didn't actually have MinIO/ClamAV services**, despite `apps/web/lib/storage.ts` and `lib/scanning.ts`'s own comments claiming they did (pointing at both files). Added both: `docker-compose.yml` gained `minio` (using `bitnami/minio` specifically — the plain `minio/minio` image needs a `server /data` command override that GitHub Actions service containers can't express, so the same image now works in both places) and `clamav` services; `.github/workflows/ci.yml` gained matching service containers plus `S3_*`/`CLAMAV_*` env vars, so the previously-DB-gated storage/scan integration tests will actually run on the next CI push instead of silently skipping forever.
3. **Formatting and lint drift**: 12 files hadn't been run through `pnpm format`; fixed. 4 stale `eslint-disable` comments (2 in `email-adapter.ts`, 1 each in `db/index.ts` and `apps/worker/src/index.ts`) were flagged as unused by the current eslint config — removed rather than left as silent warnings.
4. **Verified, not a bug**: `upload-policy.ts`'s `sanitizeFilename` regex renders as `/[ -]/g` in a text viewer but is actually `/[\x00-\x1F]/g` written with raw embedded control bytes rather than escape sequences (confirmed via `xxd`) — correct control-character stripping, just an unusual (and now eslint-disable-commented) way to write it.

### Real verification achieved

- `file_scans` table confirmed present in the shared `ppuniverse-dev` Supabase project (same one used for MVP-002), matching the Prisma schema exactly — columns, `FileScanStatus` enum, FK to `users` — via `list_tables`. This means the prior session had already done the same real-Postgres verification discipline as MVP-002, independently confirmed here rather than taken on faith.
- `get_advisors` (security) re-run: RLS-disabled finding now includes `file_scans` alongside the 4 identity tables — already reflected in the externally-updated `TD-003.md`; this session updated `planning/tech-debt.csv`'s mirror row to match.
- Full workspace `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` / `pnpm format:check` / `pnpm audit --audit-level=high` all pass, verified from a genuinely clean state (12 workspace packages, up from 8 at MVP-002).

### Security review (Definition-of-Done gate item)

Checked against `docs/08-security-privacy-compliance.md` and the "Marketplace uploads are untrusted" delivery rule in `CLAUDE.md`:
- **Fail-closed scanning**: a scan-engine error (`verdict: "error"`) is treated as `REJECTED`, never silently passed through to `CLEAN` (`complete-file-upload.ts` line ~84). Deliberate and correct — an infrastructure failure must never be mistaken for a clean bill of health.
- **Real size re-verification**: the upload-policy check re-runs against `headObject`'s actual reported size after upload, not just the client's pre-upload declaration — a client can't bypass the size limit by declaring a small size and uploading something larger.
- **Declared-vs-detected MIME mismatch rejects**: magic-byte sniffing catches a file whose content doesn't match its declared type (e.g., an executable renamed to `.png`); text types are explicitly, narrowly exempted (no reliable binary signature exists) rather than silently trusted for everything.
- **Two-zone storage model**: nothing is ever public; `quarantine` and `clean` are both private buckets/prefixes, and a file only leaves `quarantine` after an explicit `CLEAN` verdict and `moveObject` call — there is no code path that serves directly from `quarantine`.
- **Authorization**: every endpoint requires a session (`401` otherwise); `POST /uploads/complete`'s ownership check uses the storage-key's user-id prefix (the only ownership signal available before a `FileScan` row exists) rather than trusting a client-supplied user id; `GET /api/files/{id}` returns an identical 404 for "not found" and "not yours" so it doesn't leak which IDs exist to a non-owner.
- **State machine defense-in-depth**: valid transitions are enforced twice — once in `packages/domain/files` (business rule) and again in `packages/adapters/files`'s repository (re-checked against the current DB row immediately before every write) — so a caller bug can't write an invalid state directly to Postgres even if the domain-layer check were bypassed somehow.
- **New finding, logged not ignored**: RLS still disabled on the dev database, now including `file_scans` — TD-003 already covers this; no new tech-debt needed beyond updating the existing record.
- **New finding, logged**: the synchronous in-request scan pipeline (TD-004) — not a security defect per se, but a reliability/DoS-surface concern worth tracking (see below).
- **Not yet applicable to this slice**: virus-definition freshness/update cadence for the ClamAV container, and true delivery authorization (does the requester actually hold an entitlement) are MVP-009's scope, not MVP-006's — this story correctly stops at "is this file clean," not "who gets to download it."

### Risks identified

- **Storage/scan integration test suites unverified in this session** (same root cause as MVP-002: no Docker here). Now resolves automatically on first CI run (MinIO/ClamAV/Postgres service containers all wired in this session) or locally via `docker compose up -d`.
- **TD-004 (new)**: scan pipeline runs synchronously in-request rather than via a durable job queue — see the tech-debt record for the concrete risk (request blocking on large files, no retry on a mid-scan crash).
- **RLS still disabled** on the shared dev Supabase project (TD-003, updated) — unchanged risk assessment from MVP-002.
- **ClamAV virus-definition freshness** is unmanaged in this dev setup (the `clamav/clamav:stable` image updates definitions on its own schedule inside the container; no pinned/audited cadence) — acceptable for dev/CI, would need attention before any production use.

### Remaining work to reach Done
1. Run the storage/scan/DB integration test suites against real infrastructure (CI service containers, wired this session — first push; or `docker compose up -d` locally) and confirm green.
2. Then flip `planning/mvp-backlog.csv` / `planning/backlog.csv` MVP-006 status from QA to Done.

### Next story recommendation

Both MVP-002 and MVP-006 are now implemented and QA, not Done — same reason for both (integration tests never executed in this sandbox, first CI run resolves it). Per the story-completion protocol, "next unblocked story" still means "next story whose *dependencies* are Done" — MVP-001 is the only Done story, so MVP-003 (Catalog) and MVP-022 (Observability) remain the two Ready, not-yet-started candidates. Recommend **MVP-022 (Observability)** next: it's foundational (logs/traces/metrics/correlation IDs), genuinely cross-cutting, and every story implemented so far (MVP-002, MVP-006) has been built without any of it — the gap only grows the longer it's deferred. MVP-003 (Catalog) is an equally reasonable alternative if content/SEO progress is the priority instead.

## 2026-09-17 — Product-owner constitution recorded; RLS implemented; branching model established

Not an MVP-XXX backlog story — a governance/architecture action taken directly on the product owner's instruction, delivered in chat. Recorded here per this document's standing purpose (durable record of what changed and why), separate from the story-completion tracking above.

**What happened**: the product owner issued a binding scope/architecture/process decision set directly in chat ("PROJECT CONSTITUTION (MANDATORY)"). Persisted durably to `docs/final-decisions.md` (new document, positioned above BRD/PRD/TRD/ADRs in `docs/00-document-index.md`'s source-of-truth order) rather than left only in chat history, which would be invisible to any other session (including the separate one that built MVP-006 without coordination — exactly the failure mode this decision set explicitly calls out and asks to be guarded against going forward).

**Scope check**: verified the current backlog (`planning/mvp-backlog.csv`) and PRD contain no stories/requirements violating the constitution's exclusion list (Forums, Courses, Certifications, AI Architect, Tenant Analytics, Agents, Social, Mobile) — `docs/01-brd.md`'s existing out-of-scope list already matched closely. No scope-creep removal was needed.

**Vendor decisions resolved**: `docs/open-questions.md` items 5 (storage portion), 9/15 (malware-scan dev vendor), 18 (error-monitoring/analytics), 19 (email) updated to PARTIALLY/fully RESOLVED with pointers to `docs/final-decisions.md`; `docs/adr/004-technology-decision-record.md` amended with the same. Tailwind/shadcn/OpenAPI/Playwright are confirmed-but-not-yet-installed — deliberately deferred to the next UI/API-heavy story rather than retrofitted onto MVP-002/006's minimal existing surface.

**RLS implemented** (closes `planning/tech-debt/TD-003.md`, resolves open question 16): `packages/db/prisma/migrations/20260917020000_enable_row_level_security/` enables RLS with zero policies on all 5 tables — portable standard PostgreSQL DDL, deliberately not the Supabase-specific `auth.uid()`/PostgREST pattern (the app never uses that path). Verified against the `ppuniverse-dev` Supabase project: applied via `apply_migration`, confirmed the table-owning role's own INSERT/SELECT/DELETE still work unaffected, and `get_advisors` shows the finding dropped from ERROR (`rls_disabled`) to an expected INFO note (`rls_enabled_no_policy`) — the deliberate design, not a gap.

**Branching model established**: created `develop` from `main`'s tip (commit `ab983cc`, containing the MVP-002/006 work already pushed this session) and a feature branch (`docs/product-owner-constitution`) for this change, merged into `develop` and pushed (`develop` now at `24f34c5`). `main` was deliberately left untouched at `ab983cc` — the MVP-002/006 commits already there are not being rewritten, but all work from this point forward uses feature branches merged into `develop`, with promotion to `main` as a separate, deliberate release decision. `.github/workflows/ci.yml`'s push trigger extended to include `develop`. No `gh` CLI is available in this environment, so the feature branch was merged locally with `git merge` rather than via a GitHub PR — flagged to the user rather than done silently, since this is the first real exercise of the new process.

**Not yet done**: `docs/01-brd.md`'s out-of-scope list could be made more precise (explicitly naming "Agents" and "Social Features" as the constitution does) — not urgent since no current scope violates it either way; left as a documentation-polish item rather than an urgent fix. The production-role RLS caveat noted in `docs/final-decisions.md` (a future least-privilege app role would need explicit grants/policies) is intentionally deferred until the hosting decision (open question 5) is made.

## 2026-09-18 — CI debugging: MVP-002 and MVP-006 confirmed Done

The first-ever real GitHub Actions runs (triggered by the previous entries' pushes) all failed. `gh` CLI was not installed or authenticated in this environment initially, which meant the first several fix attempts were educated guesses from public documentation/known-issue research rather than the actual failure log — a real limitation, disclosed to the user rather than presented as certainty. Once the user authenticated `gh` (installed via `winget install --id GitHub.cli`, authenticated by the user running `gh auth login` themselves in their own terminal — the stored credential is machine-wide, not terminal-specific, so this session's `gh` picked it up automatically), every subsequent fix was verified against the real failure log before being applied. Five distinct, real root causes, found and fixed in this order:

1. **`turbo.json` task-graph race condition** (`@ppu/db:build` and `@ppu/db:typecheck` both independently ran `prisma generate`, racing on the shared output directory) — actually a latent MVP-002-session bug, not a CI-specific issue; caught locally before the first push by re-running validation from a clean state. Fixed by giving `generate` its own turbo task with `build`/`typecheck`/`test` depending on it.
2. **`bitnami/minio:latest` image no longer exists on Docker Hub.** First real CI failure: `docker pull bitnami/minio:latest` → "manifest unknown". Root-caused via the Docker Hub API (not guessed): Bitnami moved free/frozen images to a separate `bitnamilegacy/` namespace; confirmed `bitnamilegacy/minio:latest` is a valid, currently-pullable tag and switched to it. (Two defensive changes made *before* getting real logs — `MINIO_BROWSER=off`, worked around a known bitnami console-port bug; `clamdcheck.sh` for ClamAV's health check instead of an `nc`-dependent one — were reasonable given the available research but turned out not to be the actual failure cause. Kept anyway since they're still correct improvements.)
3. **`pnpm/action-setup@v4` version conflict.** Refuses to proceed when both its own `version` input and `package.json`'s `packageManager` field specify a pnpm version. Removed the redundant `version: 12` input; the action now reads `pnpm@12.4.2` from `package.json`.
4. **`prisma.config.ts`'s `env()` helper throws eagerly at config-*load* time**, before Prisma checks whether the invoked command actually needs a database URL — `prisma generate` never does. This is a documented Prisma 7 behavior (confirmed via Prisma's own GitHub issues), not a bug in our code, but our usage of the `env()` helper (instead of reading `process.env` directly) tripped it. Locally this was masked by an untracked, correctly-gitignored `packages/db/.env` placeholder file that `dotenv/config` picked up — CI has no such file. Fixed by reading `process.env["DATABASE_URL"]` directly; verified the fix locally by deleting `.env` and unsetting the variable, reproducing and then resolving the exact CI error.
5. **Turborepo 2.x defaults every task to Strict Environment Variable Mode** — silently stripping all environment variables from a task's process unless explicitly declared in `turbo.json`. `DATABASE_URL` (and the `S3_*`/`CLAMAV_*` vars) were visible to CI's "Apply migrations" step (which calls `prisma migrate deploy` directly via `pnpm --filter @ppu/db exec`, bypassing turbo) but stripped from `pnpm test` (which goes through `turbo run test`) — this is what made the failure so confusing initially, since the same variable worked in one step and not the next within the identical job. Fixed via `globalPassThroughEnv` in `turbo.json` (exact field name confirmed against Turborepo's own config reference before applying, not assumed).

**Result**: CI went fully green on `develop` (run `35304965396`) — Format check, Lint, Typecheck, Apply migrations, **Test (unit + integration)**, Build, Dependency audit, and Secret scan all passed. Critically, this means MVP-002's `PrismaSessionRepository` integration tests and MVP-006's `PrismaFileScanRepository`/`S3StorageAdapter`/`ClamavScanAdapter` integration tests **actually executed against real Postgres/MinIO/ClamAV for the first time** and passed — the single blocking item keeping both stories at QA instead of Done. Both flipped to **Done** in `planning/mvp-backlog.csv`/`planning/backlog.csv`; `planning/requirement-traceability.csv`'s FR-004, FR-007, and NFR-002 rows updated accordingly. This also unblocked MVP-010, MVP-011, MVP-018, and MVP-020 (all depended only on MVP-002 and/or MVP-006).

**Note on `main` vs `develop`**: all of this work (the 2026-09-17 constitution/RLS work and this CI-debugging work) landed on `develop`, not `main`, per the branching model established in the previous entry. `main` still sits at the original MVP-002/006 commit (`ab983cc`) and has not been updated — promoting `develop` to `main` is a separate, deliberate release decision not yet made.

### Next story recommendation
Unchanged from the constitution entry: **MVP-022 (Observability)** or **MVP-003 (Catalog)**, both now genuinely Ready (not just implemented-pending-QA) — see `planning/status.md` for the full rationale, now updated to reflect all six currently-Ready stories (MVP-003, MVP-010, MVP-011, MVP-018, MVP-020, MVP-022).
