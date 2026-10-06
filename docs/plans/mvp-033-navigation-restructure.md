# MVP-033: navigation restructure (build plan)

**Approved design:** `docs/final-decisions.md`, 2026-10-02:
- "Navigation restructure: by technology and by goal"
- "Structure boards approved"
- "Governance & admin area and the Updates badge"
- "Technology pages are hubs"

The boards are on the design canvas (bottom row): https://claude.ai/artifact/2wV3YJ1ezFRP2rcv4egFiJ

Each slice is its own PR with tests, an a11y gate run in CI, and its paperwork.

## Slice A: top bar (DONE in this PR)
- [x] Header and phone menu: Technologies · Guides; "KPI guides" removed.
- [x] Components links behind `FEATURE_COMPONENTS=on` (`apps/web/lib/feature-flags.ts`).
- [x] Footer column renamed "Guides".

## Slice B: content model (topics + Governance & admin area)
- `TechnologyInfo.kind: "product" | "area"`. Add `GOVERNANCE_ADMIN` ("Governance & admin", slug `governance`, kind `area`). Places that mean Microsoft products only must filter `kind === "product"`:
  - footer trademark list;
  - home "six technologies" panels and copy;
  - `TechnologyTiles`.
- Prisma: `Technology` enum gains `GOVERNANCE_ADMIN`; `Article.topic String?`. Reversible migration: drop the column; removing an enum value needs a type rebuild, so document the rollback in the migration.
- Domain: a `TECHNOLOGY_TOPICS` registry (per technology, the approved sections with slug, name and description) and `isValidTopic(technology, topic)`.
- Article source frontmatter gains `topic:`, validated against its technology. Add a topic to all 24 launch articles, as mapped on the structure board.
- Admin editor: a topic picker that depends on the technology. The API validates it.
- Palette: Governance & admin `#E2E8F0` / `#334155` (8.4:1; add to the design-tokens test).

## Slice C: hubs
- Technology page `/[technology]` becomes a hub:
  - a hero with a scoped "Stuck? Search …" box and 3 problem chips (a config list per technology);
  - a card per topic: description, guides as links, planned guides as "Coming" (from a reviewed config, never invented), and "See all";
  - a Quick reference row, showing only reference pages that exist;
  - a "New here? Start with these 3" strip at the end.
- Old tab URLs (`/[technology]/[tab]`) redirect (301) to the hub section anchors. Update the sitemap.
- `/learn` Guides hub by goal: Fix a problem · Choose the right tool · Design it to last · Measure success. One label per kind everywhere (`ARTICLE_TYPE_LABEL`, headings, filters); technology filter chips; error-paste search.
- Header Technologies menu becomes the large menu with 7 areas: guide counts, a start-here guide, the first sections.

## Slice D: Updates
- `UpdateItem` model (title, technology, kind, summary, source URL, publishedAt, status DRAFT/PUBLISHED) and a deprecation tracker list. The agent drafts; the product owner publishes.
- `/updates` page, matching the Updates board.
- Animated lime count badge in the header and phone menu:
  - the count is published items newer than the last-visit date, which is kept in `localStorage` only;
  - reduced motion: static;
  - aria "Updates, N new".
- **Update the Privacy notice in the same PR** to mention the local last-visit date.
