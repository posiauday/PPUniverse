# Implementation Readiness Plan

Status: planning artifact, no application code. Produced after reading `docs/01` through `docs/12`, `planning/mvp-backlog.csv`, `planning/requirement-traceability.csv`, all ADRs, and `schemas/product-metadata.schema.json`, per `CLAUDE.md`. Scope is the approved MVP only (`docs/02-prd.md` MVP release acceptance, `planning/mvp-backlog.csv`). No requirements are invented; ambiguities are recorded in `docs/open-questions.md`.

## 1. Repository implementation architecture

Modular monolith (ADR 001) expressed as a monorepo with two runtime apps sharing domain packages, mirroring the TRD's domain list: Identity, Catalog, Content, Commerce, Entitlements, Creator, Moderation, Reviews, Search, Notifications, Analytics, Administration.

- **`apps/web`** — Next.js app (App Router). Route handlers implement `docs/07-api-contracts.md`; server components render SEO pages (product, category, collection, creator, learn) per NFR-004; client components handle interactive filters, uploader, checkout, moderation panel.
- **`apps/worker`** — background job processor (BullMQ consumers) for webhook processing, email sending, search indexing, malware scanning, media processing, notification fan-out. Runs the same domain packages as `apps/web` so business rules are not duplicated.
- **`packages/domain/<name>`** (one per TRD domain) — pure domain types, invariants and use cases (e.g., `domain/entitlements` owns "download requires active entitlement or explicit free-product policy"). No framework or vendor imports.
- **`packages/adapters/<concern>`** (identity, payments, storage, scanning, search, email, error-monitoring) — implement ADR 003. Each adapter package exports a narrow interface plus a fake/in-memory implementation used in tests and local dev.
- **`packages/db`** — Prisma schema (multi-file, one file per domain per ADR 004), generated client, seed scripts.
- **`packages/ui`** — design-token-driven component library implementing `docs/05-ux-design-system.md` core components.
- **`packages/config`** — typed, validated environment configuration (fails fast on missing/malformed env vars; never reads secrets into logs, per NFR-006).
- **`packages/telemetry`** — correlation ID propagation, structured logging, tracing/metrics helpers, audit-event emission helper (append-only per data model constraint).
- **`packages/shared`** — error envelope (`code`, `message`, `fieldErrors`, `correlationId`, `retryAfter`), pagination helpers, permission-check helpers.

Each domain package owns its authorization rules; API route handlers call use cases, never touch Prisma directly, so authorization cannot be bypassed by a route that forgets a check (NFR-002 deny-by-default).

## 2. Final technology decision record

See `docs/adr/004-technology-decision-record.md`. Summary: pnpm + Turborepo monorepo, Next.js/TypeScript, PostgreSQL + Prisma, Auth.js OIDC adapter, Stripe, S3-compatible storage adapter, BullMQ + Redis, Postgres full-text search adapter, GitHub Actions CI/CD. Vendor identity, storage region, email vendor, scanning vendor and error-monitoring vendor remain open decisions (open questions 4, 5, 9, plus new items in Section 9 below) but are isolated behind adapters so they do not block MVP-001.

## 3. Monorepo folder structure

```
/
├── apps/
│   ├── web/                      # Next.js app: routes, server components, API handlers
│   │   ├── app/                  # App Router: (public)/, (account)/, (creator)/, (admin)/
│   │   ├── app/api/               # route handlers matching docs/07-api-contracts.md
│   │   └── middleware.ts         # session check, CSP headers, correlation ID injection
│   └── worker/                   # BullMQ consumers: webhooks, email, scan, index, media
├── packages/
│   ├── domain/
│   │   ├── identity/  catalog/  content/  commerce/  entitlements/
│   │   ├── creator/   moderation/  reviews/  search/  notifications/
│   │   └── analytics/ administration/
│   ├── adapters/
│   │   ├── identity/  payments/  storage/  scanning/  search/  email/  error-monitoring/
│   ├── db/                       # prisma/schema/*.prisma, migrations/, seed/
│   ├── ui/                       # design-system components, tokens
│   ├── config/                   # env schema + typed accessors
│   ├── telemetry/
│   └── shared/                   # error envelope, pagination, permission helpers
├── docs/                         # existing (unchanged by this plan)
├── planning/                     # existing (unchanged by this plan)
├── schemas/                      # existing product-metadata schema, extend here only
├── .github/
│   ├── workflows/                # ci.yml, deploy-preview.yml, deploy-staging.yml, deploy-prod.yml
│   └── ISSUE_TEMPLATE/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Rule: nothing inside `apps/*` imports another app; all sharing goes through `packages/*`. This is the extraction seam ADR 001 requires for future service extraction.

## 4. Database implementation plan

- **Schema organization**: one Prisma schema file per domain under `packages/db/prisma/schema/`, entities exactly as named in `docs/06-data-model.md` (Identity/organization, Catalog, Versioning and files, Commerce, Creator and marketplace, Engagement and content, Operations). Naming and fields must not exceed what the data model document lists — no speculative columns.
- **Constraints to encode at the schema level** (from the data model's "Critical constraints"): unique `Product.slug`, unique `CreatorProfile.handle`, unique `PaymentEvent.providerEventId` (webhook idempotency), `Entitlement` has exactly one non-null source reference (order line, admin grant, or subscription) enforced via a CHECK constraint or application-layer invariant plus DB constraint, `AuditEvent` has no update/delete grants at the application DB role level (append-only), `ReleaseFile` rows are never updated after a release publishes — corrections insert a new `Release`.
- **Migrations**: Prisma Migrate, expand/migrate/contract pattern per `docs/12-devops-runbook.md`. Every migration reviewed for reversibility before merge; destructive migrations require an explicit rollback script and sign-off, matching the release-blocker "data-loss migration" rule in the test strategy.
- **Seed data**: only reference/lookup data — categories, tags, license definitions, roles/permissions, initial feature flags. No fabricated products, creators, or reviews (README hard rule: "no fake marketplace inventory, fabricated reviews").
- **Data classification enforcement**: columns holding Confidential/Restricted data (profiles, orders, support cases, agreements) get explicit comments in schema and are excluded from any lower-environment copy job; Restricted data (credentials, payment secrets) is never modeled in Prisma at all — it lives only with the payment/identity providers, consistent with the data model's classification note.
- **Query boundaries**: every collection query goes through a shared pagination helper (`packages/shared`) that enforces bounded page size, satisfying the TRD quality requirement and the test-strategy release blocker on unbounded public queries.

## 5. Authentication and authorization plan

- **Authentication**: Auth.js with a generic OIDC provider adapter (ADR 004). Sessions are database-backed (not JWT-only) so they can be revoked server-side, satisfying "secure session management" in `docs/08-security-privacy-compliance.md`. MFA is delegated to the OIDC provider when available (open question 4 decides which provider).
- **Authorization model**: role-based with per-domain permission checks, deny-by-default (NFR-002).
  - Roles: Guest, Member, Creator, Moderator, SupportAgent, Admin. A user may hold multiple roles (e.g., Member + Creator).
  - Every mutating use case in `packages/domain/*` declares the roles/ownership conditions it requires (e.g., "product update requires Creator role AND ownership of the product OR Admin role"). This check runs in the domain layer, not in UI or route handlers, so it cannot be bypassed by adding a new entry point.
  - Object-level authorization (broken object authorization is threat #2 in the security doc) is enforced by always re-deriving the resource owner from the database inside the use case, never trusting a client-supplied owner/role claim.
- **Admin step-up**: destructive/high-risk admin actions (suspend, takedown, refund, entitlement grant) require a fresh authentication check (re-auth or provider-supported step-up) plus mandatory reason capture, per NFR-009 and the security doc's "admin step-up authentication where supported."
- **Session/CSRF**: secure, `HttpOnly`, `SameSite` cookies; CSRF defense on state-changing form posts; safe-redirect validation on OIDC callback and post-login redirect targets (open redirect is a common OIDC integration bug and is explicitly called out in the TRD quality requirements).
- **Authorization matrix**: before any API route is implemented, produce a matrix of `{route, method, required role(s), ownership condition}` covering every endpoint in `docs/07-api-contracts.md`. This matrix is the security gate named in `docs/08-security-privacy-compliance.md` ("authorization matrix before API build") and should live as a reviewed artifact (e.g., a table in the PR for MVP-002) rather than only in code.

## 6. Marketplace file-security plan

Implements ADR 002 and FR-007/FR-009/FR-011, backing MVP-006, MVP-009, MVP-012, MVP-014.

1. **Upload**: creator uploads through a pre-signed upload URL into a private quarantine bucket/prefix. Client never gets a public URL. Declared file type, size limit, and archive nesting depth are validated both client-side (fast feedback) and server-side (authoritative) before the upload URL is issued.
2. **Detection**: on upload completion (webhook or polling), the worker verifies the *detected* type (magic bytes) matches the *declared* type, rejects mismatches immediately, and rejects archives exceeding the configured depth/size (defends against archive bombs, a named threat).
3. **Scan**: `ScanAdapter` runs the file through the scanning engine. `FileScan` status transitions exactly as modeled: `uploaded → quarantined → scanning → clean | rejected` (`overridden` reserved for a documented manual moderator override with audit trail, never used to bypass a `rejected` verdict silently).
4. **Release gating**: a `ReleaseFile` can only be attached to a published `Release` if its `FileScan.status = clean`. MVP-014 (immutable published releases) enforces that once published, files are never replaced in place — a fix ships as a new `Release`.
5. **Delivery**: downloads are never served from a public path. At download request time (`POST /api/products/{id}/download`), the server re-checks the caller's entitlement, then issues a short-lived signed URL from the adapter and records a `Download` row. No signed URL is generated ahead of request time or cached client-side beyond its short TTL, preventing signed-URL leakage (named threat) from being useful after expiry.
6. **Documentation content**: `ProductDocument` and any Markdown/HTML documentation fields are sanitized on render (stored-XSS is a named threat) — sanitize on write and encode on output, not one or the other.
7. **Test coverage required before creator beta** (security gate in `docs/08`): oversized file, type-mismatch file, nested-archive bomb, EICAR-style test file for the scan adapter, expired-signed-URL reuse, and unauthorized-download attempts against another user's entitlement.

## 7. GitHub issue and project-board setup plan

This is a plan for the user (or an authorized automation) to execute — creating issues/boards is a visible, side-effectful GitHub action and is not performed by this session without explicit confirmation.

- **Issues**: one issue per `planning/mvp-backlog.csv` row (MVP-001…MVP-025). Issue body includes the row's Epic, Requirement ID(s), Acceptance Summary, and Dependencies, plus a checklist mirroring the CLAUDE.md "before coding" statement (requirement IDs, acceptance criteria, affected files, migration impact, security impact, test plan).
- **Labels**: `priority:P0` / `priority:P1`; `epic:<epic-name>` (Foundation, Identity, Catalog, Files, Commerce, Entitlements, Creator, Moderation, Publishing, Account, Reviews, Content, Notifications, Admin, Privacy, SEO, Observability, Accessibility, Support, Launch); `requirement:<FR-xxx|NFR-xxx>`; `type:security` where the story touches a named threat.
- **Milestones**: group by the wave sequence in Section 8 — `M1 Foundation`, `M2 Trust Core Loop` (catalog → checkout → entitlement → download), `M3 Creator & Moderation Loop`, `M4 Account, Reviews & Content` (P1), `M5 Launch Gate`.
- **Project board columns**: Backlog, Ready (dependencies satisfied), In Progress, In Review, Blocked, Done. "Ready" is only entered once an issue's Dependencies column in the CSV shows all-closed issues.
- **Automation**: PR template requires a linked issue and the requirement ID; "Closes #NNN" auto-closes the issue on merge; a status check blocks merge if the PR template's requirement-ID field is empty, keeping the traceability CSV enforceable rather than aspirational.
- **Prerequisite**: this plan assumes a GitHub remote will be added to the repository (none is configured yet per `git status`); creating it is also an explicit-permission action.

## 8. Story execution sequence

Derived by topologically sorting `planning/mvp-backlog.csv` dependencies, grouped into waves that can run in parallel within a wave. P0 stories are required for MVP-025 (launch gate); P1 stories are shown in their dependency position but are not launch blockers.

| Wave | Stories | Notes |
|---|---|---|
| 1 | MVP-001 | Repo/CI baseline. Nothing else can start without it. |
| 2 | MVP-002, MVP-003, MVP-006, MVP-022 | Identity, catalog pages, file quarantine pipeline, and observability foundation can proceed in parallel once CI exists. |
| 3 | MVP-004, MVP-005, MVP-010, MVP-011, MVP-017 (P1), MVP-018 (P1), MVP-020, MVP-023 | Search/filter and product-detail build on catalog; free-entitlement flow only needs accounts + file pipeline; creator application and consent/deletion only need accounts; accessibility gate begins once catalog pages exist. |
| 4 | MVP-007, MVP-012, MVP-021 | Checkout needs accounts + product-detail evidence fields; product/release editor needs the file pipeline + creator application; SEO metadata needs product-detail fields. |
| 5 | MVP-008, MVP-013 | Webhook fulfillment needs checkout; moderation queue needs a submittable product/release. |
| 6 | MVP-009, MVP-014, MVP-019 | Signed downloads need scan pipeline + verified webhook fulfillment; immutable publishing and the admin console need moderation to exist. |
| 7 | MVP-015 (P1), MVP-016 (P1), MVP-024 (P1) | Library/orders and reviews need working entitlements; support case workflow needs the admin console. |
| 8 | MVP-025 | Launch gate: exercised only after every P0 story above is done. |

This sequence keeps the "one free and one paid product complete the end-to-end path" MVP release acceptance criterion reachable as early as Wave 6, leaving Waves 7 and the P1 stories in Wave 3 as parallelizable rather than blocking.

## 9. Missing decisions and risks

**Unresolved decisions to add to `docs/open-questions.md`** (technical decisions surfaced by this planning pass, distinct from the 12 business/product questions already recorded):

13. Final monorepo tooling confirmation (Turborepo vs. Nx) — recommended default is Turborepo (ADR 004); revisit only if team tooling preference differs.
14. Redis/queue hosting: managed vs. self-hosted, and its region, once hosting region (open question 5) is decided.
15. Malware-scanning vendor and its cost model (ties to open question 9).
16. Whether PostgreSQL Row-Level Security should supplement application-layer authorization as defense-in-depth, or whether app-layer checks alone are the accepted MVP posture.
17. GitHub repository visibility, branch protection rules, and required status checks for the issue/PR automation in Section 7.
18. Error-monitoring/APM vendor selection, including any data-residency constraint tied to open question 5.
19. Whether the chosen email vendor has EU/data-residency constraints tied to open question 5.
20. CI time/cost budget for the full suite (unit + integration + E2E + accessibility) and how it affects PR feedback latency.

**Risks** (new, in addition to the BRD's existing risk register):
- *Adapter-interface drift*: if adapter interfaces are defined loosely before a real vendor is chosen, the first real integration may force a breaking interface change. Mitigate by writing adapter interfaces against the *behavior* described in the TRD/security doc (e.g., "issues a short-lived signed URL", "verifies webhook signature") rather than any vendor's SDK shape.
- *Prisma multi-file schema is a preview feature* (Section "Final technology decision record") — could destabilize; fallback documented in ADR 004.
- *CI cost/time creep* from running unit + integration + E2E + accessibility + security scans on every PR could slow delivery; needs a budget decision (open question 20) before MVP-001 finalizes its CI workflow.
- *Search fairness*: the IA doc requires ranking not secretly favor paid products and requires labeled sponsored placement — but MVP scope has no sponsored-placement feature approved. Flag this as a constraint to honor (do not silently build ranking that favors paid items) rather than a feature to build.
- *Cold-start inventory* (already in BRD risks) directly affects whether MVP-025's "one free and one paid product complete the end-to-end path" can be satisfied with real, non-fabricated inventory — ties to open question 10.

## 10. Readiness recommendation for MVP-001

**Recommendation: ready to start**, with the following conditions satisfied by this plan rather than by further waiting:

- MVP-001 requires only NFR-007 (build/lint/type/test/scan run in CI) and has no dependencies — it does not require any of the still-open business decisions (product name, jurisdictions, identity provider, hosting region, license model, payout model, file-type policy, inventory readiness, analytics consent scope, support targets).
- All vendor-specific concerns (identity, storage, email, scanning, error monitoring) are isolated behind adapters (Section 1, ADR 004), so the CI baseline can build, lint, type-check, test, and scan the repository using fake/in-memory adapter implementations without real vendor secrets.
- Placeholder naming: proceed with a working repository/package name; do not surface it as the product's public name until open question 1 (trademark clearance) resolves.
- Before writing MVP-001 code, follow the CLAUDE.md pre-coding statement: requirement ID (NFR-007), acceptance criteria (from the backlog row), affected files (new — this is the first slice), migration impact (none — no schema yet), security impact (establishes secret-scanning and dependency-scanning gates that every later slice relies on), and test plan (a CI workflow that fails intentionally on a lint error, a type error, a failing test, and a known-vulnerable dependency, to prove each gate actually blocks).
- Proceed to `/architecture-gate` and then `/vertical-slice` for MVP-001 as `README.md` prescribes, using the folder structure in Section 3 and the technology decisions in `docs/adr/004-technology-decision-record.md`.
