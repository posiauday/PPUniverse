# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-09-22 — MVP-010 (Free entitlement flow, FR-005) pre-work analysis delivered on `feature/mvp-010-free-entitlement` (`planning/prework/MVP-010-prework-analysis.md`); **pre-work only, no code written**, per the product-owner instruction. Two items need a decision before implementation: open questions 44 (free-download sign-in policy) and 45 (entitlement revocation), both with a safest-reversible default proposed and neither approved. A gap found in passing: `packages/domain/entitlements/README.md`'s placeholder attributes entitlement ownership to MVP-009; the traceability CSV and backlog already correctly assign FR-005 to MVP-010 — the README needs correcting as part of this story, not a separate one.

MVP-023 (manual and automated accessibility gate) is **Done and merged**. PR #6 merged via `gh pr merge` (merge commit `ed9b09b`, not squashed) after the final CI run (`aed24d8`, re-confirmed on the actual merged head `7e10c4a`) went green on all three jobs: 423/423 accessibility checks, 0 skipped, 0 retries, self-check passing in all three engines, every DB-gated integration suite passing for real, Secret scan clean. The `develop` branch-protection rule is live (confirmed by reading it back directly, not assumed); the security review and the accessibility review sign-off are recorded in `docs/final-decisions.md`. NFR-001 and NFR-008 are Implemented. Findings resolved along the way: BUG-012 (production `@ppu/db` connection-pool defect, root-fixed), BUG-013 (Firefox title-disappearance after a session revoke, mitigated), and a secret-scanner false positive (a fingerprint-scoped `.gitleaksignore`, this repository's first suppression, `docs/final-decisions.md`). **BUG-014** (intermittent Firefox @320px sign-in-submit signature) stays **open, monitor-only, permanently instrumented** — three occurrences across sixteen CI runs, two evidence-backed investigation rounds complete, root cause unproven, does not block.

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 10 | MVP-008, MVP-009, MVP-012, MVP-013, MVP-014, MVP-015, MVP-016, MVP-019, MVP-024, MVP-025 |
| Ready | 5 | MVP-007, MVP-011, MVP-017, MVP-018, MVP-020 |
| In Progress | 1 | MVP-010 (pre-work delivered, awaiting decision on open questions 44/45 before implementation) |
| QA | 0 | — |
| Blocked | 0 | — |
| Done | 9 | MVP-001, MVP-002, MVP-003, MVP-004, MVP-005, MVP-006, MVP-021, MVP-022, MVP-023 |
| **Total** | **25** | |

MVP-005 unblocked MVP-007 (Checkout, which also needs MVP-002 — Done) and MVP-021 (SEO/sitemap); MVP-021 is now Done and, having no dependents, unblocks nothing new. MVP-023 (depends only on MVP-003, already Done) likewise has no dependents in `planning/mvp-backlog.csv` and unblocks nothing new by itself — its value is the accessibility harness (`packages/e2e`) every future UI story now runs against, and the branch-protection rule now enforcing it. MVP-007 is Ready — "Ready" means dependencies are met, and MVP-007 is still gated by unanswered product decisions (see the recommendation below).

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

- Stories done: 9 / 25 (36%)
- Points done: 71 / 170 (42%)
- P0 points done: 71 / 145 (49%)
- P1 points done: 0 / 25 (0%)
- Open bugs: 5 (BUG-002, BUG-009, BUG-010, BUG-011, BUG-014); 1 mitigated not root-fixed (BUG-013); 8 resolved (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 9 (see `planning/tech-debt.csv` and `planning/tech-debt/`)
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning except MVP-023 (8 → 13 on 2026-09-21: the WCAG A/AA corrective fixes are in scope, decision Q37).

## Remaining work summary

16 of 25 stories remain (99 of 170 points).

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-003, MVP-006, MVP-022 | **Done** | 37 (done) |
| 3 | MVP-004, MVP-005 | **Done** | 13 (done) |
| 3 | MVP-023 | **Done** | 13 (done) |
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

**MVP-010 (Free entitlement flow)**: P0, dependencies MVP-002 and MVP-006, both Done, and not gated by any open product decision. **MVP-020 (Consent, legal deletion workflow)** is equally unblocked (P0, depends only on MVP-002) and is the other clean option. MVP-017 and MVP-018 (P1) are also Ready and ungated. It brings the axe and Playwright harness that would close the E2E half of TD-007, and there are now real catalog, category and product journeys to test.

Two things need the product owner rather than a story: **TD-008** (the compatibility-evidence vocabulary correction) is a separate small change that must land before MVP-012, and **BUG-002** (a repeated `q` returns HTTP 500 — MVP-004 code) is now the proposed corrective story PROP-006 (Proposed, sequenced after MVP-023, not scheduled; open question 32).

Dependency-Ready but gated by unanswered product decisions, so not recommended until those are answered: **MVP-007 (Checkout)** — open questions 3 (countries/currencies/tax/refunds), 7 (pricing) and 8 (payout model); **MVP-011 (Creator application)** — open questions 2 (first-party-only vs invited creators) and 8 (creator commercial terms). MVP-010, MVP-017, MVP-018, MVP-020 also remain Ready.

## Open bugs

5 open, 1 mitigated (not root-fixed), 8 resolved:
- [BUG-001](bugs/BUG-001.md) — **Resolved** by MVP-021 (PR #5, 2026-09-21): delivered pages emitted relative canonical/`og:url` tags and sign-in/account pages were indexable. No production deployment existed, so nothing was exposed.
- [BUG-002](bugs/BUG-002.md) (P3, found 2026-09-21 while verifying MVP-021) — a repeated `q` parameter (`?q=a&q=b`) makes `/search` and category pages return HTTP 500 (`normalizeQuery` calls `.trim()` on an array). MVP-004 code; MVP-021 may not change MVP-004 search behavior, so it is recorded, not fixed — see open question 32.

- **BUG-003 to BUG-008** — **Resolved** by MVP-023 (F1–F10): [BUG-003](bugs/BUG-003.md) invisible keyboard focus ring on the Search button (was 1.06:1, now 18.13:1); [BUG-004](bugs/BUG-004.md) search input border and placeholder contrast (was 1.35:1/3.46:1, now 7.48:1/7.48:1); [BUG-005](bugs/BUG-005.md) sign-in error identification, focus and title; [BUG-006](bugs/BUG-006.md) session-revoke focus, announcement and title; [BUG-007](bugs/BUG-007.md) skipped heading levels; [BUG-008](bugs/BUG-008.md) 404 landmark and title. Each shipped as its own commit with a regression test shown failing before the fix.

- **[BUG-012](bugs/BUG-012.md) (P1)** — **Resolved** by MVP-023: a production build opened a new Postgres connection pool for every query (reproduced: 40 queries, 41 connections); the shared client is now cached in every environment, not only development and test.
- **[BUG-013](bugs/BUG-013.md) (P3)** — **Mitigated**, not root-fixed, by MVP-023: in Firefox, `router.refresh()` could leave `<title>` removed from `<head>` after a session revoke; `SessionsHeading` now repairs it. The underlying framework gap is tracked as [TD-013](tech-debt/TD-013.md).
- [BUG-009](bugs/BUG-009.md) sign-in and account pages are unstyled (advisory, not fixed by MVP-023); [BUG-010](bugs/BUG-010.md) session-revoke failure path still loses focus (P3, not fixed); [BUG-011](bugs/BUG-011.md) sign-in stays in its sending state if the request throws (P3, not fixed); [BUG-014](bugs/BUG-014.md) (P3) the sign-in submit control (`signin-sent`/`signin-send-failed`) has produced no observable effect three times across sixteen CI runs, Firefox @320px only, never reproduced deterministically — two evidence-backed investigation rounds complete (real-browser-verified node identity/connectivity, then observer liveness/navigation/native-submit), root cause still unproven, permanently instrumented, does not block.

Earlier real issues (this story's `packages/db` eager-construction bug, and MVP-003's Tailwind/rendering bugs before it) were all caught and fixed within their own story before reaching Done — per `CLAUDE.md`'s bug-vs-shortcut distinction, documented in `planning/progress-report.md`, not filed as bugs.

## Open tech debt

9 open items (3 resolved). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
- [TD-001](tech-debt/TD-001.md), [TD-002](tech-debt/TD-002.md), [TD-003](tech-debt/TD-003.md) — Resolved.
- [TD-004](tech-debt/TD-004.md) — **Open**: MVP-006's file-scan pipeline runs synchronously rather than via a durable job queue.
- [TD-005](tech-debt/TD-005.md) — **Open** (new, 2026-09-21): FR-002's license/compatibility/free-paid/accessibility-status/update-recency filters (and "AI") were deferred by MVP-004; FR-002 traceability corrected from "Implemented" to "Partially Implemented". Update: MVP-005 now supplies the license and compatibility fields, so those two filters are unblocked pending a backlog decision.
- [TD-006](tech-debt/TD-006.md) — **Open** (new, 2026-09-21): compatibility write-time rules (`validateCompatibilityEntry`) exist but no write path calls them yet, and nothing screens notes/summaries for private data — for MVP-012/013 to enforce.
- [TD-007](tech-debt/TD-007.md) — **Open** (new, 2026-09-21): FR-003 items beyond license/version/support/compatibility (creator, screenshots, demo, price, prerequisites, setup, accessibility statement, changelog, version history, related assets) have no approved delivering story, and there is no Playwright E2E for the product page; FR-003 traceability is "Partially Implemented". Ownership dispositions were recorded 2026-09-21: creator to MVP-011, price to MVP-007, the rest proposed (not approved).
- [TD-008](tech-debt/TD-008.md) — **Open** (new, 2026-09-21): merged MVP-005 still implements the Tested / Creator Declared / Not Verified vocabulary; the product owner's 2026-09-21 decision makes Creator Declared and Marketplace Reviewed the only assignable statuses and reserves Tested. No user-visible harm today (no product data exists). Decisions recorded 2026-09-21 (Not Verified is legacy/reserved; a reviewed-at timestamp is approved); a separate small corrective change is required before MVP-012 permits compatibility-evidence writes and is **not** part of MVP-021.
- [TD-009](tech-debt/TD-009.md) — **Open** (new, 2026-09-21): no environment-level noindex switch for staging/preview deployments; needs the hosting decision (open question 5).
- [TD-010](tech-debt/TD-010.md) — **Open** (new, 2026-09-21, Low): the sitemap is one file capped at 50,000 URLs (no sitemap index, no `lastmod`).
- [TD-011](tech-debt/TD-011.md) — **Open** (new, 2026-09-21): `main` is unprotected and no reviewer or approval rules exist; `develop` protection is decided for MVP-023 but the rest of open question 17 is not (Medium).
- [TD-012](tech-debt/TD-012.md) — **Open** (new, 2026-09-21, Low): a root `.pnpmfile.cjs` removes Next.js's optional `@playwright/test` peer declaration so dev-only Playwright cannot be linked into the web app's production tree.

## Proposed stories (not approved — not on the board, not counted above)
[`planning/proposed-stories.md`](proposed-stories.md) holds five proposals from the product owner's 2026-09-21 FR-003 disposition: PROP-001 Product Media and Screenshots, PROP-002 Product Documentation and Prerequisites, PROP-003 Product Accessibility Disclosure, PROP-004 Product Releases and Changelog, PROP-005 Related Assets (deferred). Status **Proposed** until the product owner directly approves each. Creator (ownership) is assigned to MVP-011 and price to MVP-007.

## Notes
- `planning/mvp-backlog.csv` is the canonical status record; `planning/backlog.csv` mirrors Sprint/Points/Status.
- `docs/final-decisions.md` is the binding scope/architecture/process record; `CLAUDE.md`'s Decision Validation Rule and the stop-conditions protocol have now each caught real scope-boundary issues before code was written (license tiers, MVP-003's "filtering framework", MVP-004's analytics-tracking conflict).
- Branching: `develop` is the integration branch (real PRs via `gh`); `main` is promoted from it as a deliberate release decision (not yet done).
- See `planning/progress-report.md` for complete implementation detail on every story and governance action.
