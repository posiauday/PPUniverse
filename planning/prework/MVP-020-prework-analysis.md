# MVP-020 pre-work analysis — Consent and legal deletion workflow (FR-004)

Story instruction: "STORY INSTRUCTION — MVP-020 (FR-004, Consent and legal deletion workflow)", 2026-09-22, direct product-owner instruction. Originally pre-work only; **open questions 46, 47 and 48 were decided 2026-09-22** (direct product-owner instruction, "MVP-020 open questions 46, 47 and 48", recorded in `docs/final-decisions.md`) and implementation is now authorized for exactly the scope that decision and this document describe. Question 46 and 47 remain formally OPEN (a direction/interim default was approved, not a final answer); question 48 is CLOSED. Updates made to this document on closing: marked below wherever a proposal became a decision; nothing here was silently changed.

## State verified before starting

- `develop` at `de59003` (PR #8 merge commit — matches `gh pr list --state all`, all eight prior PRs MERGED, none open), no overlapping MVP-020 work found in the repo or any branch name.
- `feature/mvp-020-consent-deletion` created from `develop`. Never `main`.
- C: free space checked before any local command this round: **4.25GB** (`Get-PSDrive C`, 4,561,915,904 bytes free), above the 2GB threshold — local work authorized.
- Read in full this round: `docs/08-security-privacy-compliance.md` (17 lines — Threat priorities, Required controls, Privacy requirements, Marketplace trust, Security gates), `docs/open-questions.md` (all 62 lines, current through item 45), `planning/requirement-traceability.csv` FR-004 row, `planning/mvp-backlog.csv` MVP-020 row, `packages/db/prisma/schema/*.prisma` (every file — `catalog`, `entitlements`, `evidence`, `files`, `identity`, `schema`), `packages/domain/identity/src/*` and `packages/adapters/identity/src/*` file listings. `CLAUDE.md` and `docs/final-decisions.md` are held from having authored most of their recent entries this session; both were grep-checked this round for anything consent/deletion/admin-role-adjacent (`consent|deletion|erasure|gdpr|pipeda|ccpa|admin.*role|UserRole`) and nothing beyond what is cited below was found. `planning/progress-report.md` was not re-read in full (very large); the same grep confirms its only MVP-020-relevant content is MVP-002's own entry, cited below.

## Requirement IDs

- **FR-004** (`docs/02-prd.md`, "Activation" category, confirmed via `planning/requirement-traceability.csv`): consent capture and a deletion workflow. The traceability row already reads `MVP-002;MVP-020,"MVP-002: ... deny-by-default authorization. MVP-020 (consent/deletion) not started",Partially Implemented - MVP-002 Done; MVP-020 TBD` — MVP-002 owns the authorization half, MVP-020 owns the consent/deletion half.
- `planning/mvp-backlog.csv`: `MVP-020,Privacy,Consent legal deletion workflow,P0,Ready,FR-004,"Consent and deletion request are recorded",MVP-002`. The acceptance summary is narrow and literal: a request is **recorded**, not executed.
- **NFR-010** (data retention/deletion jobs configurable by data class) is explicitly named in `docs/open-questions.md` item 23 as only *partially* covered by MVP-020 — MVP-020 is "consent and deletion **requests**," not scheduled retention-by-data-class execution. This matches the story instruction's own scope boundary (automated erasure execution is OUT) and is not reopened here.

## Confirmed acceptance criteria

Directly from the backlog row and FR-004, nothing added: (1) a consent event can be captured and recorded, (2) a deletion request can be captured and recorded, with (implied by "workflow" and by the security/privacy doc's "audit trail" requirement) a lifecycle and an audit trail, and (3) an admin can see and action a deletion request. Everything else — what "consent" covers, what a deletion request actually *does* to data, how an admin is authorized — is addressed below, with anything requiring a product decision recorded in `docs/open-questions.md`.

## Scope boundary (restated, unchanged)

IN: consent capture, consent records with versioned policy references, consent withdrawal, a deletion **request** workflow with state, an audit trail, the admin surface needed to see/action requests. OUT (unless a decision says otherwise): automated erasure execution, scheduled retention jobs (NFR-010, item 23), data export, cookie-banner/analytics behaviour (FR-016 deferred), the operative text of any legal policy. If implementation appears to require building an erasure engine: **stop and ask** — this document does not propose one, and confirms below why the design does not need one to satisfy the acceptance criteria as written.

## Answers to the seven questions (required before any design)

### 1. Deletion versus append-only

**What a deletion request affects, as built by MVP-020: nothing.** No data is erased, anonymised or pseudonymised by this story — the acceptance criteria only require that a request be *recorded* and moved through a *reviewable state*. Actually erasing, anonymising or pseudonymising data is the erasure engine the scope boundary explicitly excludes.

That said, the question asks for a proposed model per data class, to record now with a safest default rather than decide unilaterally, because it materially shapes today's schema (FK `onDelete` behaviour, specifically):

- **Identity data** (`User`, `Account`, `Session`) — propose **pseudonymisation**, not hard erasure, as the eventual model. A hard `DELETE` on `User` would cascade into every FK that references it, and several already do (`Entitlement.userId` cascades today, per `planning/prework/MVP-010-prework-analysis.md`'s own flagged-not-decided remaining ambiguity #3) — destroying commerce and audit history that the deletion workflow itself needs to prove it acted correctly. Replacing identifying fields with an anonymised placeholder while keeping the row (and every FK pointing at it) intact avoids this.
- **Commerce/audit-adjacent data** (`Entitlement`, `Download`) — propose **retention under a stated lawful basis** (records necessary for entitlement/licensing history), not erasure. This is consistent with `Download` already being modelled as an append-only audit record (MVP-010).
- **The consent and deletion audit trail itself** (this story's own new tables) — propose **retention, unconditionally**. An audit trail that could be erased by the action it is recording would defeat its own purpose; `docs/06-data-model.md` and `CLAUDE.md` already establish "audit events are append-only" as a standing constraint.

**Consequence for today's schema:** the new tables this story adds (`ConsentRecord`, `DeletionRequest`, `DeletionRequestEvent`) should **not** cascade-delete on `userId` the way `Entitlement.userId` does — they should use `Restrict` (Postgres default `NO ACTION`), so a user row cannot be hard-deleted while these records reference it. This is a deliberate divergence from MVP-010's own precedent, not an inconsistency: MVP-010 built a commerce table before this question had been examined; MVP-020 is the story that examines it. MVP-010's own choice is not reopened here (out of scope, already flagged as its own remaining ambiguity) — only the new tables added by this story adopt the stricter default, with the divergence recorded so a future erasure-engine story does not need to rediscover it.

**DECIDED (2026-09-22, `docs/final-decisions.md`, "MVP-020 open questions 46, 47 and 48"):** the per-data-class model above is approved as the *recorded direction* for the future erasure story, not as a binding implementation decision — question 46 stays formally OPEN, blocked on question 47 (a jurisdiction decision may require erasure where pseudonymisation is proposed). The `Restrict`/`NO ACTION` FK choice on this story's own new tables **is** decided now, since it is schema being written in this story (see "Constraint and index plan" below).

### 2. Jurisdiction

Open questions 3 (countries/currencies/tax/refunds) and 5 (hosting region/data residency) are confirmed still open (`docs/open-questions.md`, read this round). Consent categories that must exist, retention periods, and deletion-request timelines all vary by regime (for example GDPR's "without undue delay, within one month," CCPA's 45-day figure) — none of which this project claims to comply with (the story instruction's compliance-claim prohibition, restated below).

**Proposed design:** timelines are **data, not hardcoded per-regime logic**. `DeletionRequest` carries no hardcoded "must complete by" constant tied to any named regime. If a target/operational timeline is wanted for internal tracking, it is a single configurable value (not a regime-specific rule engine), defaulting to a conservative, non-regime-attributed interval, described only as an internal operational target — never presented as a compliance deadline. Consent *categories* are modelled as an extensible enum (see question 3) rather than a jurisdiction-specific fixed list, so a jurisdiction decision later adds or removes categories without a schema rewrite.

**DECIDED (2026-09-22, `docs/final-decisions.md`, "MVP-020 open questions 46, 47 and 48"):** the interim default above (a single configurable operational-target value, no regime named or claimed anywhere) is approved; question 47 stays formally OPEN, blocked on items 3 and 5. The `TERMS_OF_SERVICE`/`MARKETING_EMAIL` consent-category proposal from question 3 below is also approved as the MVP set as part of this same decision.

### 3. Consent granularity

FR-016 (analytics) is confirmed deferred (`docs/open-questions.md` item 21, `planning/progress-report.md`'s MVP-022 entry) and has no owning story yet — there is nothing to attach an "analytics" consent category to today, so adding one now would describe a feature that doesn't exist.

**Proposed minimum set** (a `ConsentCategory` enum, extensible — adding a value later is one migration plus new rows, not a redesign):
- `TERMS_OF_SERVICE` — acceptance of the terms/privacy policy currently in effect. Framed as an **acceptance record** tied to using the service, not an optional consent a user can decline and keep using it.
- `MARKETING_EMAIL` — the one genuinely optional, opt-in/opt-out category, distinct from transactional email (sign-in links, entitlement confirmations), which needs no consent record because it is service-essential.

This is a proposal, not a blocking decision — low-stakes and reversible, matching how MVP-010's equivalent lower-stakes questions (test data conventions, license-tier scope) were answered directly rather than escalated. No `docs/open-questions.md` entry for this one; flagged instead under "Remaining ambiguities."

### 4. Policy versioning

This is a data-modelling question, not a legal/business one, so it is answered directly (no product decision needed to choose a *structure*).

**Proposed design:** a `PolicyVersion` reference table (`documentType`: `TERMS_OF_SERVICE` | `PRIVACY_POLICY`; `version`: a string; `effectiveAt`; `createdAt`; unique on `(documentType, version)`), holding **metadata about a version**, not the operative legal text. `ConsentRecord` references it by `policyVersionId` (nullable — `MARKETING_EMAIL` consent is not tied to a legal-document version the same way `TERMS_OF_SERVICE` acceptance is). This is how a historical consent stays interpretable after the policy text changes: "user accepted TERMS_OF_SERVICE version 2026-09-22" remains true and lookup-able regardless of what version is current later, without ever needing to store the text itself in this database.

### 5. Legal copy ownership

Confirmed and applied, not decided: no operative policy text is authored or generated as part of this story. Any UI surface referencing policy content uses a clearly marked placeholder (for example "Terms of Service — placeholder pending product-owner-approved text") or a link to wherever the real document will live, never invented or paraphrased legal language. `PolicyVersion` rows created for development/testing use an obvious placeholder `version` string, never presented as real. This is a stated operating constraint, not a question requiring a new `docs/open-questions.md` entry — flagged under "Remaining ambiguities" as something the product owner needs to supply before this surface can show real content.

### 6. Request lifecycle

**Proposed states:** `SUBMITTED` → `UNDER_REVIEW` → (`APPROVED` | `DENIED`); an `APPROVED` request separately reaches `COMPLETED` once whatever future story executes real erasure has run (MVP-020 itself never sets `COMPLETED` from its own logic — it only exists so a request has somewhere to land after execution happens elsewhere, avoiding a schema change when that story is built). `WITHDRAWN` is reachable from `SUBMITTED` or `UNDER_REVIEW` only (a `COMPLETED` or already-`DENIED` request cannot be withdrawn).

**Who transitions what:**
- The requesting user: creates a request (→ `SUBMITTED`), may withdraw their own pending request (`SUBMITTED`/`UNDER_REVIEW` → `WITHDRAWN`). Never anyone else's.
- An authorized admin: `SUBMITTED` → `UNDER_REVIEW`, `UNDER_REVIEW` → `APPROVED`/`DENIED` (a `DENIED` transition requires a recorded reason — matching this project's existing "destructive/consequential admin actions require reason capture" pattern), and `APPROVED` → `COMPLETED` once execution has actually happened elsewhere.

**What is recorded at each transition:** actor (`userId` of whoever caused it — the requester for self-service transitions, the admin for review transitions), the resulting state, a timestamp, and a reason where applicable (required for `DENIED`, optional elsewhere). Recorded as an **append-only event per transition** (`DeletionRequestEvent`), not a mutated status column — see "Proposed entities" below for why.

**A gap found while answering this, not assumed away:** the "admin surface needed to see and action requests" (explicitly in scope) requires *some* notion of an authorized admin. **No such role exists today** — `packages/db/prisma/schema/identity.prisma`'s `UserRole` enum has exactly one value, `MEMBER` (confirmed by direct read this round). Extending it is a change to MVP-002's completed schema, which the do-not-implement list says needs explicit sign-off before touching ("stop and ask first").

**DECIDED (2026-09-22, `docs/final-decisions.md`, "MVP-020 open questions 46, 47 and 48"):** add `ADMIN` to the existing `UserRole` enum — approved, limited to that one additive value, nothing else in MVP-002's schema touched. An allowlist/interim mechanism was explicitly rejected; deferring the admin surface entirely was also explicitly rejected. Binding constraints carried into implementation: no application code path ever grants `ADMIN` (a manual, documented, un-tooled operator action against the database only); tests create an admin directly under the reserved-prefix pattern; every admin surface is deny-by-default and server-role-checked, giving a `MEMBER` the same response as an unauthenticated request; every admin transition records actor/timestamp/reason; `ADMIN` is coarse-grained by design and implies no other admin capability elsewhere in the product. `docs/open-questions.md` item 48 is now CLOSED.

### 7. Authentication of the requester

Answered directly from this project's own established, proven pattern (MVP-002's session model, applied identically by MVP-010's entitlement route and MVP-023's Q40 precedent: no test bypass, no relaxed check, ever) — no new product decision needed.

A consent or deletion-request action is always taken as `session.user.id` from a real, server-verified session (`getServerSession(authOptions)`); the route or server action never accepts a target user ID as client input. This is what prevents a request being made on someone else's behalf: there is no parameter to spoof, because the acting user is derived entirely server-side from the authenticated session, exactly like MVP-010's `POST /api/products/[slug]/entitlement`.

## Proposed entities and fields

New schema file `packages/db/prisma/schema/privacy.prisma`, matching this repository's established multi-file convention.

### `PolicyVersion`
| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | No | |
| `documentType` | `PolicyDocumentType` enum (`TERMS_OF_SERVICE`, `PRIVACY_POLICY`) | No | |
| `version` | `String` | No | Opaque identifier (date or semantic version), not the document text |
| `effectiveAt` | `DateTime` | No | |
| `createdAt` | `DateTime @default(now())` | No | |

Cardinality: `@@unique([documentType, version])`. Metadata only — no legal text stored (question 5).

### `ConsentRecord`
| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | No | |
| `userId` | `String` | No | FK → `User`, `onDelete: Restrict` (see question 1) |
| `category` | `ConsentCategory` enum (`TERMS_OF_SERVICE`, `MARKETING_EMAIL`) | No | Extensible; question 3 |
| `granted` | `Boolean` | No | A withdrawal is a **new row** with `granted: false`, never a mutation of an earlier row |
| `policyVersionId` | `String?` | Yes | FK → `PolicyVersion`; nullable per question 4 |
| `recordedAt` | `DateTime @default(now())` | No | |
| `createdAt` | `DateTime @default(now())` | No | |

Cardinality: **many rows per (`userId`, `category`)**, append-only — the current state for a category is the row with the latest `recordedAt`. No unique constraint (a unique constraint would prevent the append-only withdraw-by-new-row model). `@@index([userId, category, recordedAt])` for "what is the user's current state" lookups.

### `DeletionRequest`
| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | No | |
| `userId` | `String` | No | FK → `User`, `onDelete: Restrict` |
| `createdAt` | `DateTime @default(now())` | No | |

Deliberately near-empty and **never updated after creation** — no `status` column. Current state is derived from the latest `DeletionRequestEvent` for this request, not stored redundantly, so nothing about this row is ever mutated (the instruction's explicit immutability requirement). `@@index([userId])`.

### `DeletionRequestEvent`
| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | No | |
| `deletionRequestId` | `String` | No | FK → `DeletionRequest`, `onDelete: Restrict` |
| `toState` | `DeletionRequestState` enum (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `DENIED`, `WITHDRAWN`, `COMPLETED`) | No | |
| `actorUserId` | `String` | No | FK → `User`, `onDelete: Restrict` — the requester for self-service transitions, the admin for review transitions |
| `reason` | `String?` | Yes | Required by application logic for `DENIED`; optional elsewhere |
| `occurredAt` | `DateTime @default(now())` | No | |
| `createdAt` | `DateTime @default(now())` | No | |

Cardinality: **many rows per `DeletionRequest`**, strictly append-only — this *is* the audit trail (question 6). `@@index([deletionRequestId, occurredAt])` for reconstructing history in order.

## Constraint and index plan

- `policy_versions`: `@@unique([documentType, version])`.
- `consent_records`: `@@index([userId, category, recordedAt])`.
- `deletion_requests`: `@@index([userId])`.
- `deletion_request_events`: `@@index([deletionRequestId, occurredAt])`.
- FK `onDelete`: **`Restrict`/`NO ACTION`** on every `userId`/`actorUserId`/`deletionRequestId`/`policyVersionId` reference in this story's new tables — a deliberate divergence from `Entitlement.userId`'s existing `Cascade` (MVP-010), reasoned in question 1. Not proposing a change to MVP-010's own table (out of scope; already flagged there as its own unresolved ambiguity).
- No `CHECK` constraints beyond Prisma's column types; the `DENIED`-requires-`reason` rule is application-level (the state-transition function), matching how this repository has handled conditional business rules elsewhere (no precedent for encoding this class of rule in SQL).

## RLS statements

Following the established, unconditional convention (every table gets RLS enabled with zero policies in the same migration that creates it):

```sql
ALTER TABLE "policy_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deletion_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deletion_request_events" ENABLE ROW LEVEL SECURITY;
```

## Hand-written migration plan

One migration, `<timestamp>_add_privacy`, generated via `prisma migrate dev --create-only` from the new `.prisma` file, then hand-reviewed to add the four `ENABLE ROW LEVEL SECURITY` statements above (Prisma's schema language cannot express RLS — the same reason every prior migration in this repo hand-edits it in). Purely additive — no existing table is altered, no data migration, fully reversible (`DROP TABLE` all four, in reverse dependency order: `deletion_request_events`, `deletion_requests`, `consent_records`, `policy_versions`). If the admin-role gap (question 6 / open question 48) is resolved by extending `UserRole`, that is a second, separate migration touching an existing table — kept isolated from this additive one, matching MVP-010's own stated plan for its (unexercised) second-migration case.

## Authorization model

- Every consent/deletion-request action requires a real, database-backed session (`getServerSession(authOptions)`) — no session, `401`. Matches MVP-002/MVP-010 exactly.
- **Self-service actions are server-enforced as self-only**: a user can create/withdraw only their own `DeletionRequest`, and can only ever write `ConsentRecord` rows with `userId = session.user.id`. No route or server action accepts a target user ID as a parameter for these actions (question 7).
- **Admin actions (DECIDED 2026-09-22, open question 48 CLOSED):** `UNDER_REVIEW`/`APPROVED`/`DENIED`/`COMPLETED` transition routes require `session.user.role === "ADMIN"`, checked server-side on every request. `ADMIN` is a new `UserRole` enum value (additive only — see "Repository and query changes" and the migration plan); no application code path ever assigns it — it is granted only by a documented, manual, un-tooled operator action directly against the database. A `MEMBER` (or unauthenticated) caller receives the identical response an admin route would give a non-existent resource — no information about the surface's existence is disclosed to a non-admin. Every admin transition records `actorUserId`, `occurredAt` and, for `DENIED`, a required `reason` (see "Proposed entities").
- Reason, actor and timestamp are recorded on every state-changing event (`DeletionRequestEvent`), satisfying "record reason/actor/timestamp" for admin actions once they exist.

## Repository and query changes

New packages, following the established domain/adapter split (`packages/domain/entitlements` + `packages/adapters/entitlements`, MVP-010, is the closest and most recent precedent):
- `packages/domain/privacy` — pure logic: valid state transitions (`isValidTransition(from, to, actorRole)`), whether a reason is required (`DENIED`), which `ConsentCategory` values exist. No Prisma dependency, matching every other domain package's independence from adapters.
- `packages/adapters/privacy` — the concrete Prisma repository: `recordConsent`, `getCurrentConsent(userId)` (latest row per category), `createDeletionRequest`, `appendDeletionRequestEvent`, `getDeletionRequestWithHistory(userId)`. Modelled on `packages/adapters/entitlements/src/entitlement-repository.ts`'s shape and its `*.integration.test.ts` pattern (real Postgres, `describe.skipIf(!hasDatabase)`).

## UI surface

None exists today — confirmed by grep: no `consent`/`Consent`/`terms` text anywhere in `apps/web/app/signin` or `apps/web/app/account` (empty result). Proposing a new `/account/privacy` page (kept separate from `/account/sessions`, which is MVP-002's own scope, untouched):

- **Consent section:** current `TERMS_OF_SERVICE` acceptance shown display-only ("Accepted version X on [date]" or a not-yet-accepted state if none exists yet — see "Remaining ambiguities" on how a first acceptance record is created without touching MVP-002's sign-in flow); `MARKETING_EMAIL` as a togglable control that creates a new `ConsentRecord` row on each change (never mutates a prior one).
- **Deletion section:** a "Request account deletion" control when the user has no active request; once submitted, a status display reflecting the latest event (`SUBMITTED`/`UNDER_REVIEW`/`DENIED` with its reason/`COMPLETED`) and a "Withdraw request" control while withdrawable.
- Required states for the accessibility gate (explicit in the story instruction, restated so none is missed): empty (no consent/request history yet), loading, error, denied (signed-out visitor redirected to sign-in, matching the existing pattern), pending-request, already-requested (a second submission attempt while one is pending is rejected, not silently duplicated).
- Accessible-by-default controls matching this codebase's established pattern (MVP-010's `FreeDownloadControl`): a plain `<button type="button">` (no field to collect for withdrawal/deletion-request actions, so no native-form-submission surface), `aria-disabled` not `disabled` while submitting, `role="status"` outcome regions.
- **Admin surface (DECIDED 2026-09-22):** a new `/admin/deletion-requests` page, visible and functional only to `session.user.role === "ADMIN"` (server-checked); anyone else gets the same treatment as a non-existent route. Lists pending requests (latest event per request), with controls to move a request `SUBMITTED → UNDER_REVIEW`, and `UNDER_REVIEW → APPROVED`/`DENIED` (a required reason field for `DENIED`) and `APPROVED → COMPLETED`. Follows the same server-enforced, accessible pattern as every other authenticated surface in this codebase (plain accessible controls, `aria-disabled` while submitting, `role="status"` outcome regions) — no separate design principle needed for it.

## Security impact

- No new secret, credential or connection-string surface.
- Deny-by-default, server-enforced authorization on every action (self-only for users; admin actions require `session.user.role === "ADMIN"`, checked server-side, never inferred from the client — see "Authorization model"). No application code path ever grants `ADMIN`; it is a manual, documented, un-tooled operator action against the database only.
- **Data minimisation:** the schema above captures only `userId`, category/state, timestamps, an optional `reason` string, and a reference to a policy-version identifier — no IP address, user agent or device data anywhere, matching the story instruction's explicit prohibition and the same minimisation stance MVP-010 already established for `Download`.
- RLS enabled on all four new tables from their first migration, zero policies, matching every table in this schema.
- Immutability enforced at the application layer (no `UPDATE` statement is ever issued against `ConsentRecord`, `DeletionRequest`, or `DeletionRequestEvent` rows by this story's repository code) and reinforced by the `Restrict` FK choice, which prevents the one operation (`User` hard-deletion) that could otherwise silently destroy this trail.
- **No compliance claim anywhere** — code, docs, UI copy, telemetry event names and commit messages describe only what is recorded and done (e.g., "a deletion request was submitted and is under review"), never GDPR/PIPEDA/CCPA/any regulatory compliance, certification or endorsement. This is carried into the do-not-implement restatement below and will be checked directly against the committed UI copy in the security review, the same way every prior review in this project re-verified claims against actual code rather than the plan.

## Accessibility impact

- The new `/account/privacy` page and its controls join `packages/e2e/src/pages.ts`'s `GATED_PAGES` inventory as new states (not an exclusion entry — the route-coverage guard, `route-coverage.test.ts`, must see this as a real gated page like every other authenticated surface MVP-010/MVP-023 added).
- Every new state listed under "UI surface" above needs its own explicit assertion proving it reached the intended condition (MVP-010's `product-free-idle` lesson: a silent pass-through does not fail even under fixture contamination, defeating the point of the coverage).
- `role="status"` outcome regions follow the exact BUG-005/BUG-006 pattern already fixed under MVP-023 — not a new pattern.
- Given the worker-scoped-fixture lesson from MVP-010 (two real CI failures caused by non-idempotent/self-colliding fixture helpers across repeated widths), any new `packages/e2e/src/seed.ts` helper that mutates state for this story (e.g., submitting a deletion request, withdrawing consent) must either be idempotent or have a dedicated reset/isolated-fixture-row counterpart, exactly like `grantEntitlement`/`resetEntitlement` — planned from the start this time, not discovered after a CI failure.

## Telemetry

Following the established `@ppu/telemetry` pattern (`withObservability` for request-scoped logs; explicit `logger.info` for domain events, no product analytics): `consent.recorded` (`userId`, `category`, `granted`, `policyVersionId`), `deletion_request.submitted` (`userId`, `deletionRequestId`), `deletion_request.state_changed` (`deletionRequestId`, `toState`, `actorUserId` — never the reason text, to avoid free-text content in structured logs). No IP/user-agent fields, matching data minimisation above.

## Test plan

- **Unit** (`packages/domain/privacy`): state-transition validity (every allowed/forbidden pair), the `DENIED`-requires-reason rule, consent-category enumeration — pure functions, no database.
- **Integration** (Vitest, real Postgres, `describe.skipIf(!hasDatabase)`, reserved-prefix rows created and cleaned up by the test): consent recorded then withdrawn produces two rows, not a mutation; `getCurrentConsent` returns the latest row per category; a deletion request's full lifecycle (submit → withdraw, and submit → review states) produces the expected append-only event sequence; a `User` row cannot be hard-deleted while a `ConsentRecord`/`DeletionRequest` references it (proves the `Restrict` FK choice).
- **Route/API:** unauthenticated request rejected (401); a user cannot submit/withdraw a request or consent action for another `userId` (no such parameter exists to attempt this with, but the test proves the route ignores/rejects any attempt to do so via a manipulated request body); a second submission while one is already pending is rejected, not duplicated (already-requested state).
- **Accessibility** (Playwright, existing gate, no new tooling): every state listed under "UI surface" at the existing four widths and three engines.

## Exact files expected to change

**New:**
- `packages/db/prisma/schema/privacy.prisma`
- `packages/db/prisma/migrations/<timestamp>_add_privacy/migration.sql`
- `packages/domain/privacy/package.json`, `src/index.ts`, `src/transitions.ts`, `src/transitions.test.ts`, `src/types.ts`
- `packages/adapters/privacy/package.json`, `src/index.ts`, `src/privacy-repository.ts`, `src/privacy-repository.integration.test.ts`
- `apps/web/app/account/privacy/page.tsx` and its route handlers/server actions under `apps/web/app/api/account/consent/route.ts` and `apps/web/app/api/account/deletion-requests/route.ts` (exact shape to be confirmed at implementation time, matching whichever this repo's existing convention favours — not decided here)
- `apps/web/app/admin/deletion-requests/page.tsx` and `apps/web/app/api/admin/deletion-requests/[id]/route.ts` (or equivalent) — the admin surface, now decided (question 48)
- `packages/ui/src/consent-control.tsx`, `packages/ui/src/deletion-request-control.tsx`, `packages/ui/src/admin-deletion-request-control.tsx` (or equivalent names)
- New states in `packages/e2e/src/pages.ts`, plus fixture helpers in `packages/e2e/src/seed.ts` (including a database-created `ADMIN` fixture user, reserved-prefix, matching decision 48's constraint 3)

**Modified:**
- `planning/requirement-traceability.csv` (FR-004 row, on completion)
- `docs/open-questions.md` (items 46-48, added this round; 46/47 updated with the approved direction/interim default and left open, 48 closed)
- `packages/db/prisma/schema/identity.prisma` — one additive `UserRole` enum value, `ADMIN` (decision 48, limited to exactly this change, in its own migration separate from the additive `privacy.prisma` tables).

## Remaining ambiguities (not resolved here)

1. **How is the first `TERMS_OF_SERVICE` acceptance record created?** MVP-002's sign-in flow captures no terms checkbox today (confirmed by grep — empty result), and this story is not authorized to modify MVP-002's completed behaviour without a decision. Two non-exclusive options, neither decided here: (a) the `/account/privacy` page becomes where a signed-in user's *first* acceptance is captured, lazily, the first time they visit it (no MVP-002 change needed — proposed as the safer default since it touches nothing completed); (b) a future story adds a checkbox to sign-in itself (a genuine MVP-002 change, needing its own approval). Flagged, not decided.
2. ~~Consent-category list~~ (question 3) — **APPROVED 2026-09-22** as `TERMS_OF_SERVICE` + `MARKETING_EMAIL` (part of the question 47 decision), see above.
3. **Exact route/action shape** (dedicated route handlers vs. server actions) — an implementation choice, not a product decision; this repo has precedent for both, and the choice is deferred to implementation time, matching how MVP-010 left the same question open in its own pre-work.
4. **Real policy text** — needed from the product owner before `/account/privacy` can show anything beyond a placeholder (question 5); not something this story can supply.

## Open questions recorded

Three items in `docs/open-questions.md` (46-48), decided 2026-09-22 (`docs/final-decisions.md`, "MVP-020 open questions 46, 47 and 48"):
- **46** — deletion-versus-append-only per-data-class treatment model (question 1). Direction approved (pseudonymise identity data, retain commerce/audit data, always retain the audit trail); **stays formally OPEN**, blocked on 47. The `Restrict` FK consequence for this story's schema is decided.
- **47** — jurisdiction-dependent consent categories/timelines, blocked on already-open items 3 and 5 (question 2). Interim default approved (configurable operational-target value, no regime named); **stays formally OPEN**, blocked on 3 and 5. Consent categories (`TERMS_OF_SERVICE`/`MARKETING_EMAIL`) approved as the MVP set.
- **48** — the admin-role gap. **CLOSED**: `ADMIN` added to `UserRole`, limited to the one additive value, with the binding constraints recorded above and in `docs/final-decisions.md`.

## Do-not-implement list (restated, unchanged)

MVP-007, 008, 009, 011, 012, 013, 017, 018; TD-004, 005, 006, 008, 009, 010; BUG-002; PROP-001 to PROP-006; pricing; Offer structured data; analytics (FR-016); creator and collections routes; compatibility workflow; search-behaviour changes; the per-product sign-in policy field deferred in MVP-010; promoting `develop` to `main`. No modification to completed MVP-001/002/003/004/005/006/010/021/022/023 behaviour beyond what an approved decision in question 1 requires — flagged above as not required by anything decided so far. No gate check weakened, skipped, quarantined or conditionally excluded; the accessibility self-check stays permanent and unconditional. BUG-014 stays open, monitor-only, permanently instrumented — not touched. **No claim of GDPR, PIPEDA, CCPA or any regulatory compliance anywhere — code, docs, UI, metadata or commit messages. Describe what the system records and does, nothing more.**

## Implementation authorized (2026-09-22)

Open questions 46, 47 and 48 decided (46 and 47 partially — direction/interim default approved, both remain formally open; 48 fully closed); implementation authorized on `feature/mvp-020-consent-deletion` for exactly the scope this document and `docs/final-decisions.md`'s "MVP-020 open questions 46, 47 and 48" entry describe, and nothing else. See `planning/progress-report.md` for the implementation record as it proceeds.
