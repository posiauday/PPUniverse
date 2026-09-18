# DevOps and Operational Runbook

## CI
Install with lockfile; lint; typecheck; unit/integration tests; migration validation; build; dependency, license and secret scanning; artifact creation.

## CD
Deploy preview per pull request; deploy staging from protected branch; run migrations and smoke tests; approve production; deploy; verify health, checkout test mode boundaries, queue and storage; monitor error budget.

## Rollback
Application rollback is separate from database rollback. Prefer backward-compatible expand/migrate/contract changes. Every release records previous artifact, migration state, feature flags and rollback owner.

## Incident priorities
P0 security/payment/data exposure; P1 checkout/download outage; P2 degraded search, notifications or creator workflow; P3 minor content/admin issue. Runbooks cover webhook backlog, scan backlog, failed deployment, database saturation, object-storage failure and compromised creator account.

## Observability (MVP-022)
Every API request logs a `request.start` and `request.end` (or `request.error`) JSON line with a `correlationId` field — the first triage step for any incident is filtering logs by that ID to see everything that happened in the request, in order, with timing. The same ID is included in every error-envelope response body (`docs/07-api-contracts.md`), so a user-reported error can be traced back to its server-side log lines directly from what they saw. Unhandled exceptions additionally go to Sentry (`docs/final-decisions.md`), tagged with the same `correlationId`, once `SENTRY_DSN` is provisioned (`docs/open-questions.md` item 18) — until then they only reach structured logs.

`GET /api/health` reports application and database liveness (`{"status": "ok"|"error", "checks": {"database": "ok"|"error"}}`, 200/503) — unauthenticated, intended for load-balancer/uptime-monitor polling, not wrapped in per-request logging (would flood logs at typical poll intervals).

**Alerting foundations** (rules to configure once a real Sentry project exists — not yet provisioned): page on P0/P1 criteria above; alert on a sustained rise in `request.error` log events for a given `route`; alert on repeated `GET /api/health` 503s (2+ consecutive polls). `packages/telemetry`'s `redact()` strips known-sensitive field names before anything reaches logs or Sentry — extend its default list (not a one-off call site) if a new kind of secret is ever logged by mistake.
