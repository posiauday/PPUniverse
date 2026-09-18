# Open Questions and Decision Log

1. Product name, domain and trademark clearance?
2. First-party-only or invited third-party creators at MVP?
3. Initial countries, currencies, taxes and refund obligations?
4. Identity provider and enterprise SSO requirements?
5. **PARTIALLY RESOLVED (2026-09-17, see `docs/final-decisions.md`)**: object storage vendor is Cloudflare R2 (production) / MinIO (development). Hosting region and data residency commitments themselves remain open.
6. Supported Power Platform versions and compatibility evidence method?
7. **PARTIALLY RESOLVED (2026-09-18, see `docs/final-decisions.md`)**: license families are locked as Personal/Team/Enterprise. Exact pricing, seat limits, and contract terms per tier remain open.
8. Creator commercial terms and manual versus automated payout model?
9. **PARTIALLY RESOLVED (2026-09-17, see `docs/final-decisions.md`)**: malware-scanning approach is ClamAV for development (already implemented, MVP-006) with an asynchronous production scanning service to follow (production vendor and cost model still open — see item 15). File types and maximum sizes still open as a business decision; `packages/domain/files/src/upload-policy.ts`'s current 50MB/allow-listed-MIME-type policy remains an explicit, reversible technical default pending that decision.
10. Which MVP inventory is genuinely ready and owned for publication?
11. Which analytics categories require consent in launch jurisdictions?
12. Support ownership and published service targets?

## Technical decisions raised during implementation readiness planning (2026-09-16)
13. Final monorepo tooling confirmation (Turborepo vs. Nx) — default assumed is Turborepo; see `docs/adr/004-technology-decision-record.md`.
14. Redis/queue hosting (managed vs. self-hosted) and its region, once hosting region (item 5) is decided.
15. **PARTIALLY RESOLVED (2026-09-17)**: development malware-scanning vendor is ClamAV, already implemented. Production vendor and cost model for the async production scanning service (`docs/final-decisions.md`) still open — no story yet owns this.
16. **RESOLVED (2026-09-17, see `docs/final-decisions.md`)**: RLS is approved and required. Implemented as RLS-enabled-with-zero-policies on every table (portable standard PostgreSQL DDL, not dependent on Supabase-specific `auth.uid()`/PostgREST features) — closes `planning/tech-debt/TD-003.md`'s finding without affecting the app's own table-owner Postgres connection.
17. GitHub repository visibility, branch protection rules, and required status checks for issue/PR automation.
18. **PARTIALLY RESOLVED (2026-09-17, see `docs/final-decisions.md`)**: error-monitoring/APM vendor is Sentry, product-analytics vendor is PostHog. Data-residency constraints tied to item 5 (hosting region) remain open.
19. **PARTIALLY RESOLVED (2026-09-17, see `docs/final-decisions.md`)**: email vendor is Resend. Data-residency constraints tied to item 5 (hosting region) remain open.
20. CI time/cost budget for the full test suite (unit + integration + E2E + accessibility) and its effect on PR feedback latency.

## Requirement coverage gaps found during traceability completion (2026-09-16)
21. **PARTIALLY RESOLVED (2026-09-18)**: product-owner confirmed FR-016 (funnel-event analytics, PostHog) stays out of MVP-022's scope — MVP-022 is operational observability only (logs, traces, correlation IDs, Sentry error monitoring). FR-016 still has no owning backlog story; a new story needs to be added to `planning/mvp-backlog.csv` when prioritized.
22. NFR-008 (documented, tested supported-browser/responsive-breakpoint matrix) has no dedicated story; MVP-023 covers accessibility but not a browser/breakpoint test matrix. Needs a product-owner decision on whether to fold into MVP-023's acceptance criteria or add a new story.
23. NFR-010 (data retention/deletion jobs configurable by data class) is only partially covered by MVP-020, which is scoped to consent and deletion *requests*, not scheduled retention-by-data-class jobs. Needs a decision on whether MVP-020's acceptance criteria should expand or a new story is required.

Claude must not silently resolve these as facts. Use reversible defaults and record ADRs.
