# Data Model

## Identity and organization
User, UserProfile, Session, Role, Permission, Organization, OrganizationMember, Team, TeamMember, ConsentRecord.

## Catalog
Product, ProductSlug, Category, Tag, ProductCategory, ProductTag, CompatibilityRecord, Prerequisite, LicenseDefinition, ProductLicense, ProductMedia, ProductDocument, Collection, CollectionItem.

`CompatibilityRecord` fields are defined by the approved compatibility model in `docs/final-decisions.md` (2026-09-21): platform area, structured minimum release wave (year + wave number), notes, evidence status, evidence summary, last verified date, and (TD-008, 2026-09-24) a nullable `reviewedAt` timestamp — null except when evidence status is Marketplace Reviewed, set only by the server-side moderation workflow. Evidence status is one of four enum values, but only Creator Declared and Marketplace Reviewed are assignable; Tested is reserved and Not Verified is legacy, neither ever assignable, inferred, or migrated to. `LicenseDefinition` holds the three locked license tiers (Personal, Team, Enterprise; `docs/final-decisions.md` 2026-09-18).

## Versioning and files
Release, ReleaseFile, FileScan, ChangelogEntry, Download, SignedDownloadGrant. Published releases are immutable. File scan transitions: uploaded, quarantined, scanning, clean, rejected, overridden.

## Commerce
Price, Coupon, CheckoutSession, Order, OrderLine, PaymentEvent, Refund, TaxRecord, InvoiceReference, Entitlement, EntitlementGrant, Subscription, SubscriptionItem.

## Privacy
PolicyVersion, ConsentRecord, DeletionRequest, DeletionRequestEvent (MVP-020, FR-004; `docs/final-decisions.md`, "MVP-020 open questions 46, 47 and 48"). `PolicyVersion` is metadata about a legal-document version only — never the operative text. `ConsentRecord` and `DeletionRequestEvent` are both append-only: a change of mind or a review action always inserts a new row, never updates an earlier one. `DeletionRequest` itself has no status column — its current state is derived from its latest `DeletionRequestEvent`. This story records and reviews a deletion request only; it does not execute erasure, anonymisation, pseudonymisation or scheduled retention (tracked separately, open question 23/NFR-010).

## Creator and marketplace
CreatorProfile, CreatorApplication, AgreementAcceptance, ProductSubmission, ModerationReview, ModerationComment, TakedownCase, SupportPolicy.

## Engagement and content
SavedProduct, Review, ReviewVote, CreatorResponse, NotificationPreference, Notification, Article, ArticlePublishEvent, LearningPath, LearningPathItem, SEORecord.

`Article` and `ArticlePublishEvent` are built (MVP-017, FR-014; `docs/final-decisions.md`, "MVP-017 implementation: `Article` only this pass..."). `LearningPath`, `LearningPathItem` and `SEORecord` remain unbuilt placeholders — named here, not yet modeled — pending a deferred follow-up story or an approved MVP-017 scope extension (`docs/open-questions.md` item 50). `/collections/[slug]` and `Collection`/`CollectionItem` (listed under "Catalog" above) are separately out of scope of MVP-017 entirely (`docs/final-decisions.md`, "MVP-017 / `/collections/[slug]` scope conflict...").

**`Article`** — tutorials, patterns and comparison pages, discriminated by `type`:
- `id`, `slug` (unique), `title`.
- `type`: enum `TUTORIAL | PATTERN | COMPARISON`.
- `body`: Markdown source (`TEXT`). Never rendered as raw HTML — the public `/learn/[slug]` page renders it as escaped, preformatted text (no Markdown-to-HTML conversion in this first pass); defense in depth against stored XSS even though only `ADMIN` may author content today.
- `excerpt`: nullable, used for the page's meta description.
- `status`: enum `DRAFT | PUBLISHED`, mirroring `packages/domain/catalog/src/visibility.ts`'s `ProductStatus` pattern — only `PUBLISHED` is ever publicly visible.
- `publishedAt`: nullable `DateTime`; null means draft. Set once, on publish, and never rewritten — the same precedent as `Release.publishedAt` (FR-011: a correction after publication is a new `ArticlePublishEvent`, not a rewritten timestamp; full content versioning/snapshotting is out of scope for this first pass).
- `authorUserId`: FK to `User`, `Restrict` (not `Cascade`) — the same audit-trail-adjacent rationale as `privacy.prisma`: a cascade would let a future user-deletion destroy the record of who authored content.
- `createdAt`, `updatedAt`.

**`ArticlePublishEvent`** — append-only audit trail of publish actions, exactly like `DeletionRequestEvent`/`EmailSend` (no `UPDATE` is ever issued against it):
- `id`, `articleId` (FK to `Article`, `Restrict`), `actorUserId` (FK to `User`, `Restrict`), `action` (enum, currently only `PUBLISHED`), `createdAt`.

Authorization: content-publishing authority (create/edit/publish an `Article`) reuses the existing `ADMIN` role — no `EDITOR` role exists or is introduced (`docs/final-decisions.md`, "MVP-017 implementation: content-publishing authorization reuses ADMIN").

## Operations
SupportCase, AuditEvent, FeatureFlag, JobRecord, WebhookReceipt, AnalyticsEvent.

## Critical constraints
- Unique product slug and creator handle.
- Unique provider event ID for webhook idempotency.
- Entitlement references the order line, admin grant or subscription source.
- Download requires active entitlement or explicit free-product policy.
- Review uniqueness by qualifying user/product policy.
- Published release files cannot be replaced in place.
- Audit events are append-only.
- ConsentRecord and DeletionRequestEvent are append-only; their user-reference foreign keys are Restrict, not Cascade, so a user row cannot be hard-deleted while either still references it (MVP-020).

## Data classification
Public: published catalog/content. Internal: moderation notes and operational telemetry. Confidential: profiles, orders, support cases and agreements. Restricted: credentials and payment secrets, which must not be stored in application tables.
