# Build plan: guide page and hub redesign with SEO additions

**Status:** plan. The build starts after PR #75 is merged (product owner, 2026-10-06). The designs and decisions are approved (`docs/final-decisions.md`, 2026-10-06):
- "Guide page and hub designs chosen";
- "SEO additions alongside the guide-page redesign";
- "A search phrase for every guide";
- "Article visuals";
- "Hub framing, reference pages, trust signals and community solutions".

**Design source:** the Daylight design board, row "Guide page + hubs, 3 + 2 concepts (2026-10-06)", artboards G1–G3, H1–H2 and P-HowWeWrite.

## Stories and requirements
| Story | Requirement | What this plan delivers |
|---|---|---|
| MVP-037 Hub framing | NFR-005, FR-014 | H1 hub on every technology (Power BI uses H2's journey): hub search, most-needed fixes, "Look it up" row, sections with guides, "What changed" |
| MVP-038 Trust signals | FR-014, NFR-005 | Trust strip: "Checked against Microsoft Learn", date and number of sources, "How we write guides" link; "Something here changed?" report |
| MVP-039 Votes | FR-014 | "Did this fix it?" Yes / Not yet, stored per guide, anonymous, rate-limited |
| MVP-041 Visuals | NFR-003, NFR-005 | Fix guides get the symptom picker and tick-off steps; pattern guides get a diagram and Do / Don't. Safe images and the pause control |
| MVP-042 SEO | FR-017, NFR-004 | Image in TechArticle JSON-LD, "How we write" page, IndexNow on publish, Lighthouse budget, technology in the breadcrumb, page titles and descriptions for hubs |

## Slices (each one is a pull request with tests, accessibility checks and docs)
1. **Shared guide frame (MVP-038 part, MVP-042 part).**
   - Changes: the trust strip, an optional quick-answer card, the side column, the technology in the breadcrumb and in `BreadcrumbList`, the `image` in `TechArticle`, and the "How we write" page (wording approved first).
   - Data: no migration. The "checked on" date comes from a `> [!NOTE] Checked against Microsoft Learn on …` line, parsed from the body. The source count comes from the "Sources" list.
2. **Fix and pattern blocks (MVP-041).** Markdown conventions the renderer turns into components:
   - a `> [!SYMPTOMS]` list of links becomes the symptom picker;
   - numbered `###` steps in a "Work through it" section become tick-off steps, with a CSS-only count (no script, no storage);
   - a `> [!DIAGRAM]` block of `A -> B -> C` becomes the animated stop-points, with a pause control;
   - `> [!DO]` and `> [!DONT]` become the Do / Don't cards.

   Plain Markdown still reads correctly if a block isn't recognised.
3. **Hubs (MVP-037).** Generalise `technology-hubs.ts` with:
   - `tagline` (headlines on the board, pending approval);
   - `topFixes` (slugs);
   - `layout: "sections" | "journey"`.

   The "Look it up" row is the technology's REFERENCE guides. Hub `<title>` and description name the product and what the hub helps with.
4. **Votes and reports (MVP-039, MVP-038 part).**
   - Migration: `ArticleVote` (articleId, helpful boolean, createdAt; no user ID, no IP stored) and `ArticleReport` (articleId, message ≤ 500 characters, createdAt, status).
   - Reversible: new tables only.
   - Rate limit per IP in memory or with the existing rate-limit helper. Reports are moderated in `/admin`.
   - The Privacy notice is updated if any data is collected.
5. **IndexNow and the speed budget (MVP-042).**
   - IndexNow: a key file at `/{key}.txt`, with the key from the `INDEXNOW_KEY` environment variable, set by the product owner. Publishing an article or update sends its URL to `api.indexnow.org`. The ping is fire-and-forget, never blocks publishing, and logs failures.
   - Speed: a Lighthouse CI job against the production build checks the home page, a hub and a guide (LCP ≤ 2.5 s, CLS < 0.1, total blocking time as a stand-in for INP).

## Security
- **Votes and reports:** anonymous input is validated, length-capped and rate-limited. Reports are shown only to admins, as escaped text. No personal data is stored. A CSRF-safe POST goes through the existing API pattern.
- **IndexNow:** only public page URLs are sent. The key comes from the environment, and the key file serves only that value.
- **Markdown blocks:** rendered through components only. No raw HTML, keeping the existing single-sink rule. Diagram labels are text nodes.

## Accessibility and motion
- Real buttons, links and checkboxes; labels; 44 px targets; text contrast at least 4.5:1.
- Every animation rests on its final frame, stops under `prefers-reduced-motion`, and has a Pause control when it runs longer than 5 seconds.
- The accessibility gate (`pnpm test:a11y`) covers a fix guide, a pattern guide, a hub, the Power BI hub and the "How we write" page, at 320, 375, 768 and 1280 px.

## Tests
- Unit tests:
  - the parsers for the "checked on" line, the source count and each new Markdown block;
  - hub config validation (top-fix slugs exist and are published);
  - the JSON-LD `image`;
  - breadcrumbs with the technology level;
  - the IndexNow request builder;
  - vote and report validation.
- Integration tests: the vote and report repositories against Postgres.
- End-to-end tests: the accessibility gate pages above; ticking steps updates the count; the pause control stops motion.

## Order
1 → 3 → 2 → 4 → 5. The guide frame and hubs give the biggest visible and SEO gain first. Each slice is merged before the next starts.

## Waiting on the product owner
1. ~~Approve the hub headlines on the board.~~ Power Automate and Power BI approved 2026-10-06; the other five are drafted in `docs/final-decisions.md`.
2. ~~Approve the "How we write" page wording.~~ Approved 2026-10-06.
3. Later, set `INDEXNOW_KEY` in Netlify (slice 5).
