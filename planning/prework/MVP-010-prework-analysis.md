# MVP-010 pre-work analysis — Free entitlement flow (FR-005)

Story instruction: "STORY INSTRUCTION — MVP-010 (FR-005, Free entitlement flow)", 2026-09-22, direct product-owner instruction. Originally pre-work only; **open questions 44 and 45 were closed 2026-09-22** (direct product-owner instruction, "MVP-010 open questions 44 and 45", recorded in `docs/final-decisions.md`) and implementation is now authorized for exactly the scope that decision and this document describe. Updates made to this document on closing: marked below wherever a proposal became a decision; nothing proposed here was silently changed.

## State verified before starting

- `develop` at `6ca91b2` (PR #7 merge commit), no open PRs (`gh pr list --state all` — the seven prior PRs are all MERGED), no overlapping MVP-010 work found anywhere in the repo or in any branch name.
- `feature/mvp-010-free-entitlement` created from `develop`. Never `main`.
- C: free space: **11.17GB**, above the 2GB threshold — checked before any local command in this round.
- Read in full: `CLAUDE.md`, `docs/final-decisions.md` (all 563 lines), `planning/status.md`, `docs/open-questions.md`, `planning/mvp-backlog.csv`, `planning/backlog.csv`, `planning/requirement-traceability.csv`, `docs/02-prd.md` (FR-005/FR-007 wording), `docs/06-data-model.md`, and the current Prisma schema (`identity.prisma`, `catalog.prisma`, `evidence.prisma`, `files.prisma`, `schema.prisma`) and one representative migration for RLS/CREATE TABLE conventions. `planning/progress-report.md` was not re-read in full this round (it is very large and its MVP-010-relevant content — none exists yet — was confirmed by search); every fact below is cited to where it was actually read, not recalled.

## Requirement IDs

- **FR-005** (owning requirement, `docs/02-prd.md` line 22, read verbatim): *"Free downloads may require sign-in based on product policy and always create an entitlement/download record."*
- **FR-007** (the adjacent, explicitly separate requirement, line 24): *"Entitled users receive signed, expiring download links. Storage paths are never public."* Owned by MVP-006 (Done — quarantine/scan) and MVP-009 (not started — signed delivery), confirmed by `planning/requirement-traceability.csv` row 8, which already tracks these as two different stories under one requirement.
- `planning/mvp-backlog.csv` row 10: MVP-010, P0, "Free entitlement flow", acceptance summary "Policy creates entitlement and download record", depends on MVP-002 (Done) and MVP-006 (Done).

## Confirmed acceptance criteria

Directly from FR-005 and the backlog row, nothing added:
1. A free product's download flow **may** require sign-in — the requirement is explicit that this is **per-product policy**, not a blanket rule.
2. Completing the flow **always** results in an entitlement existing and a download record being created.

Everything else (what "policy" means concretely, what fields either record needs, whether delivery of a file is in scope) is **not** stated by FR-005 and is addressed under "Answers to the five questions" below, with anything requiring a product decision recorded in `docs/open-questions.md`.

## Answers to the five questions (required before any design)

### 1. Delivery boundary

**MVP-010 does not deliver a file. It creates an `Entitlement` row (the right) and a `Download` row (the record of the flow completing) — nothing else.**

Confirmed, not inferred, from three independent sources that all agree:
- `docs/06-data-model.md` "Versioning and files" lists **`Download` and `SignedDownloadGrant` as two separate entities**, and its critical constraints separately state "Download requires active entitlement or explicit free-product policy" — `Download` is gated by entitlement, it is not itself the delivery mechanism.
- `packages/db/prisma/schema/files.prisma`'s own comment: *"Only FileScan is modeled for MVP-006 — ReleaseFile/Release/ChangelogEntry/Download/SignedDownloadGrant belong to the stories that need them (MVP-009, MVP-012, MVP-014)."* **`ReleaseFile` does not exist in the schema today** — `FileScan` (MVP-006) has no foreign key to `Release` or `Product` at all. There is currently no way to point at "the downloadable file for this product," because the model connecting a clean scan to a release hasn't been built.
- FR-007, the sibling requirement, is the one that names "signed, expiring download links" — and it's owned by MVP-009, not MVP-010.

**Consequence for the design:** since `ReleaseFile` doesn't exist, `Download.entitlementId` is the most specific thing this story can reference — not a file, not a release. MVP-009 is left owning: `ReleaseFile` (or the mechanism connecting a clean `FileScan` to a `Release`), `SignedDownloadGrant`, the actual signed-URL generation, and checking that an entitlement exists before issuing one. MVP-010's `Download` row is an audit/event record of "the free-entitlement flow completed for this user and product," not a record of bytes served.

**A related gap found, not a conflict, flagged for correction alongside this story:** `packages/domain/entitlements/README.md` (the structural placeholder from MVP-001) currently reads *"Owning story: MVP-009"* for the whole entitlement domain, including `Entitlement` and `Download`. This predates the current FR-005/FR-007 split reflected in `requirement-traceability.csv` and `mvp-backlog.csv`, both of which clearly assign FR-005 (entitlement/download) to MVP-010 and FR-007 (signed delivery) to MVP-009. This README needs correcting as part of MVP-010's own change set (it is the placeholder this story is filling in), not a separate story.

### 2. Sign-in policy

**No product-level policy field exists today.** `packages/db/prisma/schema/catalog.prisma`'s `Product` model has no such column (read directly, not assumed).

**Migration cost if built:** low in isolation — one additive, defaulted `Boolean` column on `products`, matching the pattern every prior addition to this table has used (MVP-005 added related tables, never touched `products` destructively). But it is **not** low in total scope, because of what it implies:

If sign-in is **not** required for a given product's free download, the flow has no `User` to attach an `Entitlement` to — `Entitlement.userId` would need to become nullable, or a guest-only, entitlement-less "just log a `Download`" path would need to exist alongside the signed-in path. That is a second, materially different code path (anonymous request handling, no session to authorize against, a different shape of "record" with no persistent right attached to it), not just a boolean flag. Building the real per-product policy this round means building and testing both paths in one story.

**DECIDED (2026-09-22, `docs/final-decisions.md`, "MVP-010 open questions 44 and 45"):** require sign-in for **all** free downloads in this story. No product-level field, no guest path, no disabled or unused policy flag. The per-product policy is deferred, not omitted — a real future story, stated plainly as such so it is never mistaken for the intended end state.

### 3. Test data

Proposing the same reserved-prefix pattern already proven in the accessibility suite (`docs/14-accessibility-testing.md`, `packages/e2e/src/seed.ts`), adapted to this story's own layer (Vitest DB-gated integration tests, not Playwright — see Test plan below, since MVP-010's acceptance criteria are domain/repository-level, not a new page):
- Integration tests create their own `User` and `Product` rows inside the test, under a reserved prefix obviously distinct from production data (proposing `zz-e2e-entitlement-` for user emails and product slugs, mirroring the accessibility suite's `zz-e2e-a11y-` convention rather than inventing a new shape).
- Cleanup deletes only rows the test created, matched by that prefix — never a broader deletion.
- Seeded reference data (categories, license definitions) already established as read-only to tests stays read-only here too; this story adds no new seed data of its own.
- The existing pre-flight database guard pattern (`packages/e2e/src/db-guard.ts` for Playwright; the equivalent for Vitest is `DATABASE_URL` plus `describe.skipIf` as `@ppu/adapter-identity`/`@ppu/adapter-catalog`'s integration tests already use) — this story's new integration tests self-skip when no database is configured, exactly like every other adapter package's tests, rather than requiring a new guard mechanism.

### 4. License tier

**A free entitlement records nothing about license tiers, and this can be answered without reopening open question 7.** FR-005 is entirely about *free* downloads; `LicenseDefinition`/`ProductLicense` model the three locked tiers (Personal/Team/Enterprise) for products that have a license at all, and seat/contract-term rules (open question 7) are specifically about the **paid** commercial terms of those tiers. A free product may still declare a license tier via the existing MVP-005 model (e.g., "Personal" license, free price) — but the *entitlement* itself, in this story, is a grant of download access, not a grant of a specific license's terms. Proposing `Entitlement` carries no `licenseDefinitionId` or seat count; if a future paid-entitlement story (MVP-007/008) needs to record which license tier was purchased, that is additive to the same table, not something this story needs to anticipate or block on.

### 5. Entitlement immutability

**The existing schema does not settle this — nothing currently implies permanent, revocable, or version-scoped.** The only relevant signal is `docs/06-data-model.md`'s constraint that "Entitlement references the order line, admin grant or subscription source" — all three of those are inherently **product**-scoped commercial events (you buy or are granted access to a product, not one specific release of it), not version-scoped. A free entitlement is a fourth kind of source with the same shape: I'm proposing it be **product-scoped** (one entitlement covers all past and future releases of that product), for consistency with that pattern and because scoping to a single release would mean a user needs a new entitlement every time a creator ships an update to something they already have for free — which contradicts ordinary marketplace expectations and isn't asked for anywhere.

**DECIDED (2026-09-22, `docs/final-decisions.md`, "MVP-010 open questions 44 and 45"):** permanent-until-revoked, **approved with an amendment**: `revokedAt` is included AND **enforced at read time** — a download is denied when it is non-null — even though no code path in this story ever sets it. Rationale recorded in the decision: an unenforced reserved column invites a future revocation feature that ships without the check; enforcing the condition now costs one comparison and means product suspension behaves correctly the moment any future write path sets the column.

## Proposed entities and fields

Two new tables (`packages/db/prisma/schema/entitlements.prisma`), matching this repository's established multi-file schema convention:

### `Entitlement`
| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | No | |
| `userId` | `String` | No (see Q2) | FK → `User` |
| `productId` | `String` | No | FK → `Product` |
| `source` | `EntitlementSource` enum | No | `FREE_POLICY` only, for now — extensible when MVP-007/008 add `ORDER_LINE`/`ADMIN_GRANT`/`SUBSCRIPTION`, matching the data model's own list of sources |
| `grantedAt` | `DateTime @default(now())` | No | |
| `revokedAt` | `DateTime?` | Yes | **Enforced at read time** (decision, 2026-09-22): a download is denied whenever this is non-null. No code path in this story ever sets it — nothing revokes an entitlement here — but the check exists and is live from the first migration, not added later alongside whatever eventually writes to it. |
| `createdAt` / `updatedAt` | `DateTime` | No | Standard convention used everywhere else in this schema |

Cardinality: **one `Entitlement` per (`userId`, `productId`)** — `@@unique([userId, productId])`, ordered so the same index also serves "list a user's entitlements" lookups without a second index. Re-running the free flow for a product the user is already entitled to is idempotent (reuses the existing row), consistent with "always create an entitlement... record" meaning "ensure one exists," not "always insert a new one" — an entitlement is the *right*, not an event.

### `Download`
| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | No | |
| `entitlementId` | `String` | No | FK → `Entitlement` — see "Delivery boundary" above for why this, not a file, is what's referenced |
| `userId` | `String` | No | Denormalized, matching `FileScan.uploadedByUserId`'s existing pattern, for query convenience without a join |
| `productId` | `String` | No | Denormalized, same reasoning |
| `requestedAt` | `DateTime @default(now())` | No | |
| `createdAt` | `DateTime @default(now())` | No | |

Cardinality: **many `Download` rows per `Entitlement`** — an append-only event log, one row per completed flow invocation (a user can "download" the same free product more than once; each is its own record). No unique constraint.

### `Product.requiresSignInForFreeDownload` — **not built** (decided 2026-09-22)
No `Product` column is added. Q44 closed with the universal-sign-in default; the per-product policy field is deferred to a future story, not built in any form here, including disabled or unused.

## Constraint and index plan

- `entitlements`: `@@unique([userId, productId])` (also serves `userId`-only lookups); `@@index([productId])` (for "who is entitled to this product" / moderation and support use later).
- `downloads`: `@@index([entitlementId])`, `@@index([userId])`, `@@index([productId])`, `@@index([requestedAt])` (time-ordered audit queries).
- FK `onDelete`: `Entitlement.userId → Cascade` (mirrors `FileScan.uploadedByUserId`'s existing convention; a real account-deletion policy for entitlement records more likely belongs to MVP-020's consent/deletion scope, out of bounds here — flagged, not decided, below). `Entitlement.productId → Cascade` and `Download.entitlementId → Cascade` (mirrors every other Product-keyed table's convention — `ProductLicense`, `Release`, `CompatibilityRecord` all cascade on their parent).
- No `CHECK` constraints are needed beyond what Prisma's own column types enforce (unlike MVP-005's compatibility model, nothing here needs a hand-written range or cross-field rule).

## RLS statements

Following the established, unconditional convention (every table gets RLS enabled with zero policies in the same migration that creates it, confirmed against `20260921000000_add_product_evidence/migration.sql`, the most recent precedent):

```sql
ALTER TABLE "entitlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "downloads" ENABLE ROW LEVEL SECURITY;
```

## Hand-written migration plan

One migration, `<timestamp>_add_entitlements`, generated via `prisma migrate dev` from the new `.prisma` file and then reviewed by hand (matching how every prior migration in this repo was produced): `CREATE TABLE "entitlements"`, `CREATE TABLE "downloads"`, their FKs and indexes, then the two `ENABLE ROW LEVEL SECURITY` statements above. Purely additive — no existing table is altered, no data migration, fully reversible (`DROP TABLE` both, in reverse dependency order, is the rollback). If Q2 is answered "build the policy field," a second migration adds the single `products` column, kept separate from the additive table-creation migration so the riskier (existing-table) change is isolated and easy to review or roll back independently.

## Authorization model

- The free-entitlement endpoint requires a real, database-backed session — the same server-enforced path every other authenticated surface in this codebase uses (MVP-002's session model, MVP-023's Q40 precedent: no test bypass, no relaxed check, ever). A request with no valid session is `401`, not silently treated as anonymous.
- Server-side checks before granting: the product exists and is `PUBLISHED` (not `DRAFT`) — an unpublished product must not be free-downloadable by anyone who happens to guess its slug.
- Authorization is **server-enforced only**: the API route (not client state) decides whether to create or reuse the `Entitlement`; the UI reflects what the server returns, never the reverse.
- No new `Role`/`Permission` concept is needed — every signed-in `MEMBER` (the only role that exists today) can request a free entitlement to any published product; there is no tier of user this story needs to distinguish.

## Repository and query changes

New packages, following the established domain/adapter split (`packages/domain/catalog` + `packages/adapters/catalog` is the closest precedent, both read directly this round):
- `packages/domain/entitlements` — currently a placeholder (`README.md` only, "Owning story: MVP-009" — corrected by this story, see "Delivery boundary" above). Gains: the pure policy decision ("does this request require sign-in," trivial under the proposed default; "is this product eligible for a free entitlement" — i.e., is it `PUBLISHED`), independent of Prisma.
- `packages/adapters/entitlements` (new package, does not exist yet) — the concrete Prisma repository: `grantOrReuseEntitlement(userId, productId)` (the idempotent upsert implied by the unique constraint), `recordDownload(entitlementId, userId, productId)`, `findEntitlement(userId, productId)`. Modeled directly on `packages/adapters/catalog/src/catalog-repository.ts`'s shape and its own `*.integration.test.ts` pattern (real Postgres, `describe.skipIf(!hasDatabase)`).

## UI surface

None exists today — confirmed by reading `apps/web/app/products/[slug]/page.tsx` and finding no download or "get free" control anywhere on the product page. Proposing: a single server-actioned control on the product-detail page, visible only when the product has no price/paid license attached (out of this story's scope to define precisely, since pricing itself is MVP-007's — proposing the control appears whenever a product has **no** commerce/checkout affordance at all, which today is *every* product, since MVP-007 doesn't exist yet; this needs re-visiting once MVP-007 lands and some products become paid). Accessible by default: a real `<button>` inside a `<form>` posting to a server action or route handler (matching the sign-in form's own pattern, not a client-side fetch with no-JS fallback), a `role="status"` region announcing the outcome (granted / already had it / error), keyboard-operable, visible focus — the same baseline MVP-023 already holds every interactive control to, not a new accessibility bar.

## Security impact

- No new secret, credential or connection-string surface.
- No file is served or referenced by this story — the signed-URL/storage-path security surface (FR-007's "storage paths are never public") is entirely MVP-009's, untouched here.
- Idempotent grant (unique constraint) prevents a duplicate-request race from creating two entitlement rows; the repository's upsert must be written to rely on the database constraint (an `ON CONFLICT DO NOTHING`-shaped operation or Prisma's `upsert`), not a check-then-insert that a concurrent request could race.
- RLS enabled on both new tables from their first migration, matching every other table in this schema — no table is ever created RLS-less even temporarily.
- **Never trust a client-supplied price, free flag, or product state** (decision, 2026-09-22): eligibility is re-derived server-side from the database row on every request, never accepted as a parameter.
- **`revokedAt` is enforced at read time** (decision, 2026-09-22): a download is denied when it is non-null, even though nothing in this story sets it.
- **Data minimisation** (decision, 2026-09-22): `Download` stores only `entitlementId`, `userId`, `productId`, `requestedAt` — no IP address, no user agent, no field beyond what audit needs.

## Accessibility impact

- New UI surface (the free-download control) must pass MVP-023's accessibility gate as a matter of course — it becomes a new state on an already-gated page (`product-full`/`product-minimal` in `packages/e2e/src/pages.ts`), or a new gated state if its outcome materially changes the page (e.g., a post-grant confirmation). This story is expected to extend the page inventory, not bypass it — the route-coverage guard (`packages/e2e/src/route-coverage.test.ts`) already fails if a meaningfully different page state exists ungated.
- The `role="status"` outcome region follows the exact pattern BUG-006/BUG-005 already established and fixed under MVP-023 (announce without moving focus unexpectedly; focus lands somewhere sensible on error) — not a new pattern to invent.

## Telemetry

Following `apps/web/lib/observability.ts`'s confirmed, existing pattern (`withObservability(routeName, handler)` for automatic correlation-ID and request-start/end structured logs; `logger` from `@ppu/telemetry` for domain-specific events) — proposing a `logger.info("entitlement.granted", { userId, productId, source: "FREE_POLICY", reused: boolean })` event distinguishing a fresh grant from an idempotent re-request, and `logger.info("entitlement.download_recorded", { entitlementId, userId, productId })`. No new telemetry infrastructure — reusing what MVP-022 already built.

## Test plan

- **Unit**: `packages/domain/entitlements` — the eligibility/policy decision logic, pure functions, no database.
- **Integration** (Vitest, real Postgres, `describe.skipIf(!hasDatabase)`, reserved-prefix rows created and cleaned up by the test itself — Q3 above): `packages/adapters/entitlements/src/entitlement-repository.integration.test.ts` — grant creates a row; a second grant for the same (user, product) reuses it (no duplicate); recording a download after granting; the unique constraint holding under a simulated concurrent grant.
- **Route/API**: an unauthenticated request is rejected; a request for a `DRAFT` product is rejected; a request for a `PUBLISHED` product succeeds and is idempotent on retry.
- **Accessibility** (Playwright, part of the existing gate, not a new suite): the new control and outcome region pass the same automated checks every other interactive control does, at the same four widths and three engines — no new tooling, no new CI job.
- Every test proposed here follows an existing, already-proven pattern in this repository; none introduces a new testing approach.

## Exact files expected to change

**New:**
- `packages/db/prisma/schema/entitlements.prisma`
- `packages/db/prisma/migrations/<timestamp>_add_entitlements/migration.sql`
- `packages/adapters/entitlements/package.json`, `src/index.ts`, `src/entitlement-repository.ts`, `src/entitlement-repository.integration.test.ts`
- `packages/domain/entitlements/src/eligibility.ts`, `src/eligibility.test.ts` (replacing the placeholder-only package)
- `apps/web/app/products/[slug]/FreeDownloadControl.tsx` (or equivalent name) and its route handler / server action
- A new or extended state in `packages/e2e/src/pages.ts`'s page inventory, and a corresponding regression spec under `packages/e2e/tests/a11y/regressions/` if a distinct bug-shaped fix isn't involved (this is new-feature coverage, not a regression test, so it likely belongs in `pages.spec.ts`'s existing matrix instead — to be confirmed once the actual UI states are known)

**Modified:**
- `packages/domain/entitlements/README.md` (corrected ownership — see "Delivery boundary")
- `apps/web/app/products/[slug]/page.tsx` (renders the new control)
- `planning/requirement-traceability.csv` (FR-005 row, on completion)
- `CLAUDE.md` Commands section only, if a new script is added (factual update, per the established MVP-023 precedent for touching that file)

**Not touched:** everything under "Do not implement" below, and no completed MVP-001/002/003/004/005/006/021/022/023 behavior.

## Remaining ambiguities (not resolved here)

1. ~~Q2 (sign-in policy)~~ — **CLOSED 2026-09-22**, see above.
2. ~~Q5 (revocation on suspension)~~ — **CLOSED 2026-09-22**, see above.
3. **Account-deletion interaction** — whether an `Entitlement` should be preserved, anonymized, or cascade-deleted when a user's account is deleted (MVP-020's scope, not this story's) is flagged but not decided; the proposed `Cascade` default above is reversible. Not closed by the 2026-09-22 decision.
4. **UI placement once MVP-007 exists** — the "show the free-download control whenever a product has no paid affordance" default above is a placeholder that will need revisiting once checkout exists and some products are genuinely priced; not a decision this story can make in isolation since MVP-007 doesn't exist yet.
5. **Exact route/action shape** (a dedicated `POST /api/products/[slug]/entitlement` route vs. a Server Action) is an implementation choice, not a product decision — proposing whichever this repository's existing convention favors once actually implemented; `apps/web/app/api/*` already has precedent for user-triggered mutations (e.g., `api/me/sessions/[id]`), so a route handler is the likely fit, but this is not being decided as part of pre-work.

## Open questions recorded

Items 44 and 45 in `docs/open-questions.md`, both **CLOSED 2026-09-22** (`docs/final-decisions.md`, "MVP-010 open questions 44 and 45"). See that file for the exact closing entries.

## Do-not-implement list (restated, unchanged)

MVP-007, 008, 009, 011, 012, 013, 017, 018, 020; TD-004, 005, 006, 008, 009, 010; BUG-002; PROP-001 to PROP-006; pricing; Offer structured data; analytics beyond the telemetry events named above; creator and collections routes; compatibility workflow; search behaviour changes; promoting `develop` to `main`. No modification to completed MVP-001/002/003/004/005/006/021/022/023 behavior. No gate check weakened, skipped, quarantined or conditionally excluded. The accessibility self-check stays permanent and unconditional. BUG-014 stays open, monitor-only, permanently instrumented — not touched under this authorization.

## Implementation authorized (2026-09-22)

Open questions 44 and 45 closed; implementation authorized on `feature/mvp-010-free-entitlement` for exactly the scope this document and `docs/final-decisions.md`'s "MVP-010 open questions 44 and 45" entry describe, and nothing else. See `planning/progress-report.md` for the implementation record as it proceeds.
