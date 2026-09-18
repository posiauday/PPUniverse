# GitHub User Stories

Persona-based breakdown of each Feature, using the PRD personas (Maker, Architect, Team buyer, Creator, Moderator) and journeys. Each story is created as a GitHub issue labeled `type:story`, `epic:<name>`, `priority:<Pn>`, `requirement:<id>`, linked to its parent Feature ("Part of: #FEAT-xxx"). Acceptance criteria use Given/When/Then and never exceed what the source requirement states.

---

## EPIC-01 Foundation

### STORY-001a — As an engineer, I want CI to block a broken build so bad code never merges
Feature: FEAT-001 · Requirement: NFR-007
- Given a pull request with a lint, type, or test failure, when CI runs, then the PR is blocked from merge.
- Given a pull request with a known-vulnerable dependency, when the dependency/secret scan runs, then CI reports it as a failing check.

## EPIC-02 Identity

### STORY-002a — As a Maker, I want to register and verify my email so I can save my work
Feature: FEAT-002 · Requirement: FR-004
- Given a new visitor, when they register with an email, then a verification step is required before full account access.
- Given a verified account, when the user signs in, then a session is created; when they sign out, then the session is revoked server-side.

### STORY-002b — As any user, I want to manage my active sessions so I can revoke access from a lost device
Feature: FEAT-002 · Requirement: FR-004
- Given a signed-in user, when they view account sessions, then they can see and revoke sessions other than the current one.

## EPIC-03 Catalog

### STORY-003a — As a Maker, I want to browse categories and products without signing in so I can evaluate before committing
Feature: FEAT-003 · Requirement: FR-001
- Given an anonymous visitor, when they visit a category or product listing page, then the page renders without requiring authentication and is indexable by search engines.

### STORY-004a — As an Architect, I want to filter by compatibility and license so I only see viable options
Feature: FEAT-004 · Requirement: FR-002
- Given the catalog page, when a user applies platform/category/license/compatibility/price filters, then results update, the filter state is shareable via URL, and results are keyboard/screen-reader accessible.
- Given a filter combination with no matches, when results load, then a zero-results state with guidance is shown and the event is tracked.

### STORY-005a — As an Architect, I want full compatibility, license, and support evidence on a product page so I can assess enterprise suitability
Feature: FEAT-005 · Requirement: FR-003
- Given a published product, when its detail page renders, then title, summary, creator, screenshots/demo, price, license, compatibility, prerequisites, setup, accessibility statement, support status, changelog, version history, and related assets are all present.

## EPIC-04 Files

### STORY-006a — As a buyer, I want to be certain a file I download was scanned clean so I'm not exposed to malware
Feature: FEAT-006 · Requirement: FR-007
- Given an uploaded file, when it has not completed a clean scan, then no download endpoint can serve it.
- Given a file that fails scanning, when the result is `rejected`, then it is permanently blocked from release without a documented, audited override.

## EPIC-05 Commerce

### STORY-007a — As a Team buyer, I want checkout to charge the correct, current price so I'm never mischarged
Feature: FEAT-007 · Requirement: FR-006
- Given a checkout request, when the session is created, then the price is derived server-side from the current `Price` record, never from client input.
- Given a duplicate checkout-session request with the same idempotency key, when submitted again, then no duplicate session is created.

### STORY-008a — As the platform, I want to trust only genuine, once-only payment events so entitlements are never granted incorrectly
Feature: FEAT-008 · Requirement: FR-006
- Given a payment webhook, when its signature is invalid, then it is rejected and logged.
- Given the same provider event ID delivered twice, when the second delivery arrives, then it is a no-op (idempotent) and does not duplicate the order or entitlement.

## EPIC-06 Entitlements

### STORY-009a — As a buyer, I want my download link to work only for me and only briefly so it can't be shared or replayed
Feature: FEAT-009 · Requirement: FR-007
- Given a download request, when the caller lacks an active entitlement, then the request is denied and logged.
- Given an entitled caller, when they request a download, then a short-lived signed URL is issued and the download is recorded.

### STORY-010a — As a Maker, I want a one-click free download that still respects sign-in policy so I get credit for it
Feature: FEAT-010 · Requirement: FR-005
- Given a free product with a sign-in-required policy, when an anonymous user attempts download, then they are prompted to sign in first; when a signed-in user downloads, then an entitlement and download record are created.

## EPIC-07 Creator

### STORY-011a — As a Creator, I want to apply and accept the marketplace agreement so I can start submitting products
Feature: FEAT-011 · Requirement: FR-008
- Given a signed-in user, when they submit a creator application with identity, public profile, payout readiness, and support commitment, then the agreement acceptance is recorded and the application enters review.

### STORY-012a — As a Creator, I want the editor to block submission until every required field is present so I don't get rejected for missing metadata
Feature: FEAT-012 · Requirement: FR-009
- Given a draft product/release, when required fields (license, version, compatibility, support status, documentation, media) are incomplete, then submission is blocked with field-level errors.

## EPIC-08 Moderation

### STORY-013a — As a Moderator, I want a queue with evidence and a documented decision so approvals are defensible
Feature: FEAT-013 · Requirement: FR-010
- Given a submitted product, when a moderator reviews it, then they can see metadata, files, scan status, and documentation, and record approve / request changes / reject with a reason code and narrative.

## EPIC-09 Publishing

### STORY-014a — As a buyer, I want a version I purchased to never silently change so I can trust what I paid for
Feature: FEAT-014 · Requirement: FR-011
- Given a published release, when a creator wants to change its files, then the system rejects in-place replacement and requires a new release version.

## EPIC-10 Account (P1)

### STORY-015a — As a buyer, I want to see everything I've purchased or saved in one place
Feature: FEAT-015 · Requirement: FR-013
- Given a signed-in user, when they open their library, then entitled products, order history, and saved items are listed with working access to entitled downloads.

## EPIC-11 Reviews (P1)

### STORY-016a — As a buyer, I want to trust reviews came from real users of the product
Feature: FEAT-016 · Requirement: FR-012
- Given a user without a qualifying purchase/download, when they attempt to review a product, then the action is blocked.
- Given a qualifying user's review, when a creator responds, then the response is attached; when staff moderate a review, then the moderation action is audited.

## EPIC-12 Content (P1)

### STORY-017a — As a learner, I want structured tutorials and learning paths so I can build real skill, not just download assets
Feature: FEAT-017 · Requirement: FR-014
- Given an editor-published tutorial, learning path, or collection, when it is published, then it renders as an indexable, structured page.

## EPIC-13 Notifications (P1)

### STORY-018a — As a buyer, I want required transactional emails to always send, and optional ones to respect my preferences
Feature: FEAT-018 · Requirement: FR-013
- Given a required event (e.g., order receipt), when it occurs, then the email sends regardless of preference.
- Given an optional notification category, when a user has opted out, then that email is suppressed.

## EPIC-14 Admin

### STORY-019a — As an Admin, I want every sensitive action authorized and logged so misuse is detectable
Feature: FEAT-019 · Requirement: FR-015
- Given an admin action on a user, product, order, refund, entitlement, or content, when it is performed, then it is authorization-checked server-side and produces an immutable audit event including reason where required.

## EPIC-15 Privacy

### STORY-020a — As a user, I want to give or withdraw consent and request deletion of my data
Feature: FEAT-020 · Requirement: FR-004
- Given a user managing privacy settings, when they set consent choices, then the choice is recorded; when they submit a deletion request, then it is recorded and enters the deletion workflow.

## EPIC-16 SEO

### STORY-021a — As the business, I want every indexable page to carry correct metadata so organic search can find it
Feature: FEAT-021 · Requirement: FR-017
- Given an indexable page (product, category, collection, creator, learn), when it renders, then it emits a canonical URL, metadata, social preview tags, sitemap inclusion, and valid structured data where applicable.

## EPIC-17 Observability

### STORY-022a — As an on-call engineer, I want correlated logs/traces across web, worker, and webhooks so I can diagnose an incident fast
Feature: FEAT-022 · Requirement: NFR-007
- Given a request that spans web, worker, and a provider webhook, when it is traced, then all three carry the same correlation ID and SLIs (availability, latency, error rate, job lag, webhook failures, checkout failures, download-authorization failures, scan backlog) are recorded with runbook links on alert.

## EPIC-18 Accessibility

### STORY-023a — As a screen-reader or keyboard-only user, I want every core journey fully operable without a mouse
Feature: FEAT-023 · Requirement: NFR-001
- Given a core journey (browse, checkout, creator submission, moderation), when tested with keyboard-only navigation and a screen reader, then it passes the defined WCAG 2.2 AA gate with zero critical defects.

## EPIC-19 Support (P1)

### STORY-024a — As a Support agent, I want a case linked to the user's order and product version so I don't have to ask for context
Feature: FEAT-024 · Requirement: FR-018
- Given a new support case, when it is created, then it links to the requesting user, related product, order, and version, and tracks resolution status.

## EPIC-20 Launch

### STORY-025a — As the product owner, I want proof the full golden path works before general availability
Feature: FEAT-025 · Requirement: MVP Release
- Given all P0 Features complete, when the launch gate runs, then one free and one paid product complete their full path (discover → acquire/purchase → download), a restore exercise succeeds, and an incident tabletop is completed.
