# 14. Accessibility testing (NFR-001, NFR-008)

Owner story: MVP-023. Source of the decisions: `docs/final-decisions.md` (2026-09-21, "Product-owner decisions for MVP-023" and "Product-owner response to the MVP-023 stop-gate confirmation").

This document says what the accessibility suite checks, how to run it, what browsers and widths it covers, and what it does **not** show. It states what was tested, by what method, on what date. It makes no claim that the platform conforms to WCAG, has been audited, or is certified.

## Not verified (read this first)

This list is part of the completion criteria for MVP-023 and must not be softened.

| Not verified | Detail |
|---|---|
| **Screen readers** | **No screen reader has been run.** NVDA, JAWS and VoiceOver were not used. Screen-reader compatibility is unverified. |
| Voice control | Not tested. |
| Switch access | Not tested. |
| Magnification and zoom tools | Not tested with a magnifier; browser zoom to 200% and 400% is a manual-checklist item that has not been performed. |
| Any browser and assistive-technology pairing | None exercised. |
| Real devices | Not tested. Playwright's WebKit engine is not Safari on iOS. |
| Link reachability by keyboard in WebKit | In WebKit the Tab key does not visit links (the engine's default, as in Safari). There, each link's focus indicator is measured by moving focus to it, but whether links can be reached with the keyboard is **not** verified. It is verified in Chromium and Firefox. |
| Human manual review | Not performed for this release. Who performs it, how often and on which pairs is open question 38. |
| Text-spacing overrides, forced-colours mode, reduced-motion behaviour | Not covered by the automated suite; they are items in the manual checklist below. |
| Framework-rendered pages under `/api/auth` (next-auth's built-in error and verify-request pages) | Not part of the gate. |
| Verification emails | The console email adapter is used in development and test; email content is not checked. |
| axe "needs review" results | axe could not decide these; they are listed in each run's summary and are not passes. |

Automated checks find only a subset of accessibility problems, and passing them is not evidence of conformance.

## Supported browser and breakpoint matrices (NFR-008)

These matrices define what the accessibility suite exercises. They are exercised for **accessibility and rendering checks**. This is **not** a general cross-browser functional regression suite, and it does not claim that every feature has been tested in every browser.

### Browsers (decision Q33)

The blocking gate runs three Playwright projects on Playwright's **pinned, bundled** browser builds. No moving or branded channel may gate a merge; such runs are allowed only as non-blocking, clearly labelled exploratory checks. Edge is covered by Chromium.

| Project | Engine | Build recorded from the 2026-09-21 run (Playwright 1.63.0) | Why |
|---|---|---|---|
| `chromium` | Chromium (Chrome and Edge engine) | 153.0.8010.12 (browser build 1243) | The largest desktop share; also covers Edge |
| `firefox` | Firefox | 155.0 (browser build 1543) | The independent Gecko engine |
| `webkit` | WebKit | 26.6 (browser build 2359) | The only engine on iOS; excluding it would leave the largest mobile surface unverified |

The exact builds used by any run are printed in that run's CI job summary. A build is fixed by the exact Playwright version, so it cannot change without a version change in `packages/e2e/package.json`.

### Widths (decision Q34)

| Width (CSS px) | Purpose |
|---|---|
| 320 | WCAG 2.2 reflow check (1.4.10); every page is checked for horizontal overflow |
| 375 | Mobile |
| 768 | Tablet |
| 1280 | Desktop |

The repository's Tailwind breakpoints (640 px and 1024 px) remain the design contract; the four widths sample either side of them. The matrix is not expanded without a new decision: a defect seen only at another width is recorded as a bug and a matrix change is proposed separately.

## The gate (decision Q35)

A story cannot be marked Done if either is true: automated accessibility tests fail, or manual review finds a **critical** WCAG 2.2 A/AA violation.

**Critical**: any WCAG 2.2 Level A or AA failure that prevents, blocks or substantially impedes a user from completing a step in a core user journey. Illustrative, not exhaustive: a keyboard trap; no visible focus indicator on an interactive control; an operable control unreachable by keyboard; a required form field with no programmatic label; an error that is not programmatically associated or announced; a dialog that does not trap and restore focus; a navigation or heading structure that makes the page unusable with assistive technology; content lost or clipped at 320 px reflow.

| Severity | Meaning | Blocks Done? |
|---|---|---|
| P1 | Blocks a core-journey step outright | Yes |
| P2 | Substantially impedes a core-journey step; a workaround exists but is poor | Yes |
| P3 | Noticeable accessibility defect outside a core-journey step | No; record as a bug |
| P4 | Best-practice or advisory only; not a WCAG A/AA failure | No; record as a bug |

axe results are classified as follows:

| Result | Handling |
|---|---|
| Violation of a rule tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` or `wcag22aa` | **Blocking**: fails the run |
| Violation of a rule tagged `best-practice` | **Advisory**: reported in the run summary, never fails the run |
| "Incomplete" (axe could not decide) | Listed as needing manual review; not a pass, not a failure |

The story-specific fix list of MVP-023 (Q37) named some P3 defects for fixing; that reflects that story's scope, not the threshold. Future stories apply the threshold above.

## Tooling (decision Q41)

All are devDependencies of the private workspace package `packages/e2e` (`@ppu/e2e`), pinned to exact versions (no ranges). Licences were read from the installed packages on 2026-09-21.

| Package | Version | Licence |
|---|---|---|
| `@playwright/test` (pulls `playwright` and `playwright-core`, same version) | 1.63.0 | Apache-2.0 |
| `@axe-core/playwright` | 4.13.0 | MPL-2.0 |
| `axe-core` | 4.13.0 | MPL-2.0 |

Vitest remains the unit and integration test runner. The MPL-2.0 packages are used unmodified as test tooling and are not distributed with the application.

**Not shipped.** After install, the application's production build output contains no reference to axe-core or Playwright, and the web app's production dependency tree contains neither. Next.js declares `@playwright/test` as an *optional* peer dependency (for an experimental feature this app does not use); with a workspace package present, pnpm resolved that peer from the workspace and linked Playwright into the app's production tree. The root `.pnpmfile.cjs` removes that peer declaration so the link cannot form. See `planning/tech-debt/TD-012.md`.

## Page inventory

Verified against `apps/web/app`. The route-coverage guard (`packages/e2e/src/route-coverage.test.ts`, part of `pnpm test`) fails if a page route, a special UI file (error, loading, ...) or a route handler outside `/api` exists without being gated or acknowledged.

| State id | Route | What it is |
|---|---|---|
| `home` | `/` | Home page |
| `category-populated` | `/categories/[slug]` | Category listing with products |
| `category-empty` | `/categories/[slug]` | Category with no published products |
| `product-full` | `/products/[slug]` | Product with license, version, support and compatibility evidence |
| `product-minimal` | `/products/[slug]` | Product with none of that evidence provided |
| `search-no-query` | `/search` | Search, no query |
| `search-results` | `/search` | Search with results |
| `search-no-results` | `/search` | Search with no results |
| `signin-idle` | `/signin` | Sign-in form, untouched |
| `signin-validation-error` | `/signin` | After submitting an empty email |
| `signin-send-failed` | `/signin` | After the link could not be sent (auth API intercepted in the test) |
| `signin-sent` | `/signin` | After the link was sent (auth API intercepted in the test) |
| `sessions` | `/account/sessions` | Signed in, another session listed |
| `sessions-after-revoke` | `/account/sessions` | Right after revoking a session |
| `not-found` | (404) | Unknown URL |
| `not-found-account` | (404) | `/account`, which is not a page |

Deliberately not gated: `/api/*`, `robots.txt` and `sitemap.xml` (not pages); next-auth's built-in pages under `/api/auth`; and `/account`, which has no page (only `/account/sessions` exists) and is covered as a 404. **If `/account` becomes a real page in a future story, that story must add it to the gate**; the route-coverage guard fails until it does.

## What the automated suite checks

`tests/a11y/pages.spec.ts` runs every state above at every width in every engine (16 x 4 x 3 scans):
- the response status;
- axe's blocking rules must report no violations; advisory and needs-review findings are attached and annotated;
- no horizontal scrolling at any width, including the 320 px reflow width;
- a descriptive page title (never the bare site name, except on the home page), and distinct titles across the gated pages.

`tests/a11y/keyboard.spec.ts` walks every state at 320 px and 1280 px with **real Tab key presses** from a fixed start (an invisible focus sentinel at the top of the document, so a prior interaction cannot change where the walk begins) and requires: at least one stop; no focusable control left unreached; and a visible focus indicator with at least 3:1 contrast (WCAG 1.4.11) at every stop, measured from the browser's computed outline and the real background layers behind it.

Regression specs (`tests/a11y/regressions/`) prove each Q37 fix, and each was shown **failing** against the unfixed production build before its fix:

| Bug | Fix commit subject | Criterion | Measured before, then after |
|---|---|---|---|
| BUG-003 | Focus ring no longer follows the text colour | 2.4.7, 1.4.11 | 1.06:1, then 18.13:1 |
| BUG-004 | Search input border | 1.4.11 | 1.35:1, then 7.48:1 |
| BUG-004 | Search input placeholder | 1.4.3 | 3.45:1, then 7.48:1 |
| BUG-007 | Results lists do not skip a heading level | 1.3.1 | h1 then h3, then h1, h2, h3 |
| BUG-008 | 404 has a main landmark, heading and link home | 1.3.1, 2.4.1 | no main landmark, then one |
| BUG-005 | Sign-in errors name the field, are tied to it, keep focus | 3.3.1, 3.3.3, 4.1.3, 2.4.3 | generic error and focus on the body, then field-specific and focus on the field |
| BUG-006 | Revoking a session keeps focus and announces the outcome | 2.4.3, 4.1.3 | no announcement and focus on the body, then status region and focus on the heading |
| BUG-005, BUG-006, BUG-008 | Descriptive titles for sign-in, account sessions and 404 | 2.4.2 | bare site name, then "Name \| Site" |

The contrast figures were also re-measured on 2026-09-21 from real painted pixels (a screenshot of each element decoded and sampled), independently of the computed-style measurement the tests use. The two agreed exactly in all three engines: focus ring `rgb(19,22,27)` on white 18.13:1; input border `rgb(82,85,91)` on white 7.48:1; placeholder glyph core `rgb(82,85,91)` on white 7.48:1 (a lower bound).

### Negative controls

A gate that cannot fail is worse than none, so `tests/a11y/negative-controls.spec.ts` runs in every engine and proves the helpers catch known-bad input: an image without a text alternative, low text contrast, an advisory-only finding that must not fail the run, a removed and a near-white focus outline (including a dark ring on a dark panel), a control the keyboard cannot reach, overflow at 320 px, and low border and placeholder contrast. The route-coverage guard has its own negative controls against synthetic trees.

## Test data and authentication (decisions Q36, Q40)

- **No fabricated marketplace inventory.** The temporary rows are obviously test fixtures (their names say so), use the reserved prefix `zz-e2e-a11y-`, are created by the test's worker and deleted when it ends. Seeded categories and licence definitions are read-only to tests.
- **Cleanup is scoped twice**: it deletes only the ids the worker created **and** only rows whose identifying column starts with the reserved prefix. `tests/a11y/fixtures-cleanup.spec.ts` proves another worker's rows and the seeded rows are untouched.
- **A pre-flight database guard** (`packages/e2e/src/db-guard.ts`) refuses destructive setup unless the target is a loopback Postgres URL (no redirecting `host`, `hostaddr` or `service` parameters) **and** `E2E_ALLOW_DATABASE_WRITES=1` is set. A refused test fails loudly; it never skips or passes silently. The guard never prints the URL or credentials.
- **Authenticated pages** are reached with a **database-created session** and the real, server-enforced path. There is no product backdoor, test-only route, "skip auth" flag, environment-gated branch or relaxed authorization anywhere in the application.
- **Auth API interception** to reach the sign-in "send failed" and "sent" states is **test-side only** (`page.route` inside the test). It changes nothing in the application.

## Running it

Prerequisites: Node.js >= 20, pnpm, and a **local** Postgres with the migrations applied.

```bash
docker compose up -d
export DATABASE_URL="postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=public"
pnpm --filter @ppu/db exec prisma migrate deploy
pnpm build
pnpm --filter @ppu/e2e browsers:install      # once: Playwright's pinned chromium, firefox and webkit
E2E_ALLOW_DATABASE_WRITES=1 pnpm test:a11y
```

- `pnpm test:a11y` runs the accessibility suite (`tests/a11y`); `pnpm test:e2e` runs all Playwright specs (currently the same suite).
- The suite starts the application itself (`next start` on port 3100, override with `E2E_PORT`) against the production build. `E2E_SERVER_MODE=dev` uses `next dev` instead, for fast local iteration only; it is never used in CI. Running the dev server can modify `apps/web/next-env.d.ts`; restore it before committing.
- Playwright generates a throwaway `NEXTAUTH_SECRET` per run unless one is set. Nothing secret is committed.
- `pnpm test` (the ordinary unit test run) includes the harness's pure unit tests, which need no browser or database.
- On a Windows checkout, `pnpm format:check` can report line-ending noise; check with `pnpm exec prettier --check --end-of-line auto .`, and treat CI as the authority.

## CI job (decision Q39)

- The job is **"Accessibility (axe + Playwright)"** in `.github/workflows/ci.yml`: a separate job in parallel with the existing test job, on its own Postgres service container.
- **Required for merge**: once the fixes and the harness had landed together in MVP-023's pull request, it is made a required status check on `develop` by a branch-protection rule (see `docs/final-decisions.md`, stop-gate response item 1; the applied settings are recorded in the pull request and in `docs/open-questions.md` item 17).
- **Budget**: target 5-8 minutes, hard ceiling 10 minutes wall-clock. If a run ever exceeds the ceiling the answer is a new decision (sharding, trimming redundant page and width combinations, or a scheduled full-matrix run with a reduced required set on pull requests). Engines, widths and rules are never dropped to fit.
- **Timing is reported per phase** in every run's job summary: dependency install, browsers with system dependencies (and whether the browser cache hit), build and test execution are separate lines.
- **Browser cache** is keyed on the exact pinned Playwright version, so it cannot let a browser drift.
- **Flakiness**: a flaky accessibility test is a defect. There are no retries (`retries: 0`); if one is ever added it must be for a known network or boot flake only, and any retry is listed in the run summary.
- **Artifacts**: the HTML report, JUnit and JSON results, `summary.md` and failure traces are uploaded (14 days).
- **Resolved (2026-09-21, BUG-012):** the job serves a *production* build, and `@ppu/db` did not cache its Prisma client in production, so each query opened a new connection pool; under the suite's concurrency Postgres could run out of connections, failing a few tests with HTTP 500. Root-fixed (`packages/db/src/index.ts` caches the client unconditionally now, in every environment) and re-confirmed clean on the final merged run (`aed24d8`): zero `TooManyConnections` in the server log. This note is kept, not removed, as the historical record of why the job was made required only after this fix landed.
- **Known, open (2026-09-22, BUG-014):** `signin-sent @ 320px` in Firefox has failed three times across sixteen CI runs (never in chromium or webkit, never at another width), with no network request and no client-side effect from the click. Two evidence-backed investigation rounds are on record (`planning/bugs/BUG-014.md`): a real-browser-verified instrument shows the button itself is connected, stable and correctly positioned when this happens, but the click reaches no listener and no route interceptor observes it — root cause remains unproven. **Does not block**; the job stays required, this bug stays open, monitor-only, with permanent instrumentation. `Secret scan` (`.github/workflows/ci.yml`) is not a required check; whether it should become one, and what the policy should be when a required check fails on a proven-intermittent spec, are both shelved, unanswered questions on the same record.
## Adding a page to the gate

1. Add its route pattern to `GATED_ROUTES` in `packages/e2e/src/page-routes.ts`.
2. Add its states to `GATED_PAGES` in `packages/e2e/src/pages.ts` (a state may drive interaction or intercept a network call in `prepare`).
3. If you added a special UI file (`error.tsx`, `loading.tsx`, ...), add states that exercise it and list it in `ACKNOWLEDGED_SPECIAL_FILES`.
4. Run `pnpm test` (the route-coverage guard) and `pnpm test:a11y`.

The guard fails until this is done, so a page cannot be added silently.

## Manual review process and checklist (decision Q38: reviewer, cadence and pairs are TBD)

**Status: open question 38 is unanswered.** Nothing below is approved.

| Field | Value |
|---|---|
| Who performs manual review (product owner, a named reviewer or a contractor) | **TBD** |
| Cadence (each UI story or each release) | **TBD** |
| Assistive-technology and browser pairs in scope | **TBD** |
| Recorded proposal, **not approved**: NVDA with Firefox (Windows) and VoiceOver with Safari (Apple), reviewed each release | Proposal only |

Until this is answered, screen-reader compatibility is unverified and no record may say that screen-reader testing was performed, passed or is covered by the gate.

### Checklist (per page state; record pass, fail or not applicable with evidence)

1. **Keyboard**: every control is reachable and operable with the keyboard alone; no keyboard trap; focus order follows the reading order; a `main` landmark lets a keyboard user skip to the content.
2. **Focus**: a visible indicator at every stop, not hidden behind other content; after a dynamic change (error, removal, dialog) focus lands somewhere sensible and is not lost to the page.
3. **Zoom and reflow**: at 200% and 400% zoom (320 CSS px), nothing is lost or clipped and there is no horizontal scrolling, except in a labelled, keyboard-focusable scroll region for data tables.
4. **Text spacing**: applying the WCAG 1.4.12 spacing overrides clips nothing.
5. **Contrast**: text 4.5:1 (3:1 for large text), controls and their boundaries 3:1, focus indicators 3:1; check hover, active and disabled states and any new colour; meaning is never carried by colour alone.
6. **Headings and landmarks**: one `h1`, no skipped levels, sensible landmarks, a unique descriptive title per page.
7. **Forms**: a visible label or a programmatic one for every field; instructions and format hints; an error names the field, is programmatically tied to it, suggests a correction, and focus goes somewhere sensible; `autocomplete` on personal-data fields.
8. **Status messages**: outcomes are announced without moving focus (live regions); confirm with a screen reader when a pairing is in scope.
9. **Images, icons and media**: text alternatives where meaningful; decorative items hidden from assistive technology; no time-based media today.
10. **Tables**: real table semantics with headers; a scrollable region is focusable and labelled.
11. **Dialogs, menus and popovers** (none exist yet): focus is trapped and restored, Escape closes.
12. **Motion**: animation respects `prefers-reduced-motion`; nothing flashes.
13. **Touch and orientation**: usable in portrait and landscape; interactive targets at least 24 by 24 CSS px (WCAG 2.5.8).
14. **Language**: `html lang` is set; language changes are marked.
15. **Screen-reader pass** (only for an approved pairing; **TBD**): reading order, names, roles and states, landmark and heading navigation, form mode, live-region announcements.

### Review record (copy per review)

| Field | Value |
|---|---|
| Date | |
| Build (commit SHA) | |
| Reviewer | **TBD** |
| Browser and assistive-technology pair | **TBD** |
| Pages and states reviewed | |
| Result per checklist item | |
| Defects raised (bug ids and severity per the rubric above) | |
| Blocks Done? (any open P1 or P2) | |

## What MVP-023 itself did and did not verify (2026-09-21)

- **Automated**: the full suite on chromium, firefox and webkit at four widths, with real key presses and computed and painted contrast measurements.
- **Not done**: no human manual review, no screen reader, no zoom or text-spacing review, no forced-colours check. The two sign-in and account pages remain unstyled (an advisory bug, `BUG-009`); they were not redesigned.
- **Recorded, not fixed** (Q37): `BUG-009`, `BUG-010`, `BUG-011` (see `planning/bugs.csv`).
- **Focus order was reviewed** (by the agent, not a human reviewer) by printing the Tab sequence of all 16 states at 1280 px in Chromium: each follows the reading and visual order (forms: field then button; listings: search field, Search button, sort links, then results; product: back link, support link, then the scrollable compatibility region; 404: the home link) and no positive `tabindex` exists.
- **Needs manual review** (axe could not decide, so this is not a pass): `color-contrast` of the compatibility table on the product page at 320 and 375 px, where the table sits in a clipped, scrollable region.
- **CI, first run:** all 192 axe scans were clean and no advisory finding appeared on any real page; three Chromium tests failed from BUG-012 (see the known issue above).
- **CI, final merged run (2026-09-22, `aed24d8`, merge commit `ed9b09b`):** 423 of 423 tests passed across chromium, firefox and webkit — 0 skipped, 0 retries. Includes a permanent, unconditional self-check (`tests/a11y/harness-smoke.spec.ts`) proving the harness's own BUG-014 evidence-capture mechanism is trustworthy in a real browser, not merely assumed. BUG-014 stays open (see the known issue above); every other bug found during this story (BUG-003 through BUG-013) is resolved or mitigated as recorded in `planning/bugs.csv`.