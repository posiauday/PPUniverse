# @ppu/domain-catalog

Catalog visibility rule (MVP-003, FR-001): `isPubliclyVisible` — only `PUBLISHED` products ever appear on a public page; `DRAFT` products exist in the database (once a creator/moderation pipeline writes them — MVP-011/012/013/014) but are never rendered. `CatalogRepository` is the port `@ppu/adapter-catalog`'s Prisma implementation satisfies.

Scoped to exactly what MVP-003 needs. Filtering (FR-002) is MVP-004's scope; the full evidence-field product detail model (license, version, compatibility) is MVP-005's.
