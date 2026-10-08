# Session handoff (2026-10-08)

This file is written for a new session that has none of the previous conversation's context.

**Read first:**
- `CLAUDE.md`: project rules, the required reading order, and the Definition of Done.
- `docs/final-decisions.md`: the binding product-owner decisions. The 2026-10-05 to 2026-10-08 entries cover the latest work.
- `docs/plans/learn-module.md`: the Learn module, built and benched (what's left to launch it).

**Repo locations:**
- **Working clone:** `G:\PPU-dev`.
- **Older clone:** `G:\PowerPlatformUniverse`. Don't use it for new work.
- **Leftovers:** `G:\PPU-blocks` and `G:\PPU-pool` are old scratch worktrees. Git no longer tracks them, and they can be deleted.

## Product and live state

- **Site:** LowCodeStacks, https://lowcodestacks.com. Free Power Platform learning: 57 guides in `content/articles/`, architecture patterns and KPIs.
  - The free Power Apps component library (`/components`, MVP-049) is in review, behind `FEATURE_COMPONENTS`; the older paid marketplace is hidden too.
  - Comments are on (`FEATURE_COMMENTS=on`, since release #100).
  - The Learn module (`/topics`) is built but off behind `FEATURE_LEARN` (benched, see below).
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

**Live (`main`):** release #111 (2026-10-08): Learn module (off), maker critter avatars, Bing verification.

**Merged into `develop`, not yet live:** #112 (account overview at `/account`, avatar and Admin link in the header, the name-tag avatars that missed #111), #113 (the "On this page" bar follows the section being read, BUG-029), #114 (three guide drafts: Excel 256 rows, Patch Person/Choice/Lookup, shared mailbox).

**Open PRs, in this order:**
1. **#116 `feature/component-library`** (MVP-049): the component library's pipeline, data (migration `20261015000000`, additive), import on release, admin (`/admin/components`), and the public pages in design A · Docs behind `FEATURE_COMPONENTS`, with live web replicas for six components and the sitemap entries.
2. **#117 `feature/components-wave-1`** (stacked on #116): five more components as content (text field, dialog, toast, tabs, states) and `docs/component-paste-tests.md`.
3. **#115 release `develop` → `main`:** merge last, once, after the others are in `develop` and its checks are green.

**The component library (MVP-049)** is the current focus. Nothing is tested in Power Apps Studio yet: the product owner paste-tests each component (`docs/component-paste-tests.md`), records the Studio version in `/admin/components`, publishes it, and switches on `FEATURE_COMPONENTS` when ready. The `lcsButton` pilot's paste-test decides whether the YAML format holds; if it fails, all six are fixed the same way. The component standard in `docs/plans/power-apps-component-library.md` is still a proposal (product owner, 2026-10-08).

**The Learn module is benched** (product owner, 2026-10-08). Code complete, off in production. To launch: write the first topics in `content/topics`, publish them in Admin → Learn topics, then `FEATURE_LEARN=on` (`docs/plans/learn-module.md`).

**Ticket status** (`planning/mvp-backlog.csv` is canonical):

| Status | Stories |
|---|---|
| Done | 001 to 006, 010, 012, 014, 017 to 023, 026 to 028 |
| QA | 029, 031 to 037, 039, 044, 047 |
| In progress | 007, 030, 038, 040, 041, 042, 045, 046, 048 (benched), 049 |
| Backlog | 008, 009, 015, 016, 024, 025, 043 |
| Superseded | 011, 013 |

## Next work

- **Component library (MVP-049), next steps:** the product owner's paste-tests and fixes from them; reader feedback on components (plan step 5: ratings, "Worked in my app", comments, "Report a problem"); more components (navigation shell and data table, both sign-in to copy). Design: A · Docs (`docs/final-decisions.md`, 2026-10-08).
- **Later:** the other technologies' libraries; KPIs; TD-032 (blocking time); the Contributor role's abilities.

**Product-owner to-dos (remind them; never do these for them):**
- Merge #116, then #117, then the release #115; check the Netlify build log (it runs the migration and imports the component drafts).
- Paste-test each component in a developer environment (`docs/component-paste-tests.md`), record the Studio version, publish, then set `FEATURE_COMPONENTS=on` in Netlify.
- Review and publish the three new guide drafts in `/admin/content`.
- Search Console: submit the sitemap and request indexing; check the "Deceptive pages" review.
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

- **The gate on a dev server** (`E2E_SERVER_MODE=dev`): keyboard checks fail on `nextjs-portal`, the Next.js dev-tools button. That's dev-only; CI uses the production server. Every other check is meaningful.
- **`next dev` leaves files behind:** it creates `apps/web/AGENTS.md` and `apps/web/CLAUDE.md` and edits `next-env.d.ts`. Don't commit them. Stopping its background task can leave the server running: free the port by process id.
- **Ubuntu's package mirror can crawl** (166 kB/s seen), which used to push accessibility shards past 20 minutes; the browsers' Linux packages are now cached (TD-030).
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
- **Local database without Docker:** `cd packages/db && npx prisma dev -n <name> -d`, then `npx prisma dev ls` for the URL (a TCP `postgres://postgres:postgres@localhost:<port>/template1?sslmode=disable` URL worked; PGlite, nothing to install). `prisma migrate deploy`, then the test schemas as below. Stop it with `npx prisma dev stop <name>`. (The older note of an embedded Postgres on port 55236 couldn't be found on 2026-10-08.)
  - The `ppuniverse` database is for tests and the gate; the `hubs` database has all guides, for previews.
  - Provision the test schemas with `DB_MIGRATIONS_ALLOW_DESTRUCTIVE_SETUP=1 node packages/db/scripts/provision-test-schemas.mjs --parallel`.
- **Stale builds:** if a package's `dist` is stale after switching branches, run `pnpm build --filter=<pkg>`.

**Environment variable names** (never commit values; see the `.env.example` files):
`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, `EMAIL_UNSUBSCRIBE_SECRET`, `RESEND_API_KEY`, `SENTRY_DSN`, `CLAMAV_HOST`, `CLAMAV_PORT`, `FEATURE_COMPONENTS`, `FEATURE_COMMENTS`, `INDEXNOW_KEY`, `FEATURE_LEARN`, `E2E_ALLOW_DATABASE_WRITES`.
