# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-09-23 — MVP-018 (Transactional email and preferences, FR-013) is **Done and merged**. PR #10 merged via `gh pr merge` (not squashed) after CI run `35822261607` went green on all three jobs on the first attempt: 747/747 accessibility checks (5 new `/unsubscribe` states plus 3 backfilled for the existing `MARKETING_EMAIL` toggle), 0 failed, 0 flaky (test execution 7.7m; job total 9m47s — under the 10-minute ceiling but with less headroom than MVP-020's 7m50s, worth watching on the next story); 213/213 `@ppu/web` tests plus every other package's suite green. Open question 49 was decided before implementation ("MVP-018 open question 49"): option (a), a deletion-request acknowledgement on `SUBMITTED` only (`UNDER_REVIEW`/`WITHDRAWN` not approved; `APPROVED`/`COMPLETED` withheld on a truthfulness ground pending questions 46/47; `DENIED` a recorded known gap pending product-owner copy). Built: `EmailSend` (append-only audit table, RLS, `Restrict` FK), `packages/domain/notifications` + `packages/adapters/notifications` (17 unit/integration tests), `ResendEmailAdapter`, `auth.ts` migrated off `ConsoleEmailAdapter`, the one authorized deletion-request acknowledgement send (a send failure never fails the request — verified by a dedicated route test), and a stateless signed unsubscribe token with its own page and API route (deliberately not session-gated; confirmed by grep that `getServerSession` appears nowhere in it). Two real bugs found and fixed locally before any CI push: three `/unsubscribe` states had no keyboard stops at all (fixed with a "back to home" link, matching BUG-008's established pattern), and that link's own touch target was under the WCAG 24px minimum (fixed with padding). TD-015 recorded (email sends synchronously in the request path, no retry — the same class of gap as TD-004). FR-013 is Partially Implemented (MVP-018's half only; MVP-015's "save products" half is not started, depends on MVP-009).

MVP-020 (Consent and legal deletion workflow, FR-004) is **Done and merged**. PR #9 merged via `gh pr merge` (not squashed) after CI run `35809637645` went green on all three jobs on the first attempt: 603/603 accessibility checks (7 new states — `privacy-empty`, `privacy-pending-request`, `privacy-denied`, `privacy-loading`, `privacy-error`, `admin-deletion-requests-populated`, `admin-deletion-requests-denied`), 0 failed, 0 flaky; 205/205 `@ppu/web` tests plus every other package's suite green; the new `Restrict` foreign-key constraint proven not just by a local test but by the real CI Postgres log itself rejecting a deliberately-invalid delete. Open questions 46, 47 and 48 were decided before implementation ("MVP-020 open questions 46, 47 and 48"): 48 closed (`ADMIN` added to `UserRole`, additive only, no application code path ever grants it); 46 and 47 approved as a *direction*, both stay formally open. Built: `PolicyVersion`/`ConsentRecord`/`DeletionRequest`/`DeletionRequestEvent` (RLS-enabled, append-only, `Restrict` FKs — a deliberate divergence from MVP-010's `Entitlement.userId` `Cascade`), `packages/domain/privacy` + `packages/adapters/privacy` (25 unit/integration tests), four API routes (self-only, deny-by-default; the admin route gives an authenticated non-admin the identical 404 an unauthenticated caller gets, verified by a dedicated route test), `/account/privacy` and `/admin/deletion-requests` UI. One real bug (an ambiguous Playwright locator) found and fixed locally before any CI push (full detail: `planning/progress-report.md`). `docs/06-data-model.md` updated with the new Privacy section. TD-014 recorded (admin queue has no pagination yet — deliberate scope narrowing). FR-004 is Implemented; NFR-010 (scheduled retention by data class) stays a gap, unaffected by this story.

MVP-010 (Free entitlement flow, FR-005) is **Done and merged**. PR #8 merged via `gh pr merge` (not squashed) after CI run 2 (`e1d5dcf`, the merged head) went green on all three jobs: 477/477 accessibility checks (three new states — `product-free-idle`, `product-free-entitled`, `product-free-granted` — across all widths and engines), self-check passing in all three engines, the new `@ppu/adapter-entitlements` integration suite (5/5, including a genuine concurrent-request race-safety test against a real database) confirmed passing for real, Secret scan clean. Open questions 44 (universal sign-in, per-product policy deferred) and 45 (product-scoped, permanent-until-revoked, `revokedAt` enforced at read time) were decided and closed before implementation. Run 1 (`77abff0`) failed on two real test-isolation bugs the local dev-mode checks could not have surfaced — found, root-caused and fixed before run 2 (full detail: `planning/progress-report.md`). FR-005 is Implemented; FR-007 (signed delivery) stays explicitly out of scope, blocked by the absent `ReleaseFile` model, owned by MVP-009.

MVP-023 (manual and automated accessibility gate) is **Done and merged**. PR #6 merged via `gh pr merge` (merge commit `ed9b09b`, not squashed) after the final CI run (`aed24d8`, re-confirmed on the actual merged head `7e10c4a`) went green on all three jobs: 423/423 accessibility checks, 0 skipped, 0 retries, self-check passing in all three engines, every DB-gated integration suite passing for real, Secret scan clean. The `develop` branch-protection rule is live (confirmed by reading it back directly, not assumed); the security review and the accessibility review sign-off are recorded in `docs/final-decisions.md`. NFR-001 and NFR-008 are Implemented. Findings resolved along the way: BUG-012 (production `@ppu/db` connection-pool defect, root-fixed), BUG-013 (Firefox title-disappearance after a session revoke, mitigated), and a secret-scanner false positive (a fingerprint-scoped `.gitleaksignore`, this repository's first suppression, `docs/final-decisions.md`). **BUG-014** (intermittent Firefox @320px sign-in-submit signature) stays **open, monitor-only, permanently instrumented** — three occurrences across sixteen CI runs, two evidence-backed investigation rounds complete, root cause unproven, does not block.

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 10 | MVP-008, MVP-009, MVP-012, MVP-013, MVP-014, MVP-015, MVP-016, MVP-019, MVP-024, MVP-025 |
| Ready | 3 | MVP-007, MVP-011, MVP-017 |
| In Progress | 0 | — |
| QA | 0 | — |
| Blocked | 0 | — |
| Done | 12 | MVP-001, MVP-002, MVP-003, MVP-004, MVP-005, MVP-006, MVP-010, MVP-018, MVP-020, MVP-021, MVP-022, MVP-023 |
| **Total** | **25** | |

MVP-005 unblocked MVP-007 (Checkout, which also needs MVP-002 — Done) and MVP-021 (SEO/sitemap); MVP-021 is now Done and, having no dependents, unblocks nothing new. MVP-023 (depends only on MVP-003, already Done) likewise has no dependents in `planning/mvp-backlog.csv` and unblocks nothing new by itself — its value is the accessibility harness (`packages/e2e`) every future UI story now runs against, and the branch-protection rule now enforcing it. MVP-010 (depends on MVP-002 and MVP-006, both already Done) also has no dependents in `planning/mvp-backlog.csv` and unblocks nothing new by itself. MVP-007 is Ready — "Ready" means dependencies are met, and MVP-007 is still gated by unanswered product decisions (see the recommendation below).

## Completed stories

| Story | Epic | Requirement | Points | Completed |
|---|---|---|---|---|
| MVP-001 | Foundation | NFR-007 | 5 | 2026-09-16 |
| MVP-002 | Identity | FR-004 | 8 | 2026-09-18 |
| MVP-003 | Catalog | FR-001 | 8 | 2026-09-18 |
| MVP-004 | Catalog | FR-002 | 8 | 2026-09-21 |
| MVP-005 | Catalog | FR-003 | 5 | 2026-09-21 |
| MVP-006 | Files | FR-007 | 13 | 2026-09-18 |
| MVP-010 | Free assets | FR-005 | 3 | 2026-09-22 |
| MVP-018 | Notifications | FR-013 | 5 | 2026-09-23 |
| MVP-020 | Privacy | FR-004 | 8 | 2026-09-23 |
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

### MVP-010 — Free entitlement flow
- `POST /api/products/[slug]/entitlement` grants (or idempotently reuses) a free `Entitlement` and records an append-only `Download` audit event, for a signed-in user only — no guest path, no per-product policy field (decision Q44). Product eligibility (`PUBLISHED`) is re-read and re-checked server-side on every request; nothing is ever trusted from the client.
- Does not deliver a file: `ReleaseFile` doesn't exist yet in the schema (confirmed by reading `packages/db/prisma/schema/files.prisma` directly, not assumed), so signed delivery stays entirely MVP-009's, unbuilt here.
- `Entitlement` is product-scoped and permanent-until-revoked; `revokedAt` is present and **enforced at read time**, though nothing in this story ever sets it (decision Q45's amendment) — a future revocation feature only has to write the column, not also add the check.
- A real, reproduced race-safety property, not assumed: two concurrent grant requests for the same user/product against a real database produce exactly one entitlement row, proven by an integration test.
- Two real test-isolation bugs were found by CI's first real production-mode run (not by local testing, which could not have reproduced them) and fixed before merge — full account in `planning/progress-report.md`.
- Full detail, including the security and accessibility reviews: `planning/progress-report.md` and `docs/final-decisions.md`.

### MVP-018 — Transactional email and preferences
- `auth.ts`'s sign-in link migrated off `ConsoleEmailAdapter` onto a real `ResendEmailAdapter`/`ConsoleEmailAdapter` selection (Resend when `RESEND_API_KEY` is set, console logging otherwise — production never fails to start, mirroring `error-monitoring.ts`'s `SENTRY_DSN` fallback exactly). No verified sending domain exists yet (open question 1), so the real vendor is never selected today.
- One deletion-request acknowledgement (`SUBMITTED` only — decision question 49). Every other lifecycle state was deliberately declined: `UNDER_REVIEW`/`WITHDRAWN` for no user value, `APPROVED`/`COMPLETED` because MVP-020 executes no erasure and those messages would describe an action the system doesn't perform, `DENIED` as a recorded gap pending product-owner copy.
- No new preference table: MVP-020's `ConsentRecord` (`MARKETING_EMAIL`) already is the notification preference — this story enforces it fresh on every optional send (built and tested, though no real optional message exists yet) and acts on it via a stateless, HMAC-signed unsubscribe token (no new table; every failure mode returns the identical response, so it can't be used to enumerate addresses or reveal registration).
- Two real bugs found and fixed locally, before any CI push: three `/unsubscribe` states had no keyboard stops at all (fixed with a "back to home" link, matching `BUG-008`'s established pattern for every dead-end page); that link's own touch target was under the WCAG 24px minimum (fixed with padding).
- Recorded: TD-015 (email sends synchronously in the request path, no retry — the same class of gap as TD-004, pending real job-queue infrastructure).
- Full detail, including the security and accessibility reviews: `planning/progress-report.md` and `docs/final-decisions.md`.

### MVP-020 — Consent and legal deletion workflow
- Consent capture (`ConsentRecord`, append-only — a change of mind always inserts a new row) and a deletion **request** workflow (`DeletionRequest`/`DeletionRequestEvent`, append-only, no status column — current state is derived from the latest event) — this story records and reviews requests only; it executes no erasure, anonymisation or scheduled retention (open questions 46/47, out of scope by design).
- `Restrict` (not `Cascade`) foreign keys on every new table's `userId`/`actorUserId` — a deliberate divergence from MVP-010's `Entitlement.userId` `Cascade`, so a future user-deletion cannot silently destroy this audit trail. Proven twice: a local integration test, and the real CI Postgres log itself rejecting the deliberately-invalid delete.
- A new `ADMIN` role (`UserRole`, additive only — decision 48) gates `/admin/deletion-requests` and its action route. No application code path ever assigns it; the role is re-queried from the database on every request, never read from the session. A non-admin gets the byte-identical `404` an unauthenticated caller gets — proven by a dedicated route test, not just asserted.
- Seven new accessibility-gated states, including a second database-created `ADMIN` fixture identity (the sanctioned mechanism for test-only admin access). One real bug (an ambiguous Playwright `role="status"` locator) found and fixed locally before any CI push.
- Recorded: TD-014 (admin queue has no pagination — deliberate scope narrowing, not a defect at current scale). Open questions 46 and 47 stay formally open (the eventual erasure-execution treatment and jurisdiction-dependent timelines are not decided by this story).
- Full detail, including the security and accessibility reviews: `planning/progress-report.md` and `docs/final-decisions.md`.

### MVP-021 — Metadata, sitemap, canonical, structured data
- Canonical URLs, page metadata, Open Graph and Twitter tags, `sitemap.xml`, `robots.txt` and schema.org JSON-LD, under the product owner's 2026-09-21 decisions. The site origin is `NEXT_PUBLIC_SITE_URL`, validated in one place, read at runtime, and failing safe (no incorrect canonical URLs) when missing or invalid in production.
- Deny-by-default robots (every page `noindex` unless it opts in). Category policy as approved: empty categories `noindex` and out of the sitemap; valid `?page=N` self-canonical; search, sort, filter and mixed variants `noindex` with the base canonical — an intentional corrective SEO change owned by this story, with MVP-004's search unchanged. Product JSON-LD ships **without Offer data** and with no rich-result claim.
- Verified on the real pages against a real Postgres (dev and production builds), a hostile product in the live browser DOM, and six production site-URL scenarios; **CI: 458 tests passed, 0 skipped**, including all DB-gated suites.
- Recorded: BUG-001 resolved; **BUG-002** (a repeated `q` returns HTTP 500 — MVP-004 code, out of scope, needs a decision, open question 32); TD-009 and TD-010. TD-008 was not touched.
- Full detail, including the security and accessibility reviews: `planning/progress-report.md`.

Full detail on every story is in `planning/progress-report.md`.

## Progress metrics

- Stories done: 12 / 25 (48%)
- Points done: 87 / 170 (51%)
- P0 points done: 82 / 145 (57%)
- P1 points done: 5 / 25 (20%)
- Open bugs: 5 (BUG-002, BUG-009, BUG-010, BUG-011, BUG-014); 1 mitigated not root-fixed (BUG-013); 8 resolved (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 12 (see `planning/tech-debt.csv` and `planning/tech-debt/`)
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning except MVP-023 (8 → 13 on 2026-09-21: the WCAG A/AA corrective fixes are in scope, decision Q37).

## Remaining work summary

13 of 25 stories remain (83 of 170 points).

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-003, MVP-006, MVP-022 | **Done** | 37 (done) |
| 3 | MVP-004, MVP-005 | **Done** | 13 (done) |
| 3 | MVP-023 | **Done** | 13 (done) |
| 3 | MVP-010 | **Done** | 3 (done) |
| 3 | MVP-011, MVP-017 | Ready | 10 |
| 3 | MVP-018 | **Done** | 5 (done) |
| 3 | MVP-020 | **Done** | 8 (done) |
| 4 | MVP-021 | **Done** | 3 (done) |
| 4 | MVP-007 | Ready | 8 |
| 4 | MVP-012 | Backlog | 8 |
| 5 | MVP-008, MVP-013 | Backlog | 16 |
| 6 | MVP-009, MVP-014, MVP-019 | Backlog | 21 |
| 7 | MVP-015, MVP-016, MVP-024 | Backlog | 15 |
| 8 | MVP-025 (launch gate) | Backlog | 8 |

MVP-025 cannot start until every P0 story above it is Done.

## Next story recommendation

**MVP-018 is Done.** **MVP-017** (P1, dependency MVP-002 already Done, not gated by any open product decision) is the next candidate. **MVP-011 (Creator application)**, though listed Ready (its only dependency, MVP-002, is Done), is gated by open questions 2 (first-party-only vs. invited third-party creators) and 8 (creator commercial terms) — not recommended until those are answered.

Two things need the product owner rather than a story: **TD-008** (the compatibility-evidence vocabulary correction) is a separate small change that must land before MVP-012, and **BUG-002** (a repeated `q` returns HTTP 500 — MVP-004 code) is now the proposed corrective story PROP-006 (Proposed, sequenced after MVP-023, not scheduled; open question 32).

Dependency-Ready but gated by unanswered product decisions, so not recommended until those are answered: **MVP-007 (Checkout)** — open questions 3 (countries/currencies/tax/refunds), 7 (pricing) and 8 (payout model); **MVP-011 (Creator application)** — open questions 2 (first-party-only vs invited creators) and 8 (creator commercial terms). MVP-017 remains Ready and ungated.

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

12 open items (3 resolved). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
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
- [TD-013](tech-debt/TD-013.md) — **Open** (new, 2026-09-21, Medium): `router.refresh()` can briefly leave `<title>` absent from `<head>`; only `/account/sessions` has a mitigation, the underlying framework gap is not understood or fixed.
- [TD-014](tech-debt/TD-014.md) — **Open** (new, 2026-09-22, Low): the admin deletion-request queue (`/admin/deletion-requests`, MVP-020) has no pagination, filtering or sorting — a deliberate scope narrowing, not a defect at current/near-term scale.
- [TD-015](tech-debt/TD-015.md) — **Open** (new, 2026-09-22, Medium): transactional email (MVP-018) is sent synchronously in the request path with no retry — the same class of gap as TD-004, pending real job-queue infrastructure.

## Proposed stories (not approved — not on the board, not counted above)
[`planning/proposed-stories.md`](proposed-stories.md) holds five proposals from the product owner's 2026-09-21 FR-003 disposition: PROP-001 Product Media and Screenshots, PROP-002 Product Documentation and Prerequisites, PROP-003 Product Accessibility Disclosure, PROP-004 Product Releases and Changelog, PROP-005 Related Assets (deferred). Status **Proposed** until the product owner directly approves each. Creator (ownership) is assigned to MVP-011 and price to MVP-007.

## Notes
- `planning/mvp-backlog.csv` is the canonical status record; `planning/backlog.csv` mirrors Sprint/Points/Status.
- `docs/final-decisions.md` is the binding scope/architecture/process record; `CLAUDE.md`'s Decision Validation Rule and the stop-conditions protocol have now each caught real scope-boundary issues before code was written (license tiers, MVP-003's "filtering framework", MVP-004's analytics-tracking conflict).
- Branching: `develop` is the integration branch (real PRs via `gh`); `main` is promoted from it as a deliberate release decision (not yet done).
- See `planning/progress-report.md` for complete implementation detail on every story and governance action.
