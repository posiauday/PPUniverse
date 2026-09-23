# MVP-018 pre-work analysis — Transactional email and preferences (FR-013)

Story instruction: "STORY INSTRUCTION — MVP-018 (FR-013, Transactional email and preferences)", 2026-09-22, direct product-owner instruction. **Pre-work only.** This document stops after the analysis, per the instruction's explicit closing line — nothing here authorizes implementation.

## State verified before starting

- `develop` at `d22d473` (PR #9's merge commit, confirmed against `gh pr list --state all` — all nine prior PRs MERGED, none open), no overlapping MVP-018 work found anywhere in the repo or any branch name.
- `feature/mvp-018-email` created from `develop`. Never `main`.
- C: free space: **3.36GB** (`Get-PSDrive C`, 3,522,768,896 bytes free), above the 2GB threshold — checked before any local command this round.
- Read this round: `docs/final-decisions.md` (grepped for the email/provider-abstraction rows, and re-confirmed nothing MVP-018-relevant was added since), `docs/08-security-privacy-compliance.md` (held from the MVP-020 round, re-confirmed unchanged), `docs/open-questions.md` (all current items, especially 1 and 19), `planning/mvp-backlog.csv` and `planning/backlog.csv` (MVP-018's row), `planning/requirement-traceability.csv` (FR-013's row), `docs/adr/003-provider-abstraction.md`, `docs/13-implementation-readiness-plan.md` §§1–2, `docs/02-prd.md` (FR-013's literal wording), `docs/06-data-model.md` ("Engagement and content" section), `packages/adapters/email/src/email-adapter.ts` and its test, `apps/web/lib/auth.ts`, `planning/tech-debt/TD-004.md`, `apps/worker/src/index.ts`, `apps/web/.env.example`, `turbo.json`. `planning/status.md` and `planning/progress-report.md` are held from having just written them this session (MVP-020's completion); re-grepped for anything MVP-018-relevant — nothing found beyond the auth.ts comment already covered below. The MVP-020 consent implementation is held from having built it this session.

## Requirement IDs

- **FR-013** (`docs/02-prd.md` line 30, read verbatim): *"Users can save products and manage update notifications."*
- `planning/mvp-backlog.csv` row 19: MVP-018, P1, "Transactional email and preferences", acceptance summary "Required messages send and optional messages respect preference", depends on MVP-002 (Done).
- **A traceability finding, not a conflict, flagged for the record:** `planning/requirement-traceability.csv`'s FR-013 row lists both `MVP-015` and `MVP-018` against it, described as "E2E library + notification preference". `MVP-015` ("Library orders and saved items", depends on MVP-009, not started) owns the literal "save products" half of FR-013's PRD wording; MVP-018 owns the "notification preference" half, framed by the backlog as a general transactional-email mechanism, not specifically the "update notifications for saved products" feature the PRD sentence names. This story instruction's own scope boundary confirms this reading explicitly: "product updates" is listed under OUT ("templates for features that do not exist"), because no saved-product/update-notification trigger exists yet — `SavedProduct` and `Notification` (per `docs/06-data-model.md`'s "Engagement and content" list) are not built. This is the same kind of requirement-fragment split MVP-010/MVP-009 already established for FR-005/FR-007 — recorded here for traceability accuracy, not something this pre-work resolves or needs a decision on.

## Confirmed acceptance criteria

Directly from the backlog row, nothing added: (1) required (transactional) messages send, (2) optional messages respect the user's preference. The story instruction's scope boundary narrows this further, explicitly: build the mechanism and only the messages whose trigger exists today — not a general notification system, not campaigns, not templates for unbuilt features.

## Answers to the seven questions (required before any design)

### 1. Existing sender

**MVP-002's magic-link sign-in sends mail today via `apps/web/lib/auth.ts`'s `ConsoleEmailAdapter`** (confirmed by direct read): `next-auth`'s `EmailProvider.sendVerificationRequest` callback constructs the message and calls `emailAdapter.send(...)`, where `emailAdapter = new ConsoleEmailAdapter()` — a dev/test-only implementation that logs instead of sending (`packages/adapters/email/src/email-adapter.ts`). This is the *only* call site of `EmailAdapter`/`ConsoleEmailAdapter` anywhere in `apps/web` (confirmed by grep — no other file imports it).

**The codebase already documents the intended answer to this question**, independently of this story instruction: `email-adapter.ts`'s own module comment reads *"provider integration... [is] MVP-018's scope... this interface is the seam MVP-018 implements a real vendor adapter against"*, and `auth.ts`'s comment reads *"Replaced by a real vendor EmailAdapter in MVP-018."* Both were written during MVP-002, before this story existed as an instruction — this is a pre-wired seam, not a design I am inventing.

**Proposed: migrate `auth.ts` onto the new abstraction in this story.** Cost of migrating: near zero — swap which `EmailAdapter` implementation `auth.ts` constructs (one line), based on whether a vendor API key is configured, exactly mirroring `apps/web/lib/error-monitoring.ts`'s already-proven pattern (`SENTRY_DSN` present → real adapter, absent → console fallback). Cost of *not* migrating: two parallel sending paths permanently (sign-in mail stays on `ConsoleEmailAdapter` forever, or grows its own separate vendor wiring) — exactly the outcome the instruction says to avoid, and one this codebase's own comments already reject. Migrating is the only credible answer.

### 2. Transactional versus optional

**The rule, not a list:** a message is **transactional** when it is necessary for the user to retain or exercise control over their own account or a request they made — it must never be gated by consent, because gating it would block access to functionality the user is otherwise entitled to. A message is **optional** when its purpose is promotional or non-essential to account function — it must check `ConsentRecord` (MVP-020, category `MARKETING_EMAIL`) at send time, server-side, never from a cached or client-supplied value.

**Existing triggers classified against that rule, today:**
- **Sign-in magic link** (MVP-002) — transactional. Blocking it on consent would lock the user out of their own account.
- **Deletion-request lifecycle events** (MVP-020: submitted, withdrawn, under review, approved, denied, completed) — transactional in category (a security/account-status notice, matching the instruction's own worked example, "deletion-request acknowledgement"), **but building this requires adding a `send` call inside MVP-020's already-completed route files** (`apps/web/app/api/account/deletion-requests/route.ts` and its siblings, `apps/web/app/api/admin/deletion-requests/[id]/route.ts`) — a change to completed-story behaviour beyond what question 1 requires (question 1 only covers `auth.ts`). Per the do-not-implement list's explicit instruction, this is **flagged, not built, and recorded as an open question below** rather than decided here.
- No optional-message trigger exists today (no marketing campaign, no digest, nothing FR-016-adjacent) — confirmed, and explicitly OUT of scope regardless. The consent-*check* mechanism is still required to be built now (see "Required in any implementation" in the story instruction, unconditional on a real optional message existing), the same "enforce the condition now, even though nothing yet exercises it" precedent `revokedAt` (MVP-010) and the `Restrict` FK (MVP-020) already established.

### 3. Sending domain

**Open question 1 (product name, domain and trademark clearance) is confirmed still open** (`docs/open-questions.md`, read this round). Resend (the decided vendor, `docs/final-decisions.md` line 38) requires a verified sending domain before it will deliver mail for real.

**What can be built and tested without one:** everything except an actual production send. The adapter, the audit table, the consent-check enforcement, the unsubscribe token model and landing page, the preference UI, and every unit/integration/accessibility test — all of these are exercised against a fake/console adapter or a mocked HTTP call, never a live domain. **What is blocked:** the `ResendEmailAdapter` ever being the adapter actually selected in a real deployment. Proposed (matching `error-monitoring.ts`'s exact pattern): `emailAdapter = RESEND_API_KEY ? new ResendEmailAdapter({ apiKey, from }) : new ConsoleEmailAdapter()` — production without a key falls back to logging instead of failing to start, and CI (which will never set `RESEND_API_KEY`, since no domain exists to verify) automatically exercises the same non-sending path it already does today. No domain is selected, registered or assumed anywhere in this design.

### 4. Synchronous versus queued

**`apps/worker` is confirmed still just the MVP-001 boot-proving scaffold — no consumers exist** (confirmed by reading `apps/worker/src/index.ts` directly). `TD-004.md` already documents that no story owns job-queue infrastructure and that MVP-006's scan pipeline runs synchronously for exactly that reason.

**Sending in the request path is the only option available, and it is acceptable for this story's scope**, for the same reason TD-004 accepted it: no alternative exists without building the queue, which this authorization explicitly forbids. What fails when the provider is slow or down: the HTTP request that triggered the send blocks for however long the provider call takes (or times out); a failed send does not roll back the primary action it was attached to (see question 7). **This compounds the same underlying gap TD-004 already names, not a new one** — proposed: a new, narrowly-scoped tech-debt record (not folded into TD-004's file-scan-specific text) cross-referencing it, to be filed when this story ships.

### 5. Unsubscribe

**Proposed: a stateless, signed token — no new database table.** The token is an HMAC-SHA256-signed payload of exactly `{ userId, category: "MARKETING_EMAIL", exp }`, signed with a **dedicated** secret (`EMAIL_UNSUBSCRIBE_SECRET`, new — not reused from `NEXTAUTH_SECRET`, which exists for a different purpose; reusing a secret across unrelated purposes is an avoidable weakening). Proposed expiry: 30 days (a conventional, reversible default — configurable later, not a product decision).

**Scope, precisely:** verifying the token yields exactly one thing it is allowed to do — call `recordConsent({ userId, category: "MARKETING_EMAIL", granted: false, policyVersionId: null })` for the one `(userId, category)` pair baked into it. The verification function rejects any decoded category other than `MARKETING_EMAIL` outright (defensive, even though nothing else is ever minted today) — it cannot read, write or reveal anything about `TERMS_OF_SERVICE` consent, a deletion request, or any other field.

**Cannot enumerate addresses or reveal registration, by construction:** an invalid signature, an expired token, and a well-formed-but-tampered payload all render the *identical* "this link is no longer valid" page — no distinct error message discloses which case occurred, and none of them queries the database by email address at all (the token carries an opaque `userId`, never an email). A guesser cannot use this endpoint to test whether an address exists — there is no address-shaped input anywhere in the flow.

**Cannot alter any other preference:** the token's payload is fixed at mint time; the verification function has no path from a valid token to any field other than the one `granted` write it performs.

**GET must not have side effects (a real, known email-link pitfall):** email clients and security scanners routinely *prefetch* links in email bodies, including unsubscribe links. If `GET /unsubscribe?token=...` performed the unsubscribe directly, a prefetch could silently withdraw consent the user never asked to withdraw. Proposed: `GET` renders a confirmation page only (token validated, category and outcome not yet applied); a `POST` — triggered by an explicit button click — performs the actual write. This mirrors ordinary CSRF-safe design, not a new pattern.

**Nothing currently embeds a minted token in a real outgoing email**, since no optional message exists yet to embed one in (see question 2) — the mechanism is built and tested regardless, the same "enforce/build the seam before anything exercises it" precedent already established.

### 6. Testing

**No fake/capture adapter is required beyond what already exists.** `interceptSignInSend` (the existing e2e helper) intercepts `**/api/auth/signin/email` at the *browser* level — the real server route, and therefore whatever `EmailAdapter` it is configured with, is never invoked during those tests today, confirmed by reading `packages/e2e/src/auth-intercept.ts` directly. For any *new* server-side send this story adds (sign-in stays covered the same way it already is), the production test/CI server has no `RESEND_API_KEY` set (question 3), so it automatically falls back to `ConsoleEmailAdapter` — no network call, nothing to intercept, matching the existing, already-proven fallback pattern exactly.

**For the `ResendEmailAdapter` itself** (a genuinely new adapter, needing its own tests): propose unit tests that mock the global `fetch` call the adapter makes to Resend's plain REST API (`https://api.resend.com/emails`) — no new SDK dependency, since Resend's send endpoint is a single JSON POST; mocking `fetch` is the same technique this repository already uses nowhere else *yet*, but is the standard, minimal approach and needs no new test infrastructure.

### 7. Failure and retry

**Proposed: attempt once, record the outcome, never retry in this story.** A failed send is caught, recorded in the new audit table as `FAILED` (see "Proposed entities" below), and reported via `@ppu/telemetry` — but it **never fails or rolls back the primary action it is attached to** (for `auth.ts`'s sign-in link: `next-auth`'s own existing error handling already covers a `sendVerificationRequest` throw, unchanged by this story; for any future transactional trigger, the pattern is: perform the primary write first, attempt the send after, let a send failure be visible in the audit trail and telemetry without undoing what the user actually asked for). **No retry** — proposed explicitly, because retrying synchronously in the request path (question 4) would only add latency/timeout risk without a queue to defer it to, and because a naive retry risks a duplicate send with no de-duplication mechanism available without one. Retry is deferred to whichever future story builds real queue infrastructure and can de-duplicate against the audit table's own `(userId, messageType, createdAt)` history.

## Proposed entities and fields

One new table (`packages/db/prisma/schema/notifications.prisma`), matching this repository's established multi-file schema convention. **No `NotificationPreference` table is proposed** — MVP-020's `ConsentRecord` (category `MARKETING_EMAIL`) already *is* the notification preference for the one real optional category that exists; building a second, parallel preference store would duplicate what already exists and let the two drift. This story's preference-related work is entirely about *enforcing* that existing record at send time and *acting on it* via the unsubscribe flow — not storing it again.

### `EmailSend`
| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | No | |
| `userId` | `String?` | Yes | Nullable: a first-time sign-in link may be sent before a `User` row exists for that identifier (Auth.js's database-strategy flow). No raw email address is stored here or anywhere in this table — data minimisation, matching `Download`'s (MVP-010) and `ConsentRecord`'s (MVP-020) precedent. |
| `messageType` | `EmailMessageType` enum | No | `SIGNIN_LINK` only, proposed for now — see "Remaining ambiguities" on the deletion-request types |
| `status` | `EmailSendStatus` enum | No | `SENT`, `FAILED`, `SKIPPED_NO_CONSENT` |
| `providerMessageId` | `String?` | Yes | The vendor's own message id, when `SENT` — for support/debugging, not a secret |
| `createdAt` | `DateTime @default(now())` | No | |

Cardinality: **one row per send attempt**, append-only (an audit trail — no `UPDATE` path, matching every table this session has built). `onDelete: Restrict` on `userId` (nullable, so this only constrains rows that do have one) — a deliberate consistency choice with MVP-020's `Restrict` precedent for the same reason: an audit trail should not be destroyed by the event it is auditing.

## Constraint and index plan

- `email_sends`: `@@index([userId])`, `@@index([messageType, createdAt])` (for support/debugging queries: "show recent sign-in-link sends").
- FK `onDelete`: `Restrict` on `userId`, consistent with MVP-020.
- No `CHECK` constraints beyond Prisma's column types.

## RLS statements

```sql
ALTER TABLE "email_sends" ENABLE ROW LEVEL SECURITY;
```

Following the established, unconditional convention — zero policies, enabled in the same migration that creates the table.

## Hand-written migration plan

One migration, `<timestamp>_add_notifications`, generated via `prisma migrate dev --create-only` and hand-reviewed to add the `ENABLE ROW LEVEL SECURITY` statement above. Purely additive — no existing table altered, fully reversible (`DROP TABLE "email_sends"` is the rollback).

## Authorization model

- **Sign-in send:** unchanged authorization surface — `next-auth`'s own flow, no new endpoint.
- **Unsubscribe:** deliberately **not** session-based (question 5) — authorization is the possession of a valid, unexpired, correctly-scoped token, nothing else. No endpoint here ever checks `getServerSession`.
- **No new authenticated preference-management endpoint is needed** — MVP-020's `POST /api/account/consent` already lets a signed-in user toggle `MARKETING_EMAIL`, self-only, deny-by-default (built and reviewed in that story). This story does not duplicate it.

## Repository and query changes

- `packages/adapters/email` (existing, extended): add `ResendEmailAdapter implements EmailAdapter`, calling Resend's REST API via `fetch`, config `{ apiKey, from }` — mirrors `SentryErrorMonitoringAdapter`'s constructor-config shape exactly.
- `packages/domain/notifications` (new): `EmailMessageType`, `EmailSendStatus` types; `isTransactionalMessageType(type)`; unsubscribe token mint/verify functions (`mintUnsubscribeToken`, `verifyUnsubscribeToken`), pure aside from using Node's built-in `crypto` for HMAC (no vendor dependency, consistent with `packages/e2e/src/prefix.ts` using `randomBytes` directly without being called an adapter).
- `packages/adapters/notifications` (new): `PrismaNotificationService` — `recordSend(...)` (writes `EmailSend`), `sendTransactional(type, userId, message)` (always sends via the injected `EmailAdapter`, records the outcome), `sendOptional(type, userId, category, message)` (checks `PrivacyRepository.getCurrentConsent` first; sends and records `SENT`/`FAILED`, or records `SKIPPED_NO_CONSENT` without sending).

## UI surface

- **`/unsubscribe`** (new, unauthenticated) — `GET` with a `?token=` query param renders a confirmation page (valid token → "Unsubscribe from marketing email?" with a POST-triggering button; invalid/expired → the generic "This link is no longer valid" denial, indistinguishable across every failure reason). `POST /api/unsubscribe` performs the write and the page then shows the confirmation state.
- **No new authenticated preference page** — `/account/privacy`'s existing `MARKETING_EMAIL` `ConsentToggle` (MVP-020) already is the preference management UI. Proposed: extend its *accessibility-gate coverage* with explicit loading/saved/error states for that specific control (currently only implicitly exercised as part of the page's general states, not asserted on directly) — a test-coverage addition, not new production UI, and not a change to MVP-020's component code.
- Required states for the accessibility gate, mapped: empty (`/unsubscribe` with no/garbage token — denial state), loading (the `ConsentToggle`'s own submitting state, or a held-open `POST /api/unsubscribe`), saved (`ConsentToggle` after a successful toggle), error (`ConsentToggle` after a failed toggle; `/unsubscribe` after a failed `POST`), denied (`/unsubscribe` with an invalid/expired token), unsubscribe-confirmation (`/unsubscribe` after a successful `POST`).

## Security impact

- No direct provider SDK calls from feature code — the Resend `fetch` call lives inside `ResendEmailAdapter` only.
- Provider API key: `RESEND_API_KEY`, environment variable only; added to `turbo.json`'s `globalPassThroughEnv` and `apps/web/.env.example` with a placeholder; production falls back to `ConsoleEmailAdapter` (never fails to start) when absent, matching `SENTRY_DSN`'s pattern.
- New secret: `EMAIL_UNSUBSCRIBE_SECRET`, dedicated (not reused from `NEXTAUTH_SECRET`), same treatment.
- No recipient address or message body in logs or telemetry — `@ppu/telemetry` calls carry `messageType`, `status`, `userId` (when known) only; `EmailSend` itself stores no address either (data minimisation).
- Consent checked from the persisted `ConsentRecord` at send time, server-side, inside `sendOptional` — never a client-supplied flag, never cached (re-read fresh on every call, matching MVP-010/020's "never trust a stale value" precedent).
- Unsubscribe token: narrow scope, generic denial on every failure mode, no address-shaped input anywhere in the flow, `GET` has no side effects (see question 5's full reasoning).
- No compliance claim: email copy is product copy; no line in it may state or imply GDPR/PIPEDA/CCPA compliance, a legal right, or a guaranteed timeframe — carried into the do-not-implement restatement below.

## Accessibility impact

- `/unsubscribe`'s new states join `packages/e2e/src/pages.ts`'s inventory and `page-routes.ts`'s `GATED_ROUTES`, at 320/375/768/1280 across all three engines — not an exclusion entry.
- The `ConsentToggle` loading/saved/error states are new *test* coverage of an *existing* component — no new production accessibility surface, but real new gate coverage closing a gap this pre-work found (MVP-020 never asserted on `ConsentToggle`'s own transient states directly).

## Telemetry

`email.send_attempted` (`messageType`, `userId` when known) and `email.send_result` (`messageType`, `status`, `userId` when known) — no address, no body, no subject line beyond what `messageType` already implies. `consent.recorded` already exists (MVP-020) and fires unchanged when the unsubscribe `POST` calls `recordConsent`.

## Test plan

- **Unit** (`packages/domain/notifications`): `isTransactionalMessageType`; `mintUnsubscribeToken`/`verifyUnsubscribeToken` — valid roundtrip, expired, tampered payload, wrong category all rejected uniformly.
- **Unit** (`packages/adapters/email`): `ResendEmailAdapter` against a mocked `fetch` — success, non-2xx response, network failure.
- **Integration** (`packages/adapters/notifications`, real Postgres): `sendTransactional` always sends and records `SENT`/`FAILED`; `sendOptional` records `SKIPPED_NO_CONSENT` and does not call the adapter when consent is absent/withdrawn; records `SENT` when granted.
- **Route/API**: `POST /api/unsubscribe` — valid token succeeds and is idempotent on replay (consistent with `ConsentRecord`'s append-only design — a second withdrawal is not an error); invalid/expired/tampered/wrong-category tokens all return the same generic failure.
- **Accessibility**: the new `/unsubscribe` states and the extended `ConsentToggle` states, at the existing four widths and three engines.

## Exact files expected to change

**New:**
- `packages/db/prisma/schema/notifications.prisma`
- `packages/db/prisma/migrations/<timestamp>_add_notifications/migration.sql`
- `packages/domain/notifications/package.json`, `src/index.ts`, `src/message-types.ts`, `src/unsubscribe-token.ts` (+ tests)
- `packages/adapters/email/src/resend-email-adapter.ts` (+ test) — extending the existing package
- `packages/adapters/notifications/package.json`, `src/index.ts`, `src/notification-service.ts`, `src/notification-service.integration.test.ts`
- `apps/web/app/unsubscribe/page.tsx`, `apps/web/app/api/unsubscribe/route.ts` (+ a client component for the confirm button)
- New states in `packages/e2e/src/pages.ts`; `page-routes.ts` gains `/unsubscribe`

**Modified:**
- `apps/web/lib/auth.ts` — selects `ResendEmailAdapter`/`ConsoleEmailAdapter` by `RESEND_API_KEY` presence (question 1)
- `turbo.json` (`globalPassThroughEnv`), `apps/web/.env.example` (`RESEND_API_KEY`, `EMAIL_UNSUBSCRIBE_SECRET` placeholders)
- `planning/requirement-traceability.csv` (FR-013 row, on completion)

**Not touched without explicit confirmation:** `apps/web/app/api/account/deletion-requests/**`, `apps/web/app/api/admin/deletion-requests/**` (the deletion-request-email candidate — see open question below).

**Not touched at all:** everything under "Do-not-implement list" below, and no completed MVP-001/002/003/004/005/006/010/020/021/022/023 behaviour beyond `auth.ts` (question 1).

## Remaining ambiguities (not resolved here)

1. **Deletion-request-triggered emails** — recorded as an open question below, not decided here.
2. **`EmailMessageType`'s eventual full set** — only `SIGNIN_LINK` is proposed now; adding a value later is one additive migration, not a redesign (the same reversibility argument used throughout this project's enum choices).
3. **Unsubscribe token expiry (30 days)** — a reasonable, reversible technical default, not a product decision; can be tuned later without a schema change (it is not stored, so nothing to migrate).

## Open questions recorded

One new item added to `docs/open-questions.md` this round (item 49), explicitly **not approved**, safest reversible default recorded, not decided unilaterally:
- **49** — whether this story should add deletion-request-lifecycle email notifications, which requires modifying MVP-020's already-completed route files beyond what question 1 (the sign-in-sender migration) requires. Safest default: **not built** in this story; only the sign-in migration touches an existing route.

Open question 1 (product name/domain) already fully covers why production sending is blocked — no new item needed for that; question 3 above states the consequence, not a new decision.

## Do-not-implement list (restated, unchanged)

MVP-007, 008, 009, 011, 012, 013, 017; TD-004, 005, 006, 008, 009, 010; BUG-002; PROP-001 to PROP-006; pricing; Offer structured data; analytics (FR-016); creator and collections routes; compatibility workflow; search-behaviour changes; the deferred per-product sign-in policy field; erasure execution or retention jobs; promoting `develop` to `main`. No modification to completed MVP-001/002/003/004/005/006/010/020/021/022/023 behaviour beyond `auth.ts` (question 1) — the deletion-request-email candidate is flagged above, not built, pending open question 49. No gate check weakened, skipped, quarantined or conditionally excluded. The accessibility self-check stays permanent and unconditional. BUG-014 stays open, monitor-only, permanently instrumented — not touched. Open questions 2, 3, 7, 8, 24, 46 and 47 remain open — none resolved as a side effect of this analysis.

## Stopping here (2026-09-22)

Per the story instruction's explicit closing line: this document stops after the pre-work analysis. Nothing here is authorized for implementation. One item is recorded in `docs/open-questions.md` (49), explicitly not approved. Awaiting product-owner review of this analysis and a decision on item 49 (and any other question raised here) before any code is written.
