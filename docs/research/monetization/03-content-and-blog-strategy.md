# Content and Blog Strategy

Research only. No article is created. No schema change is made. MVP-017's
real `Article` model is audited exactly as it exists today
(`10-current-architecture-inventory.md`), not as `docs/06-data-model.md`
might be read to imply.

## Target article categories (researched as a content domain, not committed to)

Common Power Apps errors, exact root causes, step-by-step fixes; delegation;
Power Fx; accessibility; responsive design; performance; Dataverse;
SharePoint; ALM; governance; PCF; Canvas components; Power Automate; Power
BI; product/platform updates; comparisons; troubleshooting decision trees.

This list is a **content domain inventory**, not a publishing plan or a
commitment to write any specific article — no content is created by this
research.

## Full capability audit — what a genuinely useful technical article needs
## to be able to record, against MVP-017's real `Article` model

| Capability | Status | Evidence |
|---|---|---|
| Article type | **Supported.** `type` enum: `TUTORIAL \| PATTERN \| COMPARISON`. | `content.prisma:50-72`, `35-39` |
| Title and slug | **Supported.** `title`, `slug` (unique). | `content.prisma:50-72` |
| Summary | **Supported.** `excerpt?` field, used for meta description. | Same |
| Author | **Partially.** `authorUserId` FK exists (`Restrict`, audit-trail rationale), but no public-facing author identity is exposed — confirmed directly: `buildArticleJsonLd` deliberately omits `author` because *"this codebase has no approved way to expose a user's identity in public structured data... every Article's author today is an internal ADMIN, not a public byline"* (MON-024). | `content.prisma`; `apps/web/lib/seo/json-ld.ts` |
| Reviewer | **Not supported at all.** No field, no JSON-LD `reviewer` output anywhere. | MON-024 |
| Created date | **Supported.** `createdAt`. | `content.prisma:50-72` |
| Published date | **Supported.** `publishedAt`, null until publish, never rewritten once set. | Same |
| Last reviewed date | **Not supported as a distinct concept.** Only `updatedAt` exists, which tracks *any* row change, not specifically "this was reviewed for freshness/accuracy." | MON-025 |
| Affected product | **Not supported.** No relation from `Article` to `Product`/`Category`. | Confirmed absent |
| Affected version or release wave | **Not supported.** No field — even though `CompatibilityRecord` already models "structured minimum release wave" for *products*, nothing equivalent exists for articles. | `evidence.prisma` (products) vs. `content.prisma` (articles, no such field) |
| Difficulty | **Not supported.** No field. | Confirmed absent |
| Prerequisites | **Not supported** as a structured field (could be embedded in `body` text, but not a discrete, filterable field). | Confirmed absent |
| Tested environment | **Not supported.** No field. | Confirmed absent |
| Symptoms | **Not supported as a structured field** — would live in `body` text only. | Confirmed absent |
| Cause | **Not supported as a structured field.** Same. | Confirmed absent |
| Numbered procedure | **Not supported as a structured field** — `body` is a single Markdown blob, rendered as plain escaped text (a deliberate stored-XSS defense, per `content.prisma`'s own header), with no sub-structure Prisma or the renderer is aware of. | `content.prisma`; `apps/web/app/learn/[slug]/page.tsx` |
| Verification steps | **Not supported as a structured field.** Same. | Same |
| Rollback steps | **Not supported as a structured field.** Same. | Same |
| Screenshots | **Not supported.** No media-attachment model for articles (the equivalent gap already exists for *products* too — `ProductMedia` is unbuilt, per PROP-001 still Proposed). | Confirmed absent |
| Code/Power Fx/YAML snippets | **Supported only as plain text inside `body`** — the deliberate plain-text rendering (no Markdown→HTML) means there is no syntax highlighting or distinct code-block treatment today; a snippet is just part of the escaped text block. | `content.prisma` header; `apps/web/app/learn/[slug]/page.tsx` |
| Warnings | **Not supported as a structured/visually-distinct field.** Only embeddable in plain `body` text. | Confirmed absent |
| Known limitations | **Not supported as a structured field.** Same. | Confirmed absent |
| References | **Not supported as a structured field** — no citation/source-link model (MON-025). | MON-025 |
| Related products | **Not supported.** No relation exists. | Confirmed absent |
| Related articles | **Not supported.** No self-relation or tagging mechanism exists on `Article`. | Confirmed absent |
| Canonical URL | **Supported, real, working.** `apps/web/lib/seo/canonical.ts`'s `learnUrl` builder, shared with metadata and JSON-LD so they can't disagree. | `10-current-architecture-inventory.md` |
| Metadata | **Supported.** `buildLearnMetadata` exists and is real, working infrastructure. | Same |
| JSON-LD | **Supported, and more specific than generic `Article` schema** — `buildArticleJsonLd` uses `"@type": "TechArticle"` and emits `dateModified` from `updatedAt`. | MON-024 |
| Revision history | **Explicitly not supported, by design.** `ArticlePublishEvent` is a bare publish-*action* log (only one action value, `PUBLISHED`, exists), not content versioning — this project's own tech debt record (TD-016, `planning/status.md`) already states this plainly: *"a bare publish-action log, not full content-version snapshotting."* | `content.prisma:77-89`; `planning/status.md` TD-016 |
| Stale-content review date | **Not supported.** Same gap as "last reviewed date" above. | MON-025 |
| Disclosure type | **Not supported.** No field for editorial/affiliate/sponsored distinction — see `05-affiliate-and-sponsorship-options.md` for the full requirement this gap maps to. | Confirmed absent |
| Sponsored or affiliate relationship | **Not supported.** Same gap. | Confirmed absent |
| Noindex/draft status | **Supported, and correctly enforced.** `Article.status` (`DRAFT \| PUBLISHED`) drives real, working sitemap and robots behavior — draft articles are excluded from the sitemap and not indexable, confirmed directly against `sitemap.ts` and `metadata.ts`'s deny-by-default posture. | `10-current-architecture-inventory.md` |

## Classification of what's missing, per this research's own required method

- **What is already supported**: article type, title/slug/summary,
  created/published dates, canonical URL, metadata, sitemap/robots
  eligibility, and real `TechArticle` JSON-LD with `dateModified`. This is a
  genuinely solid foundation for *publishing* an article correctly — the gap
  is entirely in *structured troubleshooting content* and *editorial
  trust signals*, not in basic SEO plumbing.
- **What can be represented using current fields** (documentation-only,
  no schema change needed): symptoms, cause, numbered procedure,
  verification/rollback steps, warnings, and known limitations can all be
  written into the existing plain-text `body` field today, as prose —
  functional, but not filterable, not separately styled, and not
  machine-readable as distinct fields. This is a real, usable starting
  point that doesn't require waiting for any schema change.
- **What requires only documentation** (an editorial style guide, not code):
  a consistent in-body structure/template for symptoms/cause/procedure
  sections could be established as an editorial convention today, without
  touching the schema at all.
- **What requires a future schema change**: affected product/version
  relation, difficulty, prerequisites as a structured field, references/
  citations, related-articles, reviewer, last-reviewed/stale-content date,
  disclosure type. None of these are large individually, but collectively
  they're a real, multi-field extension to `Article` — not a one-line
  addition.
- **What requires workflow or moderation**: reviewer assignment and
  stale-content review cadence are process questions as much as schema
  questions — this project already has `docs/14-accessibility-testing.md`'s
  own open question 38 (who performs manual review, how often) as a direct
  precedent for exactly this kind of unresolved "who and how often" gap,
  worth naming as a parallel, not a coincidence.
- **What is unnecessary for MVP**: rollback steps and tested-environment
  detail are genuinely valuable for troubleshooting content specifically,
  but are lower priority than the trust-signal gaps (author identity,
  reviewer, freshness) that E-E-A-T (`09-seo-editorial-and-content-quality.md`,
  MON-010) most directly rewards.

## No implementation performed

No field was added to `Article`. No admin UI was changed. No article was
written. This document is an audit against real code, not a specification
for what to build next.
