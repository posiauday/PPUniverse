# @ppu/adapter-email

`EmailAdapter` — the transactional-email port (MVP-002). `ConsoleEmailAdapter` is the current dev/test implementation (logs instead of sending); the real vendor is decided (Resend, `docs/final-decisions.md`) but not yet built — that's MVP-018's scope, which implements a `ResendEmailAdapter` against this same interface.
