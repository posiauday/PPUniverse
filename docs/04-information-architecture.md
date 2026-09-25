# Information Architecture and Sitemap

## Primary navigation
Explore, Components, Templates, Automations, Power BI, Architecture, Governance, AI, Learn, ~~Creators~~ (superseded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — no public creator directory), Pricing.

## Utility navigation
Search, saved items, downloads, purchases, ~~creator dashboard~~ (superseded, same decision — first-party authoring is MVP-012's admin surface, not a public "dashboard" nav item), notifications, account, support, admin when authorized.

## URL model
- `/products/[slug]`
- `/categories/[slug]`
- `/collections/[slug]`
- ~~`/creators/[handle]`~~ (superseded 2026-09-24, same decision — never built; no public creator page)
- `/learn/[slug]`
- `/tools/[slug]`
- `/pricing`
- `/account/*`
- ~~`/creator/*`~~ (superseded, same decision)
- `/admin/*`

## Product taxonomy
Platform, asset type, use case, industry, audience level, data source, connector, license, pricing model, compatibility, accessibility status, deployment method, support status, language and update recency.

## Page inventory
Home; search results; category landing; collection; product detail; ~~creator profile~~ (superseded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — never built, no public creator page); article/tutorial; learning path; pricing; enterprise; sign-in; account; library/downloads; orders; saved items; ~~creator application; creator dashboard~~ (superseded, same decision); product editor (first-party, MVP-012); release editor; ~~moderation queue~~ (superseded in its third-party form, MVP-013 — see `docs/final-decisions.md` section 5 for redistribution); admin dashboards; help center; contact; terms; privacy; cookies; marketplace agreement; acceptable use; refund policy; licensing explainer; takedown process.

## Search requirements
Autocomplete is optional for MVP. Required: query, filters, sort, total, pagination, clear-all, zero-results guidance and analytics. Search ranking inputs may include text relevance, quality, freshness and verified engagement but must not secretly favor paid products. Sponsored placement must be labeled.
