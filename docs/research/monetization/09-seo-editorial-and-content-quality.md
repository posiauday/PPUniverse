# Content Quality and SEO

Research only, grounded in current official Google Search guidance (retrieved
2026-09-24, `claims-register.csv` MON-009 through MON-012). No programmatic
article generation is proposed. No AI-generated text is proposed as
publishable without human review. No Microsoft documentation is proposed to
be copied.

## The real guidance, quoted precisely

- **Who/How/Why framework**: *"Is it self-evident to your visitors who
  authored your content?"* (who); readers benefit from knowing *how* content
  was produced; the *why* should be to help people, not primarily to attract
  search traffic (MON-009).
- **E-E-A-T**: *"content demonstrates aspects of experience, expertise,
  authoritativeness, and trustworthiness... trust is most important"*
  (MON-010).
- **AI-generation and disclosure**: Google's own framing is a self-assessment
  question — *"is the use of automation, including AI-generation, self-
  evident to visitors through disclosures?"* — not a blanket mandatory-label
  rule for every use of AI assistance. What Google explicitly calls a
  violation is using automation/AI-generation *for the primary purpose of
  manipulating search rankings* (MON-011). This distinction matters: it is
  not "never use AI assistance," it is "don't hide automated mass-production
  behind a human byline to game rankings."
- **Mass-production and thin rewriting**: explicitly discouraged — content
  *"mass-produced by or outsourced to a large number of creators"* or
  content that is *"mainly summarizing what others have to say without
  adding much value"* (MON-012).

## What the architecture would need to support this well

Audited against `10-current-architecture-inventory.md`'s findings on
MVP-017's actual `Article` model and editorial surface — this section states
the requirement; that file (and `03-content-and-blog-strategy.md`) states
what exists today.

- **Visible authorship** — a real author identity attached to and displayed
  with the content, not just an internal `authorUserId` foreign key used for
  audit purposes only.
- **Author expertise signal** — some way to convey why the author is
  credible for this specific topic (a bio, a role, a track record) — this is
  editorial content, not architecture, but the *field to hold it* is an
  architecture question.
- **Source citations** — a structured or at least consistent way to link to
  primary sources (Microsoft Learn pages, official release notes) rather
  than uncredited paraphrase.
- **Meaningful update history** — not just a `publishedAt` timestamp, but a
  real "last reviewed" or "last updated" signal distinct from first
  publication, which E-E-A-T and content-freshness both depend on.
- **Descriptive headings, canonical URLs, structured metadata** — this
  project already has real, working infrastructure for this (MVP-021, FR-017:
  canonical URLs, Open Graph/Twitter tags, JSON-LD). The open question for
  articles specifically is whether the *same* machinery already covers
  `Article` pages, or needs an article-specific extension (e.g., `TechArticle`
  or `HowTo` JSON-LD types, which are more specific than generic `Article`
  schema and could be a real, cheap SEO improvement if not already present).
- **Sitemap inclusion only for published/indexable content** — this project
  already has a real, tested deny-by-default robots policy (MVP-021: *"every
  page `noindex` unless it opts in"*) — the question for articles is whether
  draft/unpublished articles are correctly excluded, which should already be
  true given `Article.status`'s `DRAFT | PUBLISHED` enum, but is worth
  confirming directly rather than assuming.
- **Related-content links, breadcrumb metadata** — editorial/UX work more
  than a schema gap, assuming the underlying data (category, related
  articles) already exists to link from.
- **High-quality social images** — ties to the same `ProductMedia`-style
  gap already recorded as open in this project's own tech debt (PROP-001,
  Product Media and Screenshots, still Proposed) — articles would likely
  need an equivalent, not yet built for either asset type.
- **Content freshness review** — a real editorial process (who reviews, how
  often), not purely a schema field — but the schema needs a place to record
  *when* a review last happened, distinct from publication.
- **Correction notices** — visible, not silent, corrections. This project's
  existing pattern for `Article` is append-only publish *events*
  (`ArticlePublishEvent`), which is a start, but whether a content
  *correction* (as opposed to a publish action) is modeled at all needs
  confirming against the real schema.
- **Editorial independence** — a policy statement, covered in
  `05-affiliate-and-sponsorship-options.md`, relevant here because it's part
  of what makes E-E-A-T's "trust" component credible.

## What this research explicitly does not recommend

- **No programmatic article generation as a shortcut.** Per MON-012's own
  guidance, and per this project's own standing practice throughout this
  session (every prior research package in this repository has been
  human-verified, source-cited work, not bulk-generated content) — a
  content strategy built on mass-produced or thinly-rewritten pages would
  directly contradict the guidance this section is grounded in, not just be
  a stylistic choice.
- **No AI-generated text published without human review.** Consistent with
  MON-011's actual framing (disclosure of automation, not prohibition of
  assistance) — the safe, defensible position is: AI assistance is fine as a
  drafting tool, but a human reviews and takes editorial responsibility for
  what's published, the same discipline this project's own `CLAUDE.md`
  already applies to itself ("generated wording is never treated as final,"
  per `docs/final-decisions.md`'s existing precedent for `PolicyVersion` and
  the deletion-request acknowledgement copy).
- **No copying Microsoft documentation.** Beyond the obvious copyright
  concern, MON-012's "mainly summarizing what others have to say without
  adding much value" is precisely what copied-and-lightly-rewritten
  documentation would be — the opposite of what would make LowCodeStacks's
  own technical content actually rank or actually help anyone.
