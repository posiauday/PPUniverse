# API Contract Outline

## Public
`GET /api/products`, `GET /api/products/{slug}`, `GET /api/categories`, `GET /api/collections/{slug}`, `GET /api/creators/{handle}`, `GET /api/search`.

## Account
`GET/PATCH /api/me`, `GET /api/me/library`, `GET /api/me/orders`, `POST/DELETE /api/me/saved/{productId}`, `POST /api/me/delete-request`.

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
