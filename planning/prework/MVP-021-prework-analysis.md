# MVP-021 pre-work analysis — Metadata, sitemap, canonical, structured data

Date: 2026-09-21. Branch: `feature/mvp-021-seo-metadata` (from `develop` at `f8c8c31`; no open PRs; no overlapping work). **No application code has been written.** Authority: `docs/final-decisions.md`, entry "Product-owner responses to MVP-005 open items; MVP-021 authorization".

Facts below marked *(verified)* were checked in this session, not assumed.

## 1. Requirement IDs
- **FR-017** (primary): "Every indexable page supports canonical URL, metadata, social preview, sitemap inclusion and structured data where valid."
- Backlog: **MVP-021**, P0, 3 pts, depends on MVP-005 (Done). Traceability row FR-017 is currently `TBD`.
- Fixes **BUG-001** (delivered pages emit relative canonical/`og:url`; sign-in/account pages indexable).
- Touches (no change): NFR-004 (public pages server-rendered), NFR-006 (logs exclude secrets — the site origin is public, not secret).
- Explicitly not touched: remaining FR-003 items, filtering (MVP-004), pricing.

## 2. Acceptance criteria
Backlog wording: "Indexable pages emit valid metadata and sitemap." Made testable:
1. Each indexable page emits an **absolute** canonical URL, title, description, Open Graph (`title`, `description`, `url`, `siteName`, `type`, `locale`), Twitter card (`summary`, title, description) and `robots: index, follow`.
2. Everything else is `noindex` — search, sign-in, account, API, error pages, and **any future page by default**. API responses carry `X-Robots-Tag`.
3. `/sitemap.xml` lists only the home page, indexable category pages, and real `PUBLISHED` products; valid per sitemaps.org (absolute `https` `<loc>`, ≤ 50,000 URLs, XML-escaped).
4. `/robots.txt` is valid and references the sitemap only when the site URL is valid.
5. JSON-LD: `Product` on published product pages (approved fields only), `WebSite` on the home page, `CollectionPage` on indexable category pages, nothing elsewhere; injection-safe.
6. `NEXT_PUBLIC_SITE_URL` is validated per the approved rules and fails safely.
7. No fabricated inventory; no DRAFT leakage; tests clean up only what they create.
8. BUG-001 closed. Docs, telemetry, traceability updated; security review done.

## 3. Existing inventory *(verified by source inspection and a production-build probe)*
| Area | Today |
|---|---|
| `app/layout.tsx` | Static `metadata` (title, description). `<html lang="en">` present. **No** `metadataBase`, robots, Open Graph or Twitter. |
| Home `/` | No metadata of its own (inherits the layout). |
| Category `/categories/[slug]` | `generateMetadata`: title, description, canonical = **relative** `/categories/<slug>` for every variant (page, `q`, sort). No robots. |
| Product `/products/[slug]` | `generateMetadata`: title, description, canonical = **relative** `/products/<slug>`. No robots, no JSON-LD. |
| Search `/search` | `robots: { index: false, follow: true }` (correct). |
| Sign-in `/signin` | **Client component** (`"use client"`) — cannot export metadata. No robots. |
| Account `/account/sessions` | Server-redirects unauthenticated visitors to `/signin`. No robots. |
| API `/api/*` | JSON routes; no `X-Robots-Tag`. |
| `robots`, `sitemap`, JSON-LD, `headers()` in `next.config.ts` | **None exist.** |

Production-build probe (Next 16.3.5, temporary route with the same metadata shape, since deleted): `<link rel="canonical" href="/products/probe-item"/>`, `<meta property="og:url" content="/products/probe-item"/>`, `<meta property="og:image" content="http://localhost:3055/x.png"/>`. Relative canonical/`og:url`; localhost-based social-image fallback. Recorded as BUG-001.

Turborepo *(verified)*: it detects `nextjs` and infers `NEXT_PUBLIC_*` into the build task hash (hash `4dc20ffa…` unset vs `18eae60d…` with `NEXT_PUBLIC_SITE_URL` set). Adding the variable to `globalPassThroughEnv`, as approved, therefore carries no stale-cached-build risk.

## 4. Page-by-page metadata behavior
Approach: **deny by default, opt in.** The root layout sets `robots: { index: false, follow: false }`; only the three indexable page types override it. A forgotten override silently de-indexes a page (guarded by tests); a forgotten `noindex` would silently expose one — the safer failure mode is the former. This also covers `/signin` without touching a client component.

| Page | Robots | Canonical | JSON-LD |
|---|---|---|---|
| Home | `index, follow` | `<origin>/` | `WebSite` |
| Category, page 1, no `q`, ≥ 1 published product | `index, follow` | `<origin>/categories/<slug>` | `CollectionPage` |
| Category, `?page=N` (N > 1) | `index, follow`, **only if** the page has items (else `noindex`) | self: `…?page=N` *(open question 30)* | none |
| Category with `?q=` | `noindex, follow` | base | none |
| Category with sort / pageSize only | `index, follow` | base | none |
| Category with no published products | `noindex, follow` *(open question 29)* | none | none |
| Product (PUBLISHED) | `index, follow` | `<origin>/products/<slug>` | `Product` |
| Search, sign-in, account, 404, API | `noindex` (search keeps `follow`) | none | none |

Common to indexable pages: `og:type=website`, `og:site_name`, `og:locale=en_US`, `og:url` = canonical; `twitter:card=summary`. **No `og:image`** — no media exists (screenshots are PROP-001) and no brand assets are approved. Site name is the existing working name "Power Platform Universe" held in one constant (product name is open question 1). Descriptions pass through `normalizeDisplayText` and are capped at 300 characters. Titles keep the current `<name> | Power Platform Universe` pattern.

## 5. Schema.org types and rationale
- **Product** (product pages): `name`, `description` (the summary), `url` (canonical), `category` (category name). Nothing else. Excluded per decision: offers, price, priceCurrency, aggregateRating, review, brand, certification, endorsement, availability, seller, creator identity, compatibility claims; also no `image` (none exists). Version/release info is *permitted* by the decision but recommended for later: `version` is not a schema.org Product property (it would need `additionalProperty`), and `Release` is still minimal until MVP-014 defines authoritative releases. **Limitation to be aware of (open question 31):** Product markup without `offers`/`review`/`aggregateRating` is valid schema.org but not eligible for search-engine Product rich results. Google's Product snippet documentation requires `name` plus at least one of `review`, `aggregateRating` or `offers` *(checked against the documentation, 2026-09-21)*, so the Rich Results Test will report those fields as missing.
- **WebSite** (home): `name`, `url`. No `SearchAction` (not required; the search URL contract is not yet stable). No `Organization`/`Brand` — brand and publisher identity are unresolved.
- **CollectionPage** (indexable category page 1): `name`, `description`, `url`. No `ItemList` (the page is paginated).
- **BreadcrumbList: not proposed.** Google's structured-data guidelines say "Don't mark up content that is not visible to readers of the page" *(checked, 2026-09-21)*, and the product page has only a "← Category" back link, no visible trail. Adding one is a UI change outside this story.

## 6. Canonical URL construction and normalization
- Built **only** from the validated `NEXT_PUBLIC_SITE_URL` origin plus a path assembled from server data. Never from the request `Host`/`X-Forwarded-*` headers (host-header/cache-poisoning risk).
- Path rules: leading `/`; no trailing slash except the root; slugs go through `encodeURIComponent`; query and hash dropped, except `?page=N` for N > 1 on categories (open question 30).
- One builder feeds metadata, Open Graph, JSON-LD `url` and sitemap `<loc>`, so they cannot disagree.

## 7. `NEXT_PUBLIC_SITE_URL` validation and fallback
| Situation | Behavior |
|---|---|
| Production: `https:` origin, public hostname | Accepted; normalized to `URL.origin` (lower-cased host, default port and trailing slash removed). |
| Production: `http:`, `localhost`, loopback/private IP literal, single-label host, credentials, non-root path, query or hash | **Rejected** (`INVALID`). |
| Development/test: `http://localhost[:port]` or `http://127.0.0.1[:port]` | Accepted. |
| Development/test: unset | Falls back to `http://localhost:${PORT ?? 3000}`. |
| Production: unset or invalid | **Fail safe, keep serving:** omit canonical, `og:url` and JSON-LD; `robots.txt` omits the `Sitemap:` line; `sitemap.xml` is a valid **empty** sitemap; one `seo.site_url_invalid` error logged per process (reason only). Pages stay available — an SEO misconfiguration must not take the product offline. |
- Validated **lazily at request time**, never at import or build, so `pnpm build` (CI runs it with the variable unset) still passes.
- **Next inlines `NEXT_PUBLIC_*` at build time**, so each environment's build needs its own value. Documented in `.env.example`; hosting is still open (open question 5).
- Add to `turbo.json` `globalPassThroughEnv` (approved); documented placeholder in `apps/web/.env.example`. It is a public origin, not a secret.

## 8. Sitemap database-query design
- New port method `listSitemapEntries(limit)` on `CatalogRepository`; Prisma implementation in `@ppu/adapter-catalog`. Two indexed queries, ordered by `slug` for deterministic output:
  - products: `where: { status: "PUBLISHED" }`, select `slug`;
  - categories: `where: { products: { some: { status: "PUBLISHED" } } }`, select `slug` (open question 29 default).
- Uses existing indexes (`products.status`, category unique slug). **No migration.**
- Capped at 50,000 URLs (sitemaps.org limit); if exceeded, log `seo.sitemap_truncated` and document a sitemap-index follow-up.
- **No `lastmod`**: evidence-table changes do not bump `products.updatedAt`, and an inaccurate `lastmod` is worse than none.
- Route: `app/sitemap.ts` (framework-generated XML, so escaping is not hand-rolled), `dynamic = "force-dynamic"` (no DB at build). Logic sits in a pure builder so the route file stays thin. A database failure throws (5xx) rather than returning an empty sitemap, so crawlers do not read an outage as "all pages removed".

## 9. Publication-state filtering
- **Allow-list** `status = 'PUBLISHED'` (not a deny-list), so future statuses (suspended, archived, rejected) are excluded by default. Same rule as `findPublishedProductDetailBySlug`.
- Non-published product URLs already return 404 via `notFound()` (identical to an unknown slug — no draft-existence oracle), so they are noindex and absent from the sitemap.
- `ProductStatus` today is only `DRAFT`/`PUBLISHED`; suspended/archived/rejected do not exist yet.
- Categories have no publication state; "published category" is derived from having a published product (open question 29).

## 10. Robots behavior
1. **Meta:** root default `noindex, nofollow`; opt-in `index, follow` on the three indexable page types (section 4).
2. **Header:** `X-Robots-Tag: noindex, nofollow` via `next.config.ts` `headers()` for `/api/:path*`, `/account/:path*` and `/signin` (API JSON has no meta tag; the others are defence in depth).
3. **`robots.txt`** (`app/robots.ts`): `User-agent: *`, `Allow: /`, `Disallow: /api/`, plus `Sitemap:` when valid. Deliberately **not** disallowed: `/signin`, `/account`, `/search` — a disallowed URL cannot have its `noindex` read and can still be indexed by URL. Admin/creator paths are **not** listed (robots.txt is public and would advertise them); the default-noindex posture covers them.
4. Not in scope: a global "no-index everything" switch for staging/preview environments (needs the hosting decision).

## 11. Security analysis
- **Host-header injection / cache poisoning:** avoided — origin from configuration only.
- **XSS:** metadata values are rendered by Next/React (attribute-escaped). The only raw-HTML sink introduced is the JSON-LD script, isolated in one audited component (section 12). This changes the MVP-005 claim "no `dangerouslySetInnerHTML` anywhere" — the progress report will say so.
- **Information disclosure:** sitemap is an allow-list; drafts 404 like unknown slugs; `robots.txt` reveals only `/api/`, already visible in the URL structure.
- **Availability:** `sitemap.xml` is unauthenticated and hits the database — bounded (`limit`) and two indexed queries; response caching is a hosting/CDN concern (open question 5). Recorded as a risk.
- **Config:** protocol allow-list (`https`, and `http` only for localhost outside production) prevents `javascript:`/`data:` origins.
- **Supply chain:** no new dependencies.
- **Privacy:** no PII; creator identity excluded from structured data per decision.
- **Logging:** reason codes only, via `@ppu/telemetry`.
- Robots directives are hints, not access control; nothing here relies on them for confidentiality.

## 12. JSON-LD injection prevention
- Builders return typed, server-controlled objects — no string concatenation into markup, no creator HTML.
- One `serializeJsonLd(obj)`: `JSON.stringify`, then escape `<` → `<` (as approved), and additionally `>`, `&`, U+2028, U+2029 (a strict superset, harmless).
- One `JsonLd` component in `@ppu/ui` (the single `dangerouslySetInnerHTML` in the codebase), typed to accept objects, not strings.
- **Tests:**
  1. Serializer: `</script><script>alert(1)</script>`, `<!--`, `<script`, quotes, newlines, U+2028 → no raw `<` in output, and `JSON.parse` round-trips to the original.
  2. **HTML-parser test:** render with `renderToStaticMarkup`, load into jsdom, assert exactly one `script[type="application/ld+json"]`, no injected `script`/`img`/other elements, and `textContent` parses back to the input — this proves the *parser* cannot be broken out of, not just the string.
  3. Builders: an allow-list of keys; assert none of offers, price, priceCurrency, aggregateRating, review, brand, seller, availability, author/creator, image, certification or endorsement can appear.
  4. A source-scan test that `dangerouslySetInnerHTML` appears only in `json-ld.tsx`.

## 13. Accessibility impact
- No visible UI change: head tags, JSON-LD, `robots.txt` and `sitemap.xml` render nothing. No new components in the visual tree.
- Indirect WCAG: 2.4.2 Page Titled (each indexable page keeps a unique, descriptive title) and 3.1.1 Language (`<html lang="en">` already present).
- Not adding `BreadcrumbList` also avoids a navigation change; if added later it needs `<nav aria-label="Breadcrumb">` with an ordered list and the current page marked.
- The DB-backed pages cannot render locally (no Postgres), so head output is verified with a temporary probe using placeholder data; a re-run of the axe scan on the affected pages belongs to MVP-023.

## 14. Test plan
- **Unit (`apps/web`, node):** site-URL matrix (unset/valid/invalid × production/development/test, ~15 cases); canonical builder; page-metadata builders (robots flags, canonical, OG/Twitter, omission when the site URL is invalid, description cap, sanitization); `robots` and sitemap builders (absolute URLs, `/api/` disallowed, no admin paths, cap, empty when invalid); `next.config` `headers()`.
- **Unit (`packages/ui`):** JSON-LD serializer, HTML-parser injection test, builder allow-list, source-scan test.
- **Integration (DB-gated, `adapter-catalog`):** `listSitemapEntries` — includes a PUBLISHED product, excludes a DRAFT one, derives categories from published products, deterministic order, honors `limit`. Assertions use containment on the test's own slugs (other tests share the seeded category), and cleanup deletes only its own rows — **never seeded categories**.
- **Build/CI:** `pnpm build` passes with the variable unset (proves lazy validation); CI must show the DB-gated tests *passed*, not skipped.
- **Browser (local):** `robots.txt`; head tags and JSON-LD on a temporary placeholder probe (deleted afterwards). Sitemap output is covered by unit and CI integration tests because no local database exists. External validators (Rich Results Test, Schema Markup Validator) cannot reach localhost — recommended once a preview URL exists.
- Telemetry: `seo.site_url_invalid`, `seo.sitemap_truncated`. No audit events (no state change).

## 15. Files expected to change
- New: `apps/web/lib/site-url.ts`; `apps/web/lib/seo/{site,canonical,metadata,json-ld,robots,sitemap}.ts`; `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts`; `packages/ui/src/json-ld.tsx` — each with tests.
- Modified: `apps/web/app/layout.tsx`, `page.tsx`, `categories/[slug]/page.tsx`, `products/[slug]/page.tsx`, `search/page.tsx` (shared builder, behavior unchanged); `apps/web/next.config.ts`; `apps/web/.env.example`; `turbo.json`; `packages/domain/catalog/src/{catalog-repository,types,index}.ts`; `packages/adapters/catalog/src/catalog-repository.ts` and its integration test; `packages/ui/src/index.ts`; READMEs.
- Docs/tracking: `planning/*` (backlog CSVs, status, progress report, traceability FR-017), `planning/bugs/BUG-001.md` (closure), `docs/open-questions.md` and `docs/final-decisions.md` for any answers.
- Not expected: `.github/workflows/ci.yml`, Prisma schema, migrations.

## 16. Migration impact
None. No schema change; the sitemap query uses existing columns and indexes. Rollback is a code revert.

## 17. Remaining ambiguities and assumptions
**Need a product-owner answer (recorded as open questions; each has a safest reversible default):**
- **Q29** — Should a category with no PUBLISHED products be indexable and in the sitemap? *Default:* no — `noindex, follow` and omitted until it has one.
- **Q30** — Canonical policy for category-page variants; this changes delivered MVP-004 behavior. *Default:* self-canonical for `?page=N`; `?q=` is `noindex, follow` with the base canonical; sort/pageSize use the base canonical.
- **Q31** — Ship Product JSON-LD now (valid, but ineligible for Product rich results) or defer until price exists? *Default:* ship as decided and document.
- **Q28 (sequencing)** — TD-008 (reconciling the built status vocabulary with the Tested / Marketplace Reviewed decision) as a separate small corrective change, not inside MVP-021. *Default:* separate, before MVP-012.

**Assumptions I will make unless told otherwise (engineering, reversible):** no `BreadcrumbList`; no `og:image` (`twitter:card=summary`); working site name held in one constant; no `lastmod`; sitemap capped at 50,000 with a documented sitemap-index follow-up; `robots.txt` disallows only `/api/`; a staging/preview "noindex everything" switch is deferred until hosting is decided; the site URL is fixed at build time per environment.

**Estimate:** the backlog says 3 points; the scope above is closer to 5. No change is made without approval.
