# @ppu/adapter-catalog

`PrismaCatalogRepository` — the Prisma-backed implementation of `@ppu/domain-catalog`'s `CatalogRepository` port (MVP-003, MVP-004, MVP-005). Product queries filter to `status: "PUBLISHED"` at the query level (not just in application logic afterward) — a `DRAFT` product is never fetched for a public page in the first place.

`findPublishedProductDetailBySlug` (MVP-005) returns the product plus its evidence: license tiers (in tier order), the newest *published* release as the current version, the support declaration, and compatibility entries (in platform-area order). Every evidence relation is optional — a product created before MVP-005 comes back with empty arrays / nulls, which the page renders as "not provided yet". Nothing is inferred or invented on read. `lastVerifiedAt` comes back as a `YYYY-MM-DD` calendar date (the column is a `DATE`, so there is no time-of-day or timezone to get wrong).

Integration tests (`*.integration.test.ts`) need a migrated Postgres and self-skip without `DATABASE_URL`; CI provides one. They also probe the database-level CHECK / unique / foreign-key constraints on the evidence tables, as a second line of defence behind the domain validator.
