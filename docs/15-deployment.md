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
2. **Copy two connection strings** from the project's **Connect** panel, and put your database password into each in place of `[YOUR-PASSWORD]`:
   - **Transaction pooler**, host `aws-0-<region>.pooler.supabase.com`, port **6543**. **The site uses this**, and it goes into Netlify. Add `?schema=public` to the end.
   - **Session pooler**, the same host, port **5432**. **Migrations use this.** Release builds switch to it automatically, so you only need it to run migrations or imports by hand. Add `?schema=public` to the end.

   Use a database password with **only letters and digits**. `@`, `#`, `/`, `:` and `?` break the connection string unless they're percent-encoded. Each string must contain exactly **one** `@`, before the host.

   **Don't use the "Direct connection"** (`db.<ref>.supabase.co`) for migrations. On the free plan it's reachable only over IPv6, and many home networks are IPv4-only, so it fails with "Can't reach database server".
3. **Migrations run automatically on every production release** (`docs/final-decisions.md`, 2026-10-05, "Production migrations run automatically on release"). The Netlify production build runs `packages/db/scripts/deploy-migrations.mjs` before building the site.
   - **No extra setup is needed.** The script uses `MIGRATE_DATABASE_URL` if it's set, otherwise the site's own `DATABASE_URL`. Migrations can't use Supabase's transaction pooler (port 6543), so a Supabase pooler address on 6543 is switched to port **5432** (session mode). Supabase uses the same host, user and password for both. `MIGRATE_DATABASE_URL` is optional: set it only to migrate through a different connection, scoped to **Builds** and **Production**, and marked secret.
   - **What the build does:** it logs which variable it used and the host and port (never the password), applies pending migrations, then builds. If a migration fails, the build fails and Netlify keeps the previous deploy live. If no usable connection is set, or a 6543 address isn't Supabase's pooler, the production build fails with a message saying so. Deploy previews never run migrations.
   - **To run migrations by hand** (first setup, or recovery): from your own machine, with the **Session pooler (5432)** string, in a checkout where `pnpm install` has been run.

   **Windows Command Prompt** (one line at a time):

   ```bat
   cd <repo>\packages\db
   set "DATABASE_URL=<session pooler string>?schema=public"
   npx prisma migrate deploy
   ```

   **PowerShell:**

   ```powershell
   cd <repo>\packages\db
   $env:DATABASE_URL = "<session pooler string>?schema=public"
   npx prisma migrate deploy
   ```

   **Git Bash, macOS or Linux:**

   ```bash
   cd <repo>/packages/db
   DATABASE_URL="<session pooler string>?schema=public" npx prisma migrate deploy
   ```

   It should end with "All migrations have been successfully applied." The migrations enable row-level security on every table, including Prisma's own `_prisma_migrations` (migration `20261006000100_enable_rls_prisma_migrations`).

> [!WARNING]
> - **Never run migrations through the 6543 transaction pooler.** Prisma takes a session-level advisory lock while migrating, and the transaction pooler can't hold one, so `migrate deploy` **hangs** after printing the datasource line. If that happens, press Ctrl+C and use the 5432 string.
> - **The 5432 string goes in Netlify only as `MIGRATE_DATABASE_URL`** (optional; builds and Production only). Never set it as `DATABASE_URL`: the site must use the 6543 pooler.
> - **Never run the test-schema provisioning script** (`packages/db/scripts/provision-test-schemas.mjs`) against the production project.

Why two strings: serverless functions open many short-lived connections, and Supabase recommends its transaction pooler for them. Migrations need a session connection. The app never relies on session state such as `search_path`: every query is schema-qualified (`packages/db/src/database-schema.ts`), so it works through the transaction pooler.

## 2. Resend: sign-in email

1. Create a free Resend account, add the domain `lowcodestacks.com`, and **add the DNS records Resend shows** (SPF, DKIM, and the DMARC it recommends) at your registrar.
2. When Resend shows the domain as verified, create an **API key** that can only send.
3. Choose a sender address on the domain, for example `no-reply@lowcodestacks.com`.

## 2b. Google sign-in (optional, MVP-035)

Without these two settings the site offers the email link only. To turn Google sign-in on:

1. **Create the client:** in Google Cloud Console, create a project, then go to **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: LowCodeStacks, with your support email.
   - Scopes: only email, profile and openid.
   - Publish the app.
2. **Add credentials:** under **Credentials → Create credentials → OAuth client ID**, choose **Web application**, then add the **Authorized redirect URI** `https://lowcodestacks.com/api/auth/callback/google`.
3. **Set it in Netlify:** set `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` with **Contains secret values** ticked. Both go in the Production context, scoped to Functions and Runtime.
4. **Redeploy.** The sign-in page then shows **Continue with Google**.

The site stores only who the Google account is (its ID, email and name), never Google tokens or the profile photo (`apps/web/lib/google-auth.ts`).

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
| `AWS_LAMBDA_JS_RUNTIME` | `nodejs22.x` | Not secret. Pins the **server functions** to Node 22, matching CI. `NODE_VERSION` in `netlify.toml` only sets the build image, and Netlify reads this variable only from the UI, CLI or API, never from `netlify.toml`. Without it, the first deploy ran on `nodejs24.x` |

The `S3_*` and `CLAMAV_*` variables aren't needed at launch: no uploads or downloads happen until product downloads are built.

**Deploy previews and the database.** Supabase Free allows two projects. The safest setup is a **second free project for previews**, migrated the same way as production. A preview runs a pull request's code, and it shouldn't run against production data. A preview project with no traffic pauses after 7 days, and resuming it is one click in Supabase.

## 4. First deploy: verify before going public (MVP-030 slice 2)

Netlify's documentation doesn't name Next.js 16 or `next/og` specifically, so the first build must confirm them. Check on the first deploy:

- [ ] The build succeeds with pnpm (from `packageManager` in the root `package.json`) and Node 22, and the deploy's server function reports runtime `nodejs22.x` (it shows `nodejs24.x` if `AWS_LAMBDA_JS_RUNTIME` is missing).
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

From your machine, with the **Session pooler (5432)** string and your admin email, after `pnpm build` has been run once in the checkout (the script uses the built adapter in `dist/`).

**Windows Command Prompt:**

```bat
cd <repo>\packages\adapters\content
set "DATABASE_URL=<session pooler string>?schema=public"
set "ARTICLE_AUTHOR_EMAIL=you@example.com"
node scripts\import-articles.mjs
```

**PowerShell:**

```powershell
cd <repo>\packages\adapters\content
$env:DATABASE_URL = "<session pooler string>?schema=public"
$env:ARTICLE_AUTHOR_EMAIL = "you@example.com"
node scripts\import-articles.mjs
```

**Git Bash, macOS or Linux:**

```bash
cd <repo>/packages/adapters/content
DATABASE_URL="<session pooler string>?schema=public" ARTICLE_AUTHOR_EMAIL="you@example.com" node scripts/import-articles.mjs
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
