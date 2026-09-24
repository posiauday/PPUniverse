# Current Architecture Inventory

Research only. Every claim below is verified against real repository files
(exact file paths and, where useful, line numbers), not inferred from
`docs/06-data-model.md`'s placeholder list. **A model named in that document
is not the same as a model that exists in the Prisma schema — this file
keeps the two strictly separate throughout, per this research's own
instruction.**

## Commerce and Catalog models

| Model | Status | Evidence |
|---|---|---|
| `Product` | **Real** | `packages/db/prisma/schema/catalog.prisma:39-60` — `id, slug (unique), name, summary, status (DRAFT\|PUBLISHED), categoryId, createdAt, updatedAt, publishedAt`. Relations to `ProductLicense[]`, `Release[]`, `SupportPolicy?`, `CompatibilityRecord[]`, `Entitlement[]`. |
| `Category` | **Real** | `catalog.prisma:25-37` — `id, slug (unique), name, description?, assetType (unique enum), createdAt, updatedAt`. |
| `LicenseDefinition` | **Real** | `packages/db/prisma/schema/evidence.prisma:46-58` — `id, slug (unique), name, description, sortOrder, createdAt, updatedAt`. Comment states explicitly: "Pricing, seat limits and contract terms are deliberately not modeled — still open (open question 7)." |
| `ProductLicense` | **Real, minimal** | `evidence.prisma:60-71` — a composite-key join table (`productId` + `licenseDefinitionId`) plus `createdAt` only. **No price, no seat-count field.** |
| `Release` | **Real** | `evidence.prisma:76-89`. |
| `SupportPolicy` | **Real** | `evidence.prisma:94-104`. |
| `CompatibilityRecord` | **Real** | `evidence.prisma` — platform area, structured release wave, notes, evidence status, last-verified date, `reviewedAt` (per `docs/06-data-model.md`'s TD-008 note). |
| `FileScan` | **Real** | `packages/db/prisma/schema/files.prisma:15-33`. |
| `Entitlement` | **Real, free-only today** | `packages/db/prisma/schema/entitlements.prisma:29-50` — `id, userId, productId, source (enum: only FREE_POLICY exists), grantedAt, revokedAt (reserved, never set by any code path today), createdAt, updatedAt`. Unique on `[userId, productId]` — **one row per user+product, not per release.** File header states explicitly: *"Paid sources (ORDER_LINE, ADMIN_GRANT, SUBSCRIPTION), EntitlementGrant and Subscription/SubscriptionItem belong to MVP-007/008, which is not built yet."* |
| `Download` | **Real, minimal** | `entitlements.prisma:62-77` — records that the free-entitlement flow completed, **not** that a file was actually served. No IP address, no user agent (deliberate data minimisation). |
| `Price` | **Does not exist.** | Zero matches for `model Price` anywhere in `packages/db/prisma/schema/*.prisma`. Named only in `docs/06-data-model.md:15` and `packages/domain/commerce/README.md`. |
| `Coupon` | **Does not exist.** | Same as `Price` — placeholder-only. |
| `CheckoutSession`, `Order`, `OrderLine`, `PaymentEvent`, `Refund`, `TaxRecord`, `InvoiceReference` | **Do not exist.** | Same — zero Prisma model matches; named only in `docs/06-data-model.md:15`. |
| `EntitlementGrant`, `Subscription`, `SubscriptionItem` | **Do not exist.** | Same — placeholder-only, confirmed by the `entitlements.prisma` header comment quoted above. |
| `ReleaseFile`, `ChangelogEntry`, `SignedDownloadGrant` | **Do not exist.** | `files.prisma:1-4` header: *"Only FileScan is modeled for MVP-006 — ReleaseFile/Release/ChangelogEntry/Download/SignedDownloadGrant belong to the stories that need them (MVP-009, MVP-012, MVP-014)."* (Note: `Release` and `Download` *are* separately built, per the rows above — only the three named here remain unbuilt.) |

**`packages/domain/commerce/`** and **`packages/adapters/payments/`** each
contain **only a `README.md`** — no `src/` directory, no `.ts` files, no
Stripe dependency anywhere in source code. Confirmed: a repo-wide search for
`stripe` (case-insensitive) returns 9 files, all documentation/README —
**zero source-code hits**. There is no `apps/web/app/api/checkout`, no
`apps/web/app/api/webhooks`, no `apps/web/app/checkout` route anywhere. This
directly confirms `planning/status.md`: **MVP-007 (Checkout) is "Ready," not
"Done" — genuinely nothing built.**

## Creator and marketplace models

`CreatorProfile`, `CreatorApplication`, `AgreementAcceptance`,
`ProductSubmission`, `ModerationReview`, `ModerationComment`, `TakedownCase`
— **none exist** as Prisma models (zero matches). Only named in
`docs/06-data-model.md:21` and `packages/domain/creator/README.md` (which,
like commerce, contains only that one README, no `src/`). This confirms
**MVP-011 (Creator application) is "Ready," not "Done" — genuinely nothing
built ahead of the story.**

## Article / content model

`packages/db/prisma/schema/content.prisma`:

- **`Article`** (content.prisma:50-72) — real fields: `id, slug (unique),
  title, type (TUTORIAL|PATTERN|COMPARISON), body (Markdown text, never
  rendered raw HTML), excerpt?, status (DRAFT|PUBLISHED), publishedAt
  (null=draft, set once, never rewritten), authorUserId, createdAt,
  updatedAt`.
- **`ArticlePublishEvent`** (content.prisma:77-89) — append-only:
  `id, articleId, actorUserId, action (enum: only PUBLISHED exists),
  createdAt`. Confirmed genuinely append-only — no UPDATE issued against it
  anywhere in `content-repository.ts`.
- **Fields confirmed absent** from `Article` (checked the full model, not
  assumed): no author bio/credentials field (only a bare `authorUserId` FK,
  no display name/bio/credential); no source-citation field; no
  content-versioning/revision-history (explicitly out of scope per the
  schema's own header comment and `planning/status.md`'s TD-016: *"a bare
  publish-action log, not full content-version snapshotting"*); no
  "reviewed date"/freshness field distinct from `updatedAt`.
- **`buildArticleJsonLd`** (`apps/web/lib/seo/json-ld.ts:107-130`) uses
  `"@type": "TechArticle"` (real article-type structured data, more specific
  than generic `Article`) and **does emit `dateModified`** (from
  `updatedAt`). It explicitly does **not** emit `author` — a doc comment in
  the file states: *"this codebase has no approved way to expose a user's
  identity in public structured data... every Article's author today is an
  internal ADMIN, not a public byline."* No `reviewer` field exists in any
  JSON-LD builder.

Package structure: `packages/domain/content/src/` (pure logic — `types.ts`,
`transitions.ts` including `isValidArticleStatusTransition`, DRAFT→PUBLISHED
only, no unpublish path) and `packages/adapters/content/src/` (
`content-repository.ts`'s `PrismaContentRepository`, `publishArticle` doing
the status transition and the publish-event insert in one `$transaction`).
Public route: `apps/web/app/learn/[slug]/page.tsx` (renders body as
plain escaped text). Admin surface: `apps/web/app/admin/content/{page.tsx,
new/page.tsx, [id]/edit/page.tsx, ArticleForm.tsx,
ArticlePublishControl.tsx}`.

## Notifications and consent

- **`ConsentRecord`** (`packages/db/prisma/schema/privacy.prisma:72-86`) —
  `id, userId, category (enum: TERMS_OF_SERVICE | MARKETING_EMAIL — only
  these two values exist), granted (Boolean), policyVersionId?, recordedAt,
  createdAt`. **Only one optional/marketing category exists today** — not
  multiple marketing sub-categories. Append-only (current state = latest row
  by `recordedAt`).
- **`EmailSend`** (`packages/db/prisma/schema/notifications.prisma:31-44`) —
  `id, userId?, messageType (enum: SIGNIN_LINK | DELETION_REQUEST_SUBMITTED
  — both transactional; no optional/marketing message type is implemented
  yet), status (SENT|FAILED|SKIPPED_NO_CONSENT), providerMessageId?,
  createdAt`. No raw email address stored (data minimisation). Append-only.
- **Unsubscribe mechanism**: stateless, HMAC-SHA256-signed token
  (`packages/domain/notifications/src/unsubscribe-token.ts`), not
  session-gated, category hardcoded to `MARKETING_EMAIL` at the token level
  — a decoded token naming anything else is rejected. Route:
  `apps/web/app/api/unsubscribe/route.ts`, inserts a new `ConsentRecord` row
  with `granted:false`.
- **`sendOptional`** (`packages/adapters/notifications/src/notification-service.ts:31-79`)
  checks `ConsentRecord` fresh on every call before sending, recording
  `SKIPPED_NO_CONSENT` if not granted.

**Implication for any newsletter/marketing-email monetization model**: the
consent architecture is real and working, but currently supports exactly one
binary marketing-email category. A per-category newsletter system (editorial
vs. new-asset alerts vs. sponsored-newsletter, as researched in
`11-newsletter-and-email-readiness.md`... [see `07-subscription-membership-and-licensing.md`
cross-reference]) would need the `ConsentCategory` enum extended — a real,
bounded schema change, not a fundamental redesign.

## Telemetry, analytics, and feature flags

- **Telemetry** (`packages/telemetry/src/`) is exclusively structured JSON
  log lines with correlation-ID propagation (`correlation.ts`, `logger.ts`)
  and key-based redaction (`redact.ts`). **No traces, no APM spans, no
  metrics library.**
- **`AnalyticsEvent`: does not exist.** Zero matches in Prisma schema. Named
  only in `docs/06-data-model.md:44` and `packages/domain/analytics/README.md`
  (which states: *"Owning story: not yet assigned — FR-016 has no backlog
  story... candidate home is MVP-022"*). `packages/domain/analytics/`
  contains only that README, no `src/`.
- **`FeatureFlag`: does not exist, at all.** A repo-wide grep (not scoped to
  Prisma schema — the whole repository) for `FeatureFlag` and for
  `isFeatureEnabled` each return **exactly one match**: the same single
  placeholder line in `docs/06-data-model.md`. **There is no feature-flag
  model, no feature-flag-checking function, anywhere in this codebase.**
  This is a hard, direct fact this research does not soften: any
  monetization model that assumes "we'll gate it behind a feature flag" is
  assuming infrastructure that does not exist yet, at all — not a minor gap,
  a from-scratch build.

## SEO, sitemap, and structured data (relevant to advertising/content
## eligibility logic, and to article-based monetization)

`apps/web/lib/seo/` — real, working, and directly relevant as a *pattern* to
extend for ad-eligibility and content-monetization page-level rules:

- **Sitemap eligibility is real and status-filtered**: only the home page,
  categories with at least one PUBLISHED product, PUBLISHED products, and
  PUBLISHED articles are included — never drafts (`sitemap.ts`, enforced via
  each repository's own status-filtered query).
- **Deny-by-default robots posture is real**: every page is `noindex` unless
  it explicitly opts in (`metadata.ts`).
- **`category-indexing.ts`** already implements exactly the kind of
  per-page-type eligibility logic (base/paginated/empty/variant-parameter
  cases) that an ad-eligibility or sponsored-content-eligibility rule would
  need to mirror — a real, proven pattern in this codebase, not a novel
  concept to invent.
- **No Offer/price/currency data is emitted in `Product` JSON-LD today**,
  by deliberate, documented design (`json-ld.ts`): *"until the corresponding
  data is modeled, approved and implemented (pricing, currency, tax and
  checkout for Offer data)."* Directly confirms Commerce's placeholder-only
  status from a second, independent angle.

## Routes (one level deep, `apps/web/app/`)

```
account/  admin/  api/  categories/  learn/  not-found.tsx  page.tsx
products/  search/  signin/  unsubscribe/
```
`api/`: `account, admin, auth, files, health, me, products, unsubscribe`.
`admin/`: `content, deletion-requests`. `account/`: `privacy, sessions`.

No `checkout/`, no `creator/`, no `api/webhooks` route exists anywhere. This
is the real, current route surface any monetization exclusion list
(`04-advertising-options.md`'s required exclusion zones) or new route
(checkout, creator application) would be built against or added to.
