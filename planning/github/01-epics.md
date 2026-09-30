# GitHub Epics

One Epic per Epic column in `planning/mvp-backlog.csv`. Each Epic is created as a GitHub issue labeled `type:epic`, `epic:<name>`, and tracks its child Features via GitHub's native sub-issues/task list ("Tracks: #...").

Format: `EPIC-<NN> — <Name>`

---

### EPIC-01 — Foundation
**Business objective (BRD §3):** Establish trust and reliability groundwork before any user-facing capability ships.
**Description:** Repository, CI/CD, and quality gates that every later Feature depends on.
**Features:** MVP-001
**Priority:** P0

### EPIC-02 — Identity
**Business objective:** Let users register and authenticate so personalized/paid experiences are possible (PRD FR-004).
**Description:** Account registration, sign-in/out, session management.
**Features:** MVP-002
**Priority:** P0

### EPIC-03 — Catalog
**Business objective:** Acquire users through indexable, high-intent technical pages (BRD §3).
**Description:** Taxonomy, category/product listing pages, search/filter/sort, and the product-detail evidence model (license, version, compatibility, support).
**Features:** MVP-003, MVP-004, MVP-005
**Priority:** P0

### EPIC-04 — Files
**Business objective:** Prevent malicious uploads from ever reaching a user (Security doc threat priorities).
**Description:** Private storage, quarantine, and malware scanning pipeline for all marketplace uploads.
**Features:** MVP-006
**Priority:** P0

### EPIC-05 — Commerce
**Business objective:** Convert qualified users through paid products (BRD §3).
**Description:** Server-derived, idempotent checkout and signature-verified, idempotent webhook fulfillment.
**Features:** MVP-007, MVP-008
**Priority:** P0

### EPIC-06 — Entitlements
**Business objective:** Guarantee only paying/authorized users ever receive a download (BRD §7 business rules).
**Description:** Signed, expiring, authorized downloads for both paid and free products.
**Features:** MVP-009, MVP-010
**Priority:** P0

### EPIC-07 — ~~Creator~~ First-Party Publishing (reworded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model")
**Business objective:** ~~Build supply-side trust and onboarding (BRD §3, §4 stakeholders).~~ Enable an authorized administrator to author and publish first-party products.
**Description:** ~~Creator application/agreement flow and the product/release editor creators use to submit inventory.~~ The product/release editor (MVP-012) an administrator uses to author and publish inventory directly. FEAT-011 (Creator application) is superseded — see below.
**Features:** ~~MVP-011,~~ MVP-012
**Priority:** P0

### EPIC-08 — Moderation (superseded in its third-party form, same decision)
**Business objective:** ~~Ensure quality and safety before anything publishes (PRD journey 4).~~ Superseded — quality/safety gates are redistributed to their existing owning mechanisms (MVP-006 file scan, TD-006/TD-008 compatibility/licence checks, MVP-014 release immutability), not this epic.
**Description:** ~~Submission review queue with evidence, decisions, and reasons.~~ Superseded — presumed a third-party submitter distinct from the reviewer, which does not exist under first-party-only.
**Features:** ~~MVP-013~~ (Superseded)
**Priority:** P0

### EPIC-09 — Publishing
**Business objective:** Preserve buyer trust in purchased versions (BRD §7).
**Description:** Immutable published releases; corrections always create a new version.
**Features:** MVP-014
**Priority:** P0

### EPIC-10 — Account
**Business objective:** Create repeat usage through saved assets and accessible purchase history (BRD §3).
**Description:** Library, orders, and saved items for signed-in users.
**Features:** MVP-015
**Priority:** P1

### EPIC-11 — Reviews
**Business objective:** Build catalog trust signal from verified users only (PRD FR-012).
**Description:** Ratings/reviews restricted to qualifying interactions, with creator replies and staff moderation.
**Features:** MVP-016
**Priority:** P1

### EPIC-12 — Content
**Business objective:** Acquire and retain users through technical learning content (BRD §3).
**Description:** Tutorials, learning paths, comparison pages, and curated collections.
**Features:** MVP-017
**Priority:** P1

### EPIC-13 — Notifications
**Business objective:** Keep users informed without over-messaging (PRD FR-013).
**Description:** Transactional email plus preference-respecting optional messages.
**Features:** MVP-018
**Priority:** P1

### EPIC-14 — Admin
**Business objective:** Give operations staff safe, auditable control (PRD FR-015).
**Description:** Operations console covering users, creators, taxonomies, products, orders, refunds, entitlements, reviews, content, feature flags, and audit logs.
**Features:** MVP-019
**Priority:** P0

### EPIC-15 — Privacy
**Business objective:** Meet lawful-basis, consent, and deletion obligations (Security/Privacy doc).
**Description:** Consent capture and account deletion request workflow.
**Features:** MVP-020
**Priority:** P0

### EPIC-16 — SEO
**Business objective:** Acquire organic, high-intent traffic (BRD §3).
**Description:** Canonical URLs, metadata, social preview, sitemap inclusion, structured data on every indexable page.
**Features:** MVP-021
**Priority:** P0

### EPIC-17 — Observability
**Business objective:** Detect and resolve incidents before they affect trust (TRD observability section).
**Description:** Correlation IDs, SLIs, alerting linked to runbooks.
**Features:** MVP-022
**Priority:** P0

### EPIC-18 — Accessibility
**Business objective:** Meet WCAG 2.2 AA as a hard product requirement, not an afterthought (NFR-001).
**Description:** Automated and manual accessibility gate across core journeys.
**Features:** MVP-023
**Priority:** P0

### EPIC-19 — Support
**Business objective:** Resolve buyer/creator issues with full context (PRD FR-018).
**Description:** Support case workflow linked to user, product, order, and version.
**Features:** MVP-024
**Priority:** P1

### EPIC-20 — Launch
**Business objective:** Prove the MVP release-acceptance criteria end to end before general availability (PRD "MVP release acceptance").
**Description:** Free and paid golden-path validation, restore exercise, incident tabletop.
**Features:** MVP-025
**Priority:** P0 (gate)
