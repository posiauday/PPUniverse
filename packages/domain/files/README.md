# @ppu/domain-files

File-quarantine business rules (MVP-006): the `FileScan` state machine (`UPLOADED → QUARANTINED → SCANNING → CLEAN | REJECTED`, `REJECTED → OVERRIDDEN`), the `isDeliverable`/`assertDeliverable` gate (a file is deliverable only once `CLEAN` — the core acceptance criterion this story exists to enforce), upload policy (size/MIME allow-list, filename sanitization), and magic-byte MIME verification. `FileScanRepository` is the port `@ppu/adapter-files`'s `PrismaFileScanRepository` implements.
