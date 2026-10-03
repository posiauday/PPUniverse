# Session handoff (2026-10-02)

This file is written for a new session that has none of the previous conversation's context.

**Read first:**
- `CLAUDE.md` (project rules, required reading order, Definition of Done).
- `docs/final-decisions.md`: the binding product-owner decisions. The 2026-10-02 entries cover the current work.

**Repo locations:**
- **Working clone:** `G:\PPU-dev`.
- **Older clone:** `G:\PowerPlatformUniverse`, which is on branch `feature/mvp-014-immutable-releases-prework` with uncommitted local edits. Don't use it for new work.

## Product and live state

- **Site:** LowCodeStacks, https://lowcodestacks.com. Free Power Platform learning: guides, architecture patterns and KPIs. The marketplace (paid components) is built but hidden.
- **Operator:** Uday Posia, Saskatchewan, Canada. Contact: contact@lowcodestacks.com.
- **Hosting:** Netlify, git-linked. It deploys `main`; the package dir is `apps/web`. `netlify.toml` sets `publish = "apps/web/.next"` (BUG-021).
- **Database:** Supabase Postgres, project "ppuniverse-dev".
  - The app connects through the pooler on port 6543, with `?schema=public`.
  - Migrations run against the direct 5432 connection string.
  - The free plan pauses inactive projects.
- **Branch flow:** feature branch → PR into `develop` → release PR `develop` → `main`.
  - **The product owner merges every PR.** Agents can't run `gh pr merge` (blocked by the permission classifier); don't try to work around that.
  - Give the user the merge command, or let them click Merge.
- **Production migration:** `20261002000000` must be applied by the user with the 5432 string. Check it was applied before relying on it.

## Architecture

pnpm + Turborepo monorepo, Node >= 20.

- `apps/web`:
  - Next.js 16 App Router, TypeScript, Tailwind v4.
  - Design tokens live in `app/globals.css`, using the "Daylight" look: light, bright, colourful, with motion that respects reduced motion.
- `apps/worker`: background jobs.
- `packages/db`: Prisma 7, schema split under `prisma/schema/*.prisma`, with reversible migrations.
- `packages/domain`: domain types. `@ppu/domain-content` holds the `TECHNOLOGIES` registry (the six technologies and their slugs).
- `packages/adapters/*`: one adapter per concern, behind interfaces (content, catalog, identity, email via Resend, payments via Stripe, storage, scanning via ClamAV, search, privacy, …). The web app wires them up in `apps/web/lib/*.ts`, for example `lib/content.ts` → `contentRepository`.
- `packages/ui`: shared accessible components.
- `packages/telemetry`: structured logs, traces, metrics and audit events.
- `packages/e2e`: the Playwright + axe accessibility gate.
  - It checks every page route at 320/375/768/1280 px in chromium, firefox and webkit.
  - `src/page-routes.ts` (`GATED_ROUTES`) must list every `page.tsx`; the route-coverage unit test fails otherwise.
  - `src/pages.ts` holds the states each route is checked in.

**Data flow:** server components read through repository adapters, and pages are `force-dynamic`. SEO is handled in `apps/web/lib/seo/*`:
- metadata, canonical URLs, JSON-LD, sitemap and robots;
- empty pages are `noindex, follow`.

**Feature flags:** `apps/web/lib/feature-flags.ts`. `FEATURE_COMPONENTS=on` shows the Components (marketplace) links. It is off in production.

## Ticket status (planning/mvp-backlog.csv is canonical)

| Status | Stories |
|---|---|
| **Done** | MVP-001 to 006, 010, 012, **014** (immutable published releases), 017 to 023, 026 to 028 |
| **QA** | 029 (launch content: 24 guides), 031 (Daylight redesign), 032 (About/Privacy/Terms) |
| **In progress** | 007 (checkout session), 030 (Netlify deploy; PR #52 has open review fixes), **033** (navigation restructure) |
| **Backlog** | 008, 009, 015, 016, 024, 025 |
| **Superseded** | 011, 013 |

**Open PRs:**
- **#57:** BUG-021 into `develop`. An a11y shard flaked, and a rerun was requested.
- **#52:** MVP-030 review fixes.

## MVP-033 (navigation restructure)

The plan is in `docs/plans/mvp-033-navigation-restructure.md`. It has four slices:

- **A (merged, live):** the top bar is Technologies ▾ · Guides · search · sign-in. KPI guides are no longer a top link, and Components sits behind the flag.
- **C (this branch, `feature/mvp-033-hubs`):** technology pages become hubs. The approved board is the "structure" boards on the design canvas, https://claude.ai/artifact/2wV3YJ1ezFRP2rcv4egFiJ.
  - **Done:**
    - `apps/web/lib/technology-hubs.ts`:
      - `HUB_TOPICS`, the researched sections for each area (a KPI section exists only in Power BI);
      - `ARTICLE_TOPIC`, which maps each guide slug to its section (TD-025);
      - `HUB_PROBLEMS`, the problem chips;
      - `groupIntoSections` and `startHerePath`.
    - `app/[technology]/TechnologyHub.tsx`, the hub page:
      - a hero with search and problem chips;
      - "Everything in X" section cards, with planned guides shown as "Coming";
      - a "New here? Start with these 3" path at the end, linked from the hero.
    - `app/[technology]/OtherAreas.tsx`: `ALL_AREAS`, which is the 6 technologies plus Governance & admin, used by the header menu, the footer and the "Other areas" row.
    - `app/[technology]/page.tsx` renders the hub. Its title is "X guides"; it loads published guides of every type.
    - `app/[technology]/[tab]/page.tsx`: old tab URLs get a 308 redirect to the hub. An unknown technology or tab is a 404.
    - `app/governance/page.tsx`: the 7th area. It is noindex until guides exist, and shows planned guides only.
    - The sitemap now lists hubs only (`MAX_SECTION_PATHS` = 6).
    - The old `TechnologySection.tsx` and `FeaturedGuides*` were deleted.
    - Gov colour tokens were added (`--color-tech-gov`, `--color-tech-gov-ink`).
    - The e2e states were updated (`technology-hub`, `technology-tab-redirect`, `governance`).
    - TD-025 was recorded.
  - **Verified:** web typecheck and lint are clean, and the web unit tests pass. e2e typecheck and the route-coverage test pass.
  - **Not yet run:** the Playwright a11y gate (CI runs it on the PR). The pages have not had a visual check in a browser.
  - **Done since (2026-10-02/03):** goal labels on `/learn` and in the footer, the Technologies mega menu, a visual check, and the planning updates. TD-026 (the rest of the Guides board) is resolved too.
  - **PR:** slice C goes into `develop`; the product owner merges it.
  - **Cloud container quirk:** `pnpm build` (Turborepo) fails there with "Exec format error". Build with `pnpm -r --filter "@ppu/web^..." run build`, then run `next build` in `apps/web`.
- **B (built 2026-10-03, on this branch / PR #62):** `GOVERNANCE_ADMIN` technology, `articles.topic` (migrations `20261003000000` and `20261003000100`), `TECHNOLOGY_TOPICS` and `isValidTopic` in the domain, a hub-section picker in the admin editor, all 24 launch files carry `topic:`, and the Governance page lists its guides. TD-025 is resolved, and BUG-022 (editor saves cleared the technology) is fixed. **Production:** the product owner applies both migrations with the 5432 connection before the deploy.
- **D:** an Updates page and model, an animated "new updates" badge in the top bar (static under reduced motion), and a Privacy notice update if the badge stores any read state.

**Next after MVP-033:** our own drawn product icons to replace the coloured dots in the menu and cards, plus decorative animated placements. **Never use Microsoft product logos**: they are trademarks, and the project rules forbid implying endorsement.

## Rules the product owner set (beyond CLAUDE.md)

**Security and accounts:**
- Never see, enter or handle passwords, API keys, secrets or connection strings with passwords. The user puts secrets into Netlify, Supabase and Resend themselves.
- Don't create accounts. The user changes DNS (Porkbun).
- Respect permission-classifier denials, including production DB reads and writes and merges. Don't work around them.

**Content and legal:**
- No Microsoft endorsement claims. Use our own glyphs, never product logos.
- Never copy or scrape competitor code or content; use it for inspiration only.
- The agent never publishes articles. It imports drafts only.
- Research before implementing: verify platform, content and design claims against primary sources (Microsoft Learn and similar). The product owner has called out guessed mistakes.

**Design:**
- Bright and colourful, with motion. Dark designs were rejected.
- Show several concepts, and render-check before showing.
- Match the approved design board closely.

**Decisions:** only `docs/final-decisions.md`, an approved ADR, or a direct product-owner instruction count as approved. Record new decisions there.

**Working style:**
- The user is often near their usage limit. Be fast and token-light: run targeted tests, not the full three-browser gate, unless asked. CI runs the full gate.
- Keep replies short and plain.

**Windows quirks:**
- Files are CRLF, so node string replaces can miss. Use an edit tool, or normalise line endings first.
- Use `prettier --check --end-of-line auto` locally; CI is authoritative.

## How to run

```
pnpm install
pnpm build            # Prisma client first, then everything
pnpm typecheck
pnpm lint
pnpm test             # Vitest; DB-gated tests self-skip without DATABASE_URL
pnpm format:check
pnpm test:a11y        # needs build, browsers:install, local Postgres, E2E_ALLOW_DATABASE_WRITES=1
```

- **Single package:** `cd apps/web && npx tsc --noEmit && npx vitest run lib app`.
- **Local database:** `docker compose up -d`, then `pnpm --filter @ppu/db exec prisma migrate deploy`.
- **Stale builds:** if a package's `dist` is stale after switching branches, run `pnpm build --filter=<pkg>`.

**Environment variable names** (never commit values; see the `.env.example` files):
`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, `EMAIL_UNSUBSCRIBE_SECRET`, `RESEND_API_KEY`, `SENTRY_DSN`, `CLAMAV_HOST`, `CLAMAV_PORT`, `FEATURE_COMPONENTS`, `E2E_ALLOW_DATABASE_WRITES`.
