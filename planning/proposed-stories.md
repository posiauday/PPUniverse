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
