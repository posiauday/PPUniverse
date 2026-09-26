# MVP-019 pre-work analysis — Operations console and audit (FR-015, NFR-009)

Read-only analysis. **No code, schema, migration, route, or UI changed by this document.** Written on its own branch (`feature/mvp-019-operations-console-prework`, isolated worktree) from merged `develop` (head `adf486b`, the same commit PR #23 merged into). Not authorized as an implementation plan — the safest-reversible-defaults below are recommendations for product-owner confirmation, not decisions, per `CLAUDE.md`'s Decision Validation Rule and this session's own established pre-work pattern (see `planning/prework/MVP-014-prework-analysis.md` for the precedent this mirrors).

Picked because it is the next genuinely unblocked story: `planning/mvp-backlog.csv` shows `MVP-019` depends only on `MVP-012` (Done); it does not depend on `MVP-014` (currently in QA, PR #24 open).

## 1. Requirement source, read directly

- `planning/mvp-backlog.csv`, MVP-019 row: Epic `Admin`, Requirement `FR-015`, Priority `P0`, Status `Backlog`, Acceptance summary `"Sensitive actions are authorized and auditable"`, Depends on `MVP-012`.
- `docs/02-prd.md`: **FR-015** — "Admins can manage users, ~~creators~~ (moot under first-party-only), taxonomies, products, orders, refunds, entitlements, reviews, content, feature flags and audit logs."
- `docs/02-prd.md`: **NFR-009** — "Destructive admin actions require reason capture and audit logging."
- `docs/06-data-model.md`, "Operations" section: `SupportCase`, `AuditEvent`, `FeatureFlag`, `JobRecord`, `WebhookReceipt`, `AnalyticsEvent` — all six are **named placeholders, none built**. Confirmed by grep: none of these six identifiers appear in any `packages/db/prisma/schema/*.prisma` file.
- `docs/final-decisions.md`, "MVP-014 immutable published releases," section 1: **direct confirmation, already recorded**, that MVP-019 (not MVP-014) owns the Product `suspended`/`archived` lifecycle states from `docs/09-marketplace-operations.md`'s four-state model (draft, published, suspended, archived).
- `docs/final-decisions.md`, "First-party-only publishing model," section 7: MVP-019's acceptance criterion is confirmed unaffected by the first-party-only reversal; the "creators" entry in FR-015's list becomes moot without changing MVP-019's own scope.

## 2. The core problem: FR-015's entity list is far broader than what exists to manage

FR-015 lists eleven categories of things an admin manages. Checked directly against the current schema and backlog, only some of them have anything to manage yet:

| FR-015 entity | Backing model exists? | Owning story | Buildable in MVP-019 today? |
|---|---|---|---|
| Users | `User` (MVP-002) | — | Yes — read/list already implicit in existing admin auth checks; no dedicated admin user-management UI exists yet |
| ~~Creators~~ | N/A | moot (first-party-only) | N/A |
| Taxonomies | `Category`, `Tag` (MVP-003) | — | Partially — categories exist; no admin CRUD UI for them exists yet |
| Products | `Product` (MVP-003/012) | MVP-012 (Done) | **Yes — suspend/archive, per the already-recorded decision** |
| Orders | `Order` — **does not exist** | MVP-007 (Ready, gated by open questions 3/7) | **No** |
| Refunds | `Refund` — **does not exist** | MVP-007/008 (not started) | **No** |
| Entitlements | `Entitlement` (MVP-010) | — | Partially — revoking exists as a schema field (`revokedAt`) but no code path sets it yet (confirmed in MVP-010's own record) |
| Reviews | `Review`/`ReviewVote` — **do not exist** | MVP-016 (Backlog, depends on MVP-009, not started) | **No** |
| Content | `Article` (MVP-017, Done) | — | Already has its own admin surface (`/admin/content`); nothing new needed here |
| Feature flags | `FeatureFlag` — **does not exist** | **no story owns this anywhere in the backlog** | **No** |
| Audit logs | No unified `AuditEvent` table; three separate per-domain event tables exist (`DeletionRequestEvent`, `ArticlePublishEvent`, `ReleasePublishEvent`) | — | **Yes — this is the real, buildable core of MVP-019** |

**Conclusion, not invented — read directly off the backlog:** roughly two-thirds of FR-015's literal entity list has no backing model yet and is owned by stories that haven't started (MVP-007, MVP-008, MVP-016) or aren't owned by anything (feature flags). Building MVP-019 "fully" against FR-015's literal text today would mean inventing `Order`, `Refund`, `Review`, and `FeatureFlag` scope that belongs to other stories — exactly the kind of scope creep `CLAUDE.md` says not to do ("Never invent requirements").

## 3. What MVP-019 can honestly build right now

Two things, both already grounded in existing, real infrastructure:

### 3a. Product suspend/archive (confirmed scope, `docs/final-decisions.md`)
Adds `SUSPENDED` and `ARCHIVED` to `ProductStatus` (currently `DRAFT | PUBLISHED` only). This is the one piece of `docs/09-marketplace-operations.md`'s four-state lifecycle not yet built. Needs:
- Schema: extend the `ProductStatus` enum (additive — Postgres allows adding enum values; no destructive change).
- Domain: valid-transition rules. Candidate transitions to confirm with the product owner (not decided here): `PUBLISHED → SUSPENDED` (a published product temporarily hidden from public listing/detail, but not deleted — existing entitlement holders' access is a separate, unresolved question, see open question below), `SUSPENDED → PUBLISHED` (reinstate), `PUBLISHED → ARCHIVED` and `SUSPENDED → ARCHIVED` (permanent retirement), with `ARCHIVED` likely terminal (no transition out, to be confirmed). `DRAFT → SUSPENDED`/`DRAFT → ARCHIVED` are almost certainly meaningless (nothing published to suspend) and should probably be rejected — flagged as an open question, not assumed.
- A reason is required for `SUSPENDED` and `ARCHIVED` specifically (NFR-009, "destructive admin actions require reason capture") — mirroring `DeletionRequestEvent.reason` (`String?`, required by application logic for `DENIED`, optional otherwise), not a NOT NULL column (the same reasoning applies here: different actions need the field with different strictness, so the constraint has to live in application logic, not the schema).
- Public query impact: `findPublishedProductBySlug`/category-browse/search all already filter on `status: "PUBLISHED"` (confirmed pattern from MVP-004/MVP-021) — a `SUSPENDED` or `ARCHIVED` product should fall out of those automatically, **if** the filter is `status: "PUBLISHED"` and not `status: { not: "DRAFT" }` anywhere. This needs to be verified against the actual current query code before implementation, not assumed from the pattern.

### 3b. A unified admin audit-log view (the actual "audit logs" half of FR-015)
Three append-only, per-domain event tables already exist and already satisfy "audit events are append-only" (`docs/06-data-model.md`, "Critical constraints"): `DeletionRequestEvent` (MVP-020), `ArticlePublishEvent` (MVP-017), `ReleasePublishEvent` (MVP-014, pending merge). A real design question, **not decided here**: does MVP-019 build one new unified `AuditEvent` table that every future sensitive action writes to going forward (the `docs/06-data-model.md` placeholder's literal reading), or does it build a read-only admin view that queries and merges the existing per-domain tables (no new table, no migration of old data, no dual-write risk)?

**Recommended default (reversible, not decided):** the read/merge approach. Reasoning: a new unified table would need every existing writer (`DeletionRequest`'s admin actions, `Article`'s publish action, `Release`'s publish action) to *also* write to it, which either means touching three already-shipped, already-tested code paths (real risk of regressing shipped behavior for a reporting-only feature) or accepting that the new table only covers *future* actions from the day it ships, leaving a confusing gap for anything that happened before. A read/merge view has neither problem and is trivially reversible (delete the view code, the underlying tables are untouched) — if a real per-write-path need for a single physical table emerges later (e.g., cross-domain querying at a scale where three separate queries become a real performance problem), that's an additive migration at that point, not a redesign.

## 4. What must NOT be invented in this story

- No `Order`, `Refund`, `Review`, `ReviewVote`, or `FeatureFlag` model or admin surface — none has an owning, started story.
- No admin user-management UI (ban/suspend a `User`, change a `User.role`) unless directly authorized — FR-015 says "manage users" but no acceptance criterion or open question currently specifies what that means concretely (role changes are a `CLAUDE.md`-level security-sensitive decision: "No application code path grants `ADMIN`" is an existing hard rule from MVP-020's own authorization; a `User`-management UI that could grant/revoke `ADMIN` would need its own explicit decision, not an assumption made here).
- No taxonomy (`Category`/`Tag`) admin CRUD UI unless directly authorized — currently seeded as reference data only (`docs/13-implementation-readiness-plan.md`: "Seed data: only reference/lookup data").
- No `Entitlement.revokedAt`-setting code path unless directly authorized — the column exists and is enforced at read time (MVP-010), but no story has yet been asked to build the write path, and doing so here would be inventing FR-015 scope from a related-but-different requirement.
- No `SupportCase`, `JobRecord`, `WebhookReceipt`, or `AnalyticsEvent` model — all remain out of scope (owned by MVP-024, TD-004-adjacent job-queue work, MVP-007/008, and explicitly-deferred product analytics respectively).

## 5. Authorization

Reuses the existing `ADMIN` role exactly as `/admin/content`, `/admin/products`, and `/admin/deletion-requests` already do — deny-by-default, re-queried server-side per request, no new role. No `AUDITOR`, `SUPPORT`, or other new role is implied by anything read so far.

## 6. Open questions this analysis surfaces (not answered here)

1. Exact `ProductStatus` transition graph for `SUSPENDED`/`ARCHIVED` (which transitions are valid, whether `ARCHIVED` is terminal, whether `DRAFT` can go directly to either).
2. What happens to an existing `Entitlement` holder's download access when their product is suspended or archived — a real customer-facing consequence, not decided by anything read in this pass.
3. Whether "manage users" in FR-015 means anything more than what already exists (nothing yet) for MVP-019 specifically, or is entirely out of scope until a later story.
4. Whether the audit-log view is read/merge (recommended default above) or a new unified `AuditEvent` table.
5. Whether a reason is mandatory for every `SUSPENDED`/`ARCHIVED` transition or only some of them (mirroring `DeletionRequestEvent`'s per-action-value strictness).

## 7. Non-goals (explicit)

Orders, refunds, reviews, feature flags, support cases, job records, webhook receipts, analytics events, any new role, any `User.role` mutation path, any taxonomy admin UI.

## 8. Dependency and sequencing note

MVP-019 does not depend on MVP-014 and can proceed while PR #24 (MVP-014) is in review. If MVP-014 merges first, MVP-019's audit-log view would include `ReleasePublishEvent` as a fourth source table; if MVP-019 is implemented first, `ReleasePublishEvent` simply isn't available to merge in yet and can be added to the view later (additive, not a redesign) — this ordering does not block either story.

## 9. Likely files (implementation, not started)

- `packages/db/prisma/schema/catalog.prisma` — `ProductStatus` enum extension.
- `packages/domain/catalog/src/product.ts` — transition validators, new error types.
- `packages/adapters/catalog/src/catalog-repository.ts` — `suspendProduct`/`archiveProduct` (or similar) methods.
- New route(s) under `apps/web/app/api/admin/products/[id]/...`.
- New admin surface, likely `apps/web/app/admin/audit/` for the log view, reading `DeletionRequestEvent`/`ArticlePublishEvent`/`ReleasePublishEvent` (and `ReleasePublishEvent` once MVP-014 merges).
- `packages/e2e/src/pages.ts`/`seed.ts` — new accessibility states for both surfaces.

## 10. Recommendation

Confirm sections 3a/3b's proposed scope and the five open questions in section 6 with the product owner before writing any implementation code, per the Decision Validation Rule. This document takes no other action — nothing is implemented, no branch other than this pre-work branch is touched, no PR is opened.
