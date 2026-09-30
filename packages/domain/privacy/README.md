# domain/privacy

Consent and deletion-request workflow rules per `docs/06-data-model.md` "Privacy"
(FR-004, MVP-020). Owns the pure lifecycle logic for `ConsentRecord` and
`DeletionRequest`/`DeletionRequestEvent` — state-transition validity, who may cause
which transition, and reason requirements. No Prisma dependency (`@ppu/adapter-privacy`
implements `PrivacyRepository` against Postgres).

**Does not execute erasure, anonymisation, pseudonymisation or scheduled retention** —
this story only records a request and moves it through a reviewable state
(`docs/final-decisions.md`, "MVP-020 open questions 46, 47 and 48"). Question 46 (the
eventual per-data-class treatment) and question 47 (jurisdiction-dependent
categories/timelines) both remain formally open; only their safest-default *direction*
is recorded. No legal-document text lives here or anywhere in this codebase (question
5) — `PolicyVersion` is metadata about a version, never the operative policy.
