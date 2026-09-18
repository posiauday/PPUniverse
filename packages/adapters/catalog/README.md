# @ppu/adapter-catalog

`PrismaCatalogRepository` — the Prisma-backed implementation of `@ppu/domain-catalog`'s `CatalogRepository` port (MVP-003). Product-listing queries filter to `status: "PUBLISHED"` at the query level (not just in application logic afterward) — a `DRAFT` product is never fetched for a public page in the first place.
