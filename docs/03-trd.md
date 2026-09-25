# Technical Requirements Document

## Architecture style
Modular monolith for MVP with explicit domain boundaries: Identity, Catalog, Content, Commerce, Entitlements, ~~Creator~~, Moderation, Reviews, Search, Notifications, Analytics and Administration. **The Creator domain boundary is superseded (2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model") — first-party product authoring is Catalog/Publishing-domain work (MVP-012), not a separate bounded context for a third-party role that no longer exists.** The Moderation domain's scope is under review in the same decision (whether it becomes a first-party self-review gate, is retired, or becomes the review surface for the separately-proposed suggestion capability — not yet resolved). Use asynchronous jobs for external webhooks, email, indexing, scanning and media processing. Preserve interfaces needed to extract high-scale services later.

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
Pull request checks, by their exact required-check name: **"Format, lint, typecheck, test, build"** (formatting, lint, types, unit tests, integration tests, migration validation, dependency scan, build), **"Secret scan"**, and **"Accessibility (axe + Playwright)"** — Playwright and axe-core on chromium, firefox and webkit at 320, 375, 768 and 1280 px (`docs/14-accessibility-testing.md`), required for merge by decision (MVP-023, Q39). Since the "Accessibility suite mitigation" decision (2026-09-23), that check is an aggregator: internally it runs 4 parallel, non-required shard jobs (`Accessibility shard 1/4`…`4/4`, deterministic Playwright `--shard`, every engine/width/rule preserved in every shard) and reports failure if any shard failed — the required-check name itself is unchanged, so branch protection needed no reconfiguration. Governing budget is per-shard test execution (target under 5 minutes, ceiling 8 minutes), not job wall-clock. `docs/final-decisions.md` and `docs/open-questions.md` items 17, 20 and 22 record how this is enforced and how it evolved. Staging receives migration and smoke tests. Production requires approval with backup/restore point, migration plan and rollback steps.

## Observability
Use correlation IDs across web, worker and provider webhooks. Record service level indicators for availability, latency, error rate, job lag, webhook failures, checkout failures, download authorization failures and scan backlog. Alerts must link to runbooks.

## Data and caching
PostgreSQL is the system of record. Cache only reproducible data. Entitlement and authorization decisions must not rely on stale client caches. Invalidate catalog/search caches after publication, suspension or release.

## Initial ADRs
See `docs/adr/001-modular-monolith.md`, `002-private-asset-delivery.md`, and `003-provider-abstraction.md`.
