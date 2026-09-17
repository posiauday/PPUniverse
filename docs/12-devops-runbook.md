# DevOps and Operational Runbook

## CI
Install with lockfile; lint; typecheck; unit/integration tests; migration validation; build; dependency, license and secret scanning; artifact creation.

## CD
Deploy preview per pull request; deploy staging from protected branch; run migrations and smoke tests; approve production; deploy; verify health, checkout test mode boundaries, queue and storage; monitor error budget.

## Rollback
Application rollback is separate from database rollback. Prefer backward-compatible expand/migrate/contract changes. Every release records previous artifact, migration state, feature flags and rollback owner.

## Incident priorities
P0 security/payment/data exposure; P1 checkout/download outage; P2 degraded search, notifications or creator workflow; P3 minor content/admin issue. Runbooks cover webhook backlog, scan backlog, failed deployment, database saturation, object-storage failure and compromised creator account.
