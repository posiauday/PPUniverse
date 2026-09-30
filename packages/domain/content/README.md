# domain/content

Content-publishing rules per `docs/06-data-model.md` "Engagement and content" (FR-014,
MVP-017). Owns the pure logic for `Article` — tutorials, patterns and comparison pages,
discriminated by `type` — and its append-only `ArticlePublishEvent` audit trail: status-
transition validity, slug/title/body/excerpt validation, and public-visibility rules. No
Prisma dependency (`@ppu/adapter-content` implements `ContentRepository` against Postgres).

**Builds `Article` only.** `LearningPath`/`LearningPathItem` (an ordered sequence
referencing other content) and `SEORecord` are deferred — no types or logic for them exist
here (`docs/final-decisions.md`, "MVP-017 implementation: `Article` only this pass...";
`docs/open-questions.md` item 50). `/collections/[slug]` and `Collection`/`CollectionItem`
are out of scope of MVP-017 entirely and are never referenced by this package
(`docs/final-decisions.md`, "MVP-017 / `/collections/[slug]` scope conflict...").

**Authorization is not enforced here.** Content-publishing authority reuses the existing
`ADMIN` role (`docs/final-decisions.md`, "MVP-017 implementation: content-publishing
authorization reuses ADMIN") — this package has no notion of roles or sessions; the caller
(the API route) checks the actor is ADMIN before calling any of it.
