# Proposed stories (not approved)

**Status of everything in this file: Proposed.** Not approved, not Ready, not counted on the board in `planning/status.md`, and not in `planning/mvp-backlog.csv` or `planning/backlog.csv`. A proposal becomes a backlog story only when the product owner directly approves it. Nothing here is a decision.

Origin: the product owner's 2026-09-21 disposition of the remaining FR-003 product-detail items (`docs/final-decisions.md`, section C; `docs/open-questions.md` item 26; `planning/tech-debt/TD-007.md`). Priorities and estimates are suggestions on the same Fibonacci scale as `planning/backlog.csv`.

| ID | Proposed story | FR-003 items | Suggested priority | Suggested estimate | Status |
|---|---|---|---|---|---|
| PROP-001 | Product Media and Screenshots | screenshots, demo | P1 | 8 | Proposed |
| PROP-002 | Product Documentation and Prerequisites | prerequisites, setup instructions | P1 | 5 | Proposed |
| PROP-003 | Product Accessibility Disclosure | accessibility statement | P2 | 5 | Proposed |
| PROP-004 | Product Releases and Changelog | changelog, version history | P1 | 5 | Proposed |
| PROP-005 | Related Assets | related assets | P2 | 3 | Proposed — **deferred** |
| PROP-006 | Repeated Query Parameter Handling (BUG-002 corrective) | — (FR-002; not an FR-003 item) | P3 | not estimated (expected small) | Proposed — approved in principle, not scheduled |
| PROP-007 | Job Queue Foundation | — (cross-cutting infrastructure; TD-004, TD-015; not an FR-003 item) | not assigned | ~13 (anchor: comparable to MVP-006) | Proposed — blocked on BUG-015 and its own approval |
| PROP-008 | Power Apps Component Generator / Library | — (new product scope; not in BRD/PRD/backlog) | not assigned | not estimated (pre-research) | Proposed — pre-research, scope not yet defined |

## Items assigned to existing approved stories (not proposals)
- **Creator** → MVP-011 (Creator applications): creator identity and creator-profile *ownership* only. The public creator page/route stays unresolved under open question 24 and must not be built unless approved.
- **Price** → MVP-007 (Checkout): together with the pricing, currency, tax and refund decisions required first (open questions 3, 7, 8). No `offers`, `price` or `priceCurrency` in structured data until price is modeled and approved.

---

## PROP-001 — Product Media and Screenshots
- **Proposed scope:** a `ProductMedia` model (the entity `docs/06-data-model.md` names and is still unbuilt); screenshots displayed on the product page with required alt text and a defined order; a product demo, which may be a supported external link or an approved media type. Uploads reuse the MVP-006 quarantine/scan pipeline. Authoring UI is creator-portal work (MVP-012).
- **Requirement relationship:** FR-003 (screenshots, demo); FR-009 (creator portal supports media); FR-017 (a social-preview image becomes possible); FR-007 / MVP-006 (untrusted uploads).
- **Dependencies:** MVP-005 (Done), MVP-006 (Done); authoring depends on MVP-012. **Product-owner decisions needed first:** the allowed demo format(s), and how scanned public images are delivered (storage paths must never be public).
- **Acceptance criteria:** only scan-CLEAN images are ever shown; alt text is required and reviewed by a moderator; type and size limits follow the upload policy; a missing-media state says the information has not been provided; demo links accept only approved schemes and formats; nothing is fetched from third parties on page load without an approved decision; images are responsive and do not shift layout.
- **Security impact:** highest of the set — untrusted image uploads (SVG excluded or sanitized, metadata stripped, content sniffed, malware-scanned, quarantined), external demo links (scheme allow-list, safe `rel`), no public storage paths, possible CSP change.
- **Accessibility impact:** alt text required and reviewed; no essential information conveyed only inside an image; any gallery is keyboard-operable with visible focus and respects reduced-motion; captions where a demo is video.
- **Suggested priority / estimate:** P1 / 8.

## PROP-002 — Product Documentation and Prerequisites
- **Proposed scope:** structured prerequisites (short factual items) and setup instructions in a safely rendered, restricted format; the `Prerequisite` and `ProductDocument` entities named in `docs/06-data-model.md`. Clarify how prerequisites relate to compatibility notes so the same requirement is not stated twice.
- **Requirement relationship:** FR-003 (prerequisites, setup); FR-009 (creator portal supports documentation).
- **Dependencies:** MVP-005 (Done); authoring depends on MVP-012, moderation on MVP-013. **Decision needed first:** the permitted format for setup instructions (for example a Markdown subset) and length limits.
- **Acceptance criteria:** prerequisites and setup render on the product page in a stable order; formatting is rendered through an allow-list (no raw HTML); empty states say the information has not been provided; text is length-limited and moderated; nothing exposes credentials, tenant identifiers or customer data (reuse the TD-006 screening approach).
- **Security impact:** stored-XSS surface from creator-authored formatted text (allow-list renderer, no raw HTML, safe links); private-data leakage in instructions (moderator review plus heuristic screening).
- **Accessibility impact:** correct heading levels nested under the page's `h2` sections; list semantics; code blocks scrollable with a keyboard-focusable region; link text meaningful.
- **Suggested priority / estimate:** P1 / 5.

## PROP-003 — Product Accessibility Disclosure
- **Proposed scope:** a creator-supplied accessibility statement per product describing what the creator declares about their asset's accessibility. It is **not** platform accessibility validation, which MVP-023 owns. A structured "accessibility status" value here could later feed the FR-002 accessibility filter deferred in TD-005.
- **Requirement relationship:** FR-003 (accessibility statement); FR-002 (accessibility-status filter, TD-005); brand rule that no certification or guarantee is implied.
- **Dependencies:** MVP-005 (Done); authoring MVP-012; moderation MVP-013. **Decisions needed first:** the vocabulary of declared statuses (in keeping with the Creator Declared / Marketplace Reviewed approach), and whether a statement is mandatory for submission.
- **Acceptance criteria:** an optional or required statement (per the decision) renders on the product page; every claim is labelled as creator-declared; nothing implies certification, a guarantee or Microsoft approval; empty state says the information has not been provided; moderated before publication.
- **Security impact:** low — sanitized text only; no PII. Moderation prevents false or misleading conformance claims.
- **Accessibility impact:** the statement itself must meet WCAG 2.2 AA; conformance claims must not be conveyed by colour alone.
- **Suggested priority / estimate:** P2 / 5.

## PROP-004 — Product Releases and Changelog
- **Proposed scope:** a version-history list and per-release changelog on the product page, building on the minimal `Release` record delivered in MVP-005. Overlaps MVP-014 ("Immutable published releases"), which owns immutability and file replacement; the product owner may prefer to fold the display work into MVP-014.
- **Requirement relationship:** FR-003 (changelog, version history); FR-011 (releases immutable after publication; corrections create another version); FR-009 (creator portal supports releases).
- **Dependencies:** MVP-005 (Done); MVP-012 (release editor); MVP-014 (immutable releases).
- **Acceptance criteria:** the page lists published releases newest first with their publish date; each release shows its changelog text; unpublished releases are never shown; the current version shown elsewhere on the page matches the newest published release; changelog text is sanitized and length-limited; empty state says the information has not been provided.
- **Security impact:** stored-XSS surface from changelog text; a published release must stay immutable (a correction is a new version).
- **Accessibility impact:** list semantics, `<time datetime>` for dates, headings that preserve the outline.
- **Suggested priority / estimate:** P1 / 5.

## PROP-005 — Related Assets (deferred)
- **Proposed scope (when un-deferred):** explicit, curated relationships only (creator- or editor-defined links, moderated), displayed with the existing product-card presentation. No algorithmic or behavioral recommendation.
- **Requirement relationship:** FR-003 (related assets).
- **Dependencies:** enough real published inventory to relate; an approved relationship rule; MVP-012–014 for authoring and moderation.
- **Acceptance criteria:** only PUBLISHED products can be related; no relationship is fabricated or inferred; the section is absent or shows an approved empty state when none exist; links are moderated against spam.
- **Security impact:** low — link-integrity and spam abuse between creators; no untrusted markup.
- **Accessibility impact:** list and card semantics reuse the existing accessible `ProductCard`.
- **Suggested priority / estimate:** P2 / 3.

## PROP-006 — Repeated Query Parameter Handling (BUG-002 corrective)
- **Origin:** MVP-023 product-owner decision Q32 (2026-09-21, `docs/final-decisions.md`). Not an FR-003 proposal; recorded in this register because `planning/mvp-backlog.csv` and `planning/backlog.csv` have no Proposed status.
- **Proposed scope:** `normalizeQuery` (MVP-004) handles repeated or array query parameters safely on `/search` and the category routes, so `?q=a&q=b` no longer returns HTTP 500. No other search-behavior change. The handling choice (first value, or no query) is to be confirmed when the story is scheduled; open question 32 records the safest reversible default.
- **Requirement relationship:** FR-002 (search and filtering).
- **Reference:** BUG-002 (`planning/bugs/BUG-002.md`).
- **Sequencing:** after MVP-023, and before any story that expands search.
- **Dependencies:** MVP-004 (Done).
- **Acceptance criteria:** to be written when scheduled; the minimum is that a repeated `q` no longer returns HTTP 500 and that the chosen handling is covered by a unit test and an integration check.
- **Security impact:** low — removes an unhandled-exception path reachable by any anonymous request.
- **Accessibility impact:** none expected.
- **Suggested priority / estimate:** P3 / not estimated.
- **Status:** Proposed. The product owner approved the story in principle (Q32); it is not scheduled and not started.

## PROP-007 — Job Queue Foundation

- **Origin:** `planning/prework/TD-004-prework-analysis.md` (2026-09-24), and the product-owner decision "TD-004 architecture and sequencing" (`docs/final-decisions.md`, 2026-09-24) that followed it. Not an FR-003 proposal; cross-cutting infrastructure named directly by TD-004 and TD-015.
- **Proposed scope (unchanged from the pre-work analysis §7):** a minimal, generic job-enqueue/claim/complete/retry mechanism — a Postgres-backed queue (`SELECT ... FOR UPDATE SKIP LOCKED`, decided architecture, `docs/final-decisions.md`) — plus the `apps/worker` runtime to consume it, with **no specific job handler migrated onto it as part of this story**. TD-004's file scan and TD-015's email sends migrate afterward, each as its own small follow-up, so this foundation story's own surface area stays small and reviewable.
- **Proposed acceptance criteria (unchanged from the pre-work analysis §7):**
  - A job can be enqueued with a typed payload, claimed by exactly one worker at a time, marked complete or failed, and a failed job is retried per a defined backoff policy up to a defined attempt limit, then dead-lettered.
  - A crashed worker's claimed-but-incomplete job becomes reclaimable after a defined lease timeout (no job is lost to a worker crash).
  - The correlation ID present at enqueue time is present in every log line the worker emits while processing that job.
  - Local and CI test suites exercise the queue mechanics without any real external vendor call.
  - New table(s) carry a reversible migration and RLS per the standing convention.
  - Documentation states, explicitly, which of TD-004/TD-015/MVP-012's needs this foundation does *not* yet solve (the actual migration of those handlers onto it), so a reader doesn't assume this story silently fixes those tech-debt records.
- **Requirement relationship:** cross-cutting; supports TD-004 (FR-007-adjacent, file scanning), TD-015 (FR-013, transactional email), and MVP-012's release-file submission path (FR-009). MVP-009 and MVP-019 are recorded as **under-specified** consumers — no requirement is invented for either.
- **Dependencies:** **BUG-015 must be resolved and merged first** (`docs/final-decisions.md`, "TD-004 architecture and sequencing", section 3) — a job table is exactly the shared, mutable, cross-package CI state BUG-015 is about, and landing this before BUG-015's isolation strategy is settled creates a second surface for the identical flake. A new ADR is also required before implementation (architecture is decided in principle — Postgres-backed — but not yet written up as its own ADR).
- **Security impact:** a new table (RLS + reversible migration, standing convention); job payloads must carry identifiers and minimal re-derivation parameters only, never secrets, file contents, or rendered message bodies with PII; a worker runs with a fixed, narrowly-scoped service identity, not the app's full request-time authorization surface; a malformed/poisoned job must fail fast and not block other queued jobs. Full detail: pre-work analysis §5.
- **Testing impact:** job handler logic is plain-function unit-testable (no real queue involved); queue mechanics themselves (claim/lock/complete/retry) are DB-gated integration tests following this repo's existing `describe.skipIf(!process.env.DATABASE_URL)` convention; worker timing (poll interval, lease expiry, retry delay) needs to be injectable/fake-clock-driven, not tested by waiting out real delays. Full detail: pre-work analysis §6.
- **Suggested priority / estimate:** not assigned / **~13 points**, an anchor (comparable to MVP-006, the largest single-story estimate on the current board), offered because no existing partial implementation exists to build on (`apps/worker` is genuinely empty), real queue-mechanics testing requirements apply, and the architecture choice — while now decided — still needs its own ADR before implementation.
- **Status:** Proposed. **Not added to `planning/mvp-backlog.csv`. Not started.** Blocked on BUG-015 (its own separate authorization, not yet given) and on this proposal's own approval as a scheduled story.

## PROP-008 — Power Apps Component Generator / Library

- **Origin:** raised directly by the product owner in this session (2026-09-24), not from `docs/01-brd.md`, `docs/02-prd.md`, or any existing FR. This is genuinely new product scope — a tool or library to help creators produce Power Apps (PCF) components, positioned to compete with existing component libraries such as powerappsui.com, with an explicit bar of "pinnacle of modern, actually useful" components rather than a bare scaffold.
- **Research so far (informal, this session, not a formal pre-work document):**
  - A same-session research pass (2026-09-24) into whether a *generator/scaffolding tool* was worth building found weak differentiation: Microsoft's own free `pac pcf init` already does the mechanical scaffolding; the one community tool with real historical adoption ("PCF Builder," 24,687 VS Code Marketplace installs) has been abandoned since 2021, a signal that demand existed but standalone-tool maintenance wasn't sustained; no active web-based PCF generator exists. Full findings are in this session's transcript, not yet written to a tracked file.
  - Licensing was checked directly: the `pac` CLI itself is under a Microsoft Software License Terms EULA (not MIT) with a "Distributable Code" carve-out for code marked sample/template (a reasoned inference, not an explicit statement, that scaffold output qualifies); Microsoft's own sample/reference-control repositories (`PowerApps-Samples`, `powercat-creator-kit`, `powercat-code-components`) are plain MIT.
  - **Not yet researched:** the actual competitor, powerappsui.com, and — separately — what technical/design bar "pinnacle of modern, actually useful" components would require. A deeper, dedicated research prompt for this is being prepared for external (Copilot) research; its findings, once returned, should be added here and verified before anything in this entry is treated as more than a placeholder.
- **Proposed scope:** **not yet defined.** Depends entirely on the deeper research above. Candidate shapes to be evaluated, not assumed: (a) a generator/scaffolding tool (weakly differentiated per the research so far — likely not the right shape alone); (b) a curated library of pre-built, genuinely excellent finished components (closer to what `powercat-creator-kit` or powerappsui.com already do — the differentiation question becomes design/engineering quality, not scaffolding); (c) some combination. **Do not assume (b) is decided either — it is the research's job to establish which shape, if any, is worth pursuing.**
- **Requirement relationship:** none yet — this is new scope, not a gap in an existing FR. If pursued, a requirement ID would need to be added to `docs/02-prd.md` through the normal process, not invented here.
- **Dependencies:** none technical yet identified. Strategically, this competes for effort against the still-incomplete core marketplace scope (creator onboarding, licensing, entitlements) this project's MVP is actually chartered to ship first (`CLAUDE.md`, "Product objective"). A generator/library also has no real user until the creator pipeline (open question 2's decision — invited/vetted creators only) is live, which argues for sequencing this after, not alongside, current work.
- **Acceptance criteria:** none written — no scope to test yet.
- **Security impact:** not assessed — depends on shape decided.
- **Accessibility impact:** not assessed — depends on shape decided. Note for later: if the eventual shape is a component *library* (candidate (b) above), each component's own WCAG 2.2 AA conformance becomes a first-class deliverable, not an afterthought, given this project's own accessibility bar (`CLAUDE.md`).
- **Suggested priority / estimate:** not assigned; not estimated. Recommended sequencing: **after** the current MVP's core marketplace scope, not alongside it — see Dependencies above.
- **Status:** Proposed — pre-research. **Not added to `planning/mvp-backlog.csv`. Not started.** Blocked on the deeper competitor/design-bar research (queued as an external prompt, not yet run) and on the product owner deciding a shape and requirement once that research returns. See `docs/open-questions.md` item 60.
