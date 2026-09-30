# MVP-012 pre-work analysis — Product and release editor (FR-009)

Read-only planning analysis, produced ahead of implementation. Nothing in this
document authorizes code, schema, or test changes — per CLAUDE.md, "before
coding, state the requirement IDs, acceptance criteria, affected files,
migration impact, security impact, and test plan." This is that step. No
implementation is started by this document.

## State verified before starting

- Branch `docs/first-party-only-impact-analysis` → PR #22 (open, not merged) updates
  `planning/mvp-backlog.csv`'s MVP-012 row: dependency `MVP-006;MVP-011` → `MVP-006`
  (Done), no `CREATOR`/`SELLER`/`EDITOR`/`PUBLISHER` role, existing `ADMIN` pattern
  is the authoring authority. That change is a **direct product-owner instruction
  given in this session** (`docs/final-decisions.md`, "First-party-only publishing
  model," section 6) — a valid Decision Validation Rule source independent of the
  PR's merge status.
- `planning/mvp-backlog.csv` row (current, on this branch): `MVP-012,Publishing,Product
  and release editor,P0,Backlog,FR-009,"Draft validates all mandatory submission
  fields (first-party ADMIN authoring, not a creator portal)",MVP-006`.
- MVP-006 (file quarantine/scan pipeline) — Done. `FileScan` model exists
  (`packages/db/prisma/schema/files.prisma`), CLEAN status required before any
  release attachment.
- MVP-005 (Product detail evidence model) — Done. `ProductLicense`,
  `SupportPolicy`, `CompatibilityRecord`, `Release` models already exist
  (`packages/db/prisma/schema/evidence.prisma`), built for MVP-005's *read* path.
  No write path exists yet for any of them — confirmed by grep (no
  `POST`/`PATCH` route references these models anywhere in `apps/web`).
- TD-008 (compatibility evidence vocabulary) — Partially Resolved 2026-09-24. The
  schema, validator, and presentation are corrected to the approved two-status
  vocabulary (`CREATOR_DECLARED`, `MARKETPLACE_REVIEWED`); **the write path,
  authorization enforcement, and moderation workflow remain entirely unbuilt**,
  explicitly left for MVP-012/013.
- MVP-017 (Content publishing, `Article`) — Done. `apps/web/app/api/admin/content/`
  and `apps/web/app/admin/content/` are a **direct, working precedent** for
  first-party ADMIN-authored drafting and publishing: `requireAdmin()` (session →
  re-queried DB role, deny-by-default, identical 404 for "no session" and
  "wrong role"), a dedicated `POST .../[id]/publish` sub-route using a pure
  `isValidXStatusTransition` check rather than a PATCH-with-action-field, and
  structured `logger.info` telemetry on create/publish.

## Requirement IDs

- **FR-009** (primary): "~~Creator portal~~ First-party administrator authoring
  ... supports drafts, media, documentation, pricing, licenses, compatibility,
  releases and submission" (`docs/02-prd.md`, reworded 2026-09-24, substance
  unchanged, actor changed from an external creator to `ADMIN`).
- **FR-003** (partial, evidence-field disposition already recorded — see
  `docs/open-questions.md` item 26 / `docs/final-decisions.md`, section C):
  license, compatibility, and support status are in MVP-012's scope; media/
  screenshots, demo, prerequisites, setup instructions, accessibility statement,
  changelog, and version history are **not** — each has its own proposed,
  not-yet-approved story (`planning/proposed-stories.md`).
- **FR-011** (boundary only): release immutability enforcement is MVP-014's
  scope, not MVP-012's. MVP-012 creates `Release` rows; it does not need to
  enforce that a published release's files can never change.
- **NFR-009**: destructive/sensitive admin actions require reason capture and
  audit logging. No `AuditEvent` model exists yet (confirmed — not in any
  `.prisma` file; MVP-019's scope). MVP-012 can emit structured telemetry logs
  (the MVP-017 precedent) but cannot persist a real audit trail until MVP-019
  builds `AuditEvent`. This is a genuine sequencing gap, not a MVP-012 defect —
  flagged below as a question, not invented around.

## Confirmed acceptance criteria (from the backlog row)

"Draft validates all mandatory submission fields (first-party ADMIN authoring,
not a creator portal)." Two things this implies but does not itself decide:
1. What the "mandatory submission fields" actually are.
2. What "validates" means at which step (on every save, or only at the
   publish transition).

Neither is answered by the backlog row's one-line acceptance summary or by
FR-009's field list alone — see "Questions needing product-owner input" below.

## Key findings from research

1. **`ReleaseFile` does not exist.** `packages/db/prisma/schema/files.prisma`'s
   own header comment says so explicitly: "`ReleaseFile`/`Release`/
   `ChangelogEntry`/`Download`/`SignedDownloadGrant` belong to the stories that
   need them (MVP-009, MVP-012, MVP-014), which attach an already-CLEAN
   `FileScan` to a release." MVP-012 is the story that must add this model — a
   real, additive migration, not an oversight to route around.
2. **TD-006 and TD-008 still speak in creator/moderator terms** ("MVP-012 must
   call `validateCompatibilityEntry` ... surface its error codes to the
   creator"; "the creator/administrator product editor must not expose any
   compatibility-status write until TD-008's ... role rules are in place").
   Under first-party-only this collapses: there is no creator distinct from
   the administrator. TD-008's own hard gate already resolves the substantive
   question without needing a new decision — **MVP-012's compatibility writes
   are limited to `CREATOR_DECLARED` only; `MARKETPLACE_REVIEWED` stays
   unassignable by any MVP-012 write path**, exactly as TD-008 section 9
   already specifies, regardless of who the actor is. The "creator" wording in
   TD-006/TD-008 is pre-first-party-only language describing an actor that is
   now `ADMIN`; the gate itself does not change and does not need a new
   decision to apply.
3. **`docs/07-api-contracts.md` line 20 is stale and was not caught by the
   first-party-only validation pass** (PR #22): the Admin API list still reads
   `GET /api/admin/submissions`, `POST /api/admin/submissions/{id}/decision` —
   a third-party submission/moderation-decision shape that presumes the
   superseded MVP-013 model. It didn't surface in that pass because it names
   no searched term ("creator," "seller," "MVP-011," "MVP-013," "FR-008");
   it's a structural leftover, not a wording one. **Not fixed here** — this
   pre-work document is read-only by design, and the fix belongs with
   whichever change actually defines MVP-012's real admin API surface (see
   "Exact files expected to change"), not bundled unasked into the already-
   reported, not-yet-reviewed PR #22. Flagged for your decision.
4. **No `AuditEvent` model exists.** MVP-019 (Admin console and audit) is
   `Backlog`, depends on MVP-012 (already, in the current CSV — this is
   correct and unaffected by the first-party-only change). MVP-012 cannot wait
   for MVP-019, and MVP-019 needs MVP-012's admin surface to exist first — the
   existing MVP-017 precedent resolves this the same way: structured
   `logger.info` telemetry now (`content.article_published`-style events),
   with real persisted `AuditEvent` rows added retroactively once MVP-019
   builds the table. No new decision needed; this matches precedent exactly.
5. **Pricing and checkout are correctly out of scope**, per the explicit
   do-not-implement list already recorded in `docs/final-decisions.md`: Price
   is assigned to MVP-007, gated on open questions 3 (tax/refunds) and 7
   (pricing), both still open. A draft product with no price is a valid,
   expected MVP-012 state — nothing in FR-009's field list requires a price at
   the draft stage, and FR-006/FR-003's price-disposition entries already say
   so.

## Questions needing product-owner input (recording per CLAUDE.md, not inventing)

These go to `docs/open-questions.md` as new items if/when MVP-012 is
authorized to start — not decided here:

1. **What is the exact mandatory field set for the DRAFT → PUBLISHED
   transition?** Candidates supported by already-built, already-approved
   models: `name`, `slug`, `summary`, `categoryId` (all exist, `Product` is
   already non-nullable on these); at least one `ProductLicense`; a
   `SupportPolicy`; at least one `CompatibilityRecord` (Creator Declared);
   at least one `Release` with at least one attached CLEAN `ReleaseFile`.
   Safest reversible default if not answered before implementation starts:
   require all of the above (matches "every paid asset must have a license,
   version, compatibility metadata, support policy" from CLAUDE.md's Delivery
   rules) and treat anything not yet buildable (price) as correctly absent,
   not blocking.
2. **Does `docs/07-api-contracts.md`'s stale `/api/admin/submissions`
   endpoint pair get corrected as part of MVP-012, or as a small separate
   documentation fix first?** Recommendation: fix it as part of MVP-012's own
   pre-work-to-implementation step, since MVP-012 is what actually defines the
   real endpoint shape (`/api/admin/products`, `/api/admin/products/{id}`,
   `/api/admin/products/{id}/publish`, mirroring the content-editor precedent)
   — fixing it in isolation now would just be guessing at MVP-012's eventual
   shape twice.
3. **Release versioning scheme** — FR-011 requires corrections to create a new
   version, but no format is decided (semver, free-text, sequential integer).
   `Release.version` is already a free-text `String` in the schema (not an
   enum or structured type), so the safest reversible default is to accept any
   non-empty string and defer format enforcement to a later story if needed.

## Proposed entities and fields (net-new only)

### `ReleaseFile`
Join between a `Release` and a `FileScan`, gated to `FileScan.status ===
"CLEAN"` at write time (never a database-level CHECK across tables — enforced
in the repository/domain layer, consistent with how `FileScan` itself has no
cross-table CHECK). Minimal shape, modeled on `ProductLicense`'s join-table
style:

```prisma
model ReleaseFile {
  releaseId String
  fileScanId String
  createdAt DateTime @default(now())

  release  Release  @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  fileScan FileScan @relation(fields: [fileScanId], references: [id], onDelete: Restrict)

  @@id([releaseId, fileScanId])
  @@index([fileScanId])
  @@map("release_files")
}
```
`onDelete: Restrict` on `fileScan` — a scanned file already attached to a
release must not be deletable out from under it (mirrors `Category` on
`Product`). Exact shape needs review at implementation time, not frozen here.

## Authorization model (proposed, mirrors MVP-017 exactly)

Deny-by-default; `requireAdmin()` identical to
`apps/web/app/api/admin/content/route.ts`: no session or a non-`ADMIN` role
both return the same 404, role re-queried fresh from the database every
request, never trusted from the session token. No new role. No application
code path grants `ADMIN` (existing MVP-002/MVP-020 constraint, unchanged).

## Migration impact

One additive migration: `release_files` table (new), no changes to any
existing table or column. No destructive change. Rollback: drop the table.
(TD-008's own two migrations already landed separately, 2026-09-24 — not
MVP-012's migration to write or re-verify.)

## Security impact

- Same deny-by-default ADMIN gate as MVP-017/MVP-020 — no new authorization
  pattern introduced.
- File attachment must re-verify `FileScan.status === "CLEAN"` server-side at
  attach time, not trust a client-supplied status (mirrors MVP-006/MVP-009's
  existing signed-download authorization discipline).
- Compatibility-evidence write path must call `validateCompatibilityEntry`
  (TD-006, still open) and must reject `MARKETPLACE_REVIEWED`, `TESTED`, and
  `NOT_VERIFIED` as client-supplied values — only `CREATOR_DECLARED` is
  acceptable from any MVP-012 write path (see finding 2 above).
- No secrets, payment details, or uploaded-file contents in logs (NFR-006,
  unchanged, same as every prior story).

## Test plan (shape, not exhaustive — to be finalized at implementation)

- Unit: field validation for product/release/license/support/compatibility
  inputs; `ReleaseFile` attach rejects a non-CLEAN `FileScan`.
- Authorization: no session → 404; non-ADMIN → 404; ADMIN → succeeds (mirrors
  existing `route.test.ts` files for `/api/admin/content`).
- Integration (DB-gated): publish transition blocked until every mandatory
  field is present, once question 1 above is answered; compatibility write
  rejects reserved/legacy statuses end-to-end.
- Accessibility: the admin editor UI, once built, joins the existing
  `packages/e2e` gate at the standard four breakpoints (MVP-023 precedent).

## Exact files expected to change (at implementation time — none touched now)

- `packages/db/prisma/schema/files.prisma` (add `ReleaseFile`) + one migration.
- `packages/domain/catalog/` — product/release/license/support field
  validators (mirrors `@ppu/domain-content`'s article validators).
- `apps/web/app/api/admin/products/route.ts`,
  `apps/web/app/api/admin/products/[id]/route.ts`,
  `apps/web/app/api/admin/products/[id]/publish/route.ts`,
  `apps/web/app/api/admin/products/[id]/releases/route.ts` (new tree, mirrors
  `api/admin/content/`).
- `apps/web/app/admin/products/` (new UI tree, mirrors `app/admin/content/`).
- `docs/07-api-contracts.md` (correct the stale `/api/admin/submissions`
  entry — see question 2).
- `planning/requirement-traceability.csv` (FR-009 → Implemented once done).

## Do-not-implement list (restated from the standing first-party-only decision)

Price, checkout, payouts, Stripe Connect, `Offer`/price structured data,
`MARKETPLACE_REVIEWED` write path, any moderation/self-review workflow, media/
screenshot/demo/prerequisite/setup/accessibility-statement/changelog fields
(each a separate, not-yet-approved proposed story).

## Next step

This document is analysis only. Implementation of MVP-012 is not authorized
by it and has not started. Recommend the product owner review PR #22 first
(it changes MVP-012's own dependency row), then separately confirm question 1
(mandatory field set) and question 2 (`docs/07-api-contracts.md` fix timing)
above before implementation begins.
