# Deployment runbook: Netlify + Supabase (MVP-030)

How LowCodeStacks goes live. It implements `docs/adr/005-hosting-netlify.md` and the content-first launch (`docs/final-decisions.md`, "Launch is content-first", 2026-09-30).

**Free plans only** (`docs/final-decisions.md`, "Hosting: Netlify, free plan first; free-only infrastructure"). Every service below is used on its free plan, and any paid upgrade needs the product owner's confirmation first.

**Who does what.** The product owner creates the accounts, enters every secret and changes DNS. The agent never signs in to these services and never handles passwords or keys. The agent prepares the repository, explains each step, and verifies the result from the outside.

## What launch needs

| Service | Plan | Used for | Needed at launch? |
| --- | --- | --- | --- |
| **Netlify** | Free | Hosting the web app | Yes |
| **Supabase** | Free | PostgreSQL database | Yes. One project for production; optionally a second (free) for deploy previews |
| **Resend** | Free (3,000 emails a month, 100 a day) | Sign-in emails | **Yes.** Sign-in is by emailed link, so without it nobody, including the admin, can sign in |
| **Domain registrar** | Already paid | `lowcodestacks.com` DNS | Yes |
| Cloudflare R2 | Free tier | Product files | No, only once product downloads exist |
| ClamAV or a scanning service | — | Malware scanning | No, only once product downloads exist (scanning approach still open) |
| Sentry | — | Error monitoring | Optional. Unset falls back to logging |

## 1. Supabase: database and migrations

1. **Use the Supabase project** recorded in `docs/final-decisions.md`, or create one. Note its **region**: the Netlify functions region should match it (open question 5).
2. **Copy two connection strings** from the project's **Connect** panel:
   - **Transaction pooler** (port **6543**). The site uses this. Add `?schema=public` to the end.
   - **Direct connection, or the session pooler** (port **5432**). Migrations use this. Also add `?schema=public`.
3. **Apply the migrations**, from your own machine, using the **5432** string:

   ```bash
   DATABASE_URL="<5432 connection string>?schema=public" pnpm --filter @ppu/db exec prisma migrate deploy
   ```

   The migrations also enable row-level security on every table (`docs/final-decisions.md`, 2026-09-17).

> [!WARNING]
> Never put the 5432 string in Netlify, and never run the test-schema provisioning script (`packages/db/scripts/provision-test-schemas.mjs`) against the production project.

Why two strings: serverless functions open many short-lived connections, and Supabase recommends its transaction pooler for them. Migrations need a session or direct connection. The app sends the `search_path` startup option only for non-`public` schemas, because transaction poolers don't pass startup options through (`packages/db/src/connection-options.ts`).

## 2. Resend: sign-in email

1. Create a free Resend account, add the domain `lowcodestacks.com`, and **add the DNS records Resend shows** (SPF, DKIM, and the DMARC it recommends) at your registrar.
2. When Resend shows the domain as verified, create an **API key** that can only send.
3. Choose a sender address on the domain, for example `no-reply@lowcodestacks.com`.

## 3. Netlify: the site

1. Create a free Netlify account and choose **Add new project → Import an existing project → GitHub**, then pick `posiauday/PPUniverse`.
2. **Build settings:**
   - **Base directory:** leave empty (the repository root).
   - **Package directory:** `apps/web`.
   - **Branch to deploy:** `main`.
   - The build command and publish directory come from `apps/web/netlify.toml`. Its `publish` path is relative to the repository root (`apps/web/.next`), as Netlify resolves every `netlify.toml` path from the base directory (BUG-021).
3. **Deploy contexts** (Site configuration → Build & deploy → Branches and deploy contexts):
   - **Deploy previews:** on. Netlify serves them with `X-Robots-Tag: noindex`.
   - **Branch deploys:** **None.** They wouldn't get that header (TD-009).
4. **Environment variables** (Site configuration → Environment variables). Make each one available to **Builds** and **Functions**, and set values per context where noted:

| Variable | Production value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | The **6543 transaction pooler** string, ending `?schema=public` | Secret. For deploy previews, use a separate Supabase project's string, or leave previews read-only against production (see below) |
| `NEXTAUTH_SECRET` | A new random value, e.g. from `openssl rand -base64 32` | Secret. A different value per environment |
| `NEXTAUTH_URL` | `https://lowcodestacks.com` | Sign-in links point here, so sign-in works on production, not on previews |
| `NEXT_PUBLIC_SITE_URL` | `https://lowcodestacks.com` | The canonical origin, for production and previews alike, so previews point search engines at production |
| `EMAIL_FROM` | `no-reply@lowcodestacks.com` (your Resend sender) | |
| `RESEND_API_KEY` | The Resend key | Secret. **Required for sign-in.** Without it, production sends no email: sign-in shows "couldn't send", and nothing about the message is logged (BUG-019). Never set `EMAIL_TRANSPORT` in production; it exists only for test servers |
| `EMAIL_UNSUBSCRIBE_SECRET` | A new random value | Secret. Never the same as `NEXTAUTH_SECRET` |
| `SENTRY_DSN` | Leave unset for now | Optional |

The `S3_*` and `CLAMAV_*` variables aren't needed at launch: no uploads or downloads happen until product downloads are built.

**Deploy previews and the database.** Supabase Free allows two projects. The safest setup is a **second free project for previews**, migrated the same way as production. A preview runs a pull request's code, and it shouldn't run against production data. A preview project with no traffic pauses after 7 days, and resuming it is one click in Supabase.

## 4. First deploy: verify before going public (MVP-030 slice 2)

Netlify's documentation doesn't name Next.js 16 or `next/og` specifically, so the first build must confirm them. Check on the first deploy:

- [ ] The build succeeds with pnpm (from `packageManager` in the root `package.json`) and Node 22.
- [ ] `/`, `/learn`, an article page, `/power-apps` and its tabs, and a product page all render, with data.
- [ ] `/search?q=dataverse` returns results. This uses raw SQL through the transaction pooler.
- [ ] `/og` and an article's share image return a PNG.
- [ ] `/robots.txt` and `/sitemap.xml` show `https://lowcodestacks.com` URLs.
- [ ] A deploy-preview URL returns `X-Robots-Tag: noindex` (`curl -I <preview-url>`).
- [ ] Sign-in by email works on production, and `/admin` is reachable after step 5.

If any check fails, stop and report. Don't change the code to work around a platform gap without a decision.

## 5. Make yourself the admin

No part of the application grants the admin role, deliberately (`docs/final-decisions.md`, content-publishing authorization). After signing in once on production, so that your user row exists, run this in the Supabase **SQL editor**:

```sql
update users set role = 'ADMIN' where email = 'you@example.com';
```

Use your real sign-in email. Sign out and back in, then open `/admin`.

## 6. Import the launch articles as drafts

From your machine, using the **5432** string and your admin email:

```bash
DATABASE_URL="<5432 connection string>?schema=public" ARTICLE_AUTHOR_EMAIL="you@example.com" pnpm --filter @ppu/adapter-content content:import
```

The import creates **drafts only**. It skips any slug that already exists and imports nothing if any file is invalid. Review and publish each article in `/admin/content`.

## 7. Point the domain at Netlify

1. In Netlify: **Domain management → Add a domain**, enter `lowcodestacks.com`, and set it as the **primary domain**.
2. At your registrar, add **exactly the DNS records Netlify shows** (apex and `www`). Keep the Resend records from step 2.
3. Netlify issues the HTTPS certificate automatically once DNS resolves.
4. **Go live** when the articles are published (content-first): the site is public as soon as DNS points at it.

## 8. After launch

- **Google Search Console:** verify `lowcodestacks.com` with a DNS TXT record, then submit `https://lowcodestacks.com/sitemap.xml`.
- **Watch Netlify usage.** The free plan pauses all sites at 300 credits a month (ADR-005). Recalculate the page-view estimate from real usage after the first month.
- **Releases:** production deploys only when `main` changes (on a release), because each production deploy uses 15 credits.
