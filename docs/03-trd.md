# Technical Requirements Document

## Architecture style
Modular monolith for MVP with explicit domain boundaries: Identity, Catalog, Content, Commerce, Entitlements, Creator, Moderation, Reviews, Search, Notifications, Analytics and Administration. Use asynchronous jobs for external webhooks, email, indexing, scanning and media processing. Preserve interfaces needed to extract high-scale services later.

## Logical components
- Web application and server API
- PostgreSQL relational database
- Object storage with quarantine and private delivery zones
- Payment provider adapter
- OIDC identity adapter
- Background worker and durable queue
- Search adapter
- Email adapter
- Malware-scanning adapter
- Analytics and consent layer
- Central logs, traces, metrics and alerting

## Environments
Local, preview, development, test/staging and production. Production data cannot be copied to lower environments without approved anonymization. Each environment has separate secrets, storage, databases, payment keys and callback URLs.

## Quality requirements
- Typed interfaces and schema validation at all trust boundaries.
- Database transactions for order, payment and entitlement state changes.
- Idempotency keys for checkout creation, webhook processing and email jobs.
- Optimistic concurrency or version checks for moderation and publishing.
- Pagination and bounded queries for all collection endpoints.
- Rate limits for authentication, search, review, checkout and download endpoints.
- Content Security Policy, secure cookies, CSRF defense where relevant and safe redirect validation.
- File validation by declared type, detected type, extension, size, archive depth and scan status.

## Deployment
Pull request checks: formatting, lint, types, unit tests, integration tests, migration validation, dependency scan, secret scan and build. Staging receives migration and smoke tests. Production requires approval with backup/restore point, migration plan and rollback steps.

## Observability
Use correlation IDs across web, worker and provider webhooks. Record service level indicators for availability, latency, error rate, job lag, webhook failures, checkout failures, download authorization failures and scan backlog. Alerts must link to runbooks.

## Data and caching
PostgreSQL is the system of record. Cache only reproducible data. Entitlement and authorization decisions must not rely on stale client caches. Invalidate catalog/search caches after publication, suspension or release.

## Initial ADRs
See `docs/adr/001-modular-monolith.md`, `002-private-asset-delivery.md`, and `003-provider-abstraction.md`.
