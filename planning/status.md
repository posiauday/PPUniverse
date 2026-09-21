# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-09-21 — MVP-005 (Product detail evidence model) implemented and locally verified, now in QA awaiting CI (the DB-gated integration tests only run there). It is not Done until CI is green. Product-owner compatibility model recorded (`docs/final-decisions.md`, closes open question 6 part 1).

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 12 | MVP-007, MVP-008, MVP-009, MVP-012, MVP-013, MVP-014, MVP-015, MVP-016, MVP-019, MVP-021, MVP-024, MVP-025 |
| Ready | 6 | MVP-010, MVP-011, MVP-017, MVP-018, MVP-020, MVP-023 |
| In Progress | 0 | — |
| QA | 1 | MVP-005 (implemented; awaiting CI confirmation) |
| Blocked | 0 | — |
| Done | 6 | MVP-001, MVP-002, MVP-003, MVP-004, MVP-006, MVP-022 |
| **Total** | **25** | |

MVP-005 is the last story to enter QA. Once it is Done it unblocks MVP-007 (Checkout, also needs MVP-002 — Done) and MVP-021 (SEO/sitemap); neither is promoted to Ready until then.

## Completed stories

| Story | Epic | Requirement | Points | Completed |
|---|---|---|---|---|
| MVP-001 | Foundation | NFR-007 | 5 | 2026-09-16 |
| MVP-002 | Identity | FR-004 | 8 | 2026-09-18 |
| MVP-003 | Catalog | FR-001 | 8 | 2026-09-18 |
| MVP-004 | Catalog | FR-002 | 8 | 2026-09-21 |
| MVP-006 | Files | FR-007 | 13 | 2026-09-18 |
| MVP-022 | Observability | NFR-007 | 8 | 2026-09-18 |

### MVP-004 — Catalog filtering and search
- Keyword search (real PostgreSQL full-text search, `to_tsvector`/`plainto_tsquery`/`ts_rank`), category filter, sort (relevance/recent/alphabetical), pagination, clear-all — all via shareable URLs, no client JavaScript required for the core interactions (plain forms/links, fully keyboard/screen-reader accessible by default).
- Two scope boundaries flagged and resolved before coding rather than silently decided: FR-002's license/compatibility/pricing filter axes deferred to MVP-005/007 (fields don't exist yet); "analytically tracked" satisfied via the existing `@ppu/telemetry` logger rather than PostHog (which MVP-022 deliberately deferred).
- Real bug found and fixed at the root: `packages/db`'s `prisma` export was constructed eagerly at module-import time, throwing before any `describe.skipIf` guard could run for a package that only needed the `Prisma.sql` value helper. Fixed with a lazy `Proxy` — benefits every future consumer, not just this story.
- Full detail, including the security and accessibility reviews: `planning/progress-report.md`.

Full detail on every story is in `planning/progress-report.md`.

## Progress metrics

- Stories done: 6 / 25 (24%)
- Points done: 50 / 165 (30%)
- P0 points done: 50 / 140 (36%)
- P1 points done: 0 / 25 (0%)
- Open bugs: 0 (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 4 (see `planning/tech-debt.csv` and `planning/tech-debt/`)
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning.

## Remaining work summary

19 of 25 stories remain (115 of 165 points).

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-003, MVP-006, MVP-022 | **Done** | 37 (done) |
| 3 | MVP-004 | **Done** | 8 (done) |
| 3 | MVP-005 | **QA** (awaiting CI) | 5 |
| 3 | MVP-010, MVP-011, MVP-017, MVP-018, MVP-020, MVP-023 | Ready | 31 |
| 4 | MVP-007, MVP-012, MVP-021 | Backlog | 19 |
| 5 | MVP-008, MVP-013 | Backlog | 16 |
| 6 | MVP-009, MVP-014, MVP-019 | Backlog | 21 |
| 7 | MVP-015, MVP-016, MVP-024 | Backlog | 15 |
| 8 | MVP-025 (launch gate) | Backlog | 8 |

MVP-025 cannot start until every P0 story above it is Done.

## Next story recommendation

First, finish **MVP-005** (QA — awaiting CI confirmation that the DB-gated tests pass, then it can be marked Done).

Once it is Done, the recommended next story is **MVP-021 (Metadata, sitemap, canonical, structured data)**: it depends only on MVP-005, is the smallest P0 (3 points), is not gated by any open product decision, and builds directly on the product pages MVP-005 just made real. **MVP-023 (accessibility gate)** is the strongest follow-up — it also brings the Playwright/axe harness that would close the E2E half of TD-007.

Dependency-Ready but gated by unanswered product decisions, so not recommended until those are answered: **MVP-007 (Checkout)** — open questions 3 (countries/currencies/tax/refunds), 7 (pricing) and 8 (payout model); **MVP-011 (Creator application)** — open questions 2 (first-party-only vs invited creators) and 8 (creator commercial terms). MVP-010, MVP-017, MVP-018, MVP-020 also remain Ready.

## Open bugs

None found. See `planning/bugs.csv` (index) and `planning/bugs/` — both empty. Real issues (this story's `packages/db` eager-construction bug, and MVP-003's Tailwind/rendering bugs before it) were all caught and fixed within their own story before reaching Done — per `CLAUDE.md`'s bug-vs-shortcut distinction, documented in `planning/progress-report.md`, not filed as bugs.

## Open tech debt

4 open items (3 resolved). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
- [TD-001](tech-debt/TD-001.md), [TD-002](tech-debt/TD-002.md), [TD-003](tech-debt/TD-003.md) — Resolved.
- [TD-004](tech-debt/TD-004.md) — **Open**: MVP-006's file-scan pipeline runs synchronously rather than via a durable job queue.
- [TD-005](tech-debt/TD-005.md) — **Open** (new, 2026-09-21): FR-002's license/compatibility/free-paid/accessibility-status/update-recency filters (and "AI") were deferred by MVP-004; FR-002 traceability corrected from "Implemented" to "Partially Implemented". Update: MVP-005 now supplies the license and compatibility fields, so those two filters are unblocked pending a backlog decision.
- [TD-006](tech-debt/TD-006.md) — **Open** (new, 2026-09-21): compatibility write-time rules (`validateCompatibilityEntry`) exist but no write path calls them yet, and nothing screens notes/summaries for private data — for MVP-012/013 to enforce.
- [TD-007](tech-debt/TD-007.md) — **Open** (new, 2026-09-21): FR-003 items beyond license/version/support/compatibility (creator, screenshots, demo, price, prerequisites, setup, accessibility statement, changelog, version history, related assets) have no delivering story, and there is no Playwright E2E for the product page; FR-003 traceability is "Partially Implemented".

## Notes
- `planning/mvp-backlog.csv` is the canonical status record; `planning/backlog.csv` mirrors Sprint/Points/Status.
- `docs/final-decisions.md` is the binding scope/architecture/process record; `CLAUDE.md`'s Decision Validation Rule and the stop-conditions protocol have now each caught real scope-boundary issues before code was written (license tiers, MVP-003's "filtering framework", MVP-004's analytics-tracking conflict).
- Branching: `develop` is the integration branch (real PRs via `gh`); `main` is promoted from it as a deliberate release decision (not yet done).
- See `planning/progress-report.md` for complete implementation detail on every story and governance action.
