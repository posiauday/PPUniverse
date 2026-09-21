# @ppu/domain-catalog

Pure catalog logic and the repository port — no framework, no database.

- **Visibility (MVP-003, FR-001):** `isPubliclyVisible` — only `PUBLISHED` products ever appear on a public page; `DRAFT` products exist in the database (once a creator/moderation pipeline writes them — MVP-011/012/013/014) but are never rendered. `CatalogRepository` is the port `@ppu/adapter-catalog`'s Prisma implementation satisfies.
- **Search parameters (MVP-004, FR-002):** `search-params` — query/sort/page normalization.
- **Product evidence (MVP-005, FR-003):** the compatibility model approved by the product owner on 2026-09-21 (`docs/final-decisions.md`).
  - `compatibility.ts` — the seven platform areas, the three evidence states with their approved definitions, `formatReleaseWave` ("2025 release wave 2"), `formatVerifiedDate`, and `validateCompatibilityEntry` (the write-time rules: release wave needs a platform area, year range, wave 1|2, **Tested requires an evidence summary and a last-verified date**, no future verified dates, 500-character limit on notes/summary). Nothing in the codebase calls it yet — creator/moderator write paths arrive in MVP-012/013 and must use it.
  - `support.ts` — support-status labels, and `safeSupportChannelHref`, which turns a channel into a link only when it is a plain `http(s)` URL with no embedded credentials (anything else is shown as text).
  - `text.ts` — `normalizeDisplayText`: collapses whitespace and strips control, zero-width and bidirectional-override characters from creator-supplied text. It does **not** HTML-escape; React does that at render time.
  - `present-evidence.ts` — `presentProductEvidence` turns a `ProductDetail` into the display model `@ppu/ui`'s `ProductEvidence` renders, including the exact empty-state sentences. It never produces "Microsoft Certified", "Microsoft Approved", "Officially Supported" or "Marketplace Verified" (tests assert this).

The minimum release wave means "the earliest release wave for which the product claims compatibility" — never proof of compatibility with later releases. Structured fields the product owner excluded from this story (Dataverse/premium-connector booleans, gateway, environment type, cloud, etc.) are deliberately not modeled.

- **Sitemap eligibility (MVP-021, FR-017):** the `CatalogRepository` port gains `listSitemapEntries(maxEntries)`, returning `SitemapEntries` — PUBLISHED products, and only those categories that currently have at least one PUBLISHED product (derived from inventory on every call, never a stored flag).
