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

## MVP-022 — Observability (operational scope)

### Story status: Done
**MVP-022 — Logs, traces, metrics and alerts** (Epic: Observability, Requirement: NFR-007, Priority: P0, Sprint 2, 8 pts)

Acceptance summary: "Critical journeys have correlation and runbooks."

**Scope confirmation**: before coding, the product owner explicitly confirmed (per the newly-adopted Decision Validation Rule, `CLAUDE.md`) that MVP-022 stays scoped to *operational* observability — structured logging, correlation IDs, request tracing, error monitoring/Sentry, health metrics, alerting foundations, runbook references — and excludes PostHog product-analytics event tracking (FR-016: funnels, conversion, user-behavior analytics), which is deferred to its own future backlog story. `docs/open-questions.md` item 21 updated accordingly.

Unlike MVP-002/MVP-006, this story reaches **Done directly**, not QA: every real external dependency (the Sentry SDK) is legitimately unit-testable via mocking the SDK's own call shape (verified against the actual installed `@sentry/core` type declarations, not guessed — see "Issues found" below), and the one genuinely stateful dependency (`/api/health`'s database check) is also fully covered via a mocked Prisma client. There is no un-exercised real-infrastructure integration gate this time, unlike Postgres/S3/ClamAV in the prior two stories.

### Files changed

**`packages/telemetry`** (promoted from placeholder)
- `src/correlation.ts` — `AsyncLocalStorage`-based correlation-ID context (`runWithCorrelationId`, `getCorrelationId`); reuses an inbound ID rather than always minting a new one, so a request traced by an upstream caller stays traceable end to end
- `src/logger.ts` (+ test) — structured JSON logger (`debug`/`info`/`warn`/`error`), one line per call, auto-attaches the current correlation ID, redacts before serializing
- `src/redact.ts` (+ test) — case-insensitive sensitive-field redaction, extensible per call site without editing the default list

**`packages/adapters/error-monitoring`** (promoted from placeholder)
- `src/error-monitoring-adapter.ts` — port (`captureException`, `captureMessage`)
- `src/console-error-monitoring-adapter.ts` (+ test) — dev/test default, logs via `@ppu/telemetry`
- `src/sentry-error-monitoring-adapter.ts` (+ test, SDK mocked) — real Sentry implementation; `sendDefaultPii: false`, narrow explicit context only (never a raw request/headers object), redacted before being handed to the SDK as a second layer

**`apps/web`**
- `lib/error-monitoring.ts`, `lib/observability.ts` (+ test) — env-configured adapter selection and the `withObservability` route wrapper (correlation-ID propagation, request-start/request-end/request-error structured logs, unhandled-exception capture + 500 envelope)
- `app/api/health/route.ts` (+ test, new) — unauthenticated liveness/readiness check (app + database), deliberately *not* wrapped in `withObservability` (would flood logs at typical poll intervals)
- All 6 existing MVP-002/006 API routes (`/api/me`, `/api/me/sessions`, `/api/me/sessions/[id]`, `/api/files/uploads`, `/api/files/uploads/complete`, `/api/files/[id]`) refactored to use `withObservability` and `getCorrelationId()` instead of each generating its own `randomUUID()` — their actual authorization/business logic is unchanged, verified by their existing test suites still passing unmodified
- `.env.example` — `SENTRY_DSN` (optional; unset falls back to console logging)

**Documentation**
- `docs/12-devops-runbook.md` — new "Observability" section: correlation-ID log-search as the standard incident-triage step, `/api/health`'s shape, alerting-foundations guidance (rules to configure once a real Sentry project exists)
- Fixed 6 stale placeholder READMEs left over from MVP-002/MVP-006 that still said "Structural placeholder only" despite having real code (`packages/adapters/identity`, `storage`, `scanning`, `email`, `packages/domain/identity`), and created 2 that never existed (`packages/adapters/files`, `packages/domain/files`) — an accuracy gap this session should have caught at the time, fixed now

### Commands executed

| Command | Result |
|---|---|
| `pnpm typecheck` | Pass (14 packages, up from 12) |
| `pnpm lint` | Pass |
| `pnpm test` | Pass — 7 new tests in `apps/web` (observability wrapper + health endpoint), 14 in `@ppu/telemetry`, 7 in `@ppu/adapter-error-monitoring` |
| `pnpm build` | Pass, verified from a genuinely clean state; confirms `@sentry/node` bundles cleanly under Turbopack with no `serverExternalPackages` entry needed |
| `pnpm format:check` | Pass |
| `pnpm audit --audit-level=high` | Pass — 0 vulnerabilities |

### Issues found and fixed during implementation

1. **Verified, not guessed**: the Sentry SDK API surface (`captureException(error, {tags, extra})`, `captureMessage(message, {level, tags, extra})`, `init({dsn, environment, sendDefaultPii})`) was checked directly against the installed `@sentry/core`/`@sentry/node` `.d.ts` files before being treated as correct — `CaptureContext = Scope | Partial<ScopeContext> | (...)`, and `ScopeContext` genuinely has `level`/`tags`/`extra` fields. This matters given the session's repeated experience this session of vendor SDK shapes not matching assumptions (Prisma 7, Auth.js, Turborepo).
2. **`apps/web/lib/observability.test.ts`**: `logSpy.mock.calls.map((call) => ...)` needed an explicit `unknown[]` parameter type under strict mode — a one-line fix, not a design issue.

### Security review (Definition-of-Done gate item)

Checked against NFR-006 (log content) and the general "never commit/expose credentials" principle:
- **Redaction verified by test, not assumed**: `redact()`'s default list (password, token, secret, authorization, cookie, session/access/refresh tokens, API keys, DSNs, connection strings) is exercised in `redact.test.ts`, `logger.test.ts`, and both error-monitoring adapters' tests — each asserts a planted sensitive field actually comes out as `[REDACTED]`, not just that the function exists.
- **Sentry PII posture**: `sendDefaultPii: false` set explicitly (not left at the SDK default); the adapter's own interface only ever accepts a small, explicit `ErrorContext` object from callers — nothing in this codebase passes a raw `Request`/headers object into it, so there's no path for a session cookie to reach Sentry through this adapter. Redaction is a second, defense-in-depth layer on top of that narrow interface, not the only thing preventing a leak.
- **`/api/health` doesn't leak internals on failure**: the HTTP response is always the same two-field shape regardless of what actually broke (`{"status":"error","checks":{"database":"error"}}`) — no stack trace, no connection string, no raw error message ever reaches the caller. The full error still reaches `errorMonitoring` server-side, for operators.
- **Correlation IDs are client-suppliable, by design, and that's fine**: `withObservability` reuses an inbound `x-correlation-id` header if present. This is standard distributed-tracing practice (same trust model as `traceparent`/`X-Request-ID` industry-wide) — correlation IDs are never used for authorization or any trust decision anywhere in this codebase, only for log correlation, so a spoofed value can at most make triage slightly more confusing, not cause a security failure. Values are always serialized via `JSON.stringify` on the whole log entry, never string-concatenated, so an adversarial correlation ID can't break a log line's JSON structure or inject fake fields.
- **No change to existing authorization logic**: `withObservability` wraps *around* the 6 existing routes; their 401/400/403/404 decision logic is untouched, confirmed by their pre-existing test suites passing unmodified after the refactor.

### Risks identified
- **No real Sentry DSN provisioned** (`docs/open-questions.md` item 18) — errors currently only reach structured logs, not an external error-monitoring dashboard, until one is set up. The code path is real and tested; only the vendor account is missing.
- **Log volume/retention/shipping is undesigned** — this story produces structured JSON lines on stdout/stderr; *where those lines actually go* in production (a log-aggregation platform, retention period, cost) is an infrastructure decision tied to the still-open hosting choice (`docs/open-questions.md` item 5), not something this story could resolve.
- **Alerting is designed, not provisioned** — `docs/12-devops-runbook.md`'s new alerting-foundations section states what *should* page someone; actually configuring those alert rules requires the Sentry project (and hosting platform) to exist first.

### Remaining work to reach Done
None — this story is Done as of this entry (pending the routine final CI confirmation on push, same as every other story this session).

### Next story recommendation
**MVP-003 (Catalog)** — the strongest remaining candidate: it's Ready, and it unblocks the largest number of downstream P1/P0 stories (MVP-004 search, MVP-005 product detail, MVP-017 content, MVP-021 SEO, MVP-023 accessibility all depend on it). MVP-010/011/018/020 (all Ready, all small-to-medium) remain reasonable to parallelize alongside it.

## MVP-003 — Taxonomy and catalog pages

### Story status: Done
**MVP-003 — Taxonomy and catalog pages** (Epic: Catalog, Requirement: FR-001, Priority: P0, Sprint 2, 8 pts)

Acceptance summary: "Indexable category and product listing pages render."

**Scope discipline applied before coding** (stop-conditions protocol, `CLAUDE.md`'s Decision Validation Rule): a task framing pasted in chat included "Filtering framework" as an MVP-003 acceptance criterion — checked against `planning/mvp-backlog.csv`/`docs/02-prd.md` and found that's explicitly FR-002/MVP-004's requirement, a separate dependent story. Confirmed with the product owner before writing any code: MVP-003 stays at its documented scope (browsing/display only, no filtering). Also found during implementation: `docs/04-information-architecture.md` names `/collections/[slug]` and `/creators/[handle]` routes with no owning backlog story — recorded as `docs/open-questions.md` item 24 rather than built or silently skipped without a trace.

### Files changed

**Schema** (`packages/db/prisma/schema/catalog.prisma`, two new migrations)
- `Category` (locked 6-taxonomy `AssetType` enum, unique slug) and `Product` (`DRAFT`/`PUBLISHED` status, single FK to category — not the full many-to-many `ProductCategory` join table the data model sketches; a reversible, minimal-for-now choice) — RLS enabled with zero policies, matching every other table
- A second migration seeds the 6 locked taxonomy categories as rows (real, defined reference data confirmed against `docs/final-decisions.md` — **not** fabricated product inventory; zero `Product` rows are seeded anywhere)

**`packages/domain/catalog`** (new)
- `types.ts`, `visibility.ts` (+ test) — `isPubliclyVisible`: the one rule this story owns, a `DRAFT` product is never rendered publicly
- `catalog-repository.ts` — port

**`packages/adapters/catalog`** (new)
- `catalog-repository.ts` (+ integration test, DB-gated) — `PrismaCatalogRepository`; published-only filtering happens in the query itself, not as an application-layer afterthought

**`packages/ui`** (promoted from placeholder — its own README already named MVP-003 as owner)
- Tailwind v4 + shadcn/ui conventions written by hand (`cn()`, `class-variance-authority`) since the `shadcn` CLI needs an interactive terminal this environment doesn't have
- `Card`/`Badge` primitives, `CategoryCard`/`ProductCard` composites (+ tests, `@testing-library/react` + jsdom) — plain `<a href>`, not `next/link`, so the package stays framework-portable

**`apps/web`**
- `postcss.config.mjs`, `app/globals.css` (Tailwind v4 `@theme` tokens — light theme only, per `docs/05-ux-design-system.md`)
- `app/categories/[slug]/page.tsx`, `app/products/[slug]/page.tsx` (new, both `generateMetadata` for SEO + `notFound()` handling), `app/page.tsx` rewritten to list categories
- `lib/catalog.ts` — repository wiring

### Commands executed

| Command | Result |
|---|---|
| `pnpm typecheck` | Pass (17 packages, up from 14) |
| `pnpm lint` | Pass |
| `pnpm test` | Pass — new unit tests in `@ppu/domain-catalog`, `@ppu/ui`; `@ppu/adapter-catalog`'s integration suite correctly self-skips (no `DATABASE_URL` locally) |
| `pnpm build` | Pass, verified from a genuinely clean state |
| `pnpm format:check` | Pass |
| `pnpm audit --audit-level=high` | Pass — 0 vulnerabilities |

### Real verification achieved (schema + browser, not just tests passing)

- Both migrations applied to the shared `ppuniverse-dev` Supabase project (same one used for every prior story): confirmed unique-slug rejects a duplicate, `ON DELETE RESTRICT` correctly blocks deleting a category that still has products (both via a real transaction that would have hard-failed if the constraint didn't work), and the 6 seeded categories read back correctly. `get_advisors` confirms RLS enabled (INFO-level, no ERROR) on both new tables.
- **Actually started the dev server and loaded pages in a browser** (`CLAUDE.md`: "For UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete") — this caught a real bug `pnpm build` alone did not: Tailwind v4's automatic content scanner doesn't reach outside `apps/web` by default, so none of `@ppu/ui`'s component classes (`bg-card`, `bg-primary`, `border-border`, ...) were ever compiled into the served CSS, despite the build succeeding and every unit test passing. Fixed with an explicit `@source "../../../packages/ui/src"` directive; re-verified by fetching the compiled CSS directly and confirming the previously-missing classes are now present, then visually confirmed a `ProductCard`-shaped element renders with correct spacing/borders/colors by injecting it into the live page and screenshotting it (homepage/category pages themselves can't be visually loaded end-to-end without a reachable database, the same constraint every DB-touching story this session has had — this is the closest practical substitute).
- Also caught and fixed: the homepage/category/product pages are `async` Server Components that, by Next.js's default, get statically prerendered *at build time* — meaning `next build` itself tried to run a live Prisma query and failed with `ECONNREFUSED` against the placeholder local `DATABASE_URL`. Fixed with `export const dynamic = "force-dynamic"` on all three pages — the semantically correct choice anyway (catalog content changes as products are published; a build-time snapshot would go stale), not just a build workaround.

### Security review (Definition-of-Done gate item)

- **No fake inventory**: zero `Product` rows exist in any migration or seed data — `CLAUDE.md` explicitly bars fabricated marketplace inventory. Only real, locked taxonomy (`Category` rows matching `docs/final-decisions.md`'s constitution) is seeded. Pages correctly render an empty "no products published yet" state.
- **Published-only enforced at the query layer**: `PrismaCatalogRepository.listPublishedProductsByCategory`/`findPublishedProductBySlug` filter `status: "PUBLISHED"` in the Prisma `where` clause itself — a `DRAFT` product is never fetched into memory in the first place, not merely filtered out afterward. Verified by both the integration test (asserting a `DRAFT` sibling is excluded) and the domain-level `isPubliclyVisible` unit tests.
- **No new authenticated surface**: every route in this story is intentionally public/unauthenticated (`GET`, no session check) — matches FR-001 exactly ("Public users can browse ... without authentication"). No write endpoints exist yet (creator/moderation stories own those).
- **RLS**: both new tables enabled with zero policies, verified against real Postgres (advisor INFO-level, not ERROR), consistent with every table so far.
- **No secrets/PII on these pages**: `Category`/`Product` fields are all public-by-design content (name, summary, slug) — nothing here needs `@ppu/telemetry`'s redaction.

### Risks identified
- **Collections/creators pages have no owning story** (`docs/open-questions.md` item 24) — a real gap in the backlog, not something this story could resolve on its own.
- **Product schema is intentionally minimal** (single category FK, no `ProductCategory` many-to-many join table) — reversible, but if a real requirement for multi-category products emerges, that's a schema migration, not a config change.
- **`/api/products`-style JSON endpoints don't exist yet** — these pages query the repository directly from Server Components; if MVP-004 (filtering) or a future client-side interaction needs a JSON API instead, that's new surface, not a reuse of what exists here.

### Remaining work to reach Done
None — Done as of this entry, pending the routine final CI confirmation on push.

### Next story recommendation
**MVP-004 (Search filter sort and zero results)** is the natural next step (directly extends what this story just built, same Catalog epic) — but **MVP-005 (Product detail evidence model)** is an equally strong candidate and arguably higher-value, since it turns this story's deliberately-minimal product stub page into the real thing users need to trust a listing (license, version, compatibility, support evidence). MVP-010/011/018/020 remain Ready and available to parallelize regardless of which is picked.

## MVP-004 — Catalog filtering and search

### Story status: Done
**MVP-004 — Search filter sort and zero results** (Epic: Catalog, Requirement: FR-002, Priority: P0, Sprint 3, 8 pts)

Acceptance summary: "Filters are shareable, accessible and analytically tracked."

**Pre-work verification, per the stop-conditions protocol given this turn**: confirmed MVP-003 Done, CI green on `develop` (3 consecutive successful runs), local `develop` matched `origin/develop` exactly, no open PRs, and — explicitly checked, not assumed — grepped MVP-003's actual code for any filter/sort/search logic and found none (only a README note deferring it here). No overlap to document.

**Two real scope boundaries flagged before coding, not silently resolved**:
1. FR-002's full text lists filter axes for license/compatibility/accessibility-status/free-paid — none of those fields exist yet (MVP-005's evidence model, MVP-007's commerce/pricing). Scoped this story to what the current schema actually supports: keyword search, category filter, sort, pagination. The other axes become available automatically once MVP-005/007 add their fields.
2. The acceptance criteria's "analytically tracked" conflicts with MVP-022's deliberate PostHog/FR-016 deferral (confirmed by the product owner). Resolved via the existing `@ppu/telemetry` structured logger instead (`catalog.search` / `catalog.category_browse` log events) — satisfies "tracked" without contradicting that decision or building new analytics infrastructure ahead of its own story.

### Files changed

**`packages/domain/catalog`**
- `search-params.ts` (+ test) — pure, framework-agnostic query-param parsing/validation (`resolveSortOption`, `normalizeQuery`, `parsePage`, `parsePageSize`, `totalPages`); never throws on malformed input, always falls back to a safe default
- `types.ts` — `SortOption`, `SearchOptions`, `SearchResult`
- `catalog-repository.ts` — port extended with `searchProducts`

**`packages/adapters/catalog`**
- `catalog-repository.ts` — `searchProducts` implemented via real PostgreSQL full-text search (`to_tsvector`/`plainto_tsquery`/`ts_rank`, computed on the fly rather than a persisted column — no migration needed, fine at MVP scale), composed safely with `Prisma.sql`/`Prisma.join` (never string interpolation); `COUNT(*) OVER()` returns the total in the same query as the page of results
- Integration tests (+ 5 new, DB-gated) covering keyword match excludes drafts, zero-results, alphabetical sort, pagination math, and category+query combined

**`packages/ui`**
- `search-form.tsx`, `sort-links.tsx`, `pagination.tsx` (+ tests) — all plain HTML forms/links, no client JavaScript required for the core interactions (progressive enhancement, fully keyboard/screen-reader accessible by default, every state is its own real crawlable URL)

**`apps/web`**
- `app/search/page.tsx` (new — cross-category search, matching the IA's "search results" page inventory entry; `robots: noindex` since it's a utility view over content that's already indexable at its own canonical URL)
- `app/categories/[slug]/page.tsx` — extended with search/sort/pagination/clear-all; canonical always points to the base category URL regardless of active query params (SEO signal consolidation)
- `lib/catalog-url.ts` (+ test) — shared query-string-building helper for sort/pagination links

### Real bug found and fixed: `packages/db`'s eager client construction

Local `pnpm test` failed with `Error: DATABASE_URL is not set` — but thrown from *module import*, before `describe.skipIf(!hasDatabase)` could even run. Root cause: `packages/db/src/index.ts` constructed the real `PrismaClient` eagerly at module-evaluation time (`export const prisma = ... ?? createPrismaClient()`); this was invisible in every prior story because they only ever `import type { PrismaClient }` (erased at compile time, no runtime effect), but `packages/adapters/catalog` needed the `Prisma` *value* (for `Prisma.sql`/`Prisma.join`), and importing any value from `@ppu/db`'s barrel evaluates the whole module, including that eager side effect.

Fixed at the root, not worked around: `packages/db/src/index.ts`'s `prisma` export is now a lazy `Proxy` — the real client is only constructed on first actual property access, not at import time. Verified two ways: `pnpm --filter @ppu/db run test` still passes (confirms the Proxy correctly forwards real property access — `prisma.user`, `prisma.session`, etc. — using the local `.env`'s DATABASE_URL), and `pnpm --filter @ppu/adapter-catalog run test` now correctly skips instead of crashing. This benefits every future package that needs a `@ppu/db` value export, not just this one.

### Commands executed

| Command | Result |
|---|---|
| `pnpm typecheck` | Pass (17 packages) |
| `pnpm lint` | Pass |
| `pnpm test` | Pass — new unit tests in `@ppu/domain-catalog`, `@ppu/ui`, `apps/web`; `@ppu/adapter-catalog`'s integration suite (14 tests, 5 new) correctly self-skips locally |
| `pnpm build` | Pass, verified from a genuinely clean state — `/search` correctly listed dynamic (ƒ), not static |
| `pnpm format:check` | Pass |
| `pnpm audit --audit-level=high` | Pass — 0 vulnerabilities |

### Real verification: dev server loaded in a browser
`/search` reached the real database call correctly (failed only on the expected "no reachable Postgres locally" constraint every DB-touching story has had — confirmed via the actual Next.js error overlay showing the exact `$queryRaw` call site, not a crash earlier in the request). Injected the `SearchForm`/`SortLinks`/`Pagination` components' actual compiled markup+classes into the live page and screenshotted them: search input, primary button, sort links (current one correctly bolded via `aria-current`), clear-all, and pagination all render with correct spacing/colors/borders — no new Tailwind scanning gap (MVP-003's `@source` fix already covers this directory).

### Security review (Definition-of-Done gate item)
- **No new authenticated surface**: `/search` and the extended category page remain fully public/unauthenticated, read-only — matches FR-002 exactly.
- **No injection risk**: search terms and category slugs are always passed as `Prisma.sql`/`Prisma.join` parameters, never string-concatenated into the raw query — verified by reading the actual composed query construction, not just trusting Prisma's reputation.
- **No new PII/secrets on these pages** — same as MVP-003, nothing here needs `@ppu/telemetry`'s redaction beyond what already applies to the log events themselves.
- **Malformed/adversarial query params fail safe**: `search-params.ts`'s parsing never throws — an invalid `page`, `sort`, or absurdly large `pageSize` all fall back to safe defaults (clamped to `MAX_PAGE_SIZE`) rather than erroring the page or allowing an unbounded query.

### Accessibility review (Definition-of-Done gate item, explicitly requested this turn)
- **No client JavaScript required for the core interactions**: search is a real `<form method="GET">`, sort/pagination/clear-all are real `<a href>` links — every interaction works with a keyboard alone and with JS disabled, and is exposed to assistive tech via native semantics rather than custom ARIA widgets standing in for real controls.
- **Search input**: has an associated `<label>` (visually hidden via `.sr-only`, still exposed to screen readers) rather than a bare placeholder-only input.
- **Current sort option**: marked with `aria-current="true"`, not conveyed by color/boldness alone.
- **Result count and zero-results messaging**: `aria-live="polite"` so a screen-reader user is told the result count changed after a search, without needing to re-navigate to discover it.
- **Pagination**: uses `nav aria-label="Pagination"`; the page-count text itself is `aria-live="polite"`; a control that doesn't apply (Previous on page 1, Next on the last page) is omitted entirely rather than rendered disabled-but-focusable or disabled-but-still-announced as a link.
- **Focus/contrast**: inherits the already-established `:focus-visible` outline and color tokens from MVP-003 — no new ad-hoc styling that could regress contrast.
- Not yet covered: this is a manual/spot review, not the automated WCAG gate — that's MVP-023's dedicated scope (axe-core + manual keyboard/screen-reader pass across all core journeys), which this story's controls will be exercised by once built.

### Bugs found
None filed — the `packages/db` eager-construction issue was caught and fixed within this same story before reaching Done, so per `CLAUDE.md`'s bug-vs-shortcut distinction it's documented above, not a `BUG-XXX.md` record.

### Tech debt created
None — the full-text-search-without-a-persisted-tsvector-column approach is a deliberate, reversible MVP-scale choice (fine without a GIN index at current data volumes), not a shortcut that compromises correctness or needs tracking as debt. If catalog size ever demands it, adding an indexed `tsvector` column is a contained, additive migration.

### Remaining work to reach Done
None — Done as of this entry, pending the routine final CI confirmation on push.

### Next story recommendation
**MVP-005 (Product detail evidence model)** — the strongest remaining candidate: it turns MVP-003's deliberately-minimal product stub page into the real thing (license, version, compatibility, support evidence), and unblocks both MVP-007 (Checkout) and MVP-021 (SEO/sitemap). MVP-010, MVP-011, MVP-017, MVP-018, MVP-020, MVP-023 remain Ready and available to parallelize.

## MVP-005 — Product detail evidence model

### Story status: Done
**MVP-005 — Product detail evidence model** (Epic: Catalog, Requirement: FR-003, Priority: P0, Sprint 3, 5 pts)

Acceptance summary: "All required license/version/support/compatibility fields display."

Implemented, verified locally, and confirmed in CI. The story was held in **QA** until CI was green with the database-gated tests confirmed *passed* (not skipped) — the product owner's rule for this story — and only then marked Done.

**CI result (PR #4, run 35623812305)**: both jobs (`Format, lint, typecheck, test, build` and `Secret scan`) passed. Confirmed from the job log rather than the check mark: `catalog-repository.integration.test.ts` reported `✓ (27 tests)` in 1.2s — a pass, not a skip — and the other four DB-gated suites passed too (`clamav-scan-adapter` 2, `file-scan-repository` 3, `s3-storage-adapter` 4, `session-repository` 3). `prisma migrate deploy` applied both new migrations on CI's fresh Postgres. The CI Postgres server log shows nine `Failing row contains (...)` constraint violations — exactly the rows the constraint tests deliberately provoke (wave 3, years 2018 and 2101, blank notes, 501-character notes, Tested without evidence, Tested without a date, blank release version, supported-without-channel) — direct evidence the database CHECK constraints fire on a fresh database, not only on the dev project. The only "skipped" text in the log is pnpm's unrelated "resolution step is skipped".

**Sequence, per the stop-conditions protocol**: pre-work verification and analysis were delivered before any code (branch `feature/mvp-005-product-evidence` from up-to-date `develop`; MVP-004 Done and merged; no overlapping MVP-005 work). Two questions the story could not answer itself (compatibility shape, evidence method) were put to the product owner and work stopped until the answer arrived. The decision was recorded in `docs/final-decisions.md` / `docs/open-questions.md` first, in its own commit, so the repo — not the chat message — is the approval source. Implementation followed.

**Scope boundaries flagged rather than silently decided**
1. FR-003's PRD text lists far more than this story's acceptance criteria (creator, screenshots, demo, price, prerequisites, setup, accessibility statement, changelog, version history, related assets). Delivered exactly the acceptance criteria; FR-003 is recorded **Partially Implemented** and the gap is tracked in TD-007 and open question 26.
2. I had earlier said open question 3 (refunds) would block this story. That was wrong — it is not in the acceptance criteria — and was corrected to the product owner.
3. While starting the story I found FR-002's traceability had been overstated as "Implemented" after MVP-004. Corrected to "Partially Implemented" in a separate, flagged commit, with TD-005 and open question 25.

### Files changed

**Docs / planning**
- `docs/final-decisions.md` — product-owner compatibility model (2026-09-21) recorded first; implementation record appended (engineering choices for review, including the empty-state wording the product owner did not specify)
- `docs/open-questions.md` — item 6 part 1 CLOSED, part 2 partially resolved with an implementation note; items 25 and 26 added
- `docs/06-data-model.md` — pointer to the approved model
- `planning/` — backlog CSVs, status, traceability (FR-003, and the FR-002 correction), `tech-debt/TD-005`–`TD-007` and index, this entry

**`packages/db`**
- `prisma/schema/evidence.prisma` (new) — `LicenseDefinition`, `ProductLicense`, `Release`, `SupportPolicy`, `CompatibilityRecord` and three enums; `catalog.prisma` gains back-relations only
- `prisma/migrations/20260921000000_add_product_evidence` — hand-written; five tables, three enums, indexes/FKs, CHECK constraints, RLS on every table
- `prisma/migrations/20260921000001_seed_license_definitions` — the three locked license tiers as reference data. **No `Product` rows are seeded anywhere.**
- `README.md` — was stale ("no schema yet" since MVP-002); rewritten with the schema-file table and conventions

**`packages/domain/catalog`**
- `compatibility.ts` — the seven platform areas, three evidence states with the approved definitions, release-wave/date formatting, and `validateCompatibilityEntry` (all write-time rules, returns every error at once)
- `support.ts` — support labels; `safeSupportChannelHref` (http/https only, no embedded credentials)
- `text.ts` — `normalizeDisplayText` (whitespace, control, zero-width and bidi-override stripping; deliberately does not HTML-escape — React does)
- `present-evidence.ts` — `presentProductEvidence`: the display model, exact empty-state wording, legend
- `types.ts`, `catalog-repository.ts` (port gains `findPublishedProductDetailBySlug`), `index.ts`, `README.md`; unit tests for all four new modules

**`packages/adapters/catalog`**
- `catalog-repository.ts` — `findPublishedProductDetailBySlug`: PUBLISHED-only in the query; licenses in tier order; newest *published* release as current version; support; compatibility in platform-area order; `lastVerifiedAt` mapped to `YYYY-MM-DD`
- Integration tests: 18 new DB-gated tests (27 in the file) — detail read model, ordering, legacy product with no evidence, unpublished release ignored, DRAFT excluded, unknown slug, and every database constraint (unique per product+area, wave, year floor/ceiling, blank/oversized notes, Tested-requires-evidence, release version rules, support-channel rule, RESTRICT on an in-use license tier). Cleanup never deletes seeded categories or license tiers.

**`packages/ui`**
- `product-evidence.tsx` (+ 18 tests) — License / Version / Support / Compatibility sections; real `<table>` with caption, scoped headers and row headers; keyboard-focusable labelled scroll region; visible status legend; `README.md`, `index.ts`

**`apps/web`**
- `app/products/[slug]/page.tsx` — uses the detail query (shared between metadata and page via `cache()`) and `ProductEvidence`; still `force-dynamic`

### Migration impact
Two additive migrations; no existing table is altered, so existing `Product` rows are untouched and simply show "not provided" states. RLS is enabled (zero policies, the repo standard) on all five new tables. Verified on real Postgres (Supabase project `ppuniverse-dev`): both migrations applied; every constraint exercised with real inserts (all behaved as designed); cascade delete of a product leaves no orphaned evidence rows; Supabase advisors show RLS enabled on all 12 tables (INFO-level only). **Rollback** (rehearsed on the dev database inside a block that raised on purpose so everything rolled back — every drop succeeded, schema verified intact afterwards):

```sql
DROP TABLE "compatibility_records"; DROP TABLE "support_policies"; DROP TABLE "releases";
DROP TABLE "product_licenses"; DROP TABLE "license_definitions";
DROP TYPE "SupportStatus"; DROP TYPE "CompatibilityEvidenceStatus"; DROP TYPE "PlatformArea";
```

No existing table has to change on rollback, so it is safe while no evidence data exists; once real evidence exists it would need a data-export step first.

### Commands executed

| Command | Result |
|---|---|
| `pnpm typecheck` | Pass (31 tasks) |
| `pnpm lint` | Pass (16 tasks) |
| `pnpm test` | Pass (31 tasks) — `@ppu/domain-catalog` 61 tests, `@ppu/ui` 36, `apps/web` 11. All DB-gated suites (including the 27 in `@ppu/adapter-catalog`) self-skip locally because there is no Postgres locally — they were run and passed in CI (see the CI row below) |
| `pnpm build` | Pass (17 tasks) — `/products/[slug]` still listed dynamic (ƒ) |
| `pnpm format:check` | Pass |
| `pnpm audit --audit-level=moderate` | Pass — no known vulnerabilities |
| Real Postgres (Supabase MCP) | Both migrations applied; constraint probes; advisors; rollback rehearsal — all as above |
| CI on PR #4 (`gh run watch`, then job log inspected) | Pass — 27/27 catalog integration tests passed (not skipped) on CI's Postgres; both migrations applied by `prisma migrate deploy`; secret scan passed |

### Real verification (browser, not only tests)
Rendered `ProductEvidence` with obviously-placeholder data on a temporary route (never committed, deleted afterwards; no data was stored anywhere) in the built-in browser:
- **1024px**: no page overflow; full matrix visible without scrolling.
- **375px**: no page overflow; the table scrolls inside its own region (scrolled to its full extent — all columns reachable); the region is focusable and shows a visible focus ring.
- **States**: full, empty (exact wording "Compatibility information has not yet been provided.", no table), and a hostile `javascript:` support channel (zero anchors rendered; shown as text). A `<script>` payload in notes rendered as inert text.
- `apps/web/next-env.d.ts` was flipped by the dev server and restored so it is not committed.

### Security review (Definition-of-Done gate item)
- **No new write surface or authenticated route.** Public, read-only, PUBLISHED-only — enforced in the query itself and covered by a DRAFT-with-evidence test.
- **No injection sinks.** No raw SQL added (Prisma query builder). Repo-wide search found no `dangerouslySetInnerHTML`/`innerHTML`/`eval`; React escapes every creator-supplied string. Verified with a `<script>`/`<img onerror>` payload in unit tests and in the browser.
- **Link safety.** The support channel is a link only if it parses as plain `http(s)` with no embedded credentials; `javascript:`, `data:`, `mailto:`, protocol-relative, control-character-obfuscated and free-text values are shown as text. Links carry `rel="nofollow ugc noopener noreferrer"`.
- **Spoofing.** Control, zero-width and bidirectional-override characters are stripped from creator text before display.
- **Database as second line of defence.** CHECK constraints, unique index and FKs (including RESTRICT on in-use license tiers) reject bad data even if a future code path skips the domain validator; RLS enabled on all new tables.
- **No secrets, no PII, no new env vars** (so no `turbo.json` change was needed).
- **Claims.** No "Microsoft Certified", "Microsoft Approved", "Officially Supported" or "Marketplace Verified" wording exists anywhere; unit and component tests assert this.
- **Known gap (recorded, not hidden): TD-006.** Nothing yet screens notes/evidence summaries for private data (tenant IDs, credentials, test-environment details), nothing calls `validateCompatibilityEntry`, and who may assign "Tested" is undecided. Today nothing can write these rows except direct database access; MVP-012/013 must close it before any product write path exists.

### Accessibility review (Definition-of-Done gate item)
- **Structure**: one `<h2>` per section under the page's `<h1>`; the matrix is a real `<table>` with `<caption>`, `<th scope="col">` headers and the platform area as `<th scope="row">`; the verified date is a `<time datetime>`; the legend is a `<dl>`. Sections are deliberately not named landmarks (headings suffice; avoids landmark noise). Component tests assert all of this through role queries.
- **Never colour alone**: every evidence status is written out as text, all three share one visual style, and unverified reads "Not independently verified". Definitions are visible text; nothing is in a hover-only `title`/tooltip (asserted).
- **Mobile**: horizontal scroll happens inside `role="region"` with an accessible name and `tabindex="0"`, so keyboard users can scroll it; axe's `scrollable-region-focusable` rule passes at 375px.
- **Automated scan**: axe-core 4.10.2 (WCAG 2.0/2.1/2.2 A and AA + best-practice) against the rendered component — **0 violations** in the full state at 1024px, the empty state, and the full state at 375px. At 375px axe listed one "incomplete" colour-contrast item (it cannot sample backgrounds for cells clipped inside the scroll region); the same cells passed at 1024px, and the computed contrast ratios are 18.1:1 (text), 7.5:1 (muted text) and 6.7:1 (muted text on the table header) — all above the 4.5:1 AA minimum.
- **Found and fixed during the browser check**: the support link was visually indistinguishable from body text (Tailwind's reset removes link styling) — now underlined; "Power Automate" and "2025 release wave 2" wrapped needlessly — those columns no longer wrap, and the status/notes columns have minimum widths.
- **Not covered — stated plainly**: no real screen reader (NVDA/VoiceOver/JAWS) pass was run; the synthetic key events available here did not move the scroll region with the arrow keys (arrow-key scrolling of a focused scroll container is native browser behaviour, but it was not exercised); and this was run on a temporary component preview, not on a real product page, because no product rows exist. The systematic manual gate is MVP-023's scope.

### Issues found and fixed during implementation (same story, so not bugs)
- My first test files contained raw invisible characters, including a literal NUL byte (which made ripgrep skip the file as binary). Rebuilt from code points so the tests are readable and greppable.
- A component-test fixture used two identical release-wave values, so a `getByText` correctly failed on the duplicate; assertion corrected to the real count.
- `aria-labelledby` had been put on a `<dl>` (not a valid target for it); removed.
- `pnpm format` re-wrapped my files and also touched line endings on earlier stories' files; those show as modified but have no content diff (`core.autocrlf=true`, index is LF). Only explicit paths are staged.

### Bugs found
None in already-delivered work. (The FR-002 traceability overstatement found at the start was a tracking error, logged as TD-005 with a corrected record, not a defect.)

### Tech debt created
- **TD-006** — write-time evidence rules and private-data screening are not enforced by any write path yet (MVP-012/013).
- **TD-007** — FR-003 items beyond license/version/support/compatibility have no delivering story; no Playwright E2E for the product page.
- TD-005 (created earlier in this story) updated: the license and compatibility filters are now unblocked, pending a backlog decision. No filtering UI was built here, by instruction.

### Risks identified
- **DB-gated tests — resolved.** There is no local Postgres, so the adapter query, ordering assertions and constraint tests were only type-checked locally; they have since passed in CI (see the CI result above). Any future change to them still only gets real coverage in CI.
- **Platform-area ordering relies on Postgres enum declaration order.** A future `ALTER TYPE ... ADD VALUE` appends to the end unless `BEFORE`/`AFTER` is used, which would change the displayed order.
- **`lastVerifiedAt`** relies on Prisma returning a `DATE` as UTC midnight; covered by an integration test, which runs in CI's UTC environment.
- **Wording review.** The empty-state text for license/version/support, the release-wave explanation and the legend heading are this story's own wording (only the compatibility empty state and "Not independently verified" were specified). Flagged in `docs/final-decisions.md` for the product owner.

### Remaining work to reach Done
None — Done. MVP-007 and MVP-021 were promoted to Ready. (Follow-ups are tracked as TD-006 and TD-007, not as remaining work on this story.)

### Next story recommendation
**MVP-021 (metadata, sitemap, canonical, structured data)** — depends only on MVP-005, smallest P0 (3 pts), not gated by an open product decision. **MVP-023** (accessibility gate + the Playwright/axe harness that would close TD-007's E2E half) is the strongest follow-up. MVP-007 (open questions 3, 7, 8) and MVP-011 (open questions 2, 8) are dependency-ready but gated by unanswered product decisions.

## 2026-09-21 — Product-owner responses to MVP-005 open items; MVP-021 pre-work

Branch `feature/mvp-021-seo-metadata` (from `develop` at `f8c8c31`; no open PRs; no overlapping work). **No application code was written.** Committed locally; not yet pushed. MVP-005 remains **Done** — none of this changes its status.

### Decisions recorded (source: direct product-owner instruction, 2026-09-21)
- **A. Wording — approved as written.** The license/version/support empty-state sentences, the release-wave explanation and the legend heading are approved; the wording review is closed.
- **B. Evidence status — Tested is not assignable.** For the current MVP the only assignable statuses are **Creator Declared** (creators) and **Marketplace Reviewed** (moderators; it does not mean tested, certified, guaranteed, Microsoft approved/certified, officially supported or verified compatible). **Tested is reserved**: never assigned by creators or moderators, never inferred, never migrated to, no user-facing badge or filter, not removed destructively. The future Tested program is **deferred, not approved**. Closes open question 6, part 2 for the current MVP.
- **C. Remaining FR-003 items.** Neither MVP-005 nor MVP-021 is expanded. Creator → MVP-011 (ownership only; the public route stays under open question 24). Price → MVP-007 (after the pricing/currency/tax/refund decisions; no offers in structured data before then). Screenshots, demo, prerequisites, setup, accessibility statement, changelog and version history → five **proposed** stories (`planning/proposed-stories.md`), status Proposed — not approved, not Ready, not on the board. Related assets → deferred.
- **MVP-021 authorization:** scope limited to FR-017; `NEXT_PUBLIC_SITE_URL` rules; the structured-data decision; the indexing boundary; pre-work analysis before code.

Recorded in `docs/final-decisions.md` (new dated entry; in the earlier compatibility entry the three status bullets are annotated or struck through, not deleted, per the document's own convention), `docs/open-questions.md` (items 6, 24, 26 updated; 27–31 added), `planning/requirement-traceability.csv` (FR-003), the tech-debt and bug records, and `planning/status.md`.

### Conflicts and gaps flagged, not resolved
1. The merged MVP-005 implements the earlier three-state vocabulary (the DB enum has no `MARKETPLACE_REVIEWED`, the validator accepts `TESTED`, the legend defines Tested). Nothing is user-visible yet because no product data exists. → **TD-008**.
2. "Not Verified" is not addressed by decision B. → open question 28.
3. "Creator Declared" now has two wordings; B's is later and controls when reconciled.
4. B says moderators "change the publication state to Marketplace Reviewed"; recorded as a per-entry evidence status, not `Product.status`. → open question 28.
5. No reviewed date or reviewer display is defined for Marketplace Reviewed. → open question 28.

### Records created or changed
- **New:** `TD-008` (vocabulary reconciliation); `BUG-001` (below); `planning/proposed-stories.md`; `planning/prework/MVP-021-prework-analysis.md`.
- **Updated:** `TD-006` (role rules decided, not yet enforced), `TD-007` (dispositions), `TD-005` unchanged; backlog CSVs (MVP-021 → In Progress); `status.md` (board, 1 open bug, 5 open tech-debt items, proposed-stories section).

### Findings from the investigation (evidence, not assumption)
- **BUG-001 (P3):** a production-build probe with the product/category pages' metadata shape emitted a **relative** canonical and `og:url`, and a `http://localhost:<port>` social-image fallback, because no `metadataBase` is set. `/signin` is a client component (cannot export metadata) and, with `/account`, has no robots directive. Fixed by MVP-021. Caveat recorded: reproduced on a probe route because the real pages need a database.
- **Turborepo** infers `NEXT_PUBLIC_*` into the Next.js build hash (verified with `turbo --dry=json`), so adding `NEXT_PUBLIC_SITE_URL` to `globalPassThroughEnv` carries no stale-cached-build risk.
- **External facts checked against Google's documentation:** Product rich results need `name` plus one of `review`, `aggregateRating` or `offers`; and "Don't mark up content that is not visible to readers of the page". These shaped open question 31 and the decision not to propose `BreadcrumbList`.

### Tracking-data errors found and fixed
While validating the planning CSVs I found three malformed rows that I introduced: the `TD-006` row in `tech-debt.csv` had a stray trailing comma (9 fields), and the `FR-002` and `FR-003` rows in `requirement-traceability.csv` had unquoted commas in the Status cell (8 and 10 fields). All five planning CSVs now parse to consistent field counts. These are tracking-data typos, not product defects, so no bug records; but nothing in CI validates these files, which is why they merged. A small automated CSV check would have caught them (suggested, not created).

### Security-review note to carry forward
The MVP-005 entry states that no `dangerouslySetInnerHTML` exists in the codebase. MVP-021 will add exactly one, in the JSON-LD component, guarded by serialization escaping and an HTML-parser injection test; the MVP-021 security review must say so.

### MVP-021 status
**In Progress.** Pre-work analysis: `planning/prework/MVP-021-prework-analysis.md`. Implementation is waiting on the product owner's answers to open questions 29–31 (or acceptance of the stated defaults) and on how to sequence TD-008 (open question 28).

## 2026-09-21 — Product-owner decisions for MVP-021 recorded; implementation authorized

Source: direct product-owner instruction, 2026-09-21 (this message is the approval; earlier recommendations and handoff text are not). Recorded on the existing `feature/mvp-021-seo-metadata` branch and carried in the MVP-021 pull request — no decision-only branch, no local merge.

**Pre-work confirmations (before any change):** branch is `feature/mvp-021-seo-metadata`; it is based on the latest `develop` (`f8c8c31`, 0 commits behind); `git status` clean (no untracked or staged files; the line-ending-only entries have no content diff); `git log` shows only the local decision commit `672b9c7` above `develop`; `gh pr list` shows 0 open PRs; the branch had not been pushed; a source search found no overlapping MVP-021 code.

### Decisions recorded (`docs/final-decisions.md`, `docs/open-questions.md`)
- **Q29 (closed):** a category with zero PUBLISHED products is `noindex, follow`, excluded from the sitemap, publicly reachable, and not a 404; indexability is derived from current published inventory.
- **Q30 (closed):** parameter-specific canonical policy — base page self-canonical; valid `?page=N` self-canonical (page 1 normalized to base); invalid/zero/negative/non-numeric/out-of-range pages never indexable duplicates; `q`, sort-only, filter and mixed variants `noindex, follow` with the clean base canonical; sitemap lists base category pages only. An **intentional corrective SEO change owned by MVP-021, not a reopening of MVP-004**; MVP-004 search/filter behavior is unchanged. Regression tests required for base, `page=1`, `page=N`, `q`, `sort`, filter, mixed, empty and out-of-range cases.
- **Q31 (closed):** Product JSON-LD ships now, without Offer data, from real PUBLISHED fields only; unavailable properties omitted entirely; price/Offer data must not be added until pricing, currency, tax and checkout are approved and implemented; no rich-result eligibility claim.
- **Q28 (updated) / TD-008:** not folded into MVP-021; a separate small corrective change before MVP-012 permits compatibility-evidence writes. Creator Declared and Marketplace Reviewed are the only assignable statuses; **Not Verified is legacy/reserved and not assignable**; a nullable reviewed-at timestamp is approved (null for Creator Declared; set only by the trusted server-side moderation workflow; never from a client; cleared if a creator materially changes a reviewed claim; never fabricated).

### Interpretations I made within the approved policy (recorded as reversible, not as decisions)
Any query parameter other than a single valid `page` (including `pageSize`, unknown/tracking and repeated parameters) marks a category URL as a variant; the presence of `sort` (any value) is a sort variant; `?page=1` is `index, follow` with the base canonical; an empty category emits a self-canonical; version is expressed as a schema.org `additionalProperty`; JSON-LD is omitted when the site origin is unavailable.

### Findings while recording
- **No central environment-validation module exists** in `apps/web` (each `lib/*.ts` reads its own variables), so the "central environment validation, where applicable" instruction is met by making `apps/web/lib/site-url.ts` the single validation point for `NEXT_PUBLIC_SITE_URL`.
- The moderation entities (`ModerationReview`, `ModerationComment`, `AuditEvent`) are named in `docs/06-data-model.md` but **do not exist in the schema**; TD-008's reviewer-reference proposal therefore points at MVP-013 rather than adding a column now.

### Records changed
`TD-008` rewritten with all nine required sections (schema inconsistency, approved statuses, state transitions, reviewed-timestamp behavior, legacy Not Verified handling, authorization, migration approach, tests, dependency on MVP-012/013) and left **Open**; `tech-debt.csv`, `status.md` updated. MVP-005 remains Done.

## MVP-021 — Metadata, sitemap, canonical, structured data

### Story status: Done
**MVP-021 — Metadata sitemap canonical structured data** (Epic: SEO, Requirement: FR-017, Priority: P0, Sprint 4, 3 pts)

Acceptance summary: "Indexable pages emit valid metadata and sitemap."

Implemented, verified locally (including against real pages and a real Postgres), and confirmed in CI. It was held in **QA** until CI was green with the database-gated tests confirmed *passed* (not skipped) — the product owner's rule — and only then marked Done.

**CI result (PR #5, run 35635150884):** both jobs (`Format, lint, typecheck, test, build` and `Secret scan`) passed. Confirmed from the job log, not the check mark: **458 tests passed, 0 skipped** — `@ppu/web` 196, `@ppu/ui` 56, `@ppu/adapter-catalog` 37 (the DB-gated suite reported as passed, 1.6s), `@ppu/domain-catalog` 61 — and every DB-gated suite ran and passed, including the ClamAV (2) and MinIO (4) suites that can only run in CI. `prisma migrate deploy` applied all migrations. The CI build logged no `seo.site_url_invalid` (validation is lazy), and `/robots.txt` and `/sitemap.xml` appear as dynamic routes. (The CI log stores terminal colour codes as literal `^[[…m` text, so the first attempts to count tests with an ANSI-stripping filter returned nothing; the totals above come from a parser written for that format.)

**Sequence:** pre-work confirmations before any change (branch `feature/mvp-021-seo-metadata`; based on the latest `develop` `f8c8c31`, 0 commits behind; `git status` clean; `git log` reviewed; `gh pr list` 0 open; branch not yet pushed; no overlapping code). Decisions recorded first, in their own commits, on this same branch (`docs/final-decisions.md`, `docs/open-questions.md`, TD-008), then the implementation. The decision record travels in this story's pull request; no decision-only branch was created and nothing was merged locally.

### What was implemented
- **`NEXT_PUBLIC_SITE_URL`** (`apps/web/lib/site-url.ts`, the single validation point — no central env-validation module exists in the app): production requires an absolute `https` origin on a public hostname; `http://localhost` only in development/test; normalized to a bare origin; never inferred or hardcoded; an unknown `NODE_ENV` is treated as production; missing or invalid fails safe. Added to `turbo.json` `globalPassThroughEnv` and `apps/web/.env.example`.
- **Deny-by-default robots:** the root layout is `noindex, nofollow`; the home page, indexable category pages and published product pages opt in. `X-Robots-Tag` on `/api`, `/account`, `/signin`. `robots.txt` blocks only `/api/` and carries an absolute `Sitemap:` line when the origin is valid.
- **Category canonical/indexing policy** (`lib/seo/category-indexing.ts`), exactly as approved (Q29/Q30): base and valid `?page=N` indexable and self-canonical (`page=1` → base); empty, invalid, out-of-range, search, sort, filter and mixed variants `noindex, follow` with the base canonical. An intentional corrective SEO change owned by MVP-021 — MVP-004 search/filter behavior is unchanged (a wiring test asserts the search call is unchanged).
- **Sitemap:** `sitemap.xml` from a new `listSitemapEntries` repository method — PUBLISHED products and categories that currently have at least one PUBLISHED product; no `lastmod`; capped at 50,000. `robots.txt`/`sitemap.xml` are dynamic routes.
- **Structured data:** `WebSite` (home), `CollectionPage` (indexable category base URL), `Product` (published products) from typed builders; unavailable properties omitted; **no Offer data, no rich-result eligibility claim**; the version appears as an `additionalProperty` only when a published release exists.
- **One audited raw-HTML sink:** `packages/ui/src/json-ld.tsx` escapes every `<`, `>`, `&`, U+2028 and U+2029 in the serialized JSON (the approved rule for `<` is the JSON unicode escape, `\u003c`).
- Open Graph and Twitter Card tags on indexable pages; no image (none approved).

### Files changed
**New:** `apps/web/lib/site-url.ts`; `apps/web/lib/category-listing.ts`; `apps/web/lib/seo/{site,canonical,category-indexing,metadata,json-ld,robots,sitemap}.ts`; `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts`; `apps/web/vitest.config.ts`; `packages/ui/src/json-ld.tsx`; tests `site-url.test.ts`, `seo/{canonical,category-indexing,metadata,json-ld,robots,sitemap}.test.ts`, `seo/pages.test.tsx` (wiring), `seo/no-raw-html.test.ts` (guard), `ui/json-ld.test.tsx`; `BUG-002`, `TD-009`, `TD-010`, `planning/prework/MVP-021-prework-analysis.md`.
**Modified:** `apps/web/app/{layout,page}.tsx`, `categories/[slug]/page.tsx`, `products/[slug]/page.tsx`; `apps/web/next.config.ts`; `apps/web/.env.example`; `turbo.json`; `packages/domain/catalog/src/{types,catalog-repository,index}.ts`; `packages/adapters/catalog/src/catalog-repository.ts` and its integration test; `packages/ui/src/index.ts`, `packages/ui/package.json` (dev dependency `@types/react-dom`, needed to type the server-render test) and `pnpm-lock.yaml`; READMEs (root, ui, domain, adapter); `docs/10-seo-content-growth.md`; `docs/final-decisions.md`, `docs/open-questions.md`; planning files.

### Migration impact
None. The sitemap query uses existing columns and indexes (`products.status`, `categories.slug`). Rollback is a code revert.

### Commands executed (final state)
| Command | Result |
|---|---|
| `pnpm format` / `pnpm format:check` | Pass |
| `pnpm lint` | Pass (16 tasks) |
| `pnpm typecheck` | Pass (31 tasks) |
| `pnpm test` **with a real local Postgres attached** | Pass (31 tasks): `apps/web` 196 tests (was 11), `@ppu/ui` 56 (was 36), `@ppu/adapter-catalog` **37 DB-gated tests run and passed** (was 27), `@ppu/domain-catalog` 61, identity 3 and files 3 DB-gated also ran. Only the ClamAV (2) and MinIO (4) integration tests skipped — they need services that exist only in CI |
| `pnpm build` | Pass (17 tasks); `/robots.txt` and `/sitemap.xml` are dynamic routes; no `seo.site_url_invalid` during the build (validation is lazy) |
| `pnpm audit --audit-level=moderate` | Pass — no known vulnerabilities |

**A real database without Docker.** No Postgres exists locally, so DB-gated tests had only ever run in CI. For this story a throwaway real Postgres (`embedded-postgres`, installed in a scratch directory *outside* the repo, data deleted afterwards) let the migrations apply, all DB-gated suites run, and the real pages render against real rows. It is not part of the repository.

### Verification — real pages, real rows (dev server), then a production build
Test rows existed only in the throwaway database (14 PUBLISHED + 1 DRAFT in one category; a draft-only category; empty categories; a published release plus an unpublished one; a hostile product). Requested as a crawler, every scenario matched the approved policy:

| # | Check | Result |
|---|---|---|
| 1 | Home | `index, follow`; absolute canonical and `og:url`; `WebSite` JSON-LD; Twitter `summary`; no `og:image` |
| 2 | Category | base `index, follow` self-canonical + `CollectionPage`; `?page=1` canonical = base; `?page=2` self-canonical, `index, follow` |
| 3 | Empty category | draft-only and no-product categories: HTTP 200 (not 404), `noindex, follow`, canonical = own base, no JSON-LD |
| 4 | Pagination | `page=3` (out of range), `0`, `-1`, `abc` → `noindex, follow`, base canonical |
| 5 | Variants | `q`, `sort=recent`, `sort=alphabetical`, `license`, `pageSize`, `page=2&q` → `noindex, follow`, base canonical, no JSON-LD |
| 6 | Product | `index, follow`, absolute canonical, `Product` JSON-LD; version = newest *published* release (the unpublished `9.9.9-draft` was ignored) |
| 7 | JSON-LD | exactly `@context`, `@type`, `name`, `description`, `url`, `category`, `additionalProperty`; no offers, price, availability, ratings, reviews, seller, brand or image |
| 8 | Sitemap | 19 URLs: home, the 2 categories with PUBLISHED products, 16 published products; excludes both DRAFT products and both empty categories; no query strings; all absolute |
| 9 | robots.txt | `Allow: /`, `Disallow: /api/`, absolute `Sitemap:` line; lists no protected, admin, creator or preview path |
| 10 | Non-indexable | `/search` `noindex, follow`; `/signin` and `/account/sessions` `noindex, nofollow` + header; `/api/*` header; draft and unknown products/categories are HTTP 404 with `noindex`, no canonical, no JSON-LD |
| 11 | Drafts | no DRAFT or unpublished row appears in the sitemap, any JSON-LD, or any page |
| 12 | Page source | canonical and robots tags are in the raw `<head>` for Googlebot, Bingbot, Chrome, curl and an unknown crawler user agent |
| 13 | Claims | no price, rating, review, certification or Microsoft endorsement is emitted |

**Injection (hostile product `</script><script>window.pwned = true</script>` with `<img … onerror>` in the summary), in the live browser DOM:** `window.pwned` never set; exactly one JSON-LD script element; zero injected `img` elements; the JSON-LD parses and the name round-trips; the `<h1>` and tab title show the text inertly. The served payload is fully escaped (no raw `<`); the framework's own RSC payload also contains no unescaped injection sequence.

**Production build, six site-URL scenarios** (build made with NO value, value supplied at `next start`): a valid `https` origin supplied at *runtime* took effect (canonical, sitemap and `Sitemap:` line all use it); mixed case + default port + trailing slash normalized to one origin; unset, `http://…`, `https://localhost` and a value with a path each **failed safe** — pages HTTP 200 with no canonical and no JSON-LD, no `Sitemap:` line, a valid empty sitemap, and `seo.site_url_invalid` logged with only the reason.

**In the browser against the built app:** live DOM head for `?page=2` (self-canonical), the base (`CollectionPage`), `?q=` (noindex, base canonical) and the empty category all matched; the page UI is unchanged.

### Security review (Definition-of-Done gate item)
- **No new authenticated surface.** `robots.txt` and `sitemap.xml` are public read-only.
- **Host-header/cache-poisoning:** the origin comes only from configuration, never from the request; verified by supplying the value at runtime.
- **XSS:** the JSON-LD component is the only raw-HTML sink in the codebase (a source-scan test enforces this, and it replaces the MVP-005 claim that none existed). Hostile text is neutralized by escaping, proven three ways: string round-trip, an HTML-parser test with a negative control (the same data *without* escaping does break out, so the test can fail), and the live browser DOM. Metadata values are escaped by the framework.
- **Information disclosure:** the sitemap and JSON-LD come from PUBLISHED data only (allow-list); DRAFT rows never appear; a draft URL is a 404 identical to an unknown one; `robots.txt` reveals only `/api/`.
- **Configuration:** protocol allow-list, no credentials, bare origin, and in production no localhost/IP-literal/single-label hosts, all exercised in production mode.
- **Claims:** no offers, price, rating, review, seller, brand, image, certification or Microsoft/endorsement claim; asserted by tests and confirmed on served pages.
- **Availability risk (recorded, not built):** `sitemap.xml` is an unauthenticated route that queries the database; the query is bounded (two indexed queries, 50,000 cap). Response caching is a hosting/CDN decision (open question 5).
- **Dependencies:** one dev-only types package added to `@ppu/ui`; audit clean. No secrets; the variable is a public origin.

### Accessibility review (Definition-of-Done gate item)
- **No visible change.** Head tags, JSON-LD, `robots.txt` and `sitemap.xml` render nothing; the only DOM addition is a non-rendered `<script>`. The category and product pages look identical (screenshot of a paginated category page checked).
- Indirect WCAG items hold: each indexable page keeps a unique, descriptive `<title>` (2.4.2) and `<html lang="en">` is present (3.1.1). Not adding `BreadcrumbList` also avoided a navigation change.
- **Not covered — stated plainly:** axe was not re-run because nothing visible changed; the systematic gate remains MVP-023's.

### Bugs found
- **BUG-002 (P3, new):** a repeated `q` parameter (`?q=a&q=b`) makes `/search` and category pages return HTTP 500 (`normalizeQuery` calls `.trim()` on an array). MVP-004 code, unchanged by this branch, confirmed on a file this story does not touch. **Not fixed** — the authorization forbids changing MVP-004 search behavior. → open question 32.
- **BUG-001** (relative canonicals; indexable sign-in/account) is fixed by this story and is now Resolved.

### Tech debt created
- **TD-009** — no environment-level `noindex` switch for staging/preview deployments (needs the hosting decision).
- **TD-010** — single-file sitemap capped at 50,000 URLs (no sitemap index; no `lastmod`).
- TD-008 was **not** implemented, as instructed; it remains a separate corrective change before MVP-012.

### Issues found and fixed during implementation (same story, so not bugs)
- **Documentation-writing artifact:** the literal text of the JSON escape for `<` was converted to a raw `<` when I wrote the decision docs, so two lines of the binding decision record and one analysis line read "escape `<` as `<`". Found by checking, restored, and all code now builds the sequence from character codes.
- **Two corrections to my own pre-work analysis, verified empirically:** the site URL is read at *runtime* (I had assumed build-time inlining), and the misconfiguration error is logged *twice* per process, not once (Next loads the module once per server bundle). Comments and docs were corrected.
- Stale `.next` type output from an earlier probe route broke a typecheck; cleared (gitignored). Vite 8 uses Oxc, so the test JSX option is `oxc.jsx`, not `esbuild.jsx`.

### Interpretations within the approved policy (recorded in `docs/final-decisions.md`)
Any parameter other than a single valid `page` (including `pageSize`, unknown and repeated parameters) marks a category URL as a variant; `?page=1` is `index, follow` with the base canonical; an empty category is self-canonical; version via `additionalProperty`; JSON-LD omitted when the origin is unavailable.

### Not verified
External validators (Rich Results Test, Schema Markup Validator) cannot reach localhost; run them once a preview URL exists. No real hosting, CDN or scale test. Product JSON-LD is expected to be schema.org-valid but *not* eligible for Product rich results (no offers, review or rating) — the accepted, documented trade-off.

### Remaining work to reach Done
None — Done. FR-017 is Implemented and BUG-001 is Resolved. Follow-ups are tracked rather than remaining work on this story: TD-009, TD-010, BUG-002 (needs a product-owner decision), and TD-008 (must land before MVP-012).

### Next story recommendation
**MVP-023** (accessibility gate, and the Playwright/axe harness that would close the E2E half of TD-007). Separately, **TD-008** must land before MVP-012, and BUG-002 needs a product-owner decision (open question 32). MVP-007 (open questions 3, 7, 8) and MVP-011 (open questions 2, 8) remain gated by unanswered product decisions.

## MVP-023 — Manual and automated accessibility gate: pre-work (analysis delivered, no code)

### Story status: In Progress (pre-work only)
**MVP-023 — Manual and automated accessibility gate** (Epic: Accessibility, Requirement: NFR-001, Priority: P0, Sprint 3, 8 pts). Acceptance summary: "Core journeys meet defined WCAG gate."

**No application or test code has been written.** The written analysis (13 required sections plus a measured baseline) is `planning/prework/MVP-023-prework-analysis.md`. Work is paused until the product owner answers open questions 33–42 (or accepts the stated defaults).

**Mandatory first actions, verified:** read `CLAUDE.md`, `docs/final-decisions.md`, `planning/status.md`, `planning/progress-report.md`, `docs/open-questions.md` in that order; `git status` clean (line-ending-only noise, zero content diffs); `develop` = `origin/develop` = `73ba6a4`; 0 open PRs; no MVP-023 branch; no Playwright or axe code or configuration anywhere; the only movement since `status.md` was last edited is the merge commit for PR #5 itself. Branch `feature/mvp-023-accessibility-gate` created from that commit. The usage limit that interrupted the session left no partial MVP-023 work.

### Baseline measured on the real pages (evidence for the analysis, not a gate result)
A throwaway real Postgres and dev server (outside the repository, deleted afterwards) with throwaway rows. axe-core 4.10.2 (WCAG A/AA + best-practice), 11 pages × 4 widths = 44 scans, each page in a same-origin iframe of that width; plus real key presses, clicks, computed styles and a contrast calculation for what axe cannot judge.
- **Automated:** `heading-order` on category and search pages (h1 then h3); `landmark-one-main` and `region` on the framework's default 404; contrast "incomplete" on the product page's clipped table at 375/320 px; no horizontal overflow at 320 px anywhere; everything else clean.
- **Manual/measured (axe blind):** the Search button's focus ring is near-white on white (**1.06:1**, invisible); the search input border is **1.35:1** and its placeholder **3.46:1**; sign-in shows only a generic error and drops focus to `<body>`; revoking a session drops focus and announces nothing; sign-in, account and 404 titles are the site name only; sign-in and account pages are entirely unstyled.
- **Recorded as six bugs, NFR-001:** BUG-003 (focus ring, P2), BUG-004 (input contrast, P3), BUG-005 (sign-in, P2), BUG-006 (session revoke, P3), BUG-007 (heading levels, P3), BUG-008 (404 page, P3). Whether MVP-023 fixes them or they are scheduled separately is open question 37.
- **Limits, stated plainly:** one browser engine (Chromium); a local dev server; axe 4.10.2 (the proposal pins 4.13.0, so re-baseline); **no screen reader was run** — Claude cannot operate NVDA, JAWS or VoiceOver, so screen-reader compatibility is unverified; synthetic key events did not trigger every default browser action (Enter-to-submit, arrow-key scrolling), so keyboard checks that mattered used real Tab presses and real clicks.

### Findings while reading the repository
- `docs/final-decisions.md` names Playwright but **not axe-core**; axe-core appears only in ADR-004's testing row, and ADR-004's status is still **"Proposed"** although `final-decisions.md` says it "confirms" ADR-004's decisions. Surfaced as open question 41 rather than assumed.
- `docs/11-test-strategy.md` already lists "critical accessibility issue in core path" as a release blocker, which supports (but does not define) the gate question 35.
- The TRD's pull-request check list has no E2E or accessibility stage, and open question 20 (CI time and cost) is unanswered — a blocking accessibility job needs that decision (question 39).
- The two axe packages are MPL-2.0 (dev-only, not shipped); flagged for the product owner (question 41).
- No custom `error.tsx`, `not-found.tsx` or `loading.tsx` exists, so `docs/05`'s required states (system error, permission denied, offline, loading) are not implemented; recorded, out of scope.

### Records created or changed
`planning/prework/MVP-023-prework-analysis.md`; `docs/open-questions.md` (items 33–42 added; items 22 and 32 annotated); `planning/bugs/BUG-003.md` to `BUG-008.md` and `planning/bugs.csv`; `planning/mvp-backlog.csv` and `planning/backlog.csv` (MVP-023 → In Progress); `planning/status.md`. **Nothing was implemented, nothing was recorded in `docs/final-decisions.md`, and no decision was assumed.** MVP-003/004/005/021/022 behavior is unchanged; the corrective changes to delivered pages are documented in the analysis and await question 37.

### Remaining work
Await answers to questions 33–42; then implement per the approved scope, with CI green and the DB-gated tests confirmed passed from the log, before marking Done.

## MVP-023 — Manual and automated accessibility gate: product-owner decisions recorded, implementation authorized

### Story status: In Progress (decisions recorded; stop-gate confirmation pending; no code written)
**MVP-023** (Epic: Accessibility; NFR-001, and NFR-008 by decision Q42), P0. Estimate revised **8 → 13 points** by decision Q37, because the WCAG A/AA corrective fixes are in scope.

The product owner's direct 2026-09-21 instruction decided Q32–Q37 and Q39–Q42 and left Q38 open with a binding interim position: **screen-reader compatibility is unverified, and nothing may say otherwise.** The decisions are recorded in `docs/final-decisions.md` ("Product-owner decisions for MVP-023"), `docs/open-questions.md` (items 20, 22, 26, 32–42), `planning/proposed-stories.md` (PROP-006, the BUG-002 corrective story, Proposed), `planning/backlog.csv` (estimate), `planning/status.md`, and `planning/requirement-traceability.csv` (NFR-001 and NFR-008: In progress, not Implemented).

### Verified before recording
- Branch `feature/mvp-023-accessibility-gate` carries one commit (`a05ce5f`, docs and planning only, 13 files); `develop` = `origin/develop` = `73ba6a4`; no open pull requests.
- Repository routes (`apps/web/app`): `/`, `/categories/[slug]`, `/products/[slug]`, `/search`, `/signin`, `/account/sessions`; API routes, `robots.txt` and `sitemap.xml` are not pages. There is no `/account` page and no `not-found.tsx`, `error.tsx` or `loading.tsx`.
- Tooling, read from a scratch install **outside the repository** (nothing has been added to the repo): `@playwright/test` 1.63.0 (Apache-2.0), `@axe-core/playwright` 4.13.0 (MPL-2.0, depends on `axe-core ~4.13.0`), `axe-core` 4.13.0 (MPL-2.0).
- GitHub: neither `develop` nor `main` has branch protection, and there are no rulesets (`gh api`, read-only).

### Conflicts found while recording (in `docs/final-decisions.md`, not resolved)
1. "Required for merge" (Q39) has no GitHub mechanism: no branch protection exists and open question 17 is still open.
2. "Four engines" (Q33) versus three named; three are implemented.
3. `/account` is not a route (only `/account/sessions`).
4. Scope of the ADR-004 status change (Q41): it approves the testing stack and does not approve or close anything else.
5. PROP-006 is in the proposals register because the backlog CSVs have no Proposed status.

### Files changed / commands executed / risks
- **Files:** the six records above. No application or test code.
- **Commands:** `git status`, `git log`, `git fetch`, `gh pr list`, `gh api` (branch protection and rulesets, read-only), a scratch `npm install` outside the repo to read installed licences, and one recording script that validates CSV field counts and line endings.
- **Risks:** a required check cannot be enforced through GitHub until the product owner decides how (open question 17); the 10-minute CI ceiling may be tight for three engines × four widths and is unmeasured (any shortfall returns as a new decision, never a weaker gate); WebKit on the CI runner needs system dependencies and is untried.

### Remaining work
Post the stop-gate confirmation (git state, page inventory, pinned versions and licences, ordered Q37 commit list, conflicts) and wait for the product owner's answers to the conflicts; then implement the harness, the Q37 fixes (each a separate commit with a failing-before regression test), the CI job, the documentation and the manual-review checklist; open one PR; read the CI log; and complete the security and accessibility reviews before any merge.

## MVP-023 — Stop-gate answered; implementation authorized (no code yet)

### Story status: In Progress (H1 next)
The product owner answered the stop-gate confirmation on 2026-09-21 (`docs/final-decisions.md`, "Product-owner response to the MVP-023 stop-gate confirmation"):
1. **Required for merge: Option B, enforced.** After the accessibility job has run green in the MVP-023 PR, a branch-protection rule is created on `develop` only (pull request required, 0 approvals, both jobs required by their displayed names, branches need not be up to date, not enforced for administrators, force pushes and deletion blocked). No setting is applied before then. This narrows open question 17, which stays OPEN (`main`, reviewer and approval rules, ruleset strategy, repository visibility); TD-011 tracks it.
2. **Three engines** (Chromium, Firefox, WebKit); "four" was a counting error, not a scope reduction.
3. **`/account`** is covered as a 404 check only; no page, redirect or stub.
4. **ADR-004 → Accepted, scoped to the testing-stack rows only.**
5. **PROP-006** stays in `planning/proposed-stories.md`.
6. **Three additive files permitted:** `not-found.tsx` (F5), a sign-in route-segment layout (F8), one small client wrapper for a persistent status region (F7); stop and ask if any fix needs more than its new file plus a minimal call-site edit.
7. **Interpretations confirmed:** `packages/e2e` with `test:e2e` and `test:a11y`; only the CLAUDE.md Commands section changes; the unstyled sign-in/account pages get an advisory bug record; BUG-004/006/007/008 are fixed because Q37 names them, not because Q35 would block on a P3.

Additional requirements recorded: install time reported separately from test time; browser cache in CI without weakening the pins; the 10-minute ceiling stands; test-side auth interception only; the "Not verified" section is a named completion item.

### Verified before recording
`origin/develop` = `73ba6a4` (unchanged), no open PRs, the branch is not on the remote; the working tree is clean apart from the known line-ending-only files.

### Files changed / commands executed / risks
- **Files:** `docs/final-decisions.md`, `docs/open-questions.md` (items 17, 33, 39, 40, 41), `planning/tech-debt/TD-011.md`, `planning/tech-debt.csv`, `planning/status.md`, this report. No application or test code.
- **Commands:** `git fetch`, `git rev-parse`, `gh pr list`, `git ls-remote`, and one recording script that writes nothing unless every anchor and CSV check passes.
- **Risks:** the 10-minute ceiling is unmeasured for three engines × four widths; WebKit on the CI runner is untried; creating the protection rule needs repository-admin rights (the account has them) and stops the story if it fails.

### Remaining work
H1 (harness), F1–F10 (each with a regression test proven failing first), G1–G3; push with the docs commits and open one PR; read both CI logs; create the protection rule; complete the security and accessibility reviews; then Done and merge via `gh pr merge`.

## MVP-023 — Manual and automated accessibility gate: implemented in PR #6; Blocked on BUG-012

### Story status: Blocked (implementation complete; awaiting a product-owner decision on BUG-012)
**MVP-023** (Epic: Accessibility; NFR-001 and NFR-008), P0, 13 points. Implemented in pull request #6. It is **not Done** and **not merged**: the first CI run of the accessibility job failed three Chromium tests, and the cause is a production defect in a completed story (BUG-012) that the MVP-023 authorization does not allow it to fix. The branch-protection rule has not been created (by decision, it waits for a green accessibility job).

### Story completed (what exists on the branch)
- **H1 and follow-up:** `packages/e2e`: exact-pinned Playwright 1.63.0, `@axe-core/playwright` 4.13.0, `axe-core` 4.13.0; chromium, firefox and webkit projects; a database guard (loopback Postgres plus `E2E_ALLOW_DATABASE_WRITES=1`); reserved-prefix rows deleted by ids-and-prefix; database-created sessions; contrast, focus, heading, overflow and Tab helpers; negative controls. `.pnpmfile.cjs` keeps Playwright out of the web app's production dependency tree.
- **F1 to F10:** the Q37 fixes, each a separate commit with a regression test that failed against the unfixed production build first: BUG-003 (focus ring 1.06:1 to 18.13:1), BUG-004 (border 1.35:1 to 7.48:1; placeholder 3.45:1 to 7.48:1), BUG-007 (hidden h2), BUG-008 (not-found page and title), BUG-005 (sign-in errors, focus, title), BUG-006 (session revoke, title). New files in delivered areas: `not-found.tsx`, `signin/layout.tsx`, `SessionsHeading.tsx`.
- **G1:** 16-state page matrix (x 4 widths x 3 engines), keyboard traversal, route-coverage guard with negative controls.
- **G2:** the separate parallel `accessibility` CI job ("Accessibility (axe + Playwright)"), per-phase timing, a run summary, uploaded report.
- **G3:** `docs/14-accessibility-testing.md`, ADR-004 (Accepted for the testing rows only, with pins and licences), the TRD check list, CLAUDE.md Commands, README, the test strategy pointer, bug and tech-debt records, this report.

### Files changed
`packages/e2e/**` (new); `.pnpmfile.cjs`, `pnpm-lock.yaml`, `package.json`, `.gitignore`, `.github/workflows/ci.yml`; `apps/web/app/globals.css`, `not-found.tsx`, `signin/layout.tsx`, `signin/page.tsx`, `search/page.tsx`, `categories/[slug]/page.tsx`, `account/sessions/{SessionsHeading.tsx,page.tsx}`; `packages/ui/src/search-form.tsx`; `docs/14-accessibility-testing.md`, ADR-004, TRD, `docs/final-decisions.md`, `docs/open-questions.md`, `docs/11-test-strategy.md`, `README.md`, `CLAUDE.md` (Commands section only); planning records.

### Commands executed
`pnpm install`, `pnpm add`-equivalent pins, `pnpm exec playwright install chromium firefox webkit` (about 400 MB), `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm audit --audit-level=high` (clean), `playwright test` on all three engines locally, `git`, `gh pr create`, `gh run view` and `gh api` for logs; a throwaway local Postgres outside the repository.

### Verification
- **Local (Windows, throwaway Postgres):** lint, typecheck, test, build and audit clean; harness 69 unit tests; the full `tests/a11y` run (first run 405 passed, 12 failed from a Tab-walk start artifact, fixed; then keyboard, negative-control and regression specs all pass on three engines).
- **CI run 35665652208:** existing job passed, read from the log: 527 tests passed, 0 skipped, 0 failed, integration suites executed (catalog 37, session 3, file-scan 3, S3 4, ClamAV 2). Secret scan passed. **Accessibility job failed:** 417 of 420 passed (chromium 137/3, firefox 140/0, webkit 140/0), 0 skipped, 0 retries, all 192 axe scans clean, no advisory findings on real pages, one manual-review item (axe `color-contrast` could not decide the product compatibility table at 320 and 375 px).
- **Timing (first run, cold browser cache, 3 workers on a 4-vCPU runner):** dependencies 6 s; browsers plus system dependencies 46 s (cache miss); migrations 2 s; build 27 s; test execution 4m28s; whole job 6m18s. Inside the 10-minute ceiling; the target is 5 to 8 minutes.
- **Manual (agent-performed, not human review):** real Tab presses; the Tab order of all 16 states reads in visual order with no positive `tabindex`; contrast re-measured on the fixed elements from painted pixels and from computed style (identical in all engines). **No screen reader was run.**

### The finding that stops the story
The three failures were HTTP 500s from Postgres "too many clients" (Prisma P2037): an unknown product slug returned 500 instead of 404, a category page had no products, and a session DELETE failed. Cause: in a production build `packages/db/src/index.ts` (MVP-002) creates a new Prisma client and pool for every query, because it only caches the client when `NODE_ENV !== "production"`. Reproduced locally: 40 sequential queries leave **41** open connections in production mode and **1** in development. Recorded as **BUG-012 (P1)**; question to the product owner is open question 43 (recommendation: approve the one-line fix inside MVP-023 as a separate commit with a failing-first regression test). Retries or fewer workers would only hide it, so neither was added.

### Risks identified
- BUG-012 is a real production outage risk for every database-backed route, present since MVP-002 and invisible to dev/test.
- The accessibility job is flaky until BUG-012 is fixed; it must not be made a required check while it can fail for that reason.
- WebKit link reachability by keyboard is not verifiable (documented); screen readers, voice control, switch access and magnification are not verified; open question 38 is unanswered.
- `.pnpmfile.cjs` is a workaround (TD-012).

### Remaining work
1. Product-owner decision on open question 43 (A, B or C).
2. If A: a separate minimal commit fixing `@ppu/db` with a regression test proven failing first; re-run CI; read both job logs (DB-gated tests PASSED, skip count) and the accessibility job's timing.
3. Only after both jobs are green: create the branch-protection rule on `develop` exactly as decided and report the check names in the PR.
4. Security and accessibility reviews; mark Done; merge with `gh pr merge`; update open questions 20, 22, 33 to 37 and 39 to 42 from decided to closed, with evidence.
5. Recommend the next unblocked story.

### Update: CI run 2 and the BUG-012 fix experiment (2026-09-21)
- CI run 2 (35666983338, docs-only head 9cd68c5): the same signature. 417 of 420 passed, 3 Chromium failures (an unknown category slug and an unknown product slug returned 500 instead of 404; a session revoke failed), 0 skipped, 0 retries; Firefox and WebKit passed every test; the server log again shows TooManyConnections (8 lines). Whole job 5m57s, test execution 4m14s. The Playwright browser cache is saved only by a successful job, so both runs so far had a cold cache.
- Proposed fix validated in a throwaway git worktree (never committed, not on the feature branch): one condition in packages/db/src/index.ts (cache the client on globalThis in every environment) plus a unit test (packages/db/src/client-cache.test.ts). The test fails without the fix in production mode (and passes in development and test), and passes with it; with the fix, 40 sequential queries in production mode hold 1 open connection (was 41); and the full accessibility suite against a production build with the fix: 420 passed, 0 failed, 0 skipped, 0 retries (140 per engine) in 7.0m on a local Windows run with 3 workers; TooManyConnections lines in the server log: 0.
- **Nothing was changed on the feature branch for the fix.** The experiment lived in a throwaway worktree that is removed; the patch is one condition in `packages/db/src/index.ts` plus one new test file, ready to apply on approval (open question 43, option A).
- **Still not done:** the branch-protection rule (waits for a green accessibility job), the security review sign-off, and the accessibility review sign-off (the manual-review reviewer is open question 38). A security scan of this PR's application, auth and CI changes found nothing: 9 application files and 137 lines changed, no API route, auth configuration, adapter or domain file touched, no injection sinks, no secret-like strings, and no new workflow permissions or secrets used.

### Decision received: BUG-012 option A (2026-09-21)
The product owner approved option A (`docs/final-decisions.md`, "Product-owner decision: BUG-012 and MVP-023 sign-off"; open question 43 closed). The fix is a **root fix (i)**, not a mitigation: it corrects the client and connection lifecycle and raises no limit. It is the only `@ppu/db` change permitted in this story.

Fixed sequence: push the fix; wait for CI; read both job logs in full (accessibility green on chromium, firefox and webkit; no `TooManyConnections`; database-gated suites PASSED; skip count; 0 retries); report the runtime against the 10-minute ceiling; only then create the `develop` branch-protection rule with the check names as GitHub displays them; then the security review (covering the `@ppu/db` change) and the accessibility review; then Done; then `gh pr merge`.

The accessibility review is **not signed off**; sign-off is authorized only after the CI logs are read and confirmed, and it will state scope and method, not conformance. Open question 38 stays open. The local 420 of 420 result is not relied on.

### CI run 5 (instrumented) and the Firefox title-defect finding (2026-09-21)

**Instrumentation added** (commit `a5f44c0`, test logic only, no suite configuration
touched): `packages/e2e/src/failure-evidence.ts` and `failure-evidence-inpage.ts`
capture console, network, an in-page title/route-announcer trace, and the page HTML,
attached ONLY on a failing test. `packages/e2e/src/title-trace.ts` (+ unit tests)
applies the product owner's pre-registered criterion in code, not by eye. Proven
locally first: a deliberately failing scratch test showed all four attachments; that
run caught a real bug in the tracer itself (a `MutationObserver.observe()` call on a
still-null `document.documentElement` crashed in one engine because `addInitScript`
runs before `<html>` exists) — fixed, then re-verified against the real signin-sent
and sessions-after-revoke scenarios in all three engines with clean traces.

**Overhead:** a full local run of `tests/a11y` with the instrumentation passed
420/420 in 6.0 minutes, no slower than an earlier equivalent run without it (7.0
minutes) — within normal variance, not a regression. CI run 5 (5m37s whole job) was
in fact a little faster than uninstrumented run 4 (5m56s).

**CI run 5 result:** 1 of 3 run-4 failures recurred — `sessions-after-revoke @ 768px`
(Firefox). `signin-sent @ 320px` and `sessions-after-revoke @ 1280px` did not recur
this time, so no fresh evidence exists for them; `signin-sent`'s only evidence
remains run 4's pre-instrumentation trace (no `/api/auth/*` request after the click,
no console errors) and is not yet classified — it is a distinct failure class, not
folded into the title analysis, per instruction.

**The recurring failure, classified:** applying `classifyTitleTrace` to the captured
trace gives **product-defect**: Next's own route announcer fired while
`document.title` read `""`, and the failure-time HTML snapshot shows `<head>` with
no `<title>` element at all (independent corroboration; the element was removed, not
emptied, which is also why neither title-change detector caught an intermediate
state). Recorded as **BUG-013** (P3: the core journey and its announcement — our own
`role="status"` region from F7 — are unaffected; a duplicate, first-party announcer
and the document/tab title are what briefly go silent).

**Fix: proposed, NOT applied.** Two candidates recorded in BUG-013; recommended is a
client-side title safety net in the already-touched `SessionsHeading` component.
Per instruction, this stops here for approval before any product-code change.

**Both CI logs read in full for run 5:** existing job green (543 tests, 0 skipped, 0
failed, every integration suite executed); accessibility job 419/420, 0 skipped, 0
retries, no `TooManyConnections`; whole job 5m37s, test execution 4m01s, browsers
still a cache miss (no run has yet completed successfully to save one).

**Still not done, unchanged:** the `develop` protection rule, the security review,
the accessibility review sign-off, marking Done, and the merge. The branch is held
at `a5f44c0` pending the product owner's decision on BUG-013's proposed fix and on
`signin-sent`.

### BUG-013 fix applied; BUG-014 opened for signin-sent (2026-09-21)

**Reproduction attempts, before writing anything:** tried to make the title-removal race
deterministically reproducible using the same event-driven tracer that caught it in CI
(not the coarse poll a first attempt used, which found nothing) — delaying the `_rsc`
refetch response (0/300/800/1500ms, three attempts each, Firefox) and nine concurrent
revoke cycles across all three engines to mimic CI's worker contention. **Never
reproduced.** Per instruction, no end-to-end regression test for the race is shipped;
this is stated plainly in `planning/bugs/BUG-013.md`.

**Fix applied (candidate (a), the only product-code change authorized):** one new,
separate `useEffect` in `apps/web/app/account/sessions/SessionsHeading.tsx` that finds
or creates the `<title>` element and corrects its text on every re-render, handling the
**absent** case (create, not merely assign) that the CI evidence actually showed. Marked
and removed on unmount if still present, so nothing is left behind. Classified honestly
as a **mitigation**, not a root fix — the underlying gap is recorded as **TD-013**, which
also notes no other route currently calls `router.refresh()` but a future one would not
be covered.

**Regression coverage:** `SessionsHeading.test.ts` unit-tests the mitigation's decision
function (`computeTitleFallback`) deterministically — proving it creates rather than
assigns when the title is absent — standing in for the race reproduction that could not
be achieved.

**Verified before pushing:** workspace-wide `pnpm lint/typecheck/test/build` clean (543
tests including the 4 new ones); the full local `tests/a11y` run passed 420/420 on all
three engines after the fix, including the existing F7 regression specs, unaffected.

**BUG-014 opened** for `signin-sent` (product-owner decision: monitor, do not fix, does
not block MVP-023 — a single non-recurring observation in 5 runs, with the permanent
failure-evidence instrumentation now in place to catch it if it recurs).

**Still to do, per the sequence:** push; wait for CI; read both logs in full; report
runtime with install time separate and cache state; if green, create the `develop`
protection rule and report the exact check names; complete the security review
(covering both the BUG-012 `@ppu/db` change and this `SessionsHeading` change) and the
accessibility review (stating scope and method, not conformance); then Done; then
`gh pr merge`, never locally.

## MVP-023 — Manual and automated accessibility gate: DONE

CI run 6 (`5dedfba`) came back green: both logs read in full, 420/420 accessibility checks, 0 skipped, 0 retries, 0 `TooManyConnections`, all five database-gated suites PASSED with their counts. The `develop` branch-protection rule was created exactly as decided (both check names, 0 approvals, not enforced for admins, force-push and deletion blocked; `main` untouched). The security review and the accessibility review sign-off are recorded in `docs/final-decisions.md` (2026-09-21, "MVP-023 reviews, branch protection, and Done").

**Final shape:** the `packages/e2e` harness (Playwright 1.63.0 + axe-core/`@axe-core/playwright` 4.13.0, exact pins, dev-only, confirmed not shipped); ten WCAG A/AA fixes (F1–F10, each its own commit with a regression test shown failing first); a 16-state page matrix on three engines at four widths; a keyboard-traversal spec; a route-coverage guard; failure-evidence instrumentation (console, network, title/announcer trace, HTML) that costs nothing on passing runs; a separate, now-required CI job; `docs/14-accessibility-testing.md`; and two findings resolved along the way — **BUG-012** (a production connection-pool defect in `@ppu/db`, root-fixed) and **BUG-013** (a Firefox-only title-disappearance defect after a session revoke, mitigated, with the underlying gap tracked as TD-013 and a companion record, BUG-014, for the one still-unexplained `signin-sent` observation that does not block this story).

**Requirement coverage:** NFR-001 (accessibility) and NFR-008 (browser/breakpoint matrix, closing open question 22) are both Implemented; `planning/requirement-traceability.csv` updated with the evidence.

**Not claimed:** WCAG conformance, an accessibility audit or certification, or screen-reader support. Screen-reader compatibility remains unverified; open question 38 (manual/AT review ownership) stays open for a future story or process decision.

**Remaining, not blocking:** BUG-002 (as PROP-006, unscheduled), BUG-009/010/011 (advisory-to-P3, sign-in/account styling and two narrow error-path focus gaps), BUG-014 (monitor), TD-011/TD-012/TD-013.

Next: open the PR for merge via `gh pr merge` once the product owner confirms, and recommend the next unblocked story.

### CI run 7 (docs-only, 18b7b46) failed on a NEW signature; BUG-014 retitled and broadened; instrumentation extended (2026-09-21)

A pure documentation push (marking MVP-023 Done) triggered run 7, now required by the
branch-protection rule created after run 6. It failed `signin-send-failed @ 320px`
(Firefox) — a different test than BUG-014's original occurrence, but the network log
showed the same signature: no auth-API request at all after the click, and the field's
error state never populated. **Not merged**; the merge was blocked by the protection
rule regardless, and no fix, retry or workaround was applied.

**Decision:** broaden BUG-014 (retitled to name the signature, not one symptom) to
cover both occurrences (run 4 `signin-sent`, run 7 `signin-send-failed`), explicitly
stating the shared cause is suspected, not proven. A fixed classification criterion was
decided in advance: reaching the button but the handler not firing is a product defect;
the click never reaching the button is a test defect; anything else stops for a report.

**Instrumentation extended** (test logic only, `packages/e2e/src/signin-click-diagnostics.ts`
wired into `submitSignIn` in `pages.ts` and read by `failure-evidence.ts`): on any future
sign-in-submit failure, captures a hit test at the click point, a hydration marker on the
button, its visibility/pointer-events/z-index/bounding rect and viewport containment, a
capture-phase click/submit event log, and the interception-to-click timing gap — enough
to classify the next occurrence against the fixed criterion without guessing.

**Proven before relying on it:** a deliberately failing, otherwise-healthy submit for all
three sign-in states, chromium and firefox, showed the button hydrated, hit correctly,
and both click and submit events firing on the correct targets — the instrumentation
itself works. Workspace-wide lint/typecheck/test/build clean (551 tests).

**Local verification could not be completed this round**: not a code issue — the local
machine's C: drive was found at 0.19GB free (346GB volume), a pre-existing condition this
session did not cause and only partly could clean up (~45MB of its own scratch leftovers
freed; the drive remained essentially full). CI is relied on as the authoritative check
for this push, consistent with the standing rule to never act on local results in place
of it.

Per instruction, this instrumentation commit IS the next CI sample — no separate push was
made just to re-run the check. Report pending on that run.

### CI run 8: signature did not recur, but Secret scan failed for the first time; run 9 pending (2026-09-21)

Run 8 (`424049f`, the extended-instrumentation commit) had both required checks green:
420/420 accessibility checks (BUG-014's signature did not recur — neither `signin-sent`
nor `signin-send-failed` failed), 547 unit/integration tests with all five
database-gated suites PASSED, 0 skipped, 0 retries. **Not merged.** A third job,
`Secret scan`, failed for the first time in this entire story: gitleaks' generic-api-key
rule flagged `const KEY = "__e2eClickDiagnostics";` in the new diagnostics file. Two
identical patterns elsewhere in the same file family
(`const KEY = "__e2eTitleTrace";`, `const KEY = "__e2eClickEvents";`) were NOT flagged,
consistent with an entropy-threshold false positive tied to string length, not an
actual secret — none of the three touches a credential, environment variable, or
external call. Not renamed, not allowlisted, not otherwise touched; reported and left
for the product owner's decision. `Secret scan` is not one of the two required checks in
the branch-protection rule, so it does not block merge eligibility, but a security job
turning red for the first time is not something to quietly proceed past.

### Disk protocol adopted; instrumentation refined a second time; run 9 pushed (2026-09-21)

**Disk protocol:** free space is now reported before any local run, and a run is
skipped entirely (relying on CI) if free space is under 2GB. C: was at 0.19GB free
before this round (unrelated to this session's own footprint — the authorized,
repo-scoped cleanup categories were audited and found to be either already minimal (this
session's own scratch downloads, freed earlier) or physically on G: with 62GB free, not
C:; the Playwright browser cache held only the pinned version, nothing extra to remove).
No local `pnpm` command was run this round; the code below was verified by careful
manual review instead, with CI's fast lint/typecheck job relied on to catch anything
missed, rather than the far more expensive accessibility job.

**Instrumentation refined** (`packages/e2e/src/signin-click-diagnostics.ts`, test logic
only): the original design snapshotted the button once, BEFORE `fill()` — exactly the
gap the product owner's evidence-refinement instruction identified, since `fill()`'s
own re-render is the specific event the replaced-node hypothesis is about. Now the
button is snapshotted twice (via `locator.evaluate()`, so each snapshot uses whatever
element is freshly resolved at that moment, not a stale reference) — once at
resolution, once immediately before the click — compared for node identity (a
`WeakMap` keyed by the actual element object), `isConnected`, and a bounding-box delta.
Listeners now also attach to React's own root container when it can be found (a full
scan of the document for its `__reactContainer$` marker, not an assumed mount point),
so an event reaching `document` but not React's root is a distinguishable fact. A named
hypothesis was added to BUG-014, explicitly flagged as unproven: that `fill()`'s
re-render could replace or detach the button, so the click dispatches to an orphan node
that never reaches React.

Pushed as `<pending>`, per instruction (no documentation-only push used to obtain a
sample). Report pending on run 9.

### CI run 9: all three jobs failed, one of them a defect in this session's own test code (2026-09-21/22)

Run 9 (`7529f73`) failed on all three jobs:
- `Secret scan`: the same unresolved gitleaks false positive as run 8 (`const KEY = "__e2eClickDiagnostics";`) — unchanged, still awaiting the product owner's decision, not touched.
- `Format, lint, typecheck, test, build`: failed on formatting. This round's code was written under the disk protocol without a local `prettier` run (C: was at 0.19GB), verified by manual review only — the review missed a real formatting deviation. Because this job runs its steps in sequence and stops after the first failure, lint/typecheck/test/build never ran at all; their status is unknown, not passing.
- `Accessibility (axe + Playwright)`: 54 failures, all with the identical error:
  `ReferenceError: DOC_EVENTS_KEY is not defined`, thrown inside `installClickEventTracer`
  the moment Playwright serialized it and re-executed it in the browser. **This is a
  defect in this session's own test code, unrelated to BUG-014's signature — not a new
  finding about the application.** The refinement pushed in `7529f73` had hoisted several
  `const` key strings (`DOC_EVENTS_KEY`, `ROOT_EVENTS_KEY`, `ROOT_INFO_KEY`,
  `NODE_IDENTITY_KEY`) and a shared `describeTarget`/`findReactRootContainer` pair of
  helper functions to module scope "to avoid duplication" between
  `installClickEventTracer` and `snapshotButtonNode`. Both functions are passed BY
  REFERENCE to Playwright's `evaluate()`, which serializes ONLY that one function's own
  source text (`Function.prototype.toString()`) and re-executes it as an isolated script
  in the browser — it does not carry along anything declared outside the function body.
  Every module-scope constant and every external helper function reference was
  therefore invisible at runtime, even though it type-checked cleanly (a module-scope
  `const` is perfectly valid, resolvable TypeScript from inside a function in the same
  module; the failure exists only after Playwright extracts the function in isolation,
  which `tsc` has no way to model). Because `submitSignIn` calls
  `installClickEventTracer` on every sign-in-adjacent state, and `keyboard.spec.ts`'s
  traversal also calls `state.prepare()`, this one defect cascaded across most of the
  sign-in-related matrix — a false-positive failure signal, not 54 independent findings.

### Run 9's defect fixed; verified by simulating Playwright's actual serialization, not by local Playwright run (2026-09-22)

C: free space rechecked before doing anything further: **7.95GB**, up from 0.19GB (recovered independently of this session; no cleanup was performed this round). Above the 2GB threshold, so local verification was permitted this round.

**Fix** (`packages/e2e/src/signin-click-diagnostics.ts`, test logic only, no product code, no suite configuration change): `installClickEventTracer` and `snapshotButtonNode` were rewritten to be fully self-contained — every key string they use, and a small local `describeTarget`-equivalent each, is now declared INSIDE the function body that uses it, duplicated between the two rather than shared from module scope. This matches the pattern already proven correct elsewhere in this file family (`failure-evidence-inpage.ts`'s `installFailureEvidenceTracer`, and this same file's own `recordSignInClickDiagnostics`, which never had the bug because it already declared its key locally).

**Verified three ways, in order of what each can and cannot prove:**
1. `pnpm --filter @ppu/e2e typecheck` and `pnpm --filter @ppu/e2e lint`: both clean. Necessary but **not sufficient** — as run 9 showed, this exact class of bug type-checks and lints cleanly, because module-scope references are valid, ordinary TypeScript; the failure only exists once Playwright extracts a function's source text and re-executes it alone.
2. `pnpm exec prettier --check --end-of-line auto` on the changed file: clean after one `--write` pass (the gap that caused run 9's Format-check failure — this time actually run locally, not skipped).
3. **A direct simulation of Playwright's own serialization mechanism**, since neither of the above tests the actual failure mode: a scratch script compiled the file with `tsc`, then for each of `installClickEventTracer` and `snapshotButtonNode` took `fn.toString()` and re-executed that string as a freestanding function via `new Function()` — exactly what Playwright's `evaluate()` does — inside a jsdom-backed DOM (real `window`/`document`/`Element`, not stubs of the code under test; only jsdom's own gaps, such as a missing `elementFromPoint`, were stubbed). Result: no `ReferenceError` from either function; the idempotency guard in `installClickEventTracer` still correctly no-ops on a second, separately-serialized call; and the `WeakMap`-based node-identity tracking in `snapshotButtonNode` correctly reports the same element as known (same `nodeId`) across two separate serialized calls, and a different element as unknown (a different `nodeId`) — the specific mechanism the node-identity comparison in BUG-014's evidence depends on. This is the first time that mechanism has been checked at all, in either this run or run 8, since a full accessibility run was not part of this round's authorization and the earlier rounds relied on review alone.

A full local Playwright accessibility run (real Postgres, a production build, three browser engines) was not attempted: it is the one thing the simulation above cannot substitute for evidence-wise (an actual browser, not jsdom), but it is also disk- and time-costly relative to what was needed to fix a deterministic, 100%-reproducible defect in this session's own code — as opposed to BUG-014 itself, which is genuinely intermittent and where CI has always been the authoritative source. Committing this fix as the next CI sample, per the standing instruction, rather than treating a local run as a substitute for it.

Pushed as `8d4c724`.

### Run 10 disposition: prior evidence voided, and run 10 as pushed cannot satisfy the required self-check (2026-09-22)

Direct product-owner instruction, "Run 10 disposition": runs 8 and 9 carry NO
evidentiary weight for the sign-in signature, in either direction — both threw during
`evaluate()` serialization, and a green result from a broken instrument is not evidence
of absence. Recorded in BUG-014.

**Before any classification, the instrument itself must be proven in a real browser,
not a simulation.** Checking this against the current harness surfaced a real
architectural gap, independent of run 10's eventual pass/fail: `failure-evidence.ts`'s
`attachOnFailure` returns immediately on a passing test ("a green run pays nothing
extra," by design), so on any run where every sign-in state passes, no click-diagnostics
evidence is ever extracted from the browser at all — nothing to inspect. Even a run that
fails only gives the `fill()`-affected snapshots from `signin-sent`/`signin-send-failed`,
not a clean untouched-element control; `signin-validation-error` (the one state where
`fill()` is skipped and the two snapshots would be a genuine positive control) is not
part of BUG-014's failing signature and so never gets its diagnostics attached either.
**Run 10, as already pushed, cannot satisfy the self-check regardless of its outcome.**

**Added** (`packages/e2e/tests/a11y/harness-smoke.spec.ts`, test logic only, no product
code, no suite configuration change): a dedicated, unconditional self-check, independent
of the sign-in flow, asserted directly with `expect()` so its result — pass or fail — is
its own visible test outcome in every run, not something that only surfaces on a
sign-in failure:
- (a)/(b) the SAME untouched element reports the SAME identity token across TWO
  SEPARATE `evaluate()` calls — only provable in a real browser: if the `WeakMap` were
  built fresh inside the function body instead of read from a persistent `window`
  global, this would fail every time, which is the proof for where the store lives.
- (c) a genuinely different element reports a DIFFERENT identity token.
- (d) a real, physical click anywhere in the document is captured by BOTH the
  `document`-level listener and React's own root-container listener — not only by
  something scoped to the clicked element itself.

C: free space rechecked before this round's local verification: **7.94GB** (no
meaningful change from the prior round's 7.95GB; no cleanup performed). Verified with
`pnpm --filter @ppu/e2e typecheck`, `pnpm --filter @ppu/e2e lint`, and
`pnpm exec prettier --check --end-of-line auto` (clean after one `--write` pass) — the
same necessary-but-not-sufficient checks as before, since this test only calls the
already-fixed, already-simulated `installClickEventTracer`/`snapshotButtonNode` rather
than defining new `evaluate()`-passed closures of its own, so the specific
serialization risk from run 9 does not reapply here the same way. Its actual claims
(identity persistence and distinctness in a REAL browser) can only be proven by CI
itself — that is the entire point of adding it.

Pushed as `<pending>`, as the next sample (run 10 could not have answered this
regardless of its own outcome, so this is not a docs-only push obtained to re-run an
unchanged commit — it is new, required instrumentation, per the standing rule that such
a commit IS the sample). Report pending.

### Run 10's actual result, and a second, pre-existing Format-check gap found and fixed (2026-09-22)

Run 10 (`8d4c724`) completed: **Accessibility green** (BUG-014's signature did not
recur on this run), `Secret scan` failed (the same unresolved gitleaks false positive),
`Format check` failed — but on `packages/e2e/src/pages.ts`, a file this round did not
touch at all. Per section 1 of "Run 10 disposition," this run's Accessibility result is
recorded but voided for classification purposes: the self-check that would prove the
identity mechanism worked correctly during this pass did not exist yet (added in
`021a1ea`, pushed after run 10 was already in flight), so a green Accessibility job here
is not, by itself, usable evidence either way.

**`pages.ts`'s formatting issue is a real, standing gap in this session's own
verification, not a new defect just introduced.** `git log` shows it was last edited in
`7529f73` (the same commit whose `ReferenceError` was fixed in `8d4c724`) and has
carried an un-prettier-compliant formatting since then — through `8d4c724` and
`021a1ea` — because both of those rounds' local verification only ran
`prettier --check` against the ONE file each round had actually edited, never the full
`pnpm format:check` CI actually runs across the whole scoped tree. Running the full
check locally this round (`pnpm exec prettier --check --end-of-line auto .`) found
exactly this one file, confirmed nothing else in the tracked scope is affected, and
`--write` produced a pure line-wrapping change (two multi-line expressions reflowed;
confirmed with `git diff`, no logic touched). Re-verified with `typecheck` and `lint`
(clean) and the full repo-wide format check (clean) after the fix.

This closes the actual root cause of BOTH run 9's and run 10's `Format check` failures —
run 9's Format-check failure was attributed entirely to the round's skipped local
verification at the time (correct, but incomplete: `pages.ts` needed fixing too and was
missed because verification was scoped too narrowly even after local checks resumed).

Pushed as `<pending>`, alongside run 11 (`021a1ea`, the self-check) which was already in
flight when this was found and will likely still show the same Format-check failure on
`pages.ts` for the same reason. Report pending on whichever run actually carries both
fixes.

### Run 12 (`e79d8cf`): Format check green, but the new self-check itself failed in all three engines — an instrument defect, not a BUG-014 finding (2026-09-22)

`Format check`: **green** — the `pages.ts` fix held. `Secret scan`: still the same
unresolved false positive. `Accessibility`: **failed**, but every actual sign-in state
(`signin-validation-error`, `signin-send-failed`, `signin-sent`) **passed cleanly in all
three engines** — the failures were entirely the new self-check test itself
(`harness-smoke.spec.ts`), in chromium, firefox and webkit. Per "Run 10 disposition"'s
own branch for this case ("FAILS ON THE DIAGNOSTICS THEMSELVES... fix the instrument
only, do not classify BUG-014 from that run"): the signature not recurring in this run
is noted, but this run still does not satisfy section 2, since the control that failed
is the proof mechanism itself.

**Root cause, confirmed from Next.js's own client source, not guessed:** the React
root-container scan in `installClickEventTracer` checked only
`document.querySelectorAll("*")` (Element nodes). Next.js's App Router hydrates directly
onto `document` itself — `node_modules/next/dist/client/app-index.js`:
`const appElement = document;` then `hydrateRoot(appElement, ...)` — and `document` is a
`Document`, not an `Element`, so `querySelectorAll("*")` can never include it. The scan
therefore reported "not found" 100% reproducibly (deterministic, not flaky).

**Fixed** (`packages/e2e/src/signin-click-diagnostics.ts`, test logic only): the scan
now checks `document` itself alongside the element scan. Verified with
typecheck/lint/full-repo format check (all clean) and by extending the same
serialization-simulation technique used for the run-9 fix: a
`__reactContainer$`-prefixed property set directly on a jsdom `document` (simulating
what React's real `hydrateRoot(document, ...)` does, since jsdom does not run real
React) is now correctly found, reported as `"document"`, and a dispatched click is
captured at both listener levels — which are the same node in this app, by its own
architecture, now documented in the code rather than assumed. Recorded in BUG-014.

C: free space: unchanged from the last check this round (no cleanup performed).

Pushed as `<pending>`, as the next sample.
