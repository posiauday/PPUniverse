# MVP-023 pre-work analysis — Manual and automated accessibility gate

Date: 2026-09-21. Branch: `feature/mvp-023-accessibility-gate` (from `develop` at `73ba6a4`). **No application or test code has been written.** Nothing below is an approved decision: every choice marked *proposal* or *default* needs the product owner's confirmation (section 12) before it is recorded in `docs/final-decisions.md`.

## 0. Repository state confirmed (mandatory first actions)
- Read in order: `CLAUDE.md`, `docs/final-decisions.md`, `planning/status.md`, `planning/progress-report.md`, `docs/open-questions.md`.
- `git status`: clean (22 files show as modified only through line endings; zero content differences). Current branch was `develop`; now on `feature/mvp-023-accessibility-gate`.
- `git log`: `develop` = `origin/develop` = `73ba6a4` (merge of PR #5), 0 commits behind. CI on that commit was green (458 tests, 0 skipped).
- `gh pr list`: 0 open PRs (#1–#5 all merged). No MVP-023 branch, no Playwright or axe code or configuration anywhere in the repository.
- Movement since `planning/status.md` was last edited (`314e49d`): only the merge commit for PR #5 itself — the content already recorded there.
- The earlier usage limit left no partial MVP-023 work behind.

## 0b. Baseline evidence — the measured accessibility state of the implemented pages
Coverage is based on what actually exists. Routes were enumerated from the repository (section 8 lists them), then measured on the real pages against a throwaway real Postgres (outside the repo, deleted afterwards) with throwaway rows: 14 published + 1 draft product in one category, an empty category, a product with license/support/compatibility evidence, and a test user with two sessions. **These are measurements of delivered work, not a gate result.**

**Automated — axe-core 4.10.2, rules tagged WCAG 2.0/2.1/2.2 A and AA plus best-practice; 11 pages × 4 widths (1280, 768, 375, 320) = 44 scans.** Each page was loaded in a same-origin iframe of that width so media queries and colour contrast were evaluated under real layout.

| Finding | Where | axe impact | Class |
|---|---|---|---|
| `heading-order` — h1 followed directly by h3 | `/categories/[slug]` (incl. page 2), `/search`, `/search?q=` at every width | moderate | best-practice (WCAG 1.3.1 advisory) |
| `landmark-one-main`, `region` | the framework's default 404 page | moderate | best-practice |
| `color-contrast` **incomplete** (10–11 nodes) | product page at 375 and 320 px — table cells clipped inside the scroll region, so axe cannot sample their backgrounds | — | needs a non-axe check |
| No other violations; no `incomplete` elsewhere | `/`, product pages (at ≥ 768), empty category, `/signin`, `/account/sessions` | — | — |
| No horizontal overflow at 320 px on any page | all | — | WCAG 1.4.10 holds |

**Measured by hand on the real pages — things axe cannot judge.** Method: real Tab key presses, real mouse clicks, computed styles, a contrast calculation.

| # | Finding | Evidence | WCAG | Delivered by |
|---|---|---|---|---|
| B-1 | **Focus indicator invisible on the primary "Search" button.** The global rule is `outline: 2px solid currentColor`; on a white-text button that is a near-white ring on a white page. | Button reached by keyboard (`:focus-visible` true). Outline vs page background **1.06:1** (vs the button's own background 7.18:1). Screenshot shows no ring. | 2.4.7 (AA); 1.4.11 | MVP-003/004 |
| B-2 | **Search input boundary too faint.** Its only visual edge is a 1px border. | Border vs page **1.35:1** (needs 3:1). | 1.4.11 (AA) | MVP-004 |
| B-3 | **Placeholder text below contrast.** It is the only *visible* label (the real `<label>` is screen-reader-only). | Placeholder vs input background **3.46:1** (needs 4.5:1). | 1.4.3 (AA); 3.3.2 advisory | MVP-004 |
| B-4 | **Sign-in error is generic.** Empty or invalid email produces only "Something went wrong sending the link. Please try again." — it does not identify the field or say what is wrong. | Real click on an empty required field. `aria-invalid` becomes true (good), message does not name the problem; form has `noValidate`. | 3.3.1 (A), 3.3.3 (AA) | MVP-002 |
| B-5 | **Focus is dropped to `<body>` after submitting sign-in** (the button disables itself mid-request). | `document.activeElement` = `BODY` after submit. | 2.4.3 (A) | MVP-002 |
| B-6 | **Revoking a session drops focus and announces nothing.** | After Revoke: session gone from the list, `activeElement` = `BODY`, no `role=status`/`alert` element. | 2.4.3 (A), 4.1.3 (AA) | MVP-002 |
| B-7 | **Non-descriptive page titles.** `/signin`, `/account/sessions` and the 404 page all have the site name as title. | `document.title` = "Power Platform Universe". | 2.4.2 (A) | MVP-002 + framework |
| B-8 | **Sign-in and account pages are unstyled.** The `h1` renders at body size; the submit and "Revoke" buttons look like plain text (Revoke is glued to the date); the session list has no list appearance. | Screenshots of both pages. | Not a definite success-criterion failure — usability and `docs/05` design-system conformance | MVP-002 |
| B-9 | Heading and 404 items above (`heading-order`, missing `<main>` on 404). | axe, all widths. | best-practice | MVP-003/004 + framework |

Also observed (no failure): `<html lang="en">` present; viewport meta present; no `prefers-reduced-motion` rules but no animations either; axe's `target-size` (WCAG 2.5.8) passes everywhere (unselected sort links measure 24×20 but pass the spacing exception); the compatibility matrix's scroll region is labelled and focusable; no header, footer, site `nav` or skip link exists (nothing repeated to bypass yet — becomes a requirement when a header arrives).

**Limits of this baseline, stated plainly:** axe 4.10.2 was used (the proposal below pins 4.13.0, so results may differ slightly and must be re-baselined); Claude's synthetic key events do not trigger every default browser action (arrow-key scrolling and Enter-to-submit did not fire), so keyboard checks used real Tab presses and real clicks where behavior mattered; **no screen reader was run** — Claude cannot operate NVDA, JAWS or VoiceOver, so screen-reader compatibility is not verified here and this story must not claim it; one browser engine (Chromium) only; local dev server, not production.

## 1. Requirement IDs
- **NFR-001** (primary): "WCAG 2.2 AA target, keyboard operation, visible focus, reduced motion and accessible validation." Backlog: **MVP-023**, P0, 8 pts, Sprint 3, depends on MVP-003 (Done). Traceability row is currently `NFR-001, Accessibility, UX/Test, MVP-023, Automated + manual, TBD`.
- **NFR-008** (related, decision needed — open question 22): "Supported browsers and responsive breakpoints are documented and tested." Row is `MVP-023, PARTIAL - no dedicated browser/breakpoint matrix story, GAP`. Approving Q-22A/B below would let MVP-023 document and test the matrix; whether MVP-023 then *owns* NFR-008 is question 42.
- Related: `CLAUDE.md` Definition of Done ("keyboard and screen-reader checks pass; responsive behavior is verified"); `docs/11-test-strategy.md` release blocker "critical accessibility issue in core path"; TD-007 (no Playwright E2E — MVP-023 introduces the harness; a functional product-detail E2E is TD-007's other half); open question 20 (CI time and cost budget).
- Explicitly not touched: MVP-007, 010, 011, 012, 013, 017, 018, 020; TD-008; BUG-002; pricing; Offers; analytics; creator pages; collections; compatibility workflow; search behavior.

## 2. Acceptance criteria
Backlog wording: "Core journeys meet defined WCAG gate." Made testable:
1. A Playwright + axe harness runs from a documented command (`pnpm test:e2e`; `pnpm test:a11y` for the accessibility subset), locally and in CI.
2. **Every implemented page/state** in the route inventory (section 8) is scanned by axe at every approved viewport in every approved browser; the gate **fails on any violation of a WCAG 2.2 A/AA rule**. Axe `incomplete` results are never silently dropped — each is either resolved by an explicit check or listed in the report as "needs review".
3. **Checks axe cannot make are automated where they can be:** visible focus-indicator contrast (B-1), non-text contrast of form controls (B-2), placeholder contrast (B-3), focus retained or moved sensibly after actions (B-5, B-6), error identification (B-4), status announcements (B-6), reflow at 320 px, and page-title distinctness (B-7).
4. **Keyboard journeys** are exercised end to end: search, sort, pagination, the sign-in form (idle, submitting, sent, error) and, if approved, session revoke and sign out.
5. A **route-coverage guard** fails the build when a new `page.tsx` route exists that is not in the accessibility manifest, so coverage cannot silently rot as stories add pages.
6. **Failure reporting:** on failure, the CI job publishes an HTML report and traces as artifacts and a per-violation summary (rule, impact, WCAG criterion, route, viewport, browser, selector) to the job summary.
7. **Manual review capability:** a documented process, a review checklist, a severity rubric, a review-record template, and an explicit statement of what the automated gate does *not* cover — with the honest note that real screen-reader testing needs a human (question 38).
8. **Developer guidance** (how to add a route, write an accessibility spec, and known pitfalls) and **reusable helpers** with their own unit tests, including negative controls proving the gate fails on known-bad markup.
9. **Baseline triage:** every finding in section 0b is either fixed (documented as a corrective accessibility change) or recorded against a bug with an owner; no unrecorded failure exists at merge (question 37 decides which).
10. **Test data:** no fabricated marketplace inventory; tests create isolated rows and clean up only those; seeded categories are referenced, never modified or deleted (question 36).
11. Documentation, traceability (NFR-001), security review and accessibility review complete; CI green with database-gated tests confirmed *passed*, not skipped.

## 3. Files expected to change
**New — `packages/e2e` (private workspace package `@ppu/e2e`)** *(proposal; `docs/13` documents no E2E location and requires shared code to live in `packages/*`; keeping Playwright's dependencies out of `apps/web` also keeps the web app's install lean):*
`package.json`, `tsconfig.json`, `playwright.config.ts`; `src/helpers/{axe,focus,contrast,routes,db,session,report}.ts` (+ Vitest unit tests for the pure parts); `src/manifest/routes.ts`; `src/specs/{pages,keyboard,focus-visible,reflow,signin,account,not-found}.a11y.spec.ts` and a route-coverage guard spec; `README.md`.
**Modified:** `.github/workflows/ci.yml` (new job); root `package.json` (scripts); `.gitignore` (`playwright-report/`, `test-results/`); `eslint.config.js` if the package needs an override; `pnpm-workspace.yaml` (no change expected — `packages/*` already matches); `pnpm-lock.yaml`.
**Docs (new):** an accessibility-testing guide with the manual checklist, severity rubric and review-record template (proposed `docs/14-accessibility-testing.md`, added to `docs/00-document-index.md`); `planning/accessibility/` review-record template.
**Docs/tracking (modified):** `CLAUDE.md` (Commands and Definition of Done — *governance change, needs approval*), `README.md`, `docs/final-decisions.md`, `docs/open-questions.md`, `planning/*` (backlog CSVs, status, progress report, traceability rows NFR-001 and possibly NFR-008), bug and tech-debt records.
**Application code — only if question 37 approves corrective changes to delivered pages** (each will be documented as a separate, minimal commit): `apps/web/app/globals.css` (focus indicator), `packages/ui/src/{search-form,card,product-card}.tsx` (contrast, heading level), `apps/web/app/signin/*` and `account/sessions/*` (titles, error identification, focus, announcements, basic styling), a custom `apps/web/app/not-found.tsx`. **Not touched without approval:** MVP-003/004/005/021/022 behavior beyond these accessibility corrections.

## 4. Migration impact
None. No schema change. Test data uses existing tables only (`products`, `releases`, `product_licenses`, `support_policies`, `compatibility_records`, `users`, `sessions`); no new table, column or index.

## 5. Security impact
- **Supply chain (dev-only):** three new dev dependencies — `@playwright/test` (Apache-2.0), `@axe-core/playwright` and `axe-core` (both **MPL-2.0**). Not shipped to users; MPL-2.0 is a file-level copyleft that a dev-only test dependency does not trigger, but it is recorded for the product owner (question 41). Versions pinned exactly; `pnpm audit` continues to gate; browsers are downloaded by Playwright in CI from Microsoft's CDN, pinned via the Playwright version.
- **No test backdoor in the product.** Authenticated pages are tested by inserting `users` and `sessions` rows directly through the database client in test setup and setting the session cookie in the browser context. No test-only route, header or environment switch is added to the application.
- **Destructive-write guard:** the data helper refuses to run unless the database host is `localhost` or `127.0.0.1` **and** an explicit `E2E_ALLOW_DATABASE_WRITES=1` is set by the test script/CI — so it can never write to a shared, staging or production database by accident.
- **Cleanup scope:** rows are created with a reserved prefix (`a11y-`) and deleted only by that prefix, in teardown; a check asserts the seeded category and license-tier row counts are unchanged.
- **Secrets:** none committed. The auth secret needed to start the app in the test job is generated per run (`openssl rand`) and never stored; nothing secret-shaped is committed (the gitleaks scan must stay green).
- **CI:** the new job gets read-only repository permissions and an isolated Postgres service container; artifacts contain rendered test pages with placeholder data only.
- **Claims:** documentation and reports say "tested against WCAG 2.2 AA criteria with these tools", never "WCAG compliant" or "accessible", and make no Microsoft, certification or verification claim.
- No change to authentication or authorization behavior; server-enforced authorization is untouched.

## 6. Accessibility impact
This story *is* accessibility. Direct effects on users occur only if question 37 approves the corrective changes, which would fix B-1 to B-9 in delivered pages (focus ring, control and placeholder contrast, sign-in and account error/focus/announcement behavior and titles, heading levels, a real 404 landmark). Each would be the smallest change that removes the failure, with a test proving it and no visual redesign beyond making the unstyled pages usable. The gate then prevents regressions in every later story.
Explicit non-claims: automated tools find roughly a third to a half of WCAG issues at best; passing this gate is **not** a conformance statement, and screen-reader compatibility is unverified until a human review is performed.

## 7. Telemetry impact
None in the product: no analytics, no PostHog events, no new logging in the application. CI-side observability only: the Playwright HTML report, JUnit XML and traces as artifacts (retention proposed 14 days), and a Markdown summary table in the job summary. The existing `@ppu/telemetry` logger is untouched.

## 8. Test plan
**Route inventory (from the repository, not assumed):**

| Route | Kind | Auth | Journey / states to cover |
|---|---|---|---|
| `/` | page | public | home with categories; empty catalog |
| `/categories/[slug]` | page | public | with products (page 1 and 2), empty category, search variant |
| `/products/[slug]` | page | public | rich (evidence table, licenses, support link), minimal (no evidence) |
| `/search` | page | public | empty query, results, no results |
| `/signin` | client page | public | idle, submitting, sent, error (auth API mocked at the network layer — no email is sent) |
| `/account/sessions` | page | **authenticated** | session list, revoke error (mocked), single session — *if approved (question 40)* |
| unknown URL | framework default 404 | public | the page users actually see |
| `/robots.txt`, `/sitemap.xml`, `/api/*` | non-UI | — | out of scope (no rendered UI) |

No custom `error.tsx`, `not-found.tsx` or `loading.tsx` exists, so `docs/05`'s "required states" (system error, permission denied, offline/retry, loading) are not implemented — outside this story and recorded rather than tested.

**Layers:**
1. **Automated axe scans** — route × state × viewport × browser, WCAG 2.0/2.1/2.2 A + AA tags blocking; best-practice rules reported as advisory unless question 35 says otherwise; `incomplete` surfaced in the report.
2. **Interaction specs** — keyboard-only journeys and the checks in acceptance criterion 3 (focus-indicator contrast per focusable element, no keyboard traps, focus retained after actions, error identification, status announcements, reflow at 320 px and 400% zoom equivalence, text-spacing override, `prefers-reduced-motion` emulation).
3. **Helper unit tests (Vitest)** — contrast maths, focus-indicator evaluator, violation formatter, allowlist parser, database-safety guard.
4. **Negative controls** — the harness must fail on deliberately bad markup supplied inline (`page.setContent`): missing label, no visible focus, contrast failure, heading skip. This proves the gate can fail without adding a bad page to the app.
5. **Coverage guard** — fails when a route exists that the manifest does not list.
6. **Manual review** (section 13) — keyboard walkthrough, zoom/reflow, and screen-reader smoke steps on named AT/browser pairs performed by a human.
All DB-gated tests must be confirmed *passed* in the CI log, not skipped.

## 9. Browser matrix
**Default proposal (Q-22A): Chrome, Edge and Firefox, latest stable.** Playwright projects: `chrome` (channel), `msedge` (channel), `firefox`. Points to confirm:
- "Latest" installed by channel moves with time, so results are not reproducible across dates; pinning Playwright's bundled builds is reproducible but is not "latest". *Proposal:* use the pinned bundled Chromium and Firefox for the blocking gate, and channel builds of Chrome and Edge in a non-blocking scheduled run — or accept channels and pin only the Playwright version (question 33).
- **Safari/WebKit is not in the default matrix**, although it is the only engine on iOS. Emulated mobile viewports in Chromium are layout checks, not real mobile-browser tests; the report will say so.
- Axe results are engine-independent for most rules; engine differences matter for focus behavior, form validation UI and layout, which the interaction specs cover on all three.

## 10. Breakpoint matrix
"Existing design-system breakpoints" resolve to Tailwind v4's defaults: `globals.css` declares no custom breakpoints and `docs/05` names Mobile / Tablet / Desktop without widths. The code uses `sm:` (640 px) and `lg:` (1024 px), so the layout changes at 640 and 1024 (one, two and three card columns). **Default proposal (Q-22B):**

| Name | Viewport | Why |
|---|---|---|
| Mobile | 375 × 812 | below `sm` (one column) |
| Tablet | 768 × 1024 | between `sm` and `lg` (two columns) |
| Desktop | 1280 × 800 | at or above `lg` (three columns) |
| Reflow | 320 × 640 | WCAG 1.4.10 (equivalent to 400% zoom on a 1280 px window) |

Optionally boundary widths 639/640 and 1023/1024. The compatibility matrix's scrollable region is a data table, which WCAG 1.4.10 allows to scroll in two dimensions, so the reflow check exempts labelled data-table regions only.

## 11. Ambiguities
1. **ADR-004's status is "Proposed"**, while `docs/final-decisions.md` (2026-09-17) says it "confirms ADR-004's existing decisions". Playwright is named in `final-decisions.md` explicitly; **axe-core appears only in ADR-004's testing row**. Treated here as needing explicit confirmation (question 41).
2. **What "critical" means** in the gate rule (axe impact "critical", any WCAG A/AA failure, or a severity from the manual rubric) — question 35.
3. **Who performs manual review** and screen-reader testing — Claude can do keyboard, DOM and computed-style review but cannot operate a screen reader (question 38).
4. **Baseline policy** — the gate cannot both be blocking and start green unless the section 0b failures are fixed or explicitly allowlisted (question 37).
5. **Authenticated route** in scope or not (question 40).
6. **Blocking status and CI budget** — the TRD's PR check list has no E2E or accessibility stage, and open question 20 (time/cost) is unanswered (question 39).
7. **Axe version drift:** baseline 4.10.2 vs proposed 4.13.0; re-baseline at implementation.
8. **Scope of E2E:** MVP-023 introduces the Playwright harness, which also unblocks TD-007's functional product-detail journey; this analysis limits MVP-023 to accessibility specs plus load smoke assertions.
9. **Estimate:** 8 points fits the harness, CI job, helpers, documentation and guidance. Including the corrective changes to delivered pages is closer to **13**. No change is made without approval.

## 12. Product-owner questions
Each has a safest reversible default. Recorded in `docs/open-questions.md` items 33–42 (and item 32 updated).

- **Q-22A / 33 — Browser matrix.** Default: Chrome, Edge, Firefox, latest stable. *Approve, or supply a different matrix (for example add Safari/WebKit)?* Also: bundled pinned builds for the blocking gate, or moving channels?
- **Q-22B / 34 — Breakpoints.** Default: Mobile 375, Tablet 768, Desktop 1280, plus 320 reflow, using the repository's existing (Tailwind default) breakpoints. *Approve, or give specific viewport requirements?*
- **Q-22C / 35 — Gate definition.** Default: a story cannot be Done if automated accessibility tests fail **or** manual review finds a *critical* WCAG 2.2 AA violation. *Approve?* And define "critical": proposal — any A/AA success-criterion failure that prevents or substantially impedes a core journey step (keyboard trap, no visible focus, missing name or label, essential text or control below contrast, error not identifiable, focus lost so a task cannot continue). Should axe best-practice findings block or be advisory (default: advisory)?
- **Q-22D / 36 — Test data.** Default: isolated temporary rows with a reserved prefix, cleaned up by that prefix only; seeded categories referenced, never modified or deleted; a guard refuses to write outside a local or CI database. *Approve?*
- **Q-32 / 32 — BUG-002** (repeated `q` returns HTTP 500). Default: leave untouched and out of scope for MVP-023. *Should it become a separate small corrective story after MVP-023?* Recommendation: yes — the fix is tiny, but it changes MVP-004 search behavior, so it needs your approval as its own story.
- **37 — Baseline policy for the section 0b defects** (fix, allowlist, or follow-up). Default: **fix the WCAG A/AA failures (B-1 to B-7) in MVP-023 as separately documented, minimal corrective commits; treat best-practice items (B-9) and unstyled pages (B-8) as advisory unless you decide otherwise**; a gate that starts red or with an allowlist would contradict the backlog's "core journeys meet the gate". Alternative: ship the harness with a bug-referenced allowlist and fix in follow-up stories (this would leave a non-blocking check that should be blocking — recorded as tech debt).
- **38 — Manual review and assistive technology.** Who performs it (you, a named reviewer, a contractor), how often (per story with UI changes, or per release), and which AT/browser pairs (for example NVDA + Firefox, VoiceOver + Safari, JAWS + Chrome)? Default until answered: the checklist and record template exist, keyboard/zoom/reflow reviews are done by Claude with evidence, and screen-reader verification is stated as **not performed**.
- **39 — CI blocking and budget** (open question 20). Default: a separate parallel job, required for merge **once the baseline is resolved**; measured job time reported in the PR; the TRD's PR-check list is extended to include it.
- **40 — Authenticated `/account/sessions` in scope?** Default: yes — it is an implemented journey with interactive controls — using database-created test sessions (no product backdoor).
- **41 — Tooling confirmation.** Confirm ADR-004's testing row (Playwright, axe-core, manual pass) as approved and its status updated from "Proposed"; confirm `@playwright/test`, `@axe-core/playwright` and `axe-core` at the pinned versions and that MPL-2.0 dev-only test dependencies are acceptable.
- **42 — NFR-008 ownership.** If Q-22A/B are approved, does MVP-023 own NFR-008 (browser/breakpoint matrix documented and tested), resolving open question 22 by folding it in?

## 13. Exact tooling proposal (none of it approved until confirmed)
| Item | Proposal |
|---|---|
| Test runner | `@playwright/test` **1.63.0** (Apache-2.0, Node ≥ 20; CI uses Node 22) |
| Automated a11y engine | `@axe-core/playwright` **4.13.0** with `axe-core` **4.13.0** (MPL-2.0, dev-only) — WCAG tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` (blocking) and `best-practice` (advisory) |
| Package | `packages/e2e` (`@ppu/e2e`), private |
| Playwright projects | browser × viewport per sections 9–10; `webServer` starts the built app with `next start` |
| Pure-logic tests | Vitest (already in the repo) |
| CI | one **new parallel job** `accessibility` in `.github/workflows/ci.yml`: own Postgres service (no MinIO or ClamAV needed), `prisma migrate deploy`, `pnpm build`, cached Playwright browsers (`playwright install --with-deps`), `pnpm test:e2e`, artifacts on failure and always for the summary. Estimated 5–8 minutes running in parallel with the existing ~2-minute job — **an estimate to be measured**, not a claim |
| Failure reporting | Playwright HTML report + JUnit XML + traces as artifacts; a Markdown table (rule, impact, WCAG criterion, route, viewport, browser, selector) written to the job summary |
| Reusable helpers | `runAxe(page, options)` (tags, impact handling, explicit reasoned exclusions, `incomplete` surfaced), `expectVisibleFocus(locator)` (indicator contrast vs adjacent colours), `expectReflow(page)`, `seedIsolatedCatalog()`/`createTestSession()`/`cleanup()` with the write guard, `mockAuthApi(page, state)`, `formatViolations()` |
| Coverage guard | a spec that scans `apps/web/app` for `page.tsx` files and fails if any is missing from the manifest |
| Manual process | checklist + severity rubric + review record: keyboard (all functions reachable, logical order, no traps, visible focus), headings and landmarks, forms and errors (labels, association, identification, suggestions, status), colour and non-text contrast, zoom/reflow/text spacing, motion, tables, dialogs (none yet), and a screen-reader smoke script per approved AT pair |
| Local run | `pnpm test:e2e` needs Postgres. No Docker is required: a real Postgres can be run locally outside the repo (used for this analysis) |
| Scripts | root `test:e2e` and `test:a11y`; not part of `pnpm test` so the fast unit loop is unchanged |
| Governance edits (need approval) | `CLAUDE.md` Commands and Definition of Done; `docs/00-document-index.md`; ADR-004 status |
