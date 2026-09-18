# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-09-17 — MVP-002 and MVP-006 implemented (both held in QA pending integration-test verification); product-owner constitution recorded in `docs/final-decisions.md`; RLS implemented (closes TD-003); `develop` + feature-branch workflow established (`main` frozen at the MVP-002/006 commits, all new work now branches from `develop`). Full detail: `planning/progress-report.md`'s 2026-09-17 constitution entry.

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 19 | MVP-004, MVP-005, MVP-007…MVP-021, MVP-023…MVP-025 |
| Ready | 2 | MVP-003, MVP-022 |
| In Progress | 0 | — |
| QA | 2 | MVP-002, MVP-006 |
| Blocked | 0 | — |
| Done | 1 | MVP-001 |
| **Total** | **25** | |

A story is **Ready** only when every story listed in its `Depends on` column (`planning/mvp-backlog.csv`) is Done. MVP-002 and MVP-006 are both in **QA**, not Done: implemented and verified as far as this environment allows, but each has an integration test suite that has never actually executed (no Docker/Postgres/MinIO/ClamAV available in this sandbox) — see `planning/progress-report.md` for both stories' full detail. Stories depending on them (MVP-007, MVP-009, MVP-010, MVP-011, MVP-012, MVP-018, MVP-020) stay Backlog until their dependencies reach Done.

## Completed stories

### MVP-001 — Repository and CI Baseline
- Epic: Foundation · Requirement: NFR-007 · Priority: P0 · Sprint 1 · 5 pts
- Completed: 2026-09-16
- Acceptance criteria met: build runs successfully, lint runs successfully, type checking runs successfully, unit testing framework configured, GitHub Actions CI pipeline created, repository structure aligns with TRD, documentation updated.
- Full detail: `planning/progress-report.md`.

## In QA

### MVP-002 — Account registration and session
- Epic: Identity · Requirement: FR-004 · Priority: P0 · Sprint 2 · 8 pts
- Implemented: 2026-09-17
- What's verified: unit tests (session authorization + repository) pass; migration applied to a real Postgres (Supabase) and schema/constraints independently confirmed (unique email, cascade delete); full typecheck/lint/build/format/audit clean from a genuinely clean build state.
- What's blocking Done: the `PrismaSessionRepository` integration test suite has never executed (no local Docker/Postgres in this environment) — it correctly self-skips rather than claiming a false pass. Resolves on first CI run (Postgres service container now wired in) or a local `docker compose up -d` run.
- Full detail, including the security review: `planning/progress-report.md`.

### MVP-006 — Quarantine scan and private storage
- Epic: Files · Requirement: FR-007 · Priority: P0 · Sprint 2 · 13 pts
- Implemented: 2026-09-17 (by a separate session, found complete on disk and independently reviewed/verified/fixed in this session — see provenance note in `planning/progress-report.md`)
- What's verified: unit tests pass across all domain modules (state machine, deliverability gate, upload policy, magic-byte detection); `file_scans` schema/constraints confirmed against the same real Postgres project used for MVP-002; a real concurrency bug in the build pipeline was found and fixed (`turbo.json` task graph); full typecheck/lint/build/format/audit clean.
- What's blocking Done: the `PrismaFileScanRepository`, `S3StorageAdapter`, and `ClamavScanAdapter` integration test suites have never executed (no Docker in this environment). MinIO and ClamAV service containers were wired into CI and `docker-compose.yml` this session, so this resolves on the next CI run or a local `docker compose up -d` run.
- Full detail, including the security review: `planning/progress-report.md`.

## Progress metrics

- Stories done: 1 / 25 (4%)
- Stories in QA: 2 / 25 (8%)
- Points done: 5 / 165 (3%)
- Points in QA: 21 / 165 (13%)
- P0 points done: 5 / 140 (4%)
- P1 points done: 0 / 25 (0%)
- Open bugs: 0 (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 2 (see `planning/tech-debt.csv` and `planning/tech-debt/`)
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning.

## Remaining work summary

22 of 25 stories remain in Backlog/Ready (2 in QA, 1 Done). Grouped by sprint (sprint numbers = execution waves from `docs/13-implementation-readiness-plan.md` §8):

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-006 | **QA** | 21 (pending) |
| 2 | MVP-003, MVP-022 | Ready | 16 |
| 3 | MVP-004, MVP-005, MVP-010, MVP-011, MVP-017, MVP-018, MVP-020, MVP-023 | Backlog | 44 |
| 4 | MVP-007, MVP-012, MVP-021 | Backlog | 19 |
| 5 | MVP-008, MVP-013 | Backlog | 16 |
| 6 | MVP-009, MVP-014, MVP-019 | Backlog | 21 |
| 7 | MVP-015, MVP-016, MVP-024 | Backlog | 15 |
| 8 | MVP-025 (launch gate) | Backlog | 8 |

MVP-025 cannot start until every P0 story above it is Done.

## Next story recommendation

**MVP-022 — Observability** (Epic: Observability, Requirement: NFR-007, Priority: P0, Sprint 2, 8 pts). Rationale: both MVP-002 and MVP-006 are implemented but held in QA (their own remaining step is a CI/local verification run, not more implementation work — picking up new work isn't blocked by this). Of the two remaining Ready stories, MVP-022 is recommended over MVP-003 (Catalog) because every story built so far has shipped with zero logging/tracing/correlation-ID infrastructure — the observability gap only compounds the longer it's deferred, and MVP-022 is foundational/cross-cutting rather than feature-specific. MVP-003 (Catalog) remains an equally valid parallel candidate if content/SEO progress is the priority instead.

## Open bugs

None found. See `planning/bugs.csv` (index) and `planning/bugs/` (full records, `BUG-XXX.md` per `planning/github/04-bug-template.md`) — both empty. (Several real issues were hit and fixed during MVP-002 and MVP-006's implementation/review — Prisma 7 API changes, a bundler-resolution gap, a turbo task-graph race condition, missing CI service containers — but per `CLAUDE.md`'s bug-vs-shortcut distinction, issues caught and fixed within the same story before it reaches Done are documented in `planning/progress-report.md`, not filed as bugs.)

## Open tech debt

4 tracked items (2 resolved this session, 1 carried over open, 1 new). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
- [TD-001](tech-debt/TD-001.md) — Resolved (was: dependency audit non-blocking in CI).
- [TD-002](tech-debt/TD-002.md) — Resolved (vulnerable transitive Prisma-CLI deps, pinned via override).
- [TD-003](tech-debt/TD-003.md) — **Open**: RLS disabled on the `ppuniverse-dev` Supabase dev/test database (now covers `file_scans` too, as of MVP-006); ties to `docs/open-questions.md` items 5 and 16.
- [TD-004](tech-debt/TD-004.md) — **Open** (new): the MVP-006 file-scan pipeline runs synchronously in the request rather than via a durable job queue; no story yet owns job-queue infrastructure.

## Notes
- `planning/mvp-backlog.csv` is the canonical status record (see `CLAUDE.md` "Project management rules"); `planning/backlog.csv` mirrors Sprint/Points/Status.
- `planning/requirement-traceability.csv` FR-004, FR-007, and NFR-002 rows updated to reflect MVP-002/MVP-006's real (partial — QA) evidence.
- A temporary Supabase project (`ppuniverse-dev`) was provisioned for MVP-002's real-database verification (user-approved) and reused for MVP-006's; doing so required pausing an unrelated existing project to stay within the free-tier project limit. See `planning/progress-report.md` for full detail.
- MVP-006's implementation was found already complete on disk at the start of this session's continuation, built by a separate, already-ended Claude Code session on this machine — this session reviewed it independently, found and fixed a real build-pipeline race condition plus formatting/lint gaps, added the missing MinIO/ClamAV CI infrastructure, and completed the tracking-doc catch-up. See the provenance note in `planning/progress-report.md`'s MVP-006 section.
- See `planning/progress-report.md` for complete implementation detail on MVP-001, MVP-002, and MVP-006, including both QA stories' full security reviews.
