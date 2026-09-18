# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-09-18 — MVP-002 and MVP-006 confirmed **Done** (CI went green on `develop` after five real, distinct infrastructure bugs were found and fixed — see `planning/progress-report.md`'s 2026-09-18 CI-debugging entry). Product-owner constitution recorded (2026-09-17, see `docs/final-decisions.md`) and RLS implemented.

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 15 | MVP-004, MVP-005, MVP-007, MVP-008, MVP-009, MVP-012…MVP-017, MVP-019, MVP-021, MVP-023…MVP-025 |
| Ready | 6 | MVP-003, MVP-010, MVP-011, MVP-018, MVP-020, MVP-022 |
| In Progress | 0 | — |
| QA | 0 | — |
| Blocked | 0 | — |
| Done | 3 | MVP-001, MVP-002, MVP-006 |
| **Total** | **25** | |

MVP-002 and MVP-006 completing unblocked 4 new stories: MVP-010 (Free entitlement — depended on MVP-002;MVP-006), MVP-011 (Creator application — depended on MVP-002), MVP-018 (Transactional email — depended on MVP-002), MVP-020 (Consent/deletion — depended on MVP-002).

## Completed stories

### MVP-001 — Repository and CI Baseline
- Epic: Foundation · Requirement: NFR-007 · Priority: P0 · Sprint 1 · 5 pts
- Completed: 2026-09-16
- Full detail: `planning/progress-report.md`.

### MVP-002 — Account registration and session
- Epic: Identity · Requirement: FR-004 · Priority: P0 · Sprint 2 · 8 pts
- Completed: 2026-09-18 (implemented 2026-09-17, confirmed Done once CI's integration test suite actually ran and passed on 2026-09-18)
- Passwordless email magic-link sign-in, database-backed sessions, self-service session list/revoke with server-enforced ownership checks. Both unit and integration tests (real Postgres via CI service container) pass.
- Full detail, including the security review: `planning/progress-report.md`.

### MVP-006 — Quarantine scan and private storage
- Epic: Files · Requirement: FR-007 · Priority: P0 · Sprint 2 · 13 pts
- Completed: 2026-09-18 (implemented by a separate session ~2026-09-17, independently reviewed/verified/fixed and confirmed Done once CI's integration test suites actually ran and passed on 2026-09-18)
- Two-zone quarantine/clean storage, ClamAV malware scanning, magic-byte MIME verification, FileScan state machine enforced at both domain and repository layers. Unit and integration tests (real Postgres/MinIO/ClamAV via CI service containers) pass.
- Full detail, including the security review and provenance note: `planning/progress-report.md`.

## Progress metrics

- Stories done: 3 / 25 (12%)
- Points done: 26 / 165 (16%)
- P0 points done: 26 / 140 (19%)
- P1 points done: 0 / 25 (0%)
- Open bugs: 0 (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 1 (see `planning/tech-debt.csv` and `planning/tech-debt/`)
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning.

## Remaining work summary

22 of 25 stories remain (139 of 165 points). Grouped by sprint (sprint numbers = execution waves from `docs/13-implementation-readiness-plan.md` §8):

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-006 | **Done** | 21 (done) |
| 2 | MVP-003, MVP-022 | Ready | 16 |
| 3 | MVP-010, MVP-011, MVP-018, MVP-020 | Ready | 18 |
| 3 | MVP-004, MVP-005, MVP-017, MVP-023 | Backlog | 26 |
| 4 | MVP-007, MVP-012, MVP-021 | Backlog | 19 |
| 5 | MVP-008, MVP-013 | Backlog | 16 |
| 6 | MVP-009, MVP-014, MVP-019 | Backlog | 21 |
| 7 | MVP-015, MVP-016, MVP-024 | Backlog | 15 |
| 8 | MVP-025 (launch gate) | Backlog | 8 |

MVP-025 cannot start until every P0 story above it is Done.

## Next story recommendation

Six stories are now Ready: MVP-003 (Catalog), MVP-010 (Free entitlement), MVP-011 (Creator application), MVP-018 (Transactional email), MVP-020 (Consent/deletion), MVP-022 (Observability).

**Recommend MVP-022 (Observability)** first, unchanged reasoning from before: every story built so far (MVP-002, MVP-006) shipped with zero logging/tracing/correlation-ID infrastructure, and that gap only compounds. **MVP-003 (Catalog)** is the strongest alternative if content/SEO progress is the priority — it also unblocks the largest number of downstream P1 stories (MVP-017, MVP-021, MVP-023 all depend on it). MVP-010/011/018/020 are all small-to-medium (3–8 pts) and reasonable to parallelize alongside whichever of the above is picked first.

## Open bugs

None found. See `planning/bugs.csv` (index) and `planning/bugs/` — both empty. Several real issues were found and fixed during MVP-002/006's implementation and CI verification (see `planning/progress-report.md`'s entries) — per `CLAUDE.md`'s bug-vs-shortcut distinction, issues caught and fixed within the same story before it reaches Done are documented in the progress report, not filed as bugs.

## Open tech debt

1 open item (3 resolved). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
- [TD-001](tech-debt/TD-001.md) — Resolved (dependency audit non-blocking in CI).
- [TD-002](tech-debt/TD-002.md) — Resolved (vulnerable transitive Prisma-CLI deps).
- [TD-003](tech-debt/TD-003.md) — Resolved (RLS enabled on all tables).
- [TD-004](tech-debt/TD-004.md) — **Open**: MVP-006's file-scan pipeline runs synchronously in the request rather than via a durable job queue; no story yet owns job-queue infrastructure.

## Notes
- `planning/mvp-backlog.csv` is the canonical status record; `planning/backlog.csv` mirrors Sprint/Points/Status.
- `docs/final-decisions.md` (2026-09-17) is now the binding scope/architecture/process record, positioned above BRD/PRD/TRD/ADRs per `docs/00-document-index.md`.
- Branching model: `develop` is the integration branch, feature branches merge into it, `main` is promoted from `develop` as a deliberate release decision (not yet done for the 2026-09-17/18 work — `main` still sits at the original MVP-002/006 commit, `develop` has since moved ahead with the constitution, RLS, and five CI infrastructure fixes).
- See `planning/progress-report.md` for complete implementation detail on every story and governance action, including the full CI-debugging trail (five distinct root causes found and fixed via real GitHub Actions logs, not guessing) that took MVP-002/006 from QA to Done.
