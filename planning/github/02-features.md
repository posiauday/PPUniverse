# GitHub Features

One Feature issue per row of `planning/mvp-backlog.csv`. Each is created as a GitHub issue labeled `type:feature`, `epic:<name>`, `priority:<Pn>`, `requirement:<id>`, and linked to its parent Epic ("Part of: #EPIC-NN") and to its dependency Features ("Depends on: #...").

Format: `FEAT-<MVP-ID> — <Story title>`

---

### FEAT-001 — Repository and CI baseline
Epic: EPIC-01 Foundation · Priority: P0 · Requirement: NFR-007 · Depends on: None
Acceptance summary: Build, lint, type, test and scan run in CI.

### FEAT-002 — Account registration and session
Epic: EPIC-02 Identity · Priority: P0 · Requirement: FR-004 · Depends on: FEAT-001
Acceptance summary: Verified account can sign in/out and manage sessions.

### FEAT-003 — Taxonomy and catalog pages
Epic: EPIC-03 Catalog · Priority: P0 · Requirement: FR-001 · Depends on: FEAT-001
Acceptance summary: Indexable category and product listing pages render.

### FEAT-004 — Search filter sort and zero results
Epic: EPIC-03 Catalog · Priority: P0 · Requirement: FR-002 · Depends on: FEAT-003
Acceptance summary: Filters are shareable, accessible and analytically tracked.

### FEAT-005 — Product detail evidence model
Epic: EPIC-03 Catalog · Priority: P0 · Requirement: FR-003 · Depends on: FEAT-003
Acceptance summary: All required license/version/support/compatibility fields display.

### FEAT-006 — Quarantine scan and private storage
Epic: EPIC-04 Files · Priority: P0 · Requirement: FR-007 · Depends on: FEAT-001
Acceptance summary: Unscanned or rejected file cannot be delivered.

### FEAT-007 — Checkout session
Epic: EPIC-05 Commerce · Priority: P0 · Requirement: FR-006 · Depends on: FEAT-002, FEAT-005
Acceptance summary: Price is server-derived and checkout is idempotent.

### FEAT-008 — Verified webhook fulfillment
Epic: EPIC-05 Commerce · Priority: P0 · Requirement: FR-006 · Depends on: FEAT-007
Acceptance summary: Signature and duplicate event tests pass.

### FEAT-009 — Authorized signed downloads
Epic: EPIC-06 Entitlements · Priority: P0 · Requirement: FR-007 · Depends on: FEAT-006, FEAT-008
Acceptance summary: Only entitled users receive expiring URL.

### FEAT-010 — Free entitlement flow
Epic: EPIC-06 Entitlements · Priority: P0 · Requirement: FR-005 · Depends on: FEAT-002, FEAT-006
Acceptance summary: Policy creates entitlement and download record.

### FEAT-011 — Creator application
Epic: EPIC-07 Creator · Priority: P0 · Requirement: FR-008 · Depends on: FEAT-002
Acceptance summary: Applicant accepts agreement and enters review.

### FEAT-012 — Product and release editor
Epic: EPIC-07 Creator · Priority: P0 · Requirement: FR-009 · Depends on: FEAT-006, FEAT-011
Acceptance summary: Draft validates all mandatory submission fields.

### FEAT-013 — Submission review queue
Epic: EPIC-08 Moderation · Priority: P0 · Requirement: FR-010 · Depends on: FEAT-012
Acceptance summary: Reviewer can approve/request changes/reject with reason.

### FEAT-014 — Immutable published releases
Epic: EPIC-09 Publishing · Priority: P0 · Requirement: FR-011 · Depends on: FEAT-013
Acceptance summary: Published files cannot be replaced.

### FEAT-015 — Library orders and saved items
Epic: EPIC-10 Account · Priority: P1 · Requirement: FR-013 · Depends on: FEAT-009
Acceptance summary: User can access entitled products and preferences.

### FEAT-016 — Verified reviews and replies
Epic: EPIC-11 Reviews · Priority: P1 · Requirement: FR-012 · Depends on: FEAT-009
Acceptance summary: Only qualifying users can review; moderation exists.

### FEAT-017 — Tutorials collections learning paths
Epic: EPIC-12 Content · Priority: P1 · Requirement: FR-014 · Depends on: FEAT-003
Acceptance summary: Editor can publish indexable structured content.

### FEAT-018 — Transactional email and preferences
Epic: EPIC-13 Notifications · Priority: P1 · Requirement: FR-013 · Depends on: FEAT-002
Acceptance summary: Required messages send and optional messages respect preference.

### FEAT-019 — Operations console and audit
Epic: EPIC-14 Admin · Priority: P0 · Requirement: FR-015 · Depends on: FEAT-013
Acceptance summary: Sensitive actions are authorized and auditable.

### FEAT-020 — Consent legal deletion workflow
Epic: EPIC-15 Privacy · Priority: P0 · Requirement: FR-004 · Depends on: FEAT-002
Acceptance summary: Consent and deletion request are recorded.

### FEAT-021 — Metadata sitemap canonical structured data
Epic: EPIC-16 SEO · Priority: P0 · Requirement: FR-017 · Depends on: FEAT-005
Acceptance summary: Indexable pages emit valid metadata and sitemap.

### FEAT-022 — Logs traces metrics and alerts
Epic: EPIC-17 Observability · Priority: P0 · Requirement: NFR-007 · Depends on: FEAT-001
Acceptance summary: Critical journeys have correlation and runbooks.

### FEAT-023 — Manual and automated accessibility gate
Epic: EPIC-18 Accessibility · Priority: P0 · Requirement: NFR-001 · Depends on: FEAT-003
Acceptance summary: Core journeys meet defined WCAG gate.

### FEAT-024 — Support case workflow
Epic: EPIC-19 Support · Priority: P1 · Requirement: FR-018 · Depends on: FEAT-019
Acceptance summary: Case links to user/product/order/version.

### FEAT-025 — End-to-end launch gate
Epic: EPIC-20 Launch · Priority: P0 · Requirement: MVP Release · Depends on: All P0 Features
Acceptance summary: Free and paid golden paths, restore and incident tests pass.
