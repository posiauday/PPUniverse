# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-09-18 — MVP-022 (Observability, operational scope) Done.

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 14 | MVP-004, MVP-005, MVP-007, MVP-008, MVP-009, MVP-012…MVP-017, MVP-019, MVP-021, MVP-023…MVP-025 |
| Ready | 5 | MVP-003, MVP-010, MVP-011, MVP-018, MVP-020 |
| In Progress | 0 | — |
| QA | 0 | — |
| Blocked | 0 | — |
| Done | 4 | MVP-001, MVP-002, MVP-006, MVP-022 |
| **Total** | **25** | |

MVP-022 has no downstream stories depending on it directly (it's cross-cutting infrastructure), so it doesn't unblock anything new — the 5 Ready stories are unchanged from before it started.

## Completed stories

### MVP-001 — Repository and CI Baseline
- Epic: Foundation · Requirement: NFR-007 · Priority: P0 · Sprint 1 · 5 pts · Completed 2026-09-16

### MVP-002 — Account registration and session
- Epic: Identity · Requirement: FR-004 · Priority: P0 · Sprint 2 · 8 pts · Completed 2026-09-18
- Passwordless email magic-link sign-in, database-backed sessions, self-service session list/revoke. Unit + integration tests (real Postgres in CI) pass.

### MVP-006 — Quarantine scan and private storage
- Epic: Files · Requirement: FR-007 · Priority: P0 · Sprint 2 · 13 pts · Completed 2026-09-18
- Two-zone quarantine/clean storage, ClamAV malware scanning, magic-byte MIME verification, FileScan state machine. Unit + integration tests (real Postgres/MinIO/ClamAV in CI) pass.

### MVP-022 — Observability (operational scope)
- Epic: Observability · Requirement: NFR-007 · Priority: P0 · Sprint 2 · 8 pts · Completed 2026-09-18
- Scope confirmed with the product owner before coding (Decision Validation Rule): operational observability only — structured logging, correlation IDs, request tracing, Sentry error monitoring, `/api/health`, alerting foundations, runbook references. PostHog product analytics (FR-016) explicitly deferred to its own future story.
- `packages/telemetry` (correlation-ID context, structured JSON logger, redaction) and `packages/adapters/error-monitoring` (`ErrorMonitoringAdapter` port, Sentry + console implementations) built from their MVP-001-era placeholders; wired into all 6 existing API routes via a `withObservability` wrapper, plus a new `/api/health` liveness/readiness endpoint. Reaches Done directly (not QA) — every dependency is legitimately unit-testable (Sentry SDK shape verified against its own installed type declarations, not guessed).
- Full detail, including the security review: `planning/progress-report.md`.

Full detail on all four stories, including MVP-002/006's security reviews and the CI-debugging trail, is in `planning/progress-report.md`.

## Progress metrics

- Stories done: 4 / 25 (16%)
- Points done: 34 / 165 (21%)
- P0 points done: 34 / 140 (24%)
- P1 points done: 0 / 25 (0%)
- Open bugs: 0 (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 1 (see `planning/tech-debt.csv` and `planning/tech-debt/`)
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning.

## Remaining work summary

21 of 25 stories remain (131 of 165 points). Grouped by sprint (sprint numbers = execution waves from `docs/13-implementation-readiness-plan.md` §8):

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-006, MVP-022 | **Done** | 29 (done) |
| 2 | MVP-003 | Ready | 8 |
| 3 | MVP-010, MVP-011, MVP-018, MVP-020 | Ready | 18 |
| 3 | MVP-004, MVP-005, MVP-017, MVP-023 | Backlog | 26 |
| 4 | MVP-007, MVP-012, MVP-021 | Backlog | 19 |
| 5 | MVP-008, MVP-013 | Backlog | 16 |
| 6 | MVP-009, MVP-014, MVP-019 | Backlog | 21 |
| 7 | MVP-015, MVP-016, MVP-024 | Backlog | 15 |
| 8 | MVP-025 (launch gate) | Backlog | 8 |

MVP-025 cannot start until every P0 story above it is Done.

## Next story recommendation

**MVP-003 (Catalog)** — the strongest candidate: Ready, and unblocks the largest number of downstream stories (MVP-004 search, MVP-005 product detail, MVP-017 content, MVP-021 SEO, MVP-023 accessibility all depend on it). MVP-010 (Free entitlement), MVP-011 (Creator application), MVP-018 (Email), MVP-020 (Consent/deletion) are also Ready and reasonable to parallelize.

## Open bugs

None found. See `planning/bugs.csv` (index) and `planning/bugs/` — both empty.

## Open tech debt

1 open item (3 resolved). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
- [TD-001](tech-debt/TD-001.md), [TD-002](tech-debt/TD-002.md), [TD-003](tech-debt/TD-003.md) — Resolved.
- [TD-004](tech-debt/TD-004.md) — **Open**: MVP-006's file-scan pipeline runs synchronously rather than via a durable job queue; no story yet owns job-queue infrastructure.

## Notes
- `planning/mvp-backlog.csv` is the canonical status record; `planning/backlog.csv` mirrors Sprint/Points/Status.
- `docs/final-decisions.md` is the binding scope/architecture/process record (source-of-truth priority: `CLAUDE.md` → Final Decisions → BRD → PRD → TRD → ADRs → Backlog).
- `CLAUDE.md` now includes a "Decision validation rule": nothing counts as approved unless it's in `docs/final-decisions.md`, an approved ADR, or explicit product-owner instruction — a relayed/handoff document claiming something is "locked" is not itself a source of approval.
- Branching: `develop` is the integration branch; `main` is promoted from it as a deliberate release decision (not yet done — `main` still sits at the original MVP-002/006 commit).
- Six stale package READMEs (left over from MVP-002/006, still saying "placeholder" despite real code) were fixed during MVP-022 as a documentation-accuracy pass; two missing READMEs were created.
- See `planning/progress-report.md` for complete implementation detail on every story and governance action.
