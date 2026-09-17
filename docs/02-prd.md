# Product Requirements Document

## Personas
- Maker: wants a fast, copy-ready component with setup instructions.
- Architect: wants compatibility, security, licensing, ALM and support evidence.
- Team buyer: wants legal purchasing, team entitlement and update confidence.
- Creator: wants discovery, product publishing, sales insight and support boundaries.
- Moderator: wants safe review queues, evidence, version comparison and takedown controls.

## Core journeys
1. Discover via search engine or catalog, filter by product/category/license/compatibility, inspect preview and documentation, then download or purchase.
2. Sign in, complete checkout, receive entitlement, access versioned files and receipt.
3. Creator applies, verifies profile, submits product and release, responds to moderation feedback, and publishes.
4. Moderator reviews metadata, files, scan status, claims, documentation and preview, then approves, requests changes or rejects.
5. Buyer receives update notice, reviews changelog and downloads a newer entitled version.

## Functional requirements
- FR-001 Public users can browse category, collection, creator and product pages without authentication.
- FR-002 Catalog supports keyword search and filters for Power Apps, Power Automate, Power BI, Architecture, Governance, AI, asset type, free/paid, license, compatibility, accessibility status, and update recency.
- FR-003 Product pages show title, summary, creator, screenshots, demo, price, license, compatibility, prerequisites, setup, accessibility statement, support, changelog, version history and related assets.
- FR-004 Users can create accounts, verify email, manage profile, consent, sessions and account deletion request.
- FR-005 Free downloads may require sign-in based on product policy and always create an entitlement/download record.
- FR-006 Paid products use hosted checkout and server-verified webhook fulfillment.
- FR-007 Entitled users receive signed, expiring download links. Storage paths are never public.
- FR-008 Creator application captures identity, public profile, payout readiness, support commitment and agreement acceptance.
- FR-009 Creator portal supports drafts, media, documentation, pricing, licenses, compatibility, releases and submission.
- FR-010 Moderation supports queue, evidence, comments, decision reason, resubmission, suspension and takedown.
- FR-011 Product releases are immutable after publication; corrections create another version.
- FR-012 Verified users can rate/review qualifying assets; creators can respond; staff can moderate.
- FR-013 Users can save products and manage update notifications.
- FR-014 Editors can publish tutorials, patterns, learning paths, comparison pages and curated collections.
- FR-015 Admins can manage users, creators, taxonomies, products, orders, refunds, entitlements, reviews, content, feature flags and audit logs.
- FR-016 System records funnel events without collecting unnecessary personal or source-code data.
- FR-017 Every indexable page supports canonical URL, metadata, social preview, sitemap inclusion and structured data where valid.
- FR-018 Support workflow links requests to users, orders, products, versions and resolution status.

## Non-functional requirements
- NFR-001 WCAG 2.2 AA target, keyboard operation, visible focus, reduced motion and accessible validation.
- NFR-002 Authorization is server-side, deny-by-default and least-privilege.
- NFR-003 Payment fulfillment is idempotent and webhook signatures are verified.
- NFR-004 Public pages are server-rendered or statically generated where appropriate.
- NFR-005 Core user actions provide useful failure, retry, empty and loading states.
- NFR-006 Logs exclude secrets, payment details and uploaded asset contents.
- NFR-007 Backups, restore procedure, health checks and incident runbooks exist before launch.
- NFR-008 Supported browsers and responsive breakpoints are documented and tested.
- NFR-009 Destructive admin actions require reason capture and audit logging.
- NFR-010 Data retention and deletion jobs are configurable by data class.

## MVP release acceptance
All P0 stories pass; one free and one paid product complete the end-to-end path; a creator can submit; a moderator can approve; a buyer can purchase and download; refund revokes or adjusts entitlement according to policy; accessibility critical defects are zero; restore and incident tabletop are completed; legal pages and agreements are published.
