# ADR 005: Host the web app on Netlify (free plan first)

## Status
Accepted (2026-09-30), by direct product-owner instruction in chat: "okay go with netlify". This followed the cost rule the product owner set in the same session: *"if it add any cost then i only want whtevr is free"*. The decision is recorded in `docs/final-decisions.md`, "Hosting: Netlify, free plan first".

## Context
- **What was already decided.** The database is PostgreSQL on Supabase, kept portable (`docs/final-decisions.md`, 2026-09-17), and file storage is Cloudflare R2. Where the web app itself runs, and in which region, was open (`docs/open-questions.md`, item 5).
- **The cost rule.** The product owner wants free infrastructure only.
- **What launch needs.** Under the first-party-only model (2026-09-24), visitors never upload files, and nothing at launch needs a background worker. Launch therefore needs only a host that can run the Next.js app's server code: sign-in, the admin area, search, and pages read from the database.
- **Requirements for the host.** It must run that server code, allow commercial use (ads are next in the work order, then checkout), and start at $0.

## Options considered (prices and terms checked 2026-09-30)

| Option | Cost | Allowed for our use? | Main limit |
|---|---|---|---|
| **Netlify Free** | $0 | Yes, commercial use is allowed | Hard cap of 300 credits a month. When it's reached, every site on the account pauses until the next month, and nothing is billed |
| Vercel Hobby | $0 | **No.** Vercel's fair-use guidelines restrict Hobby to non-commercial use, and list advertising (including Google AdSense) and any payment processing as commercial | Paid Pro plan ($20/month) the day ads or checkout go live |
| Cloudflare Workers Free | $0 | Yes | 10 ms of CPU per request; our database-backed server rendering is likely to exceed it |
| Cloudflare Workers Paid | $5/month | Yes | Needs the OpenNext Cloudflare adapter (it supports Next.js 16, but not Node middleware, which we don't use), plus a trial deploy to confirm sign-in, email and the database driver |
| Netlify Personal | $9/month | Yes | 1,000 credits a month |

## Decision
1. **Host the web app on Netlify's Free plan.**
2. **If the free plan is outgrown,** the planned step is Netlify Personal at $9/month, which needs no code or migration. Under the cost rule, **the product owner must confirm that upgrade when it's needed.** Nothing upgrades automatically.
3. **Deploy production only on releases to `main`.** Production deploys cost 15 credits each; preview deploys are free.
4. **The database and file storage are unchanged:** Supabase (free plan) and Cloudflare R2 (free tier).

## Consequences
- **Capacity.** The free plan's credit costs are 15 per production deploy, 20 per GB of bandwidth, 2 per 10,000 requests, and 10 per GB-hour of compute. With four releases a month, our estimate is about 30,000 page views a month (about 115,000 on Personal). That estimate assumes about 0.008 credits per page view. Remeasure from Netlify's usage page after the first deploy.
- **Risk: a pause.** Reaching the cap pauses every site on the account until the month resets. Netlify's support forum has reports of sites staying paused after the reset. Usage must be watched.
- **Risk: Supabase pausing.** A Supabase free project pauses after 7 days of inactivity. A live site keeps it active, but a staging project with no traffic may pause.
- **First check in the deployment story:** confirm Netlify runs our Next.js version (16.3.x) with the App Router, route handlers and `next/og` image routes. Stop and report if it doesn't.
- **Still open:** the region (match the Supabase project's region) and data-residency commitments (`docs/open-questions.md`, item 5). The worker process model (item 56) is no longer blocked by hosting. Nothing at launch needs a worker.
- **Staging must not be indexed** before it's public (`planning/tech-debt/TD-009.md`).
- **Fallback:** Cloudflare Workers Paid at $5/month is the cheapest paid alternative found. It's recorded here as an option, not approved.

## Sources (checked 2026-09-30)
- Netlify pricing, https://www.netlify.com/pricing/, and how credits work, https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/
- Vercel fair-use guidelines (commercial usage), https://vercel.com/docs/limits/fair-use-guidelines
- Cloudflare Workers limits and pricing, https://developers.cloudflare.com/workers/platform/limits/ and https://developers.cloudflare.com/workers/platform/pricing/
- OpenNext for Cloudflare, https://opennext.js.org/cloudflare
- Supabase pricing, https://supabase.com/pricing
- Cloudflare R2 pricing, https://developers.cloudflare.com/r2/pricing/
