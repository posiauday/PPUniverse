# MVP-014 pre-work analysis — Immutable published releases (FR-011)

Read-only planning analysis. No implementation, route, UI, schema, migration,
or test is created by this document. Per direct product-owner instruction
("STORY INSTRUCTION — MVP-014 IMMUTABLE PUBLISHED RELEASES," 2026-09-25):
pre-work first, stop for review before any code.

## 1. Verified repository state

Read directly from `develop` at the authoritative merge commit
`adf486b6cfdbabe898f4a5ccb18c2962bbbde38d` (PR #23, MVP-012), on a fresh
branch (`feature/mvp-014-immutable-releases-prework`) branched from it — not
reusing the MVP-012 branch. Board state confirmed: Done 14, Superseded 2,
Ready 1, Backlog 8, Total 25 (`planning/status.md`). `planning/mvp-backlog.csv`
confirms `MVP-012,...,Done,FR-009,...`. MVP-011/MVP-013 confirmed
`Superseded`, not `Done`. No open PRs; no other branch or process using this
checkout; disk free 59GB.

**`MVP-014`'s own row, verified directly** (`planning/mvp-backlog.csv`):
`MVP-014,Publishing,Immutable published releases,P0,Backlog,FR-011,"Published
files cannot be replaced",MVP-012`. **FR-011's exact text**
(`docs/02-prd.md`): *"Product releases are immutable after publication;
corrections create another version."* **Traceability row**
(`planning/requirement-traceability.csv`): `FR-011,Trust,Data
model/ADR-002,MVP-014,Publish immutability test,TBD` — status `TBD`, not yet
Implemented.

This is a narrower literal scope than the instruction's own section 4 list of
19 candidate items — see section 4 below for why most of those items are
*not* read as automatically belonging to MVP-014 just because they sound
release-related.

## 2. Decision and requirement sources

Everything below is sourced from exactly one of: `docs/final-decisions.md`,
`docs/open-questions.md`, `docs/02-prd.md`/`docs/06-data-model.md`/`docs/09-
marketplace-operations.md` (approved docs), the actual merged code (PR #23),
or this session's direct instructions. Anything not traceable to one of these
is labeled **proposed default**, **open question**, or **out of scope** per
the instruction's own labeling rule — never silently treated as decided.

## 3. Functionality already delivered by MVP-012

Verified by direct code read at the merge commit, not assumed from any prior
summary:

- `packages/adapters/catalog/src/catalog-repository.ts`'s
  `publishProductWithRelease(productId, releaseId)`: one transaction,
  re-validates Product (exists, DRAFT), Release (belongs to product,
  unpublished, has a fresh-verified CLEAN file), and Product-level mandatory
  fields, then publishes both with the same timestamp or neither.
- `attachReleaseFile`/`detachReleaseFile` both reject an already-published
  release (`ReleaseAlreadyPublishedError`, via a shared
  `loadMutableReleaseOrThrow` check) and are both scoped to the caller's
  `productId` (cross-product access rejected).
- `createRelease` has no product-status gate — a `PUBLISHED` product can
  already receive further `DRAFT` releases today.
- `findPublishedProductDetailBySlug`: `releases: { where: { publishedAt: {
  not: null } }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  take: 1 }` — draft releases are already excluded from the public query, and
  exactly one deterministic release is already selected (tie-broken by
  `createdAt`).
- No route or method exists anywhere to change `Release.version` or clear
  `Release.publishedAt` once set — not merely blocked, structurally absent.
- `FileScanStatus`'s state machine (`packages/domain/files/src/
  state-machine.ts`) already has `CLEAN: []` — no outgoing transition, so
  CLEAN's terminality is a pre-existing MVP-006 invariant, not something
  MVP-012 or MVP-014 need to (re-)establish.

**Conclusion**: FR-011's literal text — *"immutable after publication;
corrections create another version"* — is **already substantially delivered**
by MVP-012. What remains for MVP-014 is narrower than the instruction's
19-item list might suggest; section 4 classifies each item precisely rather
than assuming.

## 4. Exact remaining MVP-014 scope

| Item | Classification | Source / reasoning |
|---|---|---|
| Publication of a subsequent draft release | **Already Delivered by MVP-012** | `createRelease` has no status gate (section 3) |
| Selection of the new current published release | **Requires Product-Owner Decision** | No mechanism exists to publish a *second* release for an already-published product — `publishProductWithRelease` requires the Product to be `DRAFT` (`ProductNotDraftError` otherwise). Publishing v1.1 after v1.0 needs a **new** transition MVP-014 must define (section 6) — not built, not decided in detail |
| Preservation of all earlier published releases | **Already Delivered by MVP-012** | Nothing deletes a `Release` row; `onDelete: Cascade` only fires if the parent `Product` itself is deleted, which no route does |
| Immutable release metadata (version, publishedAt) | **Already Delivered by MVP-012** | Section 3 |
| Immutable release-file membership | **Already Delivered by MVP-012** | Section 3 |
| Immutable version identifiers | **Already Delivered by MVP-012** | No version-edit route exists |
| Release publication events (audit) | **Explicitly Required by MVP-014** | No `ProductPublishEvent`/`ReleasePublishEvent` model exists anywhere (verified by direct grep — zero matches). Only structured `logger.info("product.published", ...)` telemetry exists, the same MVP-017 precedent-substitute already used project-wide pending MVP-019's persisted `AuditEvent`. See section 12 |
| Release rollback semantics | **Out of Scope** | FR-011 says corrections create *another* version, not that an earlier one can be un-published or reactivated as current. No source approves rollback |
| Product-level current-version derivation | **Already Delivered by MVP-012** | The `take: 1` query, section 3 — though it only ever has one published release to select from today; multi-release selection is the "Requires Product-Owner Decision" item above |
| Release ordering | **Already Delivered by MVP-012** (for the current single-published-release case) | `orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]` already gives a stable secondary order |
| Release retirement | **Requires Product-Owner Decision** | No `ProductStatus`/`Release` field for this exists. See section 8 |
| Customer eligibility for newer releases | **Out of Scope** (commercial) | Blocked on questions 3/7 per direct instruction; see section 9 |
| Entitlement-to-release relationships | **Owned by Another Story** | `Entitlement` is explicitly product-scoped, not release-scoped (`entitlements.prisma`'s own comment: *"covers every past and future release of the product, not one version of it"* — a direct, already-recorded MVP-010 decision, Q45). MVP-014 does not need to change this |
| Download eligibility by release | **Owned by Another Story** | MVP-009 (signed downloads, not yet built) — `SignedDownloadGrant` is explicitly named in `files.prisma`'s own header as unbuilt, "MVP-014 and later," but the actual download-authorization logic is MVP-009's FR-007 scope, not FR-011's |
| Release changelog history | **Requires Product-Owner Decision** | `ChangelogEntry` is named in `files.prisma`'s header comment as belonging to "MVP-014 and later" — but this is a code comment's aspiration, not an approved acceptance criterion; FR-011's own text says nothing about changelogs. Flagged, not assumed |
| Checksums or integrity metadata | **Out of Scope** | No source (FR-011, `docs/06-data-model.md`, any ADR) mentions checksums. Would need a new decision |
| Superseding a release without modifying it | **Requires Product-Owner Decision** | Same gap as "selection of the new current published release" above — this *is* what "corrections create another version" means in FR-011, but the mechanism isn't designed yet (section 6) |
| Correcting a defective published release | **Requires Product-Owner Decision** | See section 8 |
| Emergency product withdrawal | **Requires Product-Owner Decision** | See section 8 — `docs/09-marketplace-operations.md` already names "suspended"/"archived" as the intended future lifecycle states, but no story currently owns building them |
| Security response for a compromised release | **Requires Product-Owner Decision** | Same as above — no existing mechanism, no owning story |

## 5. Release immutability definition

**Already enforced, verified against merged code (Category A — mutating a
published release, rejected):** version, `publishedAt`, product association
(no route reassigns a `Release.productId`), and release-file associations
(both attach and detach reject a published release). File identity itself is
immutable by construction — `ReleaseFile`'s `onDelete: Restrict` on
`fileScan` means a referenced `FileScan` cannot be deleted while attached,
and no route replaces one attached file with another in place.

**Not modeled at all today (neither immutable nor mutable, because the
concept doesn't exist yet):** file *ordering* within a release (no ordinal
column on `ReleaseFile`), a compatibility-evidence *snapshot* (compatibility
records are product-scoped, not release-scoped — a product's compatibility
claims can still change after a release is published, since
`CompatibilityRecord` has no `releaseId` and no immutability rule ties it to
a specific release), a licence *snapshot* (same — `ProductLicense` is
product-scoped, mutable independent of any release), support/update
metadata (no such model exists), checksums (section 4), and audit history
(section 12 — nothing to make immutable yet because nothing is recorded).

**This is a genuine, material finding, not a minor gap**: because
compatibility and licence data are product-scoped rather than
release-scoped, a buyer who purchased "the product as it was described when
they bought release 1.0" has no guarantee that the compatibility/licence
information shown today still describes what they bought, once a later
release ships. FR-011 only requires *release files/version* to be immutable
— it says nothing about evidence snapshots — so this is recorded as an
**open question**, not assumed in or out of scope.

**Distinguishing the five operations the instruction names:**
- **A. Mutating a published release** — already prevented (section 3).
- **B. Publishing a new release that supersedes an earlier one** — not yet
  possible at all (`publishProductWithRelease` requires DRAFT); this is
  MVP-014's core remaining mechanism (section 6).
- **C. Removing a product from public sale** — no mechanism exists
  (`ProductStatus` has only `DRAFT`/`PUBLISHED`); `docs/09-marketplace-
  operations.md` already names "suspended"/"archived" as the intended
  future states but no story owns building them (section 8).
- **D. Preventing new downloads for a security issue** — no download
  authorization exists yet at all (MVP-009 not built), so there is nothing
  to gate yet; this is not MVP-014's mechanism to build ahead of MVP-009.
- **E. Deleting historical records** — never proposed anywhere in this
  document; the safest-default recommendation in section 8 explicitly
  preserves history.

## 6. Subsequent-release publication model (design only, not built)

The instruction's 10-step workflow (v1.1 after v1.0) is **not currently
possible** — `publishProductWithRelease`'s own `ProductNotDraftError` check
means an already-`PUBLISHED` product cannot go through the *initial*-
publication transaction again. MVP-014 needs a **second, distinct**
transaction — call it `publishSubsequentRelease` or similar (naming, not
decided) — with its own guard: Product must be `PUBLISHED` (not `DRAFT`),
selected Release must belong to the product and be unpublished, same
CLEAN-file and mandatory-field re-validation as the initial path. This is
new code, not a generalization of the existing method, because the two
methods' preconditions on `Product.status` are opposite (`DRAFT` required vs.
`PUBLISHED` required) — collapsing them into one method risks exactly the
"blanket `Product.status === PUBLISHED` means no more releases" mistake the
instruction explicitly warns against.

**Mechanism assessment — does this need a new field?**
- `Release.publishedAt` (existing) is **sufficient** to answer "is this
  release published" and, combined with the existing `orderBy: [{
  publishedAt: "desc" }, { createdAt: "desc" }], take: 1` query, is also
  **sufficient** to answer "which published release is current" — as long as
  only one release is ever published per product without an approved
  promotion/demotion policy. Publishing release 1.1 (setting its
  `publishedAt`) automatically makes it "current" under the existing query,
  with release 1.0 remaining a real, preserved, still-published-but-no-
  longer-current row.
- A `currentReleaseId` pointer on `Product` is **not proven necessary** by
  anything read in this pass — the deterministic `ORDER BY` already gives an
  unambiguous answer without one, and adding a pointer would be a second
  source of truth that could drift from the timestamp-derived answer. Per
  the instruction's own "do not introduce a pointer... unless proven
  necessary," this is **not recommended**, pending an explicit reason
  emerging during implementation that this analysis didn't foresee.
- A release-sequence field is likewise **not proven necessary** — `version`
  (free text) plus `publishedAt` plus `createdAt` already give a total,
  stable order for every release of a product.

**Existing entitlements**: per section 4, `Entitlement` is already
product-scoped, not release-scoped (a settled MVP-010 decision) — publishing
1.1 does not change any existing `Entitlement` row's meaning; a buyer's
entitlement already covers "every past and future release of the product,"
by design, independent of this analysis.

## 7. Public-current-release rule

Already correct for the single-published-release case (section 3's query).
For the multi-release case (section 6), the same query needs no change in
*shape* — `take: 1` ordered by `publishedAt DESC, createdAt DESC` — but its
correctness now depends on section 6's new publish transaction actually
existing and setting `publishedAt` on exactly one additional release per
publish action, never two at once (a concurrency concern, see section 11).
**Equal-timestamp risk**: `publishedAt` is a full `DateTime`, and two
sequential publish transactions using `new Date()` (as the existing
`publishProductWithRelease` does) could theoretically collide at
millisecond resolution under high concurrency, but the query's existing
secondary sort key (`createdAt DESC`) already provides a stable tiebreaker
independent of that risk — no new field is needed for this specific
concern.

## 8. Defective or unsafe published release — handling (proposed default,
not decided)

**No existing approved mechanism for unpublishing, retiring, or disabling a
product's availability exists in code.** `docs/09-marketplace-operations.md`
(rewritten 2026-09-24, an approved doc) already states the *intended*
lifecycle in prose — *"Draft, published, suspended, archived... an
administrator drafts a product, publishes it, may suspend it, and may
archive it"* — but `ProductStatus`'s actual enum has only `DRAFT`/
`PUBLISHED`, and **no backlog story currently owns building `SUSPENDED`/
`ARCHIVED`**. This is a real gap, not something to silently assign to
MVP-014 because it's adjacent.

**Proposed reversible default (not approved unless the product owner
confirms it), matching the instruction's own stated safest-default shape and
the existing documented direction in `docs/09-marketplace-operations.md`:**
- Preserve every immutable historical release/file record exactly as-is —
  never delete or rewrite a published release's file set to respond to a
  defect.
- Availability is controlled by a separate state (the already-documented
  `SUSPENDED`/`ARCHIVED` direction), not by mutating the release.
- A security or quality fix ships as a **new** published release (section
  6's mechanism), never as an edit to the defective one.
- Existing Orders/Entitlements are unaffected by a suspension (an
  entitlement is a right the buyer already holds; suspending future public
  availability is not the same as revoking a past grant — revocation is a
  separate, already-designed-but-unused mechanism, `Entitlement.revokedAt`,
  MVP-010).

**Open question this document raises, not resolves**: which story builds
`SUSPENDED`/`ARCHIVED` and the admin action to set them — MVP-014 (since it
touches release/product availability) or MVP-019 (Operations console,
which already owns "product... suspend" per `docs/07-api-contracts.md`'s
existing sketch: `POST /api/admin/products/{id}/suspend`). **The existing
API-contracts sketch already assigns product suspension to the admin/MVP-019
surface, not to MVP-014** — this document defers to that existing sketch
rather than proposing MVP-014 absorb it, but flags this as worth the
product owner's explicit confirmation before implementation, since
`docs/07-api-contracts.md`'s sketch predates the first-party-only decision
and was never updated with this specific mapping in mind.

## 9. Entitlement boundary

`Entitlement` is product-scoped today (section 6) — this document does not
propose changing that, and does not decide whether a past purchaser
receives future releases, limited-period updates, or a paid-upgrade path.
Those are exactly the commercial questions blocked on open questions 3 and
7, restated directly in the authorizing instruction (section 16 there). **No
release-level entitlement behaviour is designed here.** MVP-014 is scoped to
publication integrity only: making it *possible* to publish a second
release safely. What a buyer is entitled to once one exists is explicitly
out of this story's scope until a future decision addresses it.

## 10. Proposed state transitions (design only)

| Mutation | Allowed actor | Source state | Resulting state | Rejected states | Audit | Idempotency | Concurrency |
|---|---|---|---|---|---|---|---|
| Publish subsequent release (new) | ADMIN | Product `PUBLISHED`, selected Release unpublished & belongs to product & has CLEAN file, mandatory fields present | Product stays `PUBLISHED`; selected Release `publishedAt` set | Product `DRAFT` (use the *existing* initial-publish transaction instead); Release already published; Release not belonging to product; Release not ready | New event needed (section 12) | Re-invoking with the same already-published Release id must fail closed (`ReleaseAlreadyPublishedError`, already exists) — not silently succeed | See section 11 |
| Attach/detach file to a draft release | ADMIN | Already implemented, unchanged by MVP-014 | — | — | Already implemented (`product.release_file_attached`/`_detached` telemetry) | Already implemented | Already implemented |
| Suspend/archive product (if assigned here — see section 8's open question) | ADMIN | `PUBLISHED` | proposed `SUSPENDED`/`ARCHIVED` (new enum values, not yet approved) | — | New event needed | Idempotent (re-suspending an already-suspended product is a no-op) | Low risk — single-row update |

No creator, seller, editor, or publisher role is proposed anywhere in this
table — ADMIN remains the only actor, unchanged from MVP-012.

## 11. Concurrency analysis

- **Two publication requests for the same release** (double-click, or a
  retried request after a lost response): the new `publishSubsequentRelease`
  transaction must re-check `release.publishedAt !== null` **inside** the
  transaction (mirroring `publishProductWithRelease`'s existing pattern
  exactly) so the second concurrent request fails closed with
  `ReleaseAlreadyPublishedError` rather than double-publishing or
  overwriting the timestamp. This is the same protection
  `publishProductWithRelease` already has for the initial-publish case —
  MVP-014 needs to replicate the pattern, not invent a new one.
- **Two draft releases published concurrently for the same product**: both
  transactions re-check the Release's own state independently; Postgres's
  row-level locking inside `$transaction` (Prisma's default isolation) means
  the second transaction to reach the `release.findUnique` re-check inside
  its own transaction will see the first one's committed write if
  serialized correctly — this needs the transaction to re-read `Release`
  fresh (not from an outer snapshot) exactly as the existing method already
  does. Both could still legitimately end up published (nothing forbids two
  released being concurrently "published" for one product under section 6's
  model) — the query in section 7 already resolves "which one is current"
  deterministically regardless of how many are published.
- **File attachment racing release publication**: `attachReleaseFile`'s
  existing `loadMutableReleaseOrThrow` re-reads `publishedAt` fresh at
  attach time; if a publish transaction commits between the attach route's
  own read and its write, the attach's own re-check (not a stale earlier
  read) is what matters — this is already correctly guarded by the existing
  method, not a new MVP-014 concern, as long as MVP-014's new publish
  transaction doesn't bypass the same repository method.
- **Duplicate version creation**: already protected by the existing real
  unique constraint on `(productId, version)` (verified by the existing
  `isDuplicateVersionError`/P2002 handling in the releases route) —
  unaffected by MVP-014.
- **Public query running during publication**: Postgres's read-committed
  default isolation means a concurrent `SELECT` either sees the release as
  published or not, never a half-written state, since the publish
  transaction's write is atomic. No new locking is needed for the read
  side.
- **Retry after a committed publication response is lost**: the client
  retries the same publish request; the new transaction's own
  `ReleaseAlreadyPublishedError` re-check (same pattern as above) makes this
  a safe, idempotent no-op-with-error rather than a silent double-publish —
  the route layer should treat "already published, and it's the same
  release the retry is trying to publish" as a **success** response (idempotent
  from the caller's perspective) rather than surfacing a 409 for what is
  actually a successful retry — **this is a UX/API-contract judgment call
  for implementation, not decided here.**

**What must be protected, precisely** (per the instruction's own
"identify the records and invariant" instruction, not just "use a
transaction"): the invariant is *"a given `Release.id` transitions from
unpublished to published at most once, and its `publishedAt` value, once
set, is never subsequently changed by any code path."* The mechanism that
protects it is the same one MVP-012 already established: read `Release`
fresh **inside** the same transaction that writes it, and check
`publishedAt === null` as a precondition of the write, not before the
transaction starts.

## 12. Audit model

**Verified: no `ProductPublishEvent`, `ReleasePublishEvent`, or any
release-related persisted event model exists anywhere in this codebase.**
The only precedent for "what MVP-012 did instead" is structured
`logger.info` telemetry (`product.published`, `product.release_created`,
`product.release_file_attached`/`_detached`, etc.) — the same
MVP-017-established substitute used project-wide pending MVP-019's
persisted `AuditEvent` table (also not built).

**`ArticlePublishEvent` is the one real, shipped precedent for this exact
shape** (`packages/db/prisma/schema/content.prisma`): a bare append-only
action log — `id`, `articleId`, `actorUserId`, `action` (enum, currently
just `PUBLISHED`), `createdAt`, `onDelete: Restrict` on both the article and
actor FKs (an audit trail must survive a user deletion attempt failing, not
cascade away).

**Question for the product owner, not decided here**: does MVP-014 build a
`ReleasePublishEvent` table now, mirroring `ArticlePublishEvent` exactly
(the lowest-risk, most consistent choice — this project already has this
exact pattern proven twice, `ArticlePublishEvent` and the
`ConsentRecord`/`DeletionRequestEvent`/`EmailSend` family), or does it
continue deferring to structured telemetry only, waiting for MVP-019's
general `AuditEvent`? **Recommendation, not a decision**: build
`ReleasePublishEvent` now, since MVP-014's own subject matter (immutable,
append-only publication history) is exactly the kind of record this
project's own established pattern says should never be "just a log line" —
matching NFR-009's "destructive/sensitive admin actions require reason
capture and audit logging" more durably than telemetry alone can. This
would need: `id`, `releaseId`, `productId` (denormalized, matching
`FileScan.uploadedByUserId`'s existing denormalization precedent),
`actorUserId`, `action` (enum: `PUBLISHED` at minimum; `SUPERSEDED`/
`WITHDRAWN` only if section 8's open question is resolved to assign that to
MVP-014), `createdAt`. **No secrets, no file contents, no unnecessary
personal data** — matching every existing audit table in this codebase.

## 13. Public query impact

Section 7 already covers the query-shape analysis. Additional points: no
canonical URL change (product detail stays at the same route regardless of
which release is current); JSON-LD (MVP-021, already shipped) reads
`currentVersion` from the same query, so it automatically reflects whichever
release the section-7 query selects, with no JSON-LD-specific change needed;
sitemap inclusion (product-level, PUBLISHED-status-derived) is unaffected by
which *release* is current, since sitemap eligibility has never depended on
release data. **Draft releases already cannot appear publicly** (section 3)
— MVP-014 does not change this, only extends "how many releases can exist
in this already-correct state" from one to potentially several.

## 14. Accessibility impact

**No page or UI exists yet for any of MVP-014's remaining scope** — section
4's "explicitly required" and "requires decision" items are almost entirely
backend/domain work (a new transaction, an audit table) plus, if the admin
UI needs to expose "publish release 1.1" as a distinct action from "publish
this draft product," an extension to the *existing* `ProductPublishControl`/
`ReleasesEditor` components MVP-012 already built and already gated (7
states, verified on real CI, `admin-products-edit-published` already covers
"a published release is immutable" visually).

**Estimated new states, if a subsequent-release-publish UI action is built**
(not decided to be in scope yet — pending section 6's mechanism being
approved): a "publish this draft release" control on an already-published
product's edit page (a new state, since today's `ProductPublishControl` only
renders when `product.status === "DRAFT"`), its validation-failure state,
and — if section 8's suspend/archive mechanism is assigned to MVP-014
rather than MVP-019 — a suspend/archive confirmation state. **Conservative
estimate: 2-4 new states**, well within a single accessibility shard's
existing per-shard budget (current per-shard main execution is 1.4-3.2
minutes against an 8-minute ceiling, per the MVP-012 merge's own measured
numbers) — **not expected to threaten the standing execution target or
ceiling**, but this is an estimate for planning purposes, not a commitment
made before the actual UI is scoped.

## 15. Test strategy (shape only)

- **Unit/domain**: the new publish-subsequent-release precondition logic
  (Product must be PUBLISHED, not DRAFT) as a pure function, mirroring
  `isValidProductStatusTransition`'s existing style.
- **Repository integration** (real Postgres): initial-release immutability
  remains intact (regression coverage for what MVP-012 already tests, not
  new); subsequent-release publication succeeds; earlier release
  unchanged after a later one publishes; latest-published-release selection
  is deterministic with two published releases; draft release stays
  publicly hidden even when a sibling release is published; duplicate
  publication of the same release is idempotent-safe (rejected, not
  double-applied); duplicate-version race (existing constraint, regression
  only); attach-vs-publish and detach-vs-publish races (already covered by
  MVP-012's existing tests for the initial-publish case — extend the same
  pattern for the subsequent-release case).
- **Route integration**: unauthorized/non-ADMIN rejected (mirrors every
  existing MVP-012 route test); audit event created (once section 12 is
  decided); failed transaction leaves no partial publication (assert both
  Product and the target Release are unchanged after a deliberately-forced
  mid-transaction failure).
- **Database concurrency**: two near-simultaneous publish attempts against
  the same Release id — assert exactly one succeeds and the other receives
  `ReleaseAlreadyPublishedError`, not a corrupted or double-set
  `publishedAt`.
- **Entitlement regression**: assert `Entitlement` rows are completely
  unaffected by a subsequent-release publish — no test should assume any
  new commercial/access behaviour, per section 9.
- **Explicitly**: no pricing, currency, tax, refund, checkout, payment,
  commission, payout, or Stripe-related test — none of that logic exists or
  is introduced by this story.
- **Playwright**: only if section 14's UI states are actually built —
  otherwise this story may be primarily backend and need no new
  accessibility states at all, which would itself need reporting honestly
  as "no UI change" rather than fabricating states to test.
- **Manual verification**: none identified beyond what automated coverage
  already handles — no screen-reader-specific new interaction pattern is
  introduced beyond what MVP-012's existing `ProductPublishControl`/
  `ReleasesEditor` already established.

## 16. Security review (pre-work level)

- ADMIN remains the only actor; no new role. Every new mutation must use the
  identical `requireAdmin()` pattern (fresh DB role query) already
  established across all 8 existing MVP-012 routes — this is a re-use, not
  a redesign.
- The core invariant (section 11) — a Release publishes at most once, its
  `publishedAt` never changes afterward — is the entire security-relevant
  surface of this story; it must be enforced at the repository/transaction
  layer, never relying on a disabled button or a route-level check that a
  direct repository call could bypass, mirroring MVP-012's own
  independent-review finding (the same class of gap that made B1/B2
  BLOCKERs in that review).
- No secrets, file contents, or unnecessary personal data in the proposed
  `ReleasePublishEvent` (section 12), matching NFR-006 unchanged.
- No commercial/Stripe surface is touched, so no new PCI or payment-security
  concern is introduced.

## 17. Exact likely implementation files (naming only, nothing created)

- `packages/adapters/catalog/src/catalog-repository.ts` — new
  `publishSubsequentRelease` (or equivalent name) method; extends the
  domain `CatalogRepository` interface (`packages/domain/catalog/src/
  catalog-repository.ts`).
- `packages/domain/catalog/src/product.ts` — new precondition helper(s) and
  possibly new typed errors (mirroring the existing
  `ProductNotDraftError`-style pattern) for the PUBLISHED-required case.
- `packages/db/prisma/schema/` — `ReleasePublishEvent` model (if section
  12's recommendation is accepted) + one additive migration with RLS
  enabled (matching every other table's unconditional convention — the
  exact gap MVP-012's own review caught once already).
- `apps/web/app/api/admin/products/[id]/releases/[releaseId]/publish/
  route.ts` (naming guess, not decided) — the new subsequent-release-publish
  endpoint.
- `apps/web/app/admin/products/[id]/edit/ReleasesEditor.tsx` — extended, not
  replaced, to add a "publish this draft release" action when the product
  is already `PUBLISHED`.
- `packages/e2e/src/pages.ts`/`seed.ts` — new accessibility states and
  fixtures only if section 14's UI is actually built.

## 18. Decisions requiring product-owner input

Recorded here per the instruction's explicit rule (do not assign a
permanent open-question number during pre-work unless governance requires
it — none of these are numbered in `docs/open-questions.md` by this
document):

1. **Does MVP-014 or MVP-019 own product suspension/archival** (section 8)?
   `docs/07-api-contracts.md`'s existing sketch names `POST /api/admin/
   products/{id}/suspend` under the admin/MVP-019 surface, but this
   predates the first-party-only decision and was never explicitly
   reconfirmed against MVP-014's existence.
2. **Should MVP-014 build `ReleasePublishEvent` now, or continue deferring
   to structured telemetry pending MVP-019's `AuditEvent`** (section 12)?
   Recommendation given, not decided.
3. **Does a release-level compatibility/licence evidence snapshot matter**
   (section 5)? FR-011 doesn't require it; flagged as a real but unscoped
   gap.
4. **Should "corrections create another version" (FR-011's own words)
   include a changelog entry** (`ChangelogEntry`, named in `files.prisma`'s
   comment but never formally scoped)? Not required by FR-011's literal
   text.
5. Release-level entitlement/access questions (section 9) — explicitly
   deferred to whenever questions 3/7 are resolved, not MVP-014's decision.

## 19. Explicit non-goals (restated per the authorizing instruction)

No Stripe, Checkout, Price, currency, tax, refund, subscription, commission,
payout, paid upgrade, support entitlement, or update entitlement. No new
role. No change to the public query's URL shape. No destructive delete of
any historical record. No implementation, route, UI, schema, or migration
created by this document. The Stripe pre-work branch
(`docs/mvp-007-stripe-checkout-prework`) is untouched.

## 20. Recommendation on implementation readiness

**Partially ready.** The core mechanism (section 6's subsequent-release
publish transaction, following MVP-012's own established transactional
pattern almost exactly) is well-specified enough to implement once
authorized — it is a narrow, low-risk extension of code that already exists
and already passed an independent review. **Not ready without product-owner
input on section 18's five items**, particularly #1 (suspend/archive
ownership) and #2 (audit model) — implementing the publish mechanism alone
without deciding these would either leave FR-011's "corrections create
another version" story incomplete (no way to respond to a defective
release) or risk building an audit/suspend mechanism the product owner
intended for a different story. **Recommended next step**: product-owner
confirmation on section 18's items 1 and 2 specifically (3-5 can reasonably
stay open past MVP-014's first implementation pass without blocking it),
then implementation can proceed scoped to: the subsequent-release
transaction, its route/UI surface, and (if confirmed) `ReleasePublishEvent`
— explicitly deferring suspend/archive to whichever story is confirmed to
own it.
