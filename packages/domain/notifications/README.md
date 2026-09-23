# domain/notifications

Transactional email rules per `docs/06-data-model.md` (FR-013, MVP-018): the
transactional/optional boundary (`isTransactionalMessageType`) and the stateless,
signed unsubscribe-link token (`mintUnsubscribeToken`/`verifyUnsubscribeToken`). No
Prisma dependency (`@ppu/adapter-notifications` implements the send/audit orchestration
against Postgres; `@ppu/adapter-email` implements the vendor call itself).

**No `NotificationPreference` model lives here or anywhere** — MVP-020's
`ConsentRecord` (category `MARKETING_EMAIL`) already is the notification preference.
This package enforces it at send time; it does not store it a second time.

Only two message types exist: `SIGNIN_LINK` and `DELETION_REQUEST_SUBMITTED`
(`docs/final-decisions.md`, "MVP-018 open question 49" — every other deletion-request
state was deliberately declined a message, on truthfulness grounds for
`APPROVED`/`COMPLETED` and pending product-owner copy for `DENIED`). No marketing
campaigns, no digest scheduling, no broadcast sending.
