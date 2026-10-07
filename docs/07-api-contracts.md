# API Contract Outline

## Public
`GET /api/products`, `GET /api/products/{slug}`, `GET /api/categories`, `GET /api/collections/{slug}`, ~~`GET /api/creators/{handle}`~~ (superseded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — never built, no public creator page), `GET /api/search`.

## Account
`GET/PATCH /api/me`, `GET /api/me/library`, `GET /api/me/orders`, `POST/DELETE /api/me/saved/{productId}`, `POST /api/me/delete-request`.

Session management (implied by FR-004 "manage sessions" and the `Session` entity in `docs/06-data-model.md`, made concrete in MVP-002 since this outline didn't originally spell it out): `GET /api/me/sessions` lists the caller's active sessions (each with `id`, `expires`, `createdAt`, `isCurrent`); `DELETE /api/me/sessions/{id}` revokes one — scoped to the caller's own sessions and deliberately excludes the current session (`400 IS_CURRENT_SESSION`; use sign-out for that). Both require an authenticated session (`401` otherwise) and are server-authorization-checked, not client-trusted.

Authentication itself (registration, email verification, sign-in/out) runs through `/api/auth/[...nextauth]` (Auth.js's own route, not a hand-rolled endpoint) — see `apps/web/lib/auth.ts` and the ADR 004 amendment.

## Commerce and delivery
`POST /api/checkout` and `POST /api/webhooks/payments` — not yet built (MVP-007 slice 3 and MVP-008). `POST /api/products/{id}/download` — not yet built (MVP-009). ~~`POST /api/orders/{id}/refund-request`~~ — **will not be built**: all sales are final (`docs/final-decisions.md`, 2026-09-28, refund policy).

`POST /api/products/{slug}/entitlement` (MVP-010) — the free-download grant. Since MVP-007 slice 2 it **refuses a priced product with `409 PRODUCT_NOT_FREE`**, so a paid item can never be taken free; anyone who claimed the product before it was priced keeps access. An unknown or unpublished product is still `404`.

## ~~Creator~~ First-party authoring (reworded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model"; implemented 2026-09-24, MVP-012, FR-009 — see `docs/open-questions.md` item 62; extended 2026-09-25, MVP-014, FR-011)
~~`POST /api/creator/applications`, `GET/POST /api/creator/products`, `PATCH /api/creator/products/{id}`, `POST /api/creator/products/{id}/releases`, `POST /api/creator/products/{id}/submit`.~~ **Superseded** — `POST /api/creator/applications` no longer applies (no creator application). The real, ADMIN-authorized authoring surface MVP-012 built (`apps/web/app/api/admin/products/`), mirroring `/api/admin/content`'s authorization pattern exactly (deny-by-default: no session or a non-ADMIN role both get an identical 404):
- `GET/POST /api/admin/products` — list every product (any status); create a DRAFT (name/slug/summary/categoryId only).
- `GET/PATCH /api/admin/products/{id}` — fetch one for editing; edit core fields only (never status/publishedAt — that's the dedicated publish route below, never a PATCH-with-action-field).
- `POST /api/admin/products/{id}/publish` — DRAFT → PUBLISHED only. Checks the status transition, then the mandatory-field readiness gate (license, support policy, compatibility entry, a release with an attached CLEAN file — `docs/open-questions.md` item 61); `409` with the full missing-field list if not ready, never just the first failure.
- `PUT /api/admin/products/{id}/licenses` — replace the product's full assigned license-tier set.
- `PUT /api/admin/products/{id}/support` — upsert the support policy.
- `POST /api/admin/products/{id}/compatibility` — upsert a compatibility entry, keyed on (product, platform area). Only `CREATOR_DECLARED` is ever accepted here — `MARKETPLACE_REVIEWED` is rejected with a distinct `EVIDENCE_STATUS_NOT_PERMITTED_HERE` code even for an ADMIN caller (TD-006/TD-008's hard gate, unchanged by the first-party-only reversal; Marketplace Reviewed stays reserved for a future moderation/self-review mechanism, not approved yet).
- `POST /api/admin/products/{id}/releases` — create a release (version only; no format enforced).
- `POST /api/admin/products/{id}/releases/{releaseId}/files` — attach an already-uploaded, already-scanned file to a release by its file-scan id (composes with the existing upload/scan flow, `POST /api/files/uploads` → `.../complete` → async scan). The server re-verifies the file is `CLEAN`; a client-supplied "this file is clean" claim is never trusted. `POST /api/files/uploads` and `.../complete` are admin-only: signed-out and non-admin callers get the admin routes' identical 404 (BUG-020).
- `POST /api/admin/products/{id}/releases/{releaseId}/publish` (MVP-014, FR-011) — publish a **subsequent** release of an already-`PUBLISHED` product (the product's own first release/publish still goes through `POST /api/admin/products/{id}/publish` above, which publishes the Product and its selected Release together). Requires the product to be `PUBLISHED` (`409 INVALID_STATE` if still `DRAFT` — use the product-level publish route instead), the release to belong to that product (`404` otherwise, identical to an unknown release id), and the release to be unpublished (`409 INVALID_STATE` if already published — no re-publish, no unpublish). Re-runs the same mandatory-field readiness gate as the product-level publish route (`409 PUBLISH_NOT_READY` with the full missing-field list, `release` named specifically when the release itself has no attached `CLEAN` file). On success, sets `Release.publishedAt` exactly once via an atomic, database-conditional update (not a plain read-then-write) so two concurrent requests for the same release cannot both succeed, and writes a `ReleasePublishEvent` (`action: "PUBLISHED"`) in the same transaction. **`Product.publishedAt` is never changed by this route** — only the product's own first publish sets it. There is no `.../unpublish` route for either the product or a release under any story to date.
- `PUT` / `DELETE /api/admin/products/{id}/price` (MVP-007 slice 2) — set or clear the product's single USD price. `PUT` takes `{ price }` as the text the admin typed (e.g. `"49.99"`); it is parsed on the server, and anything that is not a positive amount with at most two decimals is a `400`. `DELETE` makes the product free again and is idempotent. Deny-by-default ADMIN, like every route here.
- `POST /api/admin/products/{id}/status` (MVP-019, FR-015/NFR-009) — one route for suspend, archive, and reinstate, not three near-identical ones: body `{ toStatus, reason }`, where `toStatus` is `SUSPENDED`, `ARCHIVED`, or `PUBLISHED` (reinstating from `SUSPENDED` only — this never performs the initial `DRAFT → PUBLISHED` publish, which stays exclusively `.../publish`'s concern). `reason` is required for every transition (`400` otherwise). `409 INVALID_STATE` for a transition the domain rejects (e.g. suspending a `DRAFT` product, or any transition attempted out of `ARCHIVED`, which is terminal). Never touches `Entitlement` rows or the selected/current release.

There is no `.../submit` endpoint: publishing is a direct, server-gated ADMIN action against the product's own quality checks, not a submission to a separate reviewer — there is no third-party submitter under the first-party-only model.

## Moderation/admin
`POST /api/admin/entitlements/grant` — not yet implemented (no story builds it yet; `Entitlement.revokedAt`'s write path also remains unbuilt, per MVP-019's own explicit non-goals). ~~`POST /api/admin/products/{id}/suspend`~~ — implemented as `POST /api/admin/products/{id}/status` above instead (one combined route, not a dedicated `/suspend` endpoint). ~~`GET /api/admin/audit`~~ — implemented as the `/admin/audit` **page** (server component, not a separate API route: it reads and renders directly, matching `/admin/deletion-requests`'s existing precedent of no separate read API). ~~`GET /api/admin/submissions`, `POST /api/admin/submissions/{id}/decision`~~ **removed 2026-09-24** (`docs/open-questions.md` item 62) — that pair presumed a third-party submission/moderation-decision shape belonging to MVP-013 (Submission review queue), which is superseded under the first-party-only model and has no approved successor. MVP-012's own quality gate is the `POST /api/admin/products/{id}/publish` route listed above, not a separate moderation-decision endpoint.

## Contract conventions
JSON, UTC timestamps, opaque IDs, cursor pagination for activity streams, bounded page pagination for catalog, structured field errors, correlation ID, consistent error envelope, authorization performed server-side, idempotency key for mutating commerce endpoints.

## Error envelope
`code`, `message`, `fieldErrors`, `correlationId`, and optional safe `retryAfter`. Never expose stack traces, provider secrets or internal storage paths.

### Admin content API: technology sections (MVP-028)
`POST /api/admin/content` and `PUT /api/admin/content/{id}` accept:
- an optional `technology`: one of `POWER_APPS`, `POWER_AUTOMATE`, `POWER_BI`, `COPILOT_STUDIO`, `DATAVERSE`, `POWER_PAGES`. Absent, `null` or `""` stores none; any other value is a `400` with `fieldErrors.technology`.
- the new `type` value `KPI_GUIDE`.

Authorization is unchanged: deny-by-default ADMIN.

## Comments, profiles and roles (MVP-040, MVP-047; 2026-10-07)

All return `Cache-Control: no-store` where they change data. Public routes check the request comes from this site (`Origin`), and the comments routes answer `404` while `FEATURE_COMMENTS` is off.

- `POST /api/guides/{slug}/comments` `{ body }`: signed in. 10 to 2,000 characters, at most 2 links. `401` signed out; `400 too-short | too-long | too-many-links`; `404` unknown or unpublished guide; `429` over 5 an hour or 20 a day. Creates the reader's profile on first use.
- `POST /api/comments/{id}/report` `{}`: anyone; `429` over 10 an hour per address; `404` unknown or removed comment.
- `POST /api/comments/{id}/delete` `{}`: the author only (`404` otherwise, `401` signed out). Deletes the comment and its reports.
- `POST /api/account/profile` `{ displayName }` or `{ avatar: "new" }`: signed in. `400 too-short | too-long | characters | reserved`; `409 taken`; `429` over 10 changes a day.
- `POST /api/admin/comments/{id}/{remove | restore | keep | accept | unaccept}`: admin only; anyone else `404`. `keep` clears the comment's reports; `accept` marks it the guide's accepted fix (clearing any other).
- `POST /api/admin/users/{id}/role` `{ role: "MEMBER" | "CONTRIBUTOR" | "ADMIN" }`: admin only; anyone else `404`. `409 self` (your own role), `409 last-admin`, `409 same`; `400 unknown-role`; `404` unknown user. Recorded in `role_change_events` and the audit log.
