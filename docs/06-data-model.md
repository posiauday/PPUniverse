# Data Model

## Identity and organization
User, UserProfile, Session, Role, Permission, Organization, OrganizationMember, Team, TeamMember, ConsentRecord.

## Catalog
Product, ProductSlug, Category, Tag, ProductCategory, ProductTag, CompatibilityRecord, Prerequisite, LicenseDefinition, ProductLicense, ProductMedia, ProductDocument, Collection, CollectionItem.

`CompatibilityRecord` fields are defined by the approved compatibility model in `docs/final-decisions.md` (2026-09-21): platform area, structured minimum release wave (year + wave number), notes, evidence status, evidence summary, last verified date. `LicenseDefinition` holds the three locked license tiers (Personal, Team, Enterprise; `docs/final-decisions.md` 2026-09-18).

## Versioning and files
Release, ReleaseFile, FileScan, ChangelogEntry, Download, SignedDownloadGrant. Published releases are immutable. File scan transitions: uploaded, quarantined, scanning, clean, rejected, overridden.

## Commerce
Price, Coupon, CheckoutSession, Order, OrderLine, PaymentEvent, Refund, TaxRecord, InvoiceReference, Entitlement, EntitlementGrant, Subscription, SubscriptionItem.

## Creator and marketplace
CreatorProfile, CreatorApplication, AgreementAcceptance, ProductSubmission, ModerationReview, ModerationComment, TakedownCase, SupportPolicy.

## Engagement and content
SavedProduct, Review, ReviewVote, CreatorResponse, NotificationPreference, Notification, Article, LearningPath, LearningPathItem, SEORecord.

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

## Data classification
Public: published catalog/content. Internal: moderation notes and operational telemetry. Confidential: profiles, orders, support cases and agreements. Restricted: credentials and payment secrets, which must not be stored in application tables.
