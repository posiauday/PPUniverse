# API Contract Outline

## Public
`GET /api/products`, `GET /api/products/{slug}`, `GET /api/categories`, `GET /api/collections/{slug}`, `GET /api/creators/{handle}`, `GET /api/search`.

## Account
`GET/PATCH /api/me`, `GET /api/me/library`, `GET /api/me/orders`, `POST/DELETE /api/me/saved/{productId}`, `POST /api/me/delete-request`.

Session management (implied by FR-004 "manage sessions" and the `Session` entity in `docs/06-data-model.md`, made concrete in MVP-002 since this outline didn't originally spell it out): `GET /api/me/sessions` lists the caller's active sessions (each with `id`, `expires`, `createdAt`, `isCurrent`); `DELETE /api/me/sessions/{id}` revokes one — scoped to the caller's own sessions and deliberately excludes the current session (`400 IS_CURRENT_SESSION`; use sign-out for that). Both require an authenticated session (`401` otherwise) and are server-authorization-checked, not client-trusted.

Authentication itself (registration, email verification, sign-in/out) runs through `/api/auth/[...nextauth]` (Auth.js's own route, not a hand-rolled endpoint) — see `apps/web/lib/auth.ts` and the ADR 004 amendment.

## Commerce and delivery
`POST /api/checkout`, `POST /api/webhooks/payments`, `POST /api/products/{id}/download`, `POST /api/orders/{id}/refund-request`.

## Creator
`POST /api/creator/applications`, `GET/POST /api/creator/products`, `PATCH /api/creator/products/{id}`, `POST /api/creator/products/{id}/releases`, `POST /api/creator/products/{id}/submit`.

## Moderation/admin
`GET /api/admin/submissions`, `POST /api/admin/submissions/{id}/decision`, `POST /api/admin/products/{id}/suspend`, `POST /api/admin/entitlements/grant`, `GET /api/admin/audit`.

## Contract conventions
JSON, UTC timestamps, opaque IDs, cursor pagination for activity streams, bounded page pagination for catalog, structured field errors, correlation ID, consistent error envelope, authorization performed server-side, idempotency key for mutating commerce endpoints.

## Error envelope
`code`, `message`, `fieldErrors`, `correlationId`, and optional safe `retryAfter`. Never expose stack traces, provider secrets or internal storage paths.
