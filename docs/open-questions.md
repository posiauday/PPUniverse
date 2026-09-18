# Open Questions and Decision Log

1. Product name, domain and trademark clearance?
2. First-party-only or invited third-party creators at MVP?
3. Initial countries, currencies, taxes and refund obligations?
4. Identity provider and enterprise SSO requirements?
5. Hosting region and data residency commitments?
6. Supported Power Platform versions and compatibility evidence method?
7. Exact license families and team/enterprise entitlement model?
8. Creator commercial terms and manual versus automated payout model?
9. File types, maximum sizes and malware-scanning provider?
10. Which MVP inventory is genuinely ready and owned for publication?
11. Which analytics categories require consent in launch jurisdictions?
12. Support ownership and published service targets?

## Technical decisions raised during implementation readiness planning (2026-09-16)
13. Final monorepo tooling confirmation (Turborepo vs. Nx) — default assumed is Turborepo; see `docs/adr/004-technology-decision-record.md`.
14. Redis/queue hosting (managed vs. self-hosted) and its region, once hosting region (item 5) is decided.
15. Malware-scanning vendor and cost model (ties to item 9).
16. Whether PostgreSQL Row-Level Security should supplement application-layer authorization as defense-in-depth, or app-layer checks alone are the accepted MVP posture. Concrete evidence from MVP-002 (2026-09-17): Supabase's own security advisor flags RLS-disabled as an ERROR-level finding on every table by default — see `planning/tech-debt/TD-003.md`.
17. GitHub repository visibility, branch protection rules, and required status checks for issue/PR automation.
18. Error-monitoring/APM vendor selection, including data-residency constraints tied to item 5.
19. Whether the chosen email vendor has data-residency constraints tied to item 5.
20. CI time/cost budget for the full test suite (unit + integration + E2E + accessibility) and its effect on PR feedback latency.

## Requirement coverage gaps found during traceability completion (2026-09-16)
21. FR-016 (funnel-event analytics without unnecessary personal/source-code data) has no backlog story in `planning/mvp-backlog.csv`. Either fold it into an existing story's acceptance criteria (e.g., MVP-022 Observability) or add a new backlog story — needs a product-owner decision since it changes backlog scope.
22. NFR-008 (documented, tested supported-browser/responsive-breakpoint matrix) has no dedicated story; MVP-023 covers accessibility but not a browser/breakpoint test matrix. Needs a product-owner decision on whether to fold into MVP-023's acceptance criteria or add a new story.
23. NFR-010 (data retention/deletion jobs configurable by data class) is only partially covered by MVP-020, which is scoped to consent and deletion *requests*, not scheduled retention-by-data-class jobs. Needs a decision on whether MVP-020's acceptance criteria should expand or a new story is required.

Claude must not silently resolve these as facts. Use reversible defaults and record ADRs.
