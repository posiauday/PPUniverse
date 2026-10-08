# Data Model

## Identity and organization
User, UserProfile, Session, Role, Permission, Organization, OrganizationMember, Team, TeamMember, ConsentRecord.

## Catalog
Product, ProductSlug, Category, Tag, ProductCategory, ProductTag, CompatibilityRecord, Prerequisite, LicenseDefinition, ProductLicense, ProductMedia, ProductDocument, Collection, CollectionItem.

`CompatibilityRecord` fields are defined by the approved compatibility model in `docs/final-decisions.md` (2026-09-21): platform area, structured minimum release wave (year + wave number), notes, evidence status, evidence summary, last verified date, and (TD-008, 2026-09-24) a nullable `reviewedAt` timestamp — null except when evidence status is Marketplace Reviewed, set only by the server-side moderation workflow. Evidence status is one of four enum values, but only Creator Declared and Marketplace Reviewed are assignable; Tested is reserved and Not Verified is legacy, neither ever assignable, inferred, or migrated to. `LicenseDefinition` holds the three locked license tiers (Personal, Team, Enterprise; `docs/final-decisions.md` 2026-09-18).

## Versioning and files
Release, ReleaseFile, FileScan, ReleasePublishEvent, ChangelogEntry, Download, SignedDownloadGrant. Published releases are immutable. File scan transitions: uploaded, quarantined, scanning, clean, rejected, overridden.

`ReleasePublishEvent` is built (MVP-014, FR-011; `docs/final-decisions.md`, "MVP-014 immutable published releases"). Append-only audit trail of release-publish actions, structurally identical to `ArticlePublishEvent`: `id`, `releaseId` (FK to `Release`, `Restrict`), `productId` (FK to `Product`, `Restrict`, denormalized for query convenience — always equal to `releaseId`'s own `Release.productId`), `actorUserId` (FK to `User`, `Restrict`), `action` (enum, currently only `PUBLISHED`), `createdAt`. One row is written per release publication, whether it is a product's first release (`publishProductWithRelease`) or a subsequent one (`publishSubsequentRelease`) — both write paths share the same event shape so the audit trail has no gap at a product's very first publish. `Release.publishedAt` is set exactly once, by an atomic conditional database update (`updateMany` gated on `publishedAt: null`, requiring exactly one affected row) rather than a plain read-then-write, so a concurrent double-publish attempt on the same release cannot both succeed. `ChangelogEntry` remains an unbuilt, out-of-scope placeholder — MVP-014 explicitly does not build it (`docs/final-decisions.md`, "MVP-014 immutable published releases").

There is no `currentReleaseId` pointer or sequence field on `Product`: the "current" published release for a product with more than one is still derived by query (`publishedAt DESC, createdAt DESC, take 1`), unchanged from MVP-012 — a deliberate decision, not an oversight (`docs/final-decisions.md`, "MVP-014 immutable published releases").

## Catalog (Product lifecycle addendum, MVP-019)

`ProductStatus` gains `SUSPENDED` and `ARCHIVED` (MVP-019, FR-015/NFR-009; `docs/final-decisions.md`, "MVP-019 operations console and audit: open questions evaluated and decided"). Valid transitions: `PUBLISHED ⇄ SUSPENDED`, `PUBLISHED → ARCHIVED`, `SUSPENDED → ARCHIVED`. `ARCHIVED` is terminal. `DRAFT` cannot go directly to either — nothing public exists yet to suspend or retire, and `DRAFT → PUBLISHED` remains exclusively MVP-012's own initial-publish concern (a deliberately separate transition table, `ALLOWED_STATUS_CHANGE_TRANSITIONS`, so a suspended/archived product can never accidentally satisfy the initial-publish gate's "must be DRAFT" precondition). Suspending or archiving a Product **never touches any `Entitlement` row** — it is a discoverability toggle only (drops the product from public listing/category/search/detail), not a revocation mechanism; existing entitlement holders keep unchanged access.

`ProductStatusEvent` is the append-only audit trail for every status-change transition — structurally identical to `ArticlePublishEvent`/`ReleasePublishEvent`: `id`, `productId` (FK `Product`, `Restrict`), `actorUserId` (FK `User`, `Restrict`), `fromStatus`/`toStatus` (both `ProductStatus`), `reason` (nullable at the schema level, but application-enforced non-empty for every transition this table records — NFR-009, mirroring `DeletionRequestEvent.reason`'s precedent), `createdAt`. The transition is a compare-and-swap: an atomic conditional update whose `WHERE` clause requires the exact status just validated (`status: product.status`), the same family as MVP-014's `Release.publishedAt` claim. Exactness guarantees the event's `fromStatus` is the status actually replaced, keeping the audit chain continuous; a request that loses a race fails with a state-transition error and may be retried against fresh state. (An earlier draft claimed against every status that could reach `toStatus`, which let a concurrent transaction succeed from a newer state while recording its stale pre-claim `fromStatus` — caught by independent review of PR #25.)

## Commerce
Price, Coupon, CheckoutSession, Order, OrderLine, PaymentEvent, Refund, TaxRecord, InvoiceReference, Entitlement, EntitlementGrant, Subscription, SubscriptionItem.

`Order`, `PaymentEvent` and `Price` are built (MVP-007 slices 1 and 2, FR-006; `docs/final-decisions.md`, "MVP-007 slice 1 authorized; launch currency; refund policy; pricing mechanism"). `Order` records one purchase of one licence tier of one product by one user: `status` (`PENDING` → `PAID` | `EXPIRED` | `FAILED`, then `PAID` → `FULFILLED`; there is no refunded state, because all sales are final), and `amountCents`/`currency` capturing what was actually charged. A CHECK constraint requires the amount to be above zero, so a free product can never become a false paid order, and the currency to be a three-letter code; USD is the only supported currency at launch. It also has a unique `stripeCheckoutSessionId` slot. Status changes are compare-and-swap on the exact current status. `PaymentEvent` is the append-only Stripe webhook ledger, keyed on Stripe's unique event id so a redelivery is recognised; it stores the event type and livemode flag but never the payload. Both tables are RLS-enabled with `Restrict` FKs. `Price` (slice 2) has at most one row per product, a positive USD amount (CHECK constraints as for `Order`), and is deleted with its product (Cascade), since a price is configuration and what a buyer paid lives on their `Order`; a product with no `Price` row is free, and most products are. Checkout sessions (slice 3), `OrderLine` (not needed: one order is one licence tier), and `Refund` (none: all sales final) are not built. `Coupon`, `Subscription` and `SubscriptionItem` are out of scope (one-time purchases only).

## Privacy
PolicyVersion, ConsentRecord, DeletionRequest, DeletionRequestEvent (MVP-020, FR-004; `docs/final-decisions.md`, "MVP-020 open questions 46, 47 and 48"). `PolicyVersion` is metadata about a legal-document version only — never the operative text. `ConsentRecord` and `DeletionRequestEvent` are both append-only: a change of mind or a review action always inserts a new row, never updates an earlier one. `DeletionRequest` itself has no status column — its current state is derived from its latest `DeletionRequestEvent`. This story records and reviews a deletion request only; it does not execute erasure, anonymisation, pseudonymisation or scheduled retention (tracked separately, open question 23/NFR-010).

## Creator and marketplace (superseded 2026-09-24 — see below)
~~CreatorProfile, CreatorApplication, AgreementAcceptance, ProductSubmission, ModerationReview, ModerationComment, TakedownCase, SupportPolicy.~~

**Superseded by the first-party-only publishing decision (`docs/final-decisions.md`, "First-party-only publishing model").** None of `CreatorProfile`, `CreatorApplication`, `AgreementAcceptance`, or `ProductSubmission` were ever built beyond this naming (confirmed: `packages/domain/creator/` contains only a placeholder README, no `src/`; no `packages/adapters/creator/` exists) — they are retired as planned entities, not rolled back from a real schema. `ModerationReview`, `ModerationComment`, and `TakedownCase` depend on the still-open question of what MVP-013's successor scope is (a first-party self-review gate, retirement, or the suggestion-inbox review surface — not resolved by this entry); they stay listed here as still-possibly-needed, not superseded outright, pending that resolution. **`SupportPolicy` is unaffected and stays exactly as built** (`packages/db/prisma/schema/evidence.prisma:94-104`) — a first-party product still declares a support model, independent of who authored it.

## Engagement and content
SavedProduct, Review, ReviewVote, CreatorResponse, NotificationPreference, Notification, Article, ArticlePublishEvent, LearningPath, LearningPathItem, SEORecord.

`Article` and `ArticlePublishEvent` are built (MVP-017, FR-014; `docs/final-decisions.md`, "MVP-017 implementation: `Article` only this pass..."). `LearningPath`, `LearningPathItem` and `SEORecord` remain unbuilt placeholders — named here, not yet modeled — pending a deferred follow-up story or an approved MVP-017 scope extension (`docs/open-questions.md` item 50). `/collections/[slug]` and `Collection`/`CollectionItem` (listed under "Catalog" above) are separately out of scope of MVP-017 entirely (`docs/final-decisions.md`, "MVP-017 / `/collections/[slug]` scope conflict...").

**`Article`** — tutorials, patterns and comparison pages, discriminated by `type`:
- `id`, `slug` (unique), `title`.
- `type`: enum `TUTORIAL | PATTERN | COMPARISON | KPI_GUIDE` (`KPI_GUIDE` added by MVP-028; it feeds a technology section's KPIs tab).
- `technology`: nullable enum `Technology` (`POWER_APPS | POWER_AUTOMATE | POWER_BI | COPILOT_STUDIO | DATAVERSE | POWER_PAGES | GOVERNANCE_ADMIN`), added by MVP-028; `GOVERNANCE_ADMIN` (the cross-product Governance & admin area) added by MVP-033. It is the technology section the article appears in; null means cross-cutting. It is indexed together with `status`.
- `topic`: nullable text, added by MVP-033. It is the section of the technology's hub the article appears in: one of that technology's ids in `TECHNOLOGY_TOPICS` (`@ppu/domain-content`), checked by the admin API and the content importer. Null means the hub's first section.

### UpdateItem and UpdatePublishEvent (MVP-033 slice D)
Platform updates for `/updates` and the header badge, mirroring Article and ArticlePublishEvent.
- `UpdateItem` (`update_items`): `slug` (unique; the item's anchor and the importer's key), `title`, `summary` (plain text), `technology` (nullable `Technology`), `kind` (enum `UpdateKind`: `FEATURE | LICENSING | DEPRECATION | RETIREMENT`), `action` (nullable short text), `sourceUrl` (Microsoft's announcement; the API and importer accept only https on microsoft.com or a subdomain), `effectiveDate` (nullable `date`; a dated DEPRECATION or RETIREMENT appears in the tracker), `replacement` (nullable), `status` (`ArticleStatus`, default DRAFT), `publishedAt` (set once on publish), `authorUserId` (Restrict FK). Indexed on `(status, publishedAt)`.
- `UpdatePublishEvent` (`update_publish_events`): append-only audit row per publish (`updateId`, `actorUserId`, `action`), Restrict FKs.
- Both tables have row-level security enabled with no policies, like every table.
- `body`: Markdown source (`TEXT`). Never rendered as raw HTML — the public `/learn/[slug]` page renders it as escaped, preformatted text (no Markdown-to-HTML conversion in this first pass); defense in depth against stored XSS even though only `ADMIN` may author content today.
- `excerpt`: nullable, used for the page's meta description.
- `status`: enum `DRAFT | PUBLISHED`, mirroring `packages/domain/catalog/src/visibility.ts`'s `ProductStatus` pattern — only `PUBLISHED` is ever publicly visible.
- `publishedAt`: nullable `DateTime`; null means draft. Set once, on publish, and never rewritten — the same precedent as `Release.publishedAt` (FR-011: a correction after publication is a new `ArticlePublishEvent`, not a rewritten timestamp; full content versioning/snapshotting is out of scope for this first pass).
- `authorUserId`: FK to `User`, `Restrict` (not `Cascade`) — the same audit-trail-adjacent rationale as `privacy.prisma`: a cascade would let a future user-deletion destroy the record of who authored content.
- `createdAt`, `updatedAt`.

**`ArticlePublishEvent`** — append-only audit trail of publish actions, exactly like `DeletionRequestEvent`/`EmailSend` (no `UPDATE` is ever issued against it):
- `id`, `articleId` (FK to `Article`, `Restrict`), `actorUserId` (FK to `User`, `Restrict`), `action` (enum, currently only `PUBLISHED`), `createdAt`.

Authorization: content-publishing authority (create/edit/publish an `Article`) reuses the existing `ADMIN` role — no `EDITOR` role exists or is introduced (`docs/final-decisions.md`, "MVP-017 implementation: content-publishing authorization reuses ADMIN").

### LearnTopic, LearnLesson and LearnPublishEvent (MVP-048)
The Learn module (`docs/plans/learn-module.md`): topics made of 3 to 6 lessons at `/topics/<topic>/<lesson>`. Same lifecycle as `Article`: created `DRAFT`, `publishedAt` set once on publish and never rewritten, `Restrict` FKs, row-level security on with no policies.
- `LearnTopic` (`learn_topics`): `slug` (unique; the address and the importer's key), `title`, `summary` (plain text), `technology` (required `Technology`, including `GOVERNANCE_ADMIN`), `sortOrder` (order among the area's topics), `status`, `publishedAt`, `authorUserId`.
- `LearnLesson` (`learn_lessons`): `topicId`, `slug` and `position` (each unique within the topic), `title`, `minutes`, `outcomes` (`TEXT[]`, 2 or 3), `body` (Markdown in the fixed lesson shape, never rendered as raw HTML), `checkedOn` (`DATE`, nullable), `status`, `publishedAt`, `authorUserId`. A lesson is public only when it and its topic are both `PUBLISHED`.
- `LearnPublishEvent` (`learn_publish_events`): append-only, one row per publish: `topicId`, `lessonId` (null when the topic itself was published), `actorUserId`, `action`.
- The lesson shape and the knowledge-check rules are checked in `@ppu/domain-content` (`learn.ts`) by the importer, the content gate and the admin editor.

## Operations
SupportCase, FeatureFlag, JobRecord, WebhookReceipt, AnalyticsEvent.

~~AuditEvent~~ — **superseded by a read/merge admin view, not a new table** (MVP-019, question 4). Rather than a single physical audit table every sensitive-action write path would need to also write to, `apps/web/lib/audit.ts` reads and merges the existing per-domain event tables (`ProductStatusEvent` above, `ReleasePublishEvent` from MVP-014, `DeletionRequestEvent` from MVP-020, `ArticlePublishEvent` from MVP-017) at request time. No schema exists for `AuditEvent` and none is planned under this name; a future physical unification, if ever needed for cross-domain query performance, remains a clean additive step from here, not a redesign.

## Critical constraints
- Unique product slug. ~~and creator handle~~ (moot under first-party-only, 2026-09-24 — no creator handle to be unique).
- Unique provider event ID for webhook idempotency.
- Entitlement references the order line, admin grant or subscription source.
- Download requires active entitlement or explicit free-product policy.
- Review uniqueness by qualifying user/product policy.
- Published release files cannot be replaced in place.
- Audit events are append-only.
- ConsentRecord and DeletionRequestEvent are append-only; their user-reference foreign keys are Restrict, not Cascade, so a user row cannot be hard-deleted while either still references it (MVP-020).

## Data classification
Public: published catalog/content. Internal: moderation notes and operational telemetry. Confidential: profiles, orders, support cases and agreements. Restricted: credentials and payment secrets, which must not be stored in application tables.
