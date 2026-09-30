# @ppu/adapter-storage

`StorageAdapter` — the object-storage port (quarantine/clean zone model, signed upload/download URLs, MVP-006). `S3StorageAdapter` is the real implementation, S3-API-compatible so it works unchanged against MinIO (development/CI) or Cloudflare R2 (production, `docs/final-decisions.md`) — only the endpoint/credentials differ. `InMemoryStorageAdapter` is a fake for fast unit tests that don't need a real object store.
