# domain/commerce

Commerce domain rules for MVP-007 (FR-006). Slice 1 contains the order state machine, amount and currency validation, the provider-neutral webhook-verifier port (ADR 003) and the repository port. Price (slice 2) and checkout-session creation (slice 3) are not built yet; webhook handling and fulfilment belong to MVP-008. Decisions: `docs/final-decisions.md`, "MVP-007 slice 1 authorized; launch currency; refund policy; pricing mechanism".
