# MVP-007 Stripe Checkout pre-work (FR-006)

Documentation and pre-work only, per direct product-owner instruction
("COMBINED PRODUCT-OWNER INSTRUCTION," Phase B, 2026-09-25). **No Stripe
code, SDK, routes, schema, migration, or UI exists as a result of this
document.** MVP-007 is not started, not marked In Progress, and open
questions 3 and 7 are not closed by anything here.

## 1. Repository state

Read directly from `develop` (`8a931c69d6bd78e2f840526e5c36e9e455f87c4b`) on
a fresh branch (`docs/mvp-007-stripe-checkout-prework`), independent of the
unmerged PR #23 (MVP-012) branch — nothing here assumes PR #23's code is
merged.

- `packages/db/prisma/schema/`: no `Order`, `Price`, `Coupon`,
  `CheckoutSession`, `PaymentEvent`, `Refund`, `TaxRecord`, or
  `InvoiceReference` model exists anywhere. Only `entitlements.prisma`
  (`Entitlement`, `Download` — the MVP-010 free-download path) and
  `evidence.prisma`'s `LicenseDefinition`/`ProductLicense` (the three locked
  license tiers: Personal/Team/Enterprise, no price field) exist on the
  commerce side.
- `packages/domain/`: no `commerce`, `checkout`, `order`, or `payments`
  domain package exists (checked directly — only `catalog`, `content`,
  `entitlements`, `files`, `notifications`, `privacy` do).
- `docs/06-data-model.md`'s "Commerce" section already names the full future
  vocabulary at a one-line sketch level: *"Price, Coupon, CheckoutSession,
  Order, OrderLine, PaymentEvent, Refund, TaxRecord, InvoiceReference,
  Entitlement, EntitlementGrant, Subscription, SubscriptionItem."* This
  document treats those names as the already-approved naming direction
  (an approved doc, per the Decision Validation Rule) rather than inventing
  new ones — except where B1's decision explicitly forecloses a concept
  (`Subscription`/`SubscriptionItem` do not apply; see section 3).
- `EntitlementSource` enum today has exactly one value, `FREE_POLICY`. Its
  own header comment already names `ORDER_LINE`, `ADMIN_GRANT`,
  `SUBSCRIPTION` as future values "MVP-007/008, not built yet" — i.e. this
  is not a new gap this document is discovering, it is a previously-recorded
  placeholder now being designed against for real.
- `planning/mvp-backlog.csv`: `MVP-007,Commerce,Checkout session,P0,Ready,
  FR-006,"Price is server-derived and checkout is idempotent",
  MVP-002;MVP-005`. `MVP-008` (webhook fulfillment) depends on `MVP-007`.
  `MVP-009` (signed downloads) depends on `MVP-006;MVP-008`. `MVP-015`
  (library/orders) depends on `MVP-009`.

## 2. Decision sources

Per `CLAUDE.md`'s Decision Validation Rule, everything in this document is
sourced from exactly one of:
- **Direct product-owner instruction, this session** ("COMBINED
  PRODUCT-OWNER INSTRUCTION," Phase B, B1) — the Stripe provider/shape
  decision itself (section 3 below).
- `docs/open-questions.md` items 3 and 7 — both explicitly still open,
  narrowed but not resolved.
- `docs/06-data-model.md`'s existing Commerce sketch — an approved doc,
  read as naming direction only, not as a built or approved schema.
- Current official Stripe documentation (`docs.stripe.com`), fetched live in
  this session — cited by URL at each point it informs a design choice.

Nothing here is a guess promoted to fact. Anything not resolvable from one
of the above is recorded as an open item in section 17 or 19, not decided.

## 3. Provider decision (recorded, per Decision Validation Rule)

**Recorded as directly instructed, this session, 2026-09-25:** LowCodeStacks
will use **Stripe Checkout**, hosted mode, for selected first-party premium
products, one-time purchases only. Free/MIT-licensed products remain the
majority and bypass Stripe entirely. No subscriptions, no memberships, no
recurring charge, no saved-card billing beyond what Stripe Checkout does by
default, no usage billing, no creator payouts, no commissions, no split
payments, no Connect, no PayPal, no second gateway at launch. This decides
**provider and payment shape only** — not currency, amount, launch
countries, tax registration/collection, refund policy, support period,
update entitlement, price per licence grant, or Enterprise commercial
treatment. Open questions 3 and 7 are unaffected and stay open.

This is consistent with, and narrows, `docs/final-decisions.md`'s existing
"First-party-only publishing model" entry (no third-party seller, no
commission, no payout — matching B1's "no creator payouts, no commissions,
no split payments, no Connect" verbatim) and with open question 7's own
framing (*"a licence tier is a grant attached to a purchased product... not
a subscription plan"*) — a one-time Checkout Session per (product, licence
grant) purchase fits that framing directly; a Stripe `subscription`-mode
integration would not.

## 4. Free/premium product architecture

**Audited against the actual current schema**, not assumed:

- `Product.status` (`DRAFT`/`PUBLISHED`) exists. Nothing about premium/free
  exists on `Product` today.
- `ProductLicense` (join to `LicenseDefinition`, the three locked tiers) is
  the entitlement-*grant* concept — already built, MVP-005. It carries no
  price.
- No `Price` model exists. No product is "premium" or "free" in any stored
  sense today — every published product is free by omission, since nothing
  charges for anything yet.

**Comparison of the three options B4 poses:**

| Option | Description | Assessment |
|---|---|---|
| A. Explicit product access type | A stored field (e.g. `Product.accessType: FREE \| PREMIUM`) set directly by the ADMIN | Simple, explicit, server-authoritative, matches this project's general preference for explicit state over derived state (e.g. `Product.status`, `Release.publishedAt` are both explicit, not derived) |
| B. Derived from active approved `Price` records | "Premium" = "has at least one active `Price` row"; no separate field | Avoids a field that could drift from the real pricing state; but makes "is this free or premium" a join/query instead of a direct read, and creates an implicit rule (empty Price set = free) that a future admin action could violate by accident (e.g. deactivating the last Price silently makes a product "free" again) |
| C. Another existing domain model | No existing model fits; rejected |

**Recommendation for the eventual decision, not decided here:** Option A
(explicit `accessType` field), because it matches this project's established
pattern of explicit state fields elsewhere (`Product.status`,
`Release.publishedAt`, `FileScan.status`) rather than derived state, and
because "is this product currently premium" needs to be answerable without
depending on whether a `Price` row's *active* flag was set correctly — the
field and the Price rows would need to agree, which is itself something a
future story's tests can assert directly (`accessType = PREMIUM` implies at
least one active `Price` exists; the reverse implication is a DB-level or
application-level invariant to design when this actually gets built). **Not
decided or implemented here** — this is a recommendation for the
product-owner to confirm or reject when MVP-007 is authorized.

**Server-authoritative boundary (already decided by B1/B4, restated as a
hard constraint for the eventual implementation):** amount, currency, tax
behaviour, and entitlement scope are computed server-side from the current
`Product`/`ProductLicense`/`Price` state, never accepted from the client.
The browser may submit only an internal `productId` and `licenseDefinitionId`
(or equivalent) — never an amount, a currency, or a Stripe Price ID.

## 5. Current schema fit

What already exists and is directly reusable, unmodified:
- `Product` (id, slug, status) — the thing being purchased.
- `ProductLicense`/`LicenseDefinition` — the licence-tier grant a purchase
  would record.
- `Entitlement` (userId, productId, source, revokedAt) — already
  product-scoped and already has a `source` enum designed from the start to
  grow beyond `FREE_POLICY`. A paid purchase would add `source: ORDER_LINE`
  (the value the schema's own comment already reserves) rather than
  redesigning `Entitlement` itself.
- `User` — the buyer.
- The existing ADMIN authorization pattern (`docs/final-decisions.md`,
  reused by MVP-012/017/020) — no new role needed for checkout; a buyer
  acts as an authenticated `MEMBER`, not a new role.

What does not exist and would need to be designed (not built here): `Price`,
`Order`/`OrderLine`, `PaymentEvent` (or equivalent idempotent webhook-event
ledger), and the `EntitlementSource` enum's `ORDER_LINE` value.

## 6. Checkout Session design (analysis only — not implemented)

Sourced from
[docs.stripe.com/payments/checkout/how-checkout-works](https://docs.stripe.com/payments/checkout/how-checkout-works)
and
[docs.stripe.com/checkout/fulfillment](https://docs.stripe.com/checkout/fulfillment):

- **Mode**: `payment` (one-time), never `subscription` — matches B1's
  decision exactly. Stripe's own docs describe `payment` mode as the
  one-time-purchase mode and `subscription` mode as the recurring/mixed-cart
  mode; there is no ambiguity here.
- **Price representation**: Stripe supports either a pre-created `Price`
  object (`line_items[0][price] = {{PRICE_ID}}`) or inline `price_data`
  (amount/currency computed at session-creation time from data you already
  host). Given this project's `LicenseDefinition`/`ProductLicense` model
  already treats price as *not yet modelled* (open question 7), and a
  `Price` object per (product, licence tier) combination would need to be
  created and kept in sync with Stripe whenever a price changes, the
  **inline `price_data`** approach (amount/currency computed server-side
  from this project's own eventual `Price` model at session-creation time)
  is the shape most consistent with "server-authoritative amount, never a
  client-supplied Stripe Price ID" (B4) and avoids a second system of
  record for price. This is a design leaning for the eventual
  implementation, not a decision — the actual choice needs question 7
  (pricing) resolved first, since there is no real price to charge yet
  either way.
- **Session creation**: server-side only, from a verified internal
  `productId`/`licenseDefinitionId` pair, after re-checking (per B6):
  product is `PUBLISHED`, has a valid published release, the licence applies
  to the product, price is active, and duplicate-entitlement rules permit
  the purchase.
- **`client_reference_id`/`metadata`**: Stripe's Checkout Session object
  supports both, specifically for linking a session back to an internal
  record — this is the mechanism an eventual internal `Order`/pending-order
  id would be carried through Checkout and read back on
  `checkout.session.completed`. Only minimal internal identifiers and
  correlation metadata belong here (B6, step 7) — never PII, never payment
  details (NFR-006 precedent already established project-wide).
- **`success_url`/`cancel_url`**: Stripe supports a `{CHECKOUT_SESSION_ID}`
  placeholder substituted into `success_url` on redirect. Per B6 steps 9-10
  and Stripe's own explicit guidance, **the redirect return does not fulfil
  the purchase** — it is a UX convenience (immediate visible status) layered
  on top of the webhook, never a substitute for it. Stripe's docs are
  explicit: *"You can't rely on triggering fulfillment only from your
  checkout landing page, because it's not guaranteed customers visit that
  page."*
- **Expiration**: a Checkout Session expires 24 hours after creation by
  default (configurable 30 minutes–24 hours). A `checkout.session.expired`
  event exists for returning an abandoned pending order to a clean state.
- **Idempotency**: Stripe's API supports an `Idempotency-Key` header on
  session-creation requests generically (standard Stripe API behaviour,
  documented at
  [docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests)) —
  the internal pending-`Order` id is the natural idempotency key candidate,
  so a retried checkout-initiation request (e.g. a double-click) reuses the
  same Stripe session rather than creating two.

## 7. Webhook event design

Sourced from
[docs.stripe.com/webhooks](https://docs.stripe.com/webhooks) and
[docs.stripe.com/checkout/fulfillment](https://docs.stripe.com/checkout/fulfillment).

**Minimum event set for one-time purchases**, each with what it's for, why,
and the internal transition it would drive (not built):

| Event | Why needed | Internal transition (design only) | Owner story |
|---|---|---|---|
| `checkout.session.completed` | Primary fulfillment trigger — fires when a customer completes payment (instant methods) or completes Checkout for a delayed method (status still `processing`) | pending Order → check `payment_status`; if paid, → fulfilled | MVP-008 |
| `checkout.session.async_payment_succeeded` | Delayed/asynchronous payment methods (e.g. bank-debit-style) confirm success *after* Checkout completes | pending/processing Order → fulfilled | MVP-008 |
| `checkout.session.async_payment_failed` | The async counterpart failing | pending/processing Order → payment failed (policy-gated wording, see section 9) | MVP-008 |
| `checkout.session.expired` | An abandoned Checkout Session times out | pending Order → expired, no entitlement created | MVP-008 |
| `charge.refunded` (or `refund.created`, exact event tbd against pricing/refund policy) | A refund needs to move a fulfilled Order/Entitlement | Blocked pending question 3 (refund policy) — recorded as blocked, not designed further | Not yet owned |
| Dispute/chargeback event (`charge.dispute.created`) | A dispute needs at minimum an audit trail entry | Blocked pending question 3 | Not yet owned |

**Explicitly not subscribed to by default**, per B7's "do not subscribe to
every event": anything Subscription/Billing-related (out of scope per B1),
Connect/connected-account events (no Connect), Radar/fraud-review events
beyond what Checkout handles internally, and any event type not in the
table above until a real need is identified.

**Required principles, all directly from the fetched documentation, not
invented:**
- **Raw body required.** Stripe's own docs state signature verification
  fails if a framework has "manipulated" the raw request body — the
  eventual webhook route must read the raw bytes before any JSON-parsing
  middleware touches them.
- **`Stripe-Signature` header**, HMAC-SHA256, verified against the
  endpoint's own `whsec_...` secret (distinct from the API secret key).
  Manual verification (if not using an official library) extracts a
  timestamp (`t=`) and a `v1=` signature, rejects any non-`v1` scheme
  (downgrade-attack protection), and uses constant-time comparison.
- **Replay protection**: the timestamp is itself part of the signed payload;
  official libraries default to a 5-minute tolerance window. Stripe
  explicitly warns never to set tolerance to `0` (that disables the recency
  check entirely).
- **Event ordering is not guaranteed.** Stripe's own docs: *"Don't use
  `created` to determine event order or whether you've already processed an
  event."* — track event IDs, not timestamps.
- **Idempotent processing required**: the same event can be delivered more
  than once; Stripe's own recommendation is to log processed event IDs and
  skip already-logged ones. This project's own established pattern
  (`ArticlePublishEvent`, `ConsentRecord`/`DeletionRequestEvent`,
  `EmailSend`) is an append-only audit table with a unique constraint on the
  provider's own event id — the same shape applies directly here (a
  `PaymentEvent` table keyed on Stripe's `event.id`, unique, is the natural
  design once built).
- **Fast, durable acceptance**: Stripe expects a `2xx` response within
  roughly 10 seconds before Checkout's own optional wait-then-redirect
  behaviour times out; complex fulfillment logic should not block the
  response. This project has no job queue yet (`TD-004`, open) — the
  eventual MVP-008 implementation needs its own answer to "durable but
  fast," which is out of scope to design here (see section 17).
- **Automatic retries**: Stripe retries failed webhook deliveries for up to
  3 days (live mode) with exponential backoff; a `5xx`/timeout response
  triggers a retry, so a transient internal failure is self-healing as long
  as the handler correctly fails loudly (non-2xx) rather than silently
  swallowing an error.
- **No card data stored, ever** — Checkout is PCI-scope-reducing by design
  (hosted page); this project never sees raw card details. No webhook
  secret or full payment payload belongs in logs (NFR-006's existing
  discipline, unchanged).
- **Safe unknown-event handling**: an event type not explicitly handled
  should be acknowledged (`2xx`) and ignored, not treated as an error —
  matches Stripe's own example handler pattern (`else: unhandled event
  type`, still returns `200`).

`PROP-007` (job-queue foundation) remains separate and unaffected by this
document.

## 8. Event ownership

Every event in section 7's table is explicitly assigned to **MVP-008**
(Verified webhook fulfillment), which already exists in the backlog and
already depends on MVP-007. This document does not propose a new story for
webhook handling — MVP-008's existing scope already covers it
(`"Signature and duplicate event tests pass"`).

## 9. Order and Entitlement state mapping (design only)

Existing states (already built): `Entitlement` has no status field beyond
`revokedAt` (null = active). No `Order` exists yet.

**Gaps identified, explicitly not resolved here:**
- **Order states** needed at minimum: pending (Checkout Session created,
  not yet paid), paid/fulfilled, expired (session timed out unpaid), and —
  **blocked pending question 3** — a refunded state and a
  disputed/chargeback state. This document does not invent refund or
  dispute *policy*; it records that the state exists as a design slot and
  is blocked.
- **`EntitlementSource.ORDER_LINE`** — the schema comment already reserves
  this name; adding it is a one-line additive enum change when MVP-007 is
  actually authorized, not proposed as done here.
- **Distinguishing licence grant vs. price vs. billing event vs. Order vs.
  Entitlement vs. support entitlement vs. update entitlement** (B8's
  explicit list): `ProductLicense`/`LicenseDefinition` is the licence-grant
  concept (built). `Price` (unbuilt) would be the amount charged for a
  specific licence-grant-on-a-product. `PaymentEvent` (unbuilt) is the
  Stripe-event ledger. `Order`/`OrderLine` (unbuilt) is the internal
  purchase record. `Entitlement` (built, product-scoped) is the download
  right. "Support entitlement" and "update entitlement" have **no existing
  model or decision at all** — `docs/09-marketplace-operations.md`'s
  Support model section documents platform-supported/community-
  supported/unsupported *declarations* on a product, not a *buyer's*
  entitlement to support responses, and no update-entitlement concept
  exists anywhere in the current schema or docs. **Recorded as a genuine
  open gap** (not invented an answer to) — see section 17.

## 10. Idempotency design (principles only)

- **Checkout-session creation**: idempotency key = the internal pending
  `Order`'s id (once that model exists), so a duplicate client-side
  "Buy" click reuses the same Stripe session rather than creating two.
- **Webhook processing**: idempotency key = Stripe's own `event.id`,
  recorded in an append-only ledger (this project's established pattern,
  see section 7) before any fulfillment side effect runs; a duplicate
  delivery of the same `event.id` is a no-op.
- **Fulfillment itself**: per Stripe's own guidance
  ([fulfillment doc](https://docs.stripe.com/checkout/fulfillment)), the
  `fulfill_checkout`-equivalent function must be safe to call more than
  once, possibly concurrently, for the same Checkout Session — it must
  check current Order/Entitlement state before acting, not assume it is the
  only caller. `Entitlement`'s existing `@@unique([userId, productId])`
  constraint (MVP-010 precedent) already gives a real, race-safe idempotency
  boundary at the database level for "does this user already have this
  entitlement" — the same pattern would extend directly to a paid
  entitlement.

## 11. Recovery design (principles only)

- **Local failure after successful payment** (Stripe's payment succeeded,
  this project's own fulfillment logic then throws): the payment is not
  lost — Stripe's automatic retry (up to 3 days) re-delivers the webhook if
  the handler returned non-2xx; if the handler returned 2xx but failed
  *after* acknowledging (a genuine bug class), the append-only
  `PaymentEvent` ledger (recorded before the 2xx, section 7) is the
  recovery anchor — a reconciliation job (not designed here, likely
  PROP-007/TD-004-adjacent) could re-drive fulfillment for any acknowledged
  event whose Order never reached "fulfilled."
- **No fabricated synchronous queue** (B7's explicit instruction) — this
  document does not propose building a queue to solve this; it notes that
  TD-004 (no job-queue infrastructure) is a real, already-recorded
  prerequisite question MVP-008's eventual implementation will need to
  answer, not invents a workaround here.

## 12. Security and privacy

- Amount, currency, Stripe Price ID (if ever used), and tax behaviour are
  always server-computed; a client-supplied value for any of these is
  rejected outright, mirroring MVP-012's own "never trust a client claim
  about scan status" discipline applied to `attachReleaseFile`.
- Webhook signature verification is mandatory, using the raw body and the
  endpoint-specific `whsec_...` secret; IP allowlisting (Stripe publishes
  its sending IP ranges) is Stripe's own recommended *additional* layer,
  not a replacement for signature verification.
- No card data ever reaches this project's own servers or logs (Checkout's
  hosted-page design keeps this project out of PCI scope for card handling
  entirely).
- No webhook secret, API secret key, or complete payment payload in logs,
  screenshots, documentation, PR text, or chat — matching NFR-006's
  existing, unchanged discipline.
- A free product must never create a real (or fake) paid Order — the free
  path (MVP-010, already built) and the eventual premium path must remain
  structurally distinct code paths, not a shared path with a bypassed price
  check.

## 13. Accessibility impact (design only)

No page or state exists yet, so nothing is built or gated here. When
MVP-007/MVP-008 are actually implemented, per this project's standing rule
("any future new page/state must join the established accessibility
matrix," restated directly in B11), the following states would need
`admin-*`-equivalent... no — **buyer-facing** — Playwright a11y coverage
at the existing four widths (320/375/768/1280) across all three engines,
mirroring the `admin-content-*`/`admin-products-*` convention this session
already established for MVP-012:
- Free product: a "Free" label, no checkout button, the existing MVP-010
  free-acquisition action (already built and already gated).
- Premium product: a "Premium" label, licence selection, a "Buy" action
  gated on server-confirmed purchasability (price display itself is
  blocked until question 7 is answered).
- Status-page states (B11's list): processing, fulfilled, payment
  incomplete, fulfillment delayed, already-owned, unavailable, support
  path. **Never** a state that shows "purchase complete" merely because
  Stripe redirected the browser — that status must reflect the actual,
  server-confirmed Order state, not the redirect having happened.

Stripe-hosted Checkout itself handles the payment-entry page's own
accessibility (Stripe's own docs claim Checkout pages have "structure and
labeled controls" and accommodate screen-reader users) — this project owns
the accessibility of product selection, licence selection, the redirect
landing page, status states, errors, order history, and library access, per
B11's explicit boundary statement.

## 14. Test strategy (design only)

Per B10's list, organized by boundary:

**Domain/unit (fakes, no network):** free product bypasses Stripe entirely;
unpublished product rejected; product without a valid published release
rejected (this reuses MVP-012's own `checkProductPublishReadiness`/
`publishProductWithRelease` concepts directly — a product that was never
validly published has nothing to sell); invalid licence rejected; missing
or inactive Price rejected; client-supplied amount/currency/Stripe-Price-ID
rejected; duplicate-purchase handling (already-entitled user re-attempting
purchase); unauthenticated purchase attempt rejected.

**Integration boundary (Stripe test/sandbox mode, per B10's explicit
instruction — never mocked away for the signature-verification tests
specifically):** valid webhook signature accepted; invalid signature
rejected; missing signature rejected; a modified raw body rejected (proves
the raw-body-integrity requirement is actually enforced, not just
documented); duplicate event (same `event.id` twice) is a no-op; out-of-
order event delivery does not corrupt state; unknown event type
acknowledged, not errored; wrong/missing Order metadata handled without a
crash; an already-fulfilled Order receiving a second completion event is a
no-op; a payment-succeeded event followed by a simulated local fulfillment
failure is recoverable (ties to section 11).

**No real charge, ever, in CI or locally** — Stripe's test-mode API keys
and the Stripe CLI's local-forwarding tooling (`stripe listen`) are the
sanctioned mechanism; no production credential appears in CI, a fixture,
a test, or a log, matching B9's constraints exactly.

**Refund/dispute test paths stay explicitly policy-gated** (blocked on
question 3) — not written until the policy exists to test against.

## 15. Manual Stripe checklist (nothing marked complete)

**A. Possible now, in Stripe sandbox/test mode (no blocker):**
- Create/access a Stripe account and its sandbox/test-mode API keys.
- Install the Stripe CLI and run `stripe listen --forward-to
  localhost:<port>/webhook` for local webhook testing (yields a temporary
  `whsec_...` test secret).
- Explore the Checkout Sessions API and webhook event objects in test mode
  with fabricated, non-production products.

**B. Blocked until business/legal-account information is available:**
- Business verification (Stripe requires legal entity/business details for
  live-mode activation) — this is exactly the kind of "legal entity and
  commercial readiness" open question 51 already flags as unresolved and
  explicitly not claimed to exist.
- Bank/payout account setup for receiving real funds.

**C. Blocked until price and currency decisions exist:**
- Creating any real `Price` object (or even deciding whether to use
  `Price` objects vs. inline `price_data`) — open question 7.
- Any tax-registration or tax-collection configuration — open question 3.

**D. Blocked until a public deployment URL exists:**
- Registering a production webhook endpoint (requires a publicly accessible
  HTTPS URL — local `stripe listen` forwarding is the only option before
  this exists).

**E. Required immediately before live activation (not sandbox):**
- Full business verification.
- A registered, HTTPS, publicly reachable webhook endpoint with its
  production `whsec_...` secret stored as a real environment value (never
  in git, `.env.example`, tests, fixtures, logs, screenshots, docs, PR
  text, or chat — B9's constraint, restated).
- A decided minimum live-mode event subscription set (section 7's table,
  confirmed against real pricing/refund decisions by then).
- Confirmed currency, launch countries, and tax position (questions 3 and 7,
  resolved).

No manual task above is marked done. No credential of any kind was
requested from, or should be pasted by, the product owner as part of this
document.

## 16. Likely implementation files (naming only, nothing created)

Consistent with this project's existing package-per-domain convention
(`packages/domain/<name>` + `packages/adapters/<name>`, MVP-012/017's exact
precedent):
- `packages/domain/commerce/` (or `checkout`) — pure Order/Price/
  fulfillment-state rules, mirroring `packages/domain/catalog/src/
  product.ts`'s style (no DB, no Stripe SDK, no knowledge of who is
  calling).
- `packages/adapters/commerce/` — the Stripe-SDK-touching adapter
  (`StripeCheckoutAdapter` or similar), mirroring `packages/adapters/
  notifications`'s `ResendEmailAdapter` precedent (one adapter package per
  external vendor).
- `packages/db/prisma/schema/commerce.prisma` — `Order`, `OrderLine`,
  `Price`, `PaymentEvent` (schema only, when authorized).
- `apps/web/app/api/checkout/route.ts` (session creation) and `apps/web/
  app/api/webhooks/payments/route.ts` (webhook receiver) — matching
  `docs/07-api-contracts.md`'s existing sketch (`POST /api/checkout`,
  `POST /api/webhooks/payments`).
- `apps/web/app/products/[slug]/` — buyer-facing Buy/Free UI additions.
- `apps/web/app/account/orders/` or similar — order history (feeds MVP-015).

None of these exist yet. This section names likely locations for planning
purposes only.

## 17. Schema gaps (explicitly unresolved, not invented around)

- `Price`, `Order`, `OrderLine`, `PaymentEvent`, `Refund`,
  `TaxRecord`/`InvoiceReference` — all named in `docs/06-data-model.md`'s
  sketch, none built, none designed in column-level detail here (blocked on
  questions 3/7 for the fields that matter — currency, amount, tax, refund
  shape).
- `EntitlementSource.ORDER_LINE` — additive enum value, trivial once
  authorized.
- "Support entitlement" / "update entitlement" (B8) — **no existing model,
  no existing decision, not even a sketch in `docs/06-data-model.md`**. This
  is a genuine gap this document surfaces rather than resolves. Recommend a
  new open question when MVP-007 is scoped for real: does a buyer's
  entitlement to *future updates* of a product differ from their entitlement
  to *download it at all* (both currently modeled as one undifferentiated
  `Entitlement` row), and does "support" mean anything buyer-specific beyond
  the product-level `SupportPolicy` declaration that already exists
  (MVP-005)?
- Job-queue infrastructure for durable-but-fast webhook processing (TD-004,
  already open, cross-referenced not re-litigated here).

## 18. Dependencies on PR #23

MVP-007/MVP-008 do not structurally depend on MVP-012's code. They do
depend conceptually on MVP-012's `checkProductPublishReadiness`/
`publishProductWithRelease` concepts for "is this product actually sellable"
(section 14) — that dependency is recorded as **pending PR #23**, not
assumed merged; this document does not treat any MVP-012 code as current
`develop` state, since PR #23 is not merged as of this writing. When MVP-007
is actually scoped, re-verify against `develop`'s real state at that time,
not against this document's assumptions.

## 19. Boundaries imposed by questions 3 and 7

- **Question 3** (countries/currencies/tax/refunds) — narrowed to Canada/US
  only as a *proposed*, **not approved**, default; nothing about tax
  registration, collection, or a refund policy is decided. Every place this
  document mentions currency, refund, or dispute handling is explicitly
  blocked on this question, not designed further.
- **Question 7** (pricing) — narrowed to first-party pricing only; license
  tiers are locked (Personal/Team/Enterprise) but no price exists for any
  of them. Every place this document mentions an amount, a `Price` object,
  or a "premium" product's actual cost is blocked on this question.

Neither question is closed by this document, per explicit instruction.

## 20. Explicit non-goals (restated, unchanged)

No Stripe SDK installed. No Checkout implemented. No webhook implemented.
No API routes created. No UI created. No schema or migration created. No
Stripe Products or Prices created (even in test mode, none were created as
part of writing this document — the sandbox exploration in section 15.A is
a recommendation for later, not something performed here). The product
owner's Stripe account was not configured. No credentials were requested.
No real environment values were added anywhere. Tax, refunds, coupons,
subscriptions, saved cards, PayPal, and Stripe Connect are not implemented.
PR #23 and MVP-012 code are untouched by this branch. Nothing was merged.

## 21. Can MVP-007 safely begin before questions 3 and 7 are resolved?

**No, not for a real implementation — but narrow, schema-only groundwork
could, with an explicit product-owner decision to authorize exactly that
scope.**

Reasoning: the *mechanism* (Stripe Checkout, hosted, one-time payment mode,
webhook-driven fulfillment) is now decided (section 3) and does not depend
on questions 3/7. But nearly every concrete field this mechanism needs to
carry — amount, currency, tax behaviour, refund/dispute state — is exactly
what questions 3 and 7 gate. Building `packages/domain/commerce`'s pure
Order-state-transition rules and the `PaymentEvent` idempotency ledger
*shape* could reasonably proceed without those answers (they don't need a
real currency or price to be structurally correct), but the `Price` model,
the actual Checkout Session line-item construction, and any UI showing a
buyer a real amount cannot be built honestly without them. **Recommendation
for the product owner's decision, not made here:** if MVP-007 is authorized
to begin, scope its first slice to the parts genuinely independent of
questions 3/7 (Order/PaymentEvent schema and state machine, webhook
signature verification plumbing, the free-product path staying untouched)
and explicitly gate the Checkout-Session-creation/pricing slice behind
those questions being answered — mirroring how MVP-012 itself was scoped to
exclude price entirely rather than block on it.
