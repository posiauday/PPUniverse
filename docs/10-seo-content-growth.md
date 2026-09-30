# SEO, Content and Growth Strategy

## Topic clusters
Power Apps components and YAML; responsive layouts; Power Fx patterns; Power Automate expressions and production patterns; DAX and dashboard design; Dataverse and ALM; governance and CoE; architecture blueprints; accessibility; AI Builder, Copilot Studio, agents and RAG.

## Page templates
Product, category, collection, comparison, tutorial, pattern, glossary, troubleshooting, generator/tool, ~~creator~~ (superseded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — no public creator page type) and learning path. Each page must satisfy a distinct intent and avoid thin programmatic duplication.

## Technical SEO baseline (MVP-021, FR-017)
Binding decisions: `docs/final-decisions.md`, entries dated 2026-09-21. Summary of what is implemented:

- **Site origin:** `NEXT_PUBLIC_SITE_URL` (never `NEXTAUTH_URL`, never the request `Host`). Production requires an absolute `https` origin on a public hostname; it is normalized to a bare origin; a missing or invalid value fails safe (no canonical URLs or structured data, empty sitemap). Validated in `apps/web/lib/site-url.ts`.
- **Deny by default:** the root layout is `noindex, nofollow`; only the home page, indexable category pages and published product pages opt in. API, account and sign-in responses also carry `X-Robots-Tag`. `robots.txt` blocks only `/api/` and deliberately does not list admin ~~, creator~~ or preview paths, or block pages that rely on `noindex`.
- **Category pages** (`apps/web/lib/seo/category-indexing.ts`): a category with no PUBLISHED products is `noindex, follow` and absent from the sitemap (derived from inventory, no flag); the base URL and valid `?page=N` are indexable and self-canonical (`page=1` normalizes to the base URL); search, sort, filter, extra-parameter, mixed and invalid or out-of-range page URLs are `noindex, follow` with the clean base canonical.
- **Sitemap:** home page, categories with at least one PUBLISHED product, and PUBLISHED products only — never DRAFT or other statuses, and no paginated or variant URLs. No `lastmod`. Capped at 50,000 URLs.
- **Structured data** (schema.org JSON-LD): `WebSite` (home), `CollectionPage` (indexable category base URL), `Product` (published products). Only fields backed by real PUBLISHED data; unavailable properties are omitted. **Product data is emitted without Offer data — price and offers must not be added until pricing, currency, tax and checkout are approved and implemented — and no rich-result eligibility claim is made.** Serialization escapes every `<` so creator text cannot terminate the script element.
- **Not yet built:** social-preview images (needs approved media, see `planning/proposed-stories.md`), `BreadcrumbList` (needs a visible breadcrumb trail), a staging/preview "noindex everything" switch (needs the hosting decision), the `SEORecord` per-page override entity, and a sitemap index beyond 50,000 URLs.

## Product-led loops
Free asset to account; account to saved library; library to update notification; tutorial to component; component to bundle; ~~creator product to creator audience~~ (superseded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — no per-creator audience concept; first-party product to LowCodeStacks's own audience); verified deployment story to case study.

## Content quality
Named author/reviewer, last reviewed date, tested version, prerequisites, step-by-step result, limitations, accessibility notes, security notes and change history. Do not scrape or republish competitor content.

## Measurement
Search impressions, qualified clicks, page-to-product navigation, search zero-results, free activation, email consent, purchase conversion, repeat usage, content-assisted revenue and ~~creator-attributed~~ first-party-content-attributed (reworded 2026-09-24, same decision) acquisition.
