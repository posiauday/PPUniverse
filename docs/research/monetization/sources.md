# Sources

Source inventory for the monetization architecture audit. Every factual
claim traces to one of these sources via `claims-register.csv`'s `SourceUrl`
column.

| Title | Publisher | URL | Retrieved | Type | Topics | Limitations | Can change? | Review by |
|---|---|---|---|---|---|---|---|---|
| AdSense Program policies | Google | https://support.google.com/adsense/answer/48182?hl=en | 2026-09-24 | Official documentation | Advertising, prohibited behaviors | Policy text can change | Yes | 2026-12-24 |
| EthicalAds Publisher page | EthicalAds | https://www.ethicalads.io/publishers/ | 2026-09-24 | Vendor site | Advertising, publisher requirements | Stated preference, not confirmed as an absolute cutoff | Yes | 2026-12-24 |
| Carbon Ads join/about pages | Carbon Ads | https://www.carbonads.net/join; https://www.carbonads.net/about | 2026-09-24 | Vendor site (via search-result summary) | Advertising, publisher requirements | Summarized, not a full verbatim fetch | Yes | 2026-12-24 |
| GitHub Docs — About sponsorships, fees, and taxes | GitHub | https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/about-sponsorships-fees-and-taxes | 2026-09-24 | Official documentation | Sponsorship fees | None | Yes | 2026-12-24 |
| GitHub Docs — About GitHub Sponsors | GitHub | https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors | 2026-09-24 | Official documentation | Sponsorship eligibility | None | Yes | 2026-12-24 |
| Google Search Central — Creating helpful, reliable, people-first content | Google | https://developers.google.com/search/docs/fundamentals/creating-helpful-content | 2026-09-24 | Official documentation | Content quality, SEO, AI-content disclosure | None | Yes | 2026-12-24 |
| FTC — Endorsement Guides: What People Are Asking | US Federal Trade Commission | https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking | 2026-09-24 | Official documentation | Affiliate/sponsorship disclosure | US-specific; no Canadian equivalent researched | Yes | 2026-12-24 |
| Repository source (Prisma schema, package READMEs, route structure, SEO logic) | This repository | `packages/db/prisma/schema/*.prisma`, `packages/domain/*/README.md`, `packages/adapters/*/README.md`, `apps/web/lib/seo/*.ts`, `apps/web/app/**` | 2026-09-24 | Repository evidence | Architecture inventory | Point-in-time snapshot, verified by direct read via an Explore agent this session | Yes, as the codebase evolves | 2026-10-24 |
| `docs/research/power-apps-components/` | This repository (prior research package, same session) | `docs/research/power-apps-components/*` | 2026-09-24 | Repository evidence (prior research) | Competitor evidence, licensing, PROP-008 decision | Cross-referenced, not re-verified in this pass | As that package is extended | 2026-12-24 |
| `docs/open-questions.md`, `docs/final-decisions.md`, `docs/06-data-model.md`, `docs/09-marketplace-operations.md`, `docs/02-prd.md`, `planning/status.md` | This repository | Repository paths | 2026-09-24 | Official documentation (internal governance) | Existing decisions, MVP status, requirements | Point-in-time snapshot | Yes, as governance decisions are made | 2026-10-24 |

## Notes on source quality

- Every vendor-site source (EthicalAds, Carbon Ads) is classified
  `VendorClaim` in the claims register — self-reported requirements, not
  independently audited.
- Google, FTC, and GitHub sources are `OfficialDocumentation` — primary,
  authoritative sources fetched directly, with short verbatim quotes
  preserved in the relevant numbered files.
- Repository evidence (Prisma schema, package structure, route inventory)
  was gathered by a dedicated read-only Explore agent this session, with
  exact file paths and line numbers reported and independently spot-checked
  against the real files this document references — not paraphrased from
  `docs/06-data-model.md`'s placeholder list.
- No source in this table is `IndependentEvidence` in the strict
  third-party-audit sense — every external source is either the platform's
  own official documentation or a vendor's own site.
