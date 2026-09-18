# @ppu/adapter-files

`PrismaFileScanRepository` — the Prisma-backed implementation of `@ppu/domain-files`'s `FileScanRepository` port (MVP-006). Re-enforces the domain layer's state-machine transition rules at the point of every write, so an invalid status transition can't reach Postgres even if a caller bug bypassed the domain-layer check.
