# Session handoff (2026-10-07)

This file is written for a new session that has none of the previous conversation's context.

**Read first:**
- `CLAUDE.md`: project rules, the required reading order, and the Definition of Done.
- `docs/final-decisions.md`: the binding product-owner decisions. The 2026-10-05 to 2026-10-07 entries cover the latest work.
- `docs/plans/learn-module.md`: the next big piece of work.

**Repo locations:**
- **Working clone:** `G:\PPU-dev`.
- **Older clone:** `G:\PowerPlatformUniverse`. Don't use it for new work.
- **Leftovers:** `G:\PPU-blocks` and `G:\PPU-pool` are old scratch worktrees. Git no longer tracks them, and they can be deleted.

## Product and live state

- **Site:** LowCodeStacks, https://lowcodestacks.com. Free Power Platform learning: 57 guides in `content/articles/`, architecture patterns and KPIs.
  - The marketplace (paid components) is built but hidden behind `FEATURE_COMPONENTS`.
  - Comments are built but hidden behind `FEATURE_COMMENTS`.
- **No personal details:**
  - Never add the owner's name, province, city or personal email to the site or to new repo content.
  - Guides are credited to the brand, with the byline "the Maker Desk" (`BYLINE_NAME` in `apps/web/lib/legal/pages.ts`).
  - Contact: contact@lowcodestacks.com.
- **Hosting:** Netlify, git-linked. It deploys `main`; the package dir is `apps/web`. Every production deploy costs Netlify credits.
- **Database:** Supabase Postgres.
  - The app connects through the transaction pooler on port 6543. Supavisor allows 200 clients, so the pg pool is capped at max 3 with a 5 s idle timeout (BUG-027).
  - **Migrations run automatically** on a release to `main`: the Netlify production build runs `packages/db/scripts/deploy-migrations.mjs` first (decision 2026-10-05). Merging the release PR is the approval. Deploy previews never migrate.
- **Branch flow:** feature branch → PR into `develop` → release PR `develop` → `main`, merged with "Create a merge commit".
  - **The product owner merges every PR.** Agents can't run `gh pr merge` or turn on auto-merge; don't try to work around that.

## Where things stand

**Merged into `develop`:** #88 to #97. That covers:
- redesign slice 2;
- BUG-027 and BUG-028;
- the top bar (MVP-045);
- AI-search fixes (MVP-046: RSS, IndexNow, Organization JSON-LD, article dates);
- removal of personal details;
- quick answers on all guides;
- comments (MVP-040).

`main` is still at release #87.

**Open PRs, merge in this order:**
1. **#98 `feature/speed-budget` (MVP-042):**
   - the Playwright page-speed check (report only, TD-032);
   - font preloads trimmed;
   - the display font uses `display: "optional"`.
2. **#99 `feature/admin-panel` (MVP-047):** admin panel concept A. It includes #98's commits, so merge #98 first.
   - sidebar, overview, users and roles (a new Contributor role), settings, and a "keep" action for reported comments;
   - this handoff file.

**Then the release:** open a PR `develop` → `main`.

**The release applies these migrations automatically (check the Netlify build log):**
- `20261009000000`: policy versions;
- `20261010000000`: comments and profiles;
- `20261011000000`: policy versions for the comments wording;
- `20261012000000`: the Contributor role.

**Ticket status** (`planning/mvp-backlog.csv` is canonical):

| Status | Stories |
|---|---|
| Done | 001 to 006, 010, 012, 014, 017 to 023, 026 to 028 |
| QA | 029, 031 to 037, 039, 044, 047 |
| In progress | 007, 030, 038, 040, 041, 042, 045, 046 |
| Backlog | 008, 009, 015, 016, 024, 025, 043 |
| Superseded | 011, 013 |

## Next work (in order)

1. **The Learn module** (plan: `docs/plans/learn-module.md`; it lives at `/topics`, with in-depth topic explainers).
   - The product owner picked concept **L3 "Story scroll"**, then asked for more research before building:
     - research what top learning sites do for structure, interaction and motion. Use inspiration only: never copy their content or code;
     - make **three variations of L3**, raised to a top-class standard with animation;
     - render-check them, then show them for a choice.
   - The earlier concepts are in the untracked `.nav-mock/learn-concepts.html` and `learn-L1/L2/L3.png`.
   - After the choice, build it in vertical slices.
2. **TD-032:** cut blocking time (about 380 to 490 ms on a phone profile, mostly hydration of the header's client components), then make the speed check blocking.
   - The product owner's PageSpeed Insights run (desktop, score 79, TBT 390 ms) is recorded in `planning/tech-debt/TD-032.md`, with a list of things to inspect. Do it after the Learn module.
3. **Contributor role:** the product owner still has to decide what a Contributor can do. Until then, it has no extra powers.

**Product-owner to-dos (remind them; never do these for them):**
- Merge #98, then #99, then the release PR. Then check that the Netlify production build passed, since it runs the migrations.
- Set `FEATURE_COMMENTS=on` and `INDEXNOW_KEY` in Netlify after the release.
- Search Console:
  - submit the sitemap and request indexing;
  - check the "Deceptive pages" review.
- Add the site in Bing Webmaster Tools (import from Search Console).
- Submit the site at Brave's submit-url page.
- Paste the quick answers into the live guides through `/admin/content`.
- Consider making the GitHub repo **private**: the old history contains personal email addresses.
- Answer the open PIPEDA mailing-address question.

## Rules the product owner set (beyond CLAUDE.md)

**Security and accounts:**
- Never see, enter or handle passwords, API keys, secrets or connection strings with passwords.
- Don't create accounts. The user puts secrets into Netlify, Supabase, Resend and Google, and changes DNS at Porkbun.
- Respect permission-classifier denials (production DB reads and writes, merges); don't work around them.
- Ask before downloading files or uploading designs to outside services.
- Decline non-essential cookies.
- Don't browse the Wayback Machine.

**Content and legal:**
- No Microsoft endorsement claims. Use our own glyphs, never product logos.
- Never copy or scrape competitor code or content. When drawing on forum posts, paraphrase and leave out usernames.
- The agent never publishes articles; it drafts only.
- Don't click "Make public" until launch.
- Research before implementing: verify platform, content and design claims against primary sources such as Microsoft Learn.

**Design:**
- Bright and colourful, with motion that respects reduced motion. Dark designs were rejected.
- Show several concepts, and render-check them before showing.

**Decisions:** only `docs/final-decisions.md`, an approved ADR, or a direct product-owner instruction count as approved.

**Working style:**
- The user is often near their usage limit. Be token-light: run targeted tests, and let CI run the full three-browser gate.
- Keep replies short and plain.

## Gotchas learned the hard way

- **The gate rejects real form posts.** The a11y gate's server runs with `NEXT_PUBLIC_SITE_URL=https://e2e.example.org`, so form posts from the browser get 403 from the same-origin check. Gate states that submit forms must fake the answer with `page.route(...).fulfill(...)`.
- **Every page must be listed.** Every `page.tsx` and feed route needs an entry in `packages/e2e/src/page-routes.ts`, or the route-coverage test fails.
- **Labels can escape the scroll area.** Absolutely positioned `sr-only` labels inside an `overflow-x-auto` region overflow the page at 320 px unless the region is `relative`.
- **Move focus after render.** Do it in an effect; `requestAnimationFrame` fails in WebKit (BUG-028).
- **Backslash escapes get mangled.** Bash heredocs and python strings can mangle them (`\b`, `\n`, `\u`). Use the Write tool, or build them with `chr(92)`, and check the bytes.
- **CRLF files:** use an edit tool or newline-preserving edits.
- **`prisma format`** rewrites the line endings of other schema files; restore them with `git checkout`.
- **Local format check:** `npx prettier --check --end-of-line auto`. CI is authoritative.
- **gitleaks** scans every commit in a PR, and the repo forbids inline `gitleaks:allow` comments. Use obviously fake sample values.
- **Lighthouse CI** was rejected because it pulled in high-severity advisories.
- **Stale `next start` processes** on ports 3006 to 3009 cause wrong screenshots. Kill them by port before previewing.
- **`NEXT_PUBLIC_SITE_URL` is fixed at build time.**
- **GitHub sometimes returns 500s** on push; retry.

## How to run

```
pnpm install
pnpm build            # Prisma client first, then everything
pnpm typecheck
pnpm lint
pnpm test             # Vitest; DB-gated tests self-skip without DATABASE_URL
pnpm format:check
pnpm test:a11y        # needs build, browsers:install, local Postgres, E2E_ALLOW_DATABASE_WRITES=1
pnpm --filter @ppu/e2e test:speed   # page-speed report (MVP-042)
```

- **Single package:** `cd apps/web && npx tsc --noEmit && npx vitest run <path>`.
- **Local database without Docker:** an embedded Postgres on port 55236.
  - The `ppuniverse` database is for tests and the gate; the `hubs` database has all guides, for previews.
  - Provision the test schemas with `DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP=1 node packages/db/scripts/provision-test-schemas.mjs --parallel`.
- **Stale builds:** if a package's `dist` is stale after switching branches, run `pnpm build --filter=<pkg>`.

**Environment variable names** (never commit values; see the `.env.example` files):
`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, `EMAIL_UNSUBSCRIBE_SECRET`, `RESEND_API_KEY`, `SENTRY_DSN`, `CLAMAV_HOST`, `CLAMAV_PORT`, `FEATURE_COMPONENTS`, `FEATURE_COMMENTS`, `INDEXNOW_KEY`, `E2E_ALLOW_DATABASE_WRITES`.
