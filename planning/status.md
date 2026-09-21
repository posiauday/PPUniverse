# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-09-21 — MVP-023 (manual and automated accessibility gate) is In Progress: the product owner's 2026-09-21 decisions (Q32–Q37, Q39–Q42; Q38 open) are recorded in `docs/final-decisions.md`, the estimate moves from 8 to 13 points, and implementation is authorized behind a stop-gate confirmation. **No code written yet.** MVP-021 is Done (PR #5, 458 tests, 0 skipped).

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 10 | MVP-008, MVP-009, MVP-012, MVP-013, MVP-014, MVP-015, MVP-016, MVP-019, MVP-024, MVP-025 |
| Ready | 6 | MVP-007, MVP-010, MVP-011, MVP-017, MVP-018, MVP-020 |
| In Progress | 1 | MVP-023 (decisions recorded; stop-gate confirmation pending; no code yet) |
| QA | 0 | — |
| Blocked | 0 | — |
| Done | 8 | MVP-001, MVP-002, MVP-003, MVP-004, MVP-005, MVP-006, MVP-021, MVP-022 |
| **Total** | **25** | |

MVP-005 unblocked MVP-007 (Checkout, which also needs MVP-002 — Done) and MVP-021 (SEO/sitemap); MVP-021 is now Done and, having no dependents, unblocks nothing new. MVP-007 is Ready — "Ready" means dependencies are met, and MVP-007 is still gated by unanswered product decisions (see the recommendation below).

## Completed stories

| Story | Epic | Requirement | Points | Completed |
|---|---|---|---|---|
| MVP-001 | Foundation | NFR-007 | 5 | 2026-09-16 |
| MVP-002 | Identity | FR-004 | 8 | 2026-09-18 |
| MVP-003 | Catalog | FR-001 | 8 | 2026-09-18 |
| MVP-004 | Catalog | FR-002 | 8 | 2026-09-21 |
| MVP-005 | Catalog | FR-003 | 5 | 2026-09-21 |
| MVP-006 | Files | FR-007 | 13 | 2026-09-18 |
| MVP-021 | SEO | FR-017 | 3 | 2026-09-21 |
| MVP-022 | Observability | NFR-007 | 8 | 2026-09-18 |

### MVP-004 — Catalog filtering and search
- Keyword search (real PostgreSQL full-text search, `to_tsvector`/`plainto_tsquery`/`ts_rank`), category filter, sort (relevance/recent/alphabetical), pagination, clear-all — all via shareable URLs, no client JavaScript required for the core interactions (plain forms/links, fully keyboard/screen-reader accessible by default).
- Two scope boundaries flagged and resolved before coding rather than silently decided: FR-002's license/compatibility/pricing filter axes deferred to MVP-005/007 (fields don't exist yet); "analytically tracked" satisfied via the existing `@ppu/telemetry` logger rather than PostHog (which MVP-022 deliberately deferred).
- Real bug found and fixed at the root: `packages/db`'s `prisma` export was constructed eagerly at module-import time, throwing before any `describe.skipIf` guard could run for a package that only needed the `Prisma.sql` value helper. Fixed with a lazy `Proxy` — benefits every future consumer, not just this story.
- Full detail, including the security and accessibility reviews: `planning/progress-report.md`.

### MVP-005 — Product detail evidence model
- The product page now shows license tiers, the current published version, the support declaration and a compatibility matrix (platform area, minimum release wave, evidence status, last verified, notes), using the compatibility model the product owner approved on 2026-09-21 (closes open question 6 part 1). Products with no evidence show explicit "not provided" wording; no `Product` rows or compatibility data were invented or seeded.
- The database enforces the rules independently of the code (CHECK constraints, unique index, RLS). Proven on real Postgres, and by 18 new DB-gated tests that **passed in CI** (PR #4) — the CI Postgres log shows the constraints rejecting the deliberately-invalid rows.
- Accessibility: real table semantics, status shown as text (never colour alone), labelled keyboard-focusable scroll region on mobile; axe-core 0 violations at 1024px and 375px. Not covered: a real screen-reader pass (MVP-023's scope).
- Recorded rather than hidden: TD-006 (no write path calls the evidence validator yet; no private-data screening), TD-007 (other FR-003 items have no owning story; no E2E yet). FR-003 is **Partially Implemented**. Also caught at the start of this story: FR-002's traceability had been overstated after MVP-004 (TD-005).
- Full detail, including the security and accessibility reviews: `planning/progress-report.md`.

### MVP-021 — Metadata, sitemap, canonical, structured data
- Canonical URLs, page metadata, Open Graph and Twitter tags, `sitemap.xml`, `robots.txt` and schema.org JSON-LD, under the product owner's 2026-09-21 decisions. The site origin is `NEXT_PUBLIC_SITE_URL`, validated in one place, read at runtime, and failing safe (no incorrect canonical URLs) when missing or invalid in production.
- Deny-by-default robots (every page `noindex` unless it opts in). Category policy as approved: empty categories `noindex` and out of the sitemap; valid `?page=N` self-canonical; search, sort, filter and mixed variants `noindex` with the base canonical — an intentional corrective SEO change owned by this story, with MVP-004's search unchanged. Product JSON-LD ships **without Offer data** and with no rich-result claim.
- Verified on the real pages against a real Postgres (dev and production builds), a hostile product in the live browser DOM, and six production site-URL scenarios; **CI: 458 tests passed, 0 skipped**, including all DB-gated suites.
- Recorded: BUG-001 resolved; **BUG-002** (a repeated `q` returns HTTP 500 — MVP-004 code, out of scope, needs a decision, open question 32); TD-009 and TD-010. TD-008 was not touched.
- Full detail, including the security and accessibility reviews: `planning/progress-report.md`.

Full detail on every story is in `planning/progress-report.md`.

## Progress metrics

- Stories done: 8 / 25 (32%)
- Points done: 58 / 170 (34%)
- P0 points done: 58 / 145 (40%)
- P1 points done: 0 / 25 (0%)
- Open bugs: 7 (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 7 (see `planning/tech-debt.csv` and `planning/tech-debt/`)
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning except MVP-023 (8 → 13 on 2026-09-21: the WCAG A/AA corrective fixes are in scope, decision Q37).

## Remaining work summary

17 of 25 stories remain (112 of 170 points).

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-003, MVP-006, MVP-022 | **Done** | 37 (done) |
| 3 | MVP-004, MVP-005 | **Done** | 13 (done) |
| 3 | MVP-023 | **In Progress** (decisions recorded; 13 points, was 8) | 13 |
| 3 | MVP-010, MVP-011, MVP-017, MVP-018, MVP-020 | Ready | 23 |
| 4 | MVP-021 | **Done** | 3 (done) |
| 4 | MVP-007 | Ready | 8 |
| 4 | MVP-012 | Backlog | 8 |
| 5 | MVP-008, MVP-013 | Backlog | 16 |
| 6 | MVP-009, MVP-014, MVP-019 | Backlog | 21 |
| 7 | MVP-015, MVP-016, MVP-024 | Backlog | 15 |
| 8 | MVP-025 (launch gate) | Backlog | 8 |

MVP-025 cannot start until every P0 story above it is Done.

## Next story recommendation

**MVP-023 (Manual and automated accessibility gate)** is In Progress: P0, 13 points (revised from 8 by the 2026-09-21 product-owner decision), depends only on MVP-003, and its decisions are recorded in `docs/final-decisions.md`; implementation is authorized behind a stop-gate confirmation. It brings the axe and Playwright harness that would close the E2E half of TD-007, and there are now real catalog, category and product journeys to test.

Two things need the product owner rather than a story: **TD-008** (the compatibility-evidence vocabulary correction) is a separate small change that must land before MVP-012, and **BUG-002** (a repeated `q` returns HTTP 500 — MVP-004 code) is now the proposed corrective story PROP-006 (Proposed, sequenced after MVP-023, not scheduled; open question 32).

Dependency-Ready but gated by unanswered product decisions, so not recommended until those are answered: **MVP-007 (Checkout)** — open questions 3 (countries/currencies/tax/refunds), 7 (pricing) and 8 (payout model); **MVP-011 (Creator application)** — open questions 2 (first-party-only vs invited creators) and 8 (creator commercial terms). MVP-010, MVP-017, MVP-018, MVP-020 also remain Ready.

## Open bugs

7 open, 1 resolved:
- [BUG-001](bugs/BUG-001.md) — **Resolved** by MVP-021 (PR #5, 2026-09-21): delivered pages emitted relative canonical/`og:url` tags and sign-in/account pages were indexable. No production deployment existed, so nothing was exposed.
- [BUG-002](bugs/BUG-002.md) (P3, found 2026-09-21 while verifying MVP-021) — a repeated `q` parameter (`?q=a&q=b`) makes `/search` and category pages return HTTP 500 (`normalizeQuery` calls `.trim()` on an array). MVP-004 code; MVP-021 may not change MVP-004 search behavior, so it is recorded, not fixed — see open question 32.

- **BUG-003 to BUG-008** (found 2026-09-21 while measuring the MVP-023 accessibility baseline on the real pages; all NFR-001): [BUG-003](bugs/BUG-003.md) invisible keyboard focus ring on the Search button (P2, measured 1.06:1); [BUG-004](bugs/BUG-004.md) search input border 1.35:1 and placeholder 3.46:1 (P3); [BUG-005](bugs/BUG-005.md) sign-in generic error, focus dropped, unstyled page and title (P2); [BUG-006](bugs/BUG-006.md) session revoke drops focus and announces nothing (P3); [BUG-007](bugs/BUG-007.md) skipped heading levels in card lists (P3); [BUG-008](bugs/BUG-008.md) default 404 has no main landmark (P3). Whether MVP-023 fixes them or they are scheduled separately is open question 37.

Earlier real issues (this story's `packages/db` eager-construction bug, and MVP-003's Tailwind/rendering bugs before it) were all caught and fixed within their own story before reaching Done — per `CLAUDE.md`'s bug-vs-shortcut distinction, documented in `planning/progress-report.md`, not filed as bugs.

## Open tech debt

7 open items (3 resolved). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
- [TD-001](tech-debt/TD-001.md), [TD-002](tech-debt/TD-002.md), [TD-003](tech-debt/TD-003.md) — Resolved.
- [TD-004](tech-debt/TD-004.md) — **Open**: MVP-006's file-scan pipeline runs synchronously rather than via a durable job queue.
- [TD-005](tech-debt/TD-005.md) — **Open** (new, 2026-09-21): FR-002's license/compatibility/free-paid/accessibility-status/update-recency filters (and "AI") were deferred by MVP-004; FR-002 traceability corrected from "Implemented" to "Partially Implemented". Update: MVP-005 now supplies the license and compatibility fields, so those two filters are unblocked pending a backlog decision.
- [TD-006](tech-debt/TD-006.md) — **Open** (new, 2026-09-21): compatibility write-time rules (`validateCompatibilityEntry`) exist but no write path calls them yet, and nothing screens notes/summaries for private data — for MVP-012/013 to enforce.
- [TD-007](tech-debt/TD-007.md) — **Open** (new, 2026-09-21): FR-003 items beyond license/version/support/compatibility (creator, screenshots, demo, price, prerequisites, setup, accessibility statement, changelog, version history, related assets) have no approved delivering story, and there is no Playwright E2E for the product page; FR-003 traceability is "Partially Implemented". Ownership dispositions were recorded 2026-09-21: creator to MVP-011, price to MVP-007, the rest proposed (not approved).
- [TD-008](tech-debt/TD-008.md) — **Open** (new, 2026-09-21): merged MVP-005 still implements the Tested / Creator Declared / Not Verified vocabulary; the product owner's 2026-09-21 decision makes Creator Declared and Marketplace Reviewed the only assignable statuses and reserves Tested. No user-visible harm today (no product data exists). Decisions recorded 2026-09-21 (Not Verified is legacy/reserved; a reviewed-at timestamp is approved); a separate small corrective change is required before MVP-012 permits compatibility-evidence writes and is **not** part of MVP-021.
- [TD-009](tech-debt/TD-009.md) — **Open** (new, 2026-09-21): no environment-level noindex switch for staging/preview deployments; needs the hosting decision (open question 5).
- [TD-010](tech-debt/TD-010.md) — **Open** (new, 2026-09-21, Low): the sitemap is one file capped at 50,000 URLs (no sitemap index, no `lastmod`).

## Proposed stories (not approved — not on the board, not counted above)
[`planning/proposed-stories.md`](proposed-stories.md) holds five proposals from the product owner's 2026-09-21 FR-003 disposition: PROP-001 Product Media and Screenshots, PROP-002 Product Documentation and Prerequisites, PROP-003 Product Accessibility Disclosure, PROP-004 Product Releases and Changelog, PROP-005 Related Assets (deferred). Status **Proposed** until the product owner directly approves each. Creator (ownership) is assigned to MVP-011 and price to MVP-007.

## Notes
- `planning/mvp-backlog.csv` is the canonical status record; `planning/backlog.csv` mirrors Sprint/Points/Status.
- `docs/final-decisions.md` is the binding scope/architecture/process record; `CLAUDE.md`'s Decision Validation Rule and the stop-conditions protocol have now each caught real scope-boundary issues before code was written (license tiers, MVP-003's "filtering framework", MVP-004's analytics-tracking conflict).
- Branching: `develop` is the integration branch (real PRs via `gh`); `main` is promoted from it as a deliberate release decision (not yet done).
- See `planning/progress-report.md` for complete implementation detail on every story and governance action.
