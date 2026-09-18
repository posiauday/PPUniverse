# @ppu/domain-identity

Session-ownership business rules (MVP-002): `decideRevokeSession` — a session can be revoked by its owner, except the current session (that's sign-out, not revocation). `SessionRepository` is the port `@ppu/adapter-identity`'s `PrismaSessionRepository` implements. Scoped to what MVP-002 actually needed; the fuller identity domain (`UserProfile`, `Role`, `Permission`, `Organization`, `ConsentRecord` from `docs/06-data-model.md`) is added by the stories that need them (e.g. MVP-020 for consent).
