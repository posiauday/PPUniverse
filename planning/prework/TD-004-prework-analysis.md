# TD-004 Pre-Work: Job Queue Infrastructure — Analysis Only

**Status: pre-work only. No code, schema, package, or worker was created or modified by this analysis. Nothing here is a decision.**

Story instruction: direct product-owner instruction, 2026-09-24 ("STORY INSTRUCTION — TD-004 (Job queue infrastructure — pre-work only)"). Branch: `feature/td-004-job-queue-prework`, off `develop`, never `main`.

Sources read before writing this: `CLAUDE.md`, `docs/final-decisions.md`, `docs/03-trd.md`, `planning/status.md`, `planning/progress-report.md`, `docs/open-questions.md`, `planning/tech-debt/TD-004.md`, `planning/tech-debt/TD-015.md`, `planning/mvp-backlog.csv`, `docs/adr/004-technology-decision-record.md`, `docs/02-prd.md`, `packages/telemetry/src/correlation.ts`, `planning/bugs/BUG-015.md`. State verified before starting: `develop` at the post-merge head (`d195d97`), no open PRs, no overlapping work, 60GB free disk.

---

## A note on ADR-004 before anything else

`docs/adr/004-technology-decision-record.md`'s table lists "Background jobs: BullMQ + Redis." Read carelessly, this looks like an existing decision that would make the "Options" section below moot. It is not one, and this is worth stating plainly before the rest of this document, because it is exactly the kind of thing the Decision Validation Rule exists to catch.

The ADR's own **Status** line reads: *"Accepted (2026-09-21), for the testing-stack rows only... This status change records the approval of the testing stack... and does not approve or change any other row of this ADR. The status of the other rows is as recorded in `docs/final-decisions.md`; any row that is not approved there needs its own decision."* A search of `docs/final-decisions.md` for "BullMQ," "background job," and "job queue" returns zero results. The background-jobs row was never separately ratified. It is a draft table entry, not an approved choice — consistent with, not contradicted by, this story's own instruction not to select a vendor. The "Options" section below treats BullMQ+Redis as one candidate among several, not a foregone conclusion.

---

## 1. Current state — every synchronous operation, verified by reading the code

### 1a. File-scan pipeline (TD-004's own subject)

**File:** `apps/web/lib/complete-file-upload.ts`, function `completeFileUpload()` (lines 22–90). **Called from:** `apps/web/app/api/files/uploads/complete/route.ts`, `POST` handler (lines 60–66). The function's own doc comment already says: *"Runs synchronously in the request — a documented, reversible scope reduction from the TRD's async-job default... no story yet owns setting up the job queue."*

Work performed inline, all awaited before the response:
1. `storageAdapter.headObject("quarantine", storageKey)` (line 30) — S3/MinIO network call.
2. `repo.create(...)` / `repo.updateStatus(...)` — Prisma writes (lines 35–42).
3. `storageAdapter.getObjectRange("quarantine", storageKey, 0, 511)` (line 59) — a second S3 call, for magic-byte verification.
4. `storageAdapter.getObject("quarantine", storageKey)` (line 72) — a **full-object** S3 download.
5. `scanAdapter.scan(fullBytes)` (line 73) — in production, `ClamavScanAdapter.scan()` opens a raw TCP socket to clamd and streams the entire file in 64KB chunks, with a 10s **connect** timeout but no timeout on the scan itself once connected.
6. On a clean verdict, `storageAdapter.moveObject("quarantine", "clean", storageKey)` (line 77) — an S3 copy + delete, two more sequential calls.

**Latency class:** network-call class, compounding — up to four sequential S3 round-trips plus one full-file streaming AV scan, plus three-plus Prisma writes. Scales with file size (policy limit: 50MB) and clamd load.

**Failure behavior today:** a clamd connection error is deliberately turned into a `REJECTED` verdict, not an exception (fail closed). Any other thrown error surfaces as a 500 via `withObservability`'s catch-all, except `UploadNotFoundError`, which becomes a 404. **There is no retry anywhere in this path.** If the request times out or the client disconnects mid-scan, the `FileScan` row (already written to `SCANNING`/`QUARANTINED` before the slow step runs) is left stuck with no reconciliation job to notice or recover it.

### 1b. Transactional email sends (TD-015's own subject)

Three call sites, all synchronous, all confirmed by direct read:

- **`apps/web/lib/auth.ts`**, `sendVerificationRequest` (lines 31–46): calls `notificationService.sendTransactional("SIGNIN_LINK", ...)` inside NextAuth's own request handling (`apps/web/app/api/auth/[...nextauth]/route.ts`, a bare `NextAuth(authOptions)` handler, no `withObservability` wrapper). By design, a send failure re-throws and fails the sign-in request itself (comment at lines 37–39).
- **`packages/adapters/notifications/src/notification-service.ts`**, `sendTransactional()` (lines 31–46) and `sendOptional()` (lines 55–79): both `await this.emailAdapter.send(message)` synchronously. In production this is `ResendEmailAdapter.send()` — an unawaited-timeout `fetch()` POST to `https://api.resend.com/emails`. In dev/no-API-key environments, `ConsoleEmailAdapter` (no network).
- **`apps/web/app/api/account/deletion-requests/route.ts`**, `POST` (lines 67–82): the one call site that deliberately swallows the send failure in a `try/catch` — the request still blocks on the `fetch()` call before returning, but a slow/down Resend does not fail the deletion-request submission itself.

**Failure behavior today:** `recordSend()` always writes an `EmailSend` audit row (status `FAILED` on error) regardless of outcome, so there is an audit trail, but **no automatic retry exists anywhere**. For the sign-in path, failure is user-visible immediately (next-auth's own error page). For the deletion-request path, failure is silent to the user — a transient network blip means the one courtesy email is simply never sent, with only the audit row as evidence.

### 1c. Full route-by-route sweep (all 17 routes under `apps/web/app/api/**/route.ts`, read in full)

Only the two subjects above, plus one non-finding worth naming explicitly: `apps/web/app/api/files/uploads/route.ts`'s `POST` calls `storageAdapter.getSignedUploadUrl(...)`, which is local cryptographic URL-signing (the AWS SDK's presigner), **not a network call** — despite living on a "storage adapter," it does not belong in the offload-to-queue category. Every other route (`account/consent`, `account/deletion-requests/[id]`, `admin/content/*`, `admin/deletion-requests/[id]`, `files/[id]`, `health`, `me`, `me/sessions*`, `products/[slug]/entitlement`, `unsubscribe`) performs only Prisma reads/writes or local computation — no external I/O.

### 1d. Adapter sweep (`packages/adapters/*/src/*.ts`)

Only `s3-storage-adapter.ts` (network, used by 1a), `clamav-scan-adapter.ts` (network, used by 1a), and `resend-email-adapter.ts` (network, used by 1b) perform genuine external I/O reachable from a request path. `sentry-error-monitoring-adapter.ts`'s `captureException`/`captureMessage` are Sentry-SDK fire-and-forget (the SDK batches internally and does not block the caller) — not a blocking finding. Every catalog/content/entitlements/identity/privacy/files repository adapter is Prisma-only. `packages/adapters/payments/` is a **structural placeholder** (`README.md` only, no source): *"Stripe Checkout/Billing Portal/webhooks adapter (ADR 003, ADR 004). Structural placeholder only. Owning story: MVP-007."* Flagged because Stripe webhook handling is the next place this exact pattern could reappear (see §2, MVP-009 discussion, and §8).

A grep across `apps/web/app/api/**` and `packages/adapters/**` for `webhook|thumbnail|resize|indexing|process` returns zero matches in source code — no webhook handler, image processing, or search-indexing code exists anywhere in the repo today.

### 1e. `apps/worker` — exact current contents

`apps/worker/src/index.ts` (16 lines, quoted in full):
```ts
/**
 * Worker process entrypoint. Job consumers (webhook processing, email,
 * scanning, indexing, media processing) are added by the stories that own
 * them (see docs/13-implementation-readiness-plan.md §1). This baseline only
 * proves the process boots.
 */
export function describeWorker(): string {
  return "worker process ready";
}

/* c8 ignore start */
if (process.env["NODE_ENV"] !== "test") {
  console.log(describeWorker());
}
/* c8 ignore stop */
```
`apps/worker/package.json` has **no runtime dependencies at all** — only devDependencies (`@types/node`, `eslint`, `typescript`, `vitest`). No queue client, no database client, no adapters, no consumer loop, no message-broker connection, nothing that keeps the Node process alive after start. "The MVP-001 boot-proving scaffold" is not a simplification — it is a literal, word-for-word match to what the file's own comment says about itself. There is nothing here to build on top of; a real worker is being designed from zero, not extended from a partial one.

---

## 2. Consumers

For each, per instruction: what it would enqueue, what triggers it, what the user sees while it runs, what happens on failure — and where the story is not yet specified enough to answer honestly, that is stated rather than invented.

### TD-004 (file scan)
- **Enqueues:** the six-step pipeline in §1a — magic-byte check, full AV scan, zone move.
- **Triggers:** `POST /api/files/uploads/complete`.
- **User sees today:** the request blocks until scan completion, then returns the final `FileScan` status. **On a queue:** the endpoint would return `202`/`QUARANTINED` immediately (the file's `FileScan` row already models a `SCANNING` state — no new state needed), and the client would poll `GET /api/files/{id}` (already returns scan status) for a terminal result. This is a real UX change — today's caller gets a synchronous answer; a queued version means "quarantined, check back" — and needs its own product decision about how the calling UI communicates that wait, not assumed here.
- **On failure:** must not silently drop the file. A malformed/poisoned job (see §5) must not crash the worker such that other queued scans are starved.

### TD-015 (email)
- **Enqueues:** one `EmailAdapter.send()` call per message.
- **Triggers:** sign-in link creation, deletion-request acknowledgement, and any future transactional/optional message (`sendOptional` exists in code today but has no live caller in production per the adapter's own comment).
- **User sees today:** the sign-in path blocks and fails visibly if Resend is slow/down (by design, per §1b) — this is arguably *correct* current behavior for a magic-link flow (the user is about to wait on an email anyway), and moving it to a queue changes what "sign-in request accepted" means: does the request succeed once the job is *enqueued*, or only once the email is confirmed *sent*? That is a real design fork this pre-work surfaces but does not resolve (see §9).
- **On failure:** `EmailSend`'s existing audit row is already the natural de-duplication/retry record (TD-015's own proposed resolution already says this) — a `messageType` + `userId` + bounded time window is enough to detect and skip a duplicate retry attempt.

### MVP-009 — Authorized signed downloads (FR-007: *"Entitled users receive signed, expiring download links. Storage paths are never public."*)
Backlog acceptance criterion: *"Only entitled users receive expiring URL."* **This is not obviously a queue consumer as currently specified.** Signed-URL generation (`getSignedDownloadUrl`) is local cryptographic signing, not a network call — confirmed the same way `getSignedUploadUrl` was confirmed in §1c. The request/response nature of "click download, get a URL" is also latency-sensitive in a way that argues *against* queuing the URL generation itself. TD-004's own text names MVP-009 as an expected consumer, but based on what FR-007 actually says today, no specific background job is named. Plausible future candidates — recording a download event, rate-limiting entitled downloads, expiring/cleanup of stale grants — are not in FR-007's text and are not invented here. **This consumer is not yet specified enough to design against.**

### MVP-012 — Product and release editor (FR-009: *"Creator portal supports drafts, media, documentation, pricing, licenses, compatibility, releases and submission."*)
Two concrete, specification-grounded connections:
1. **Release file submission** would reuse the *exact same* scan pipeline TD-004 already covers (§1a) — a creator uploading a release file is the same malware-scan/quarantine flow MVP-006 built for any upload, not a new pipeline. This is the clearest, most concrete consumer in this list.
2. **Media** (screenshots, per the FR-003 text) is a plausible future consumer of image processing (thumbnailing, resizing) — but this is currently **PROP-001 in `planning/proposed-stories.md`, status Proposed, not approved**. No processing requirement is invented here since none is approved.

### MVP-019 — Operations console and audit (FR-015: *"Admins can manage users, creators, taxonomies, products, orders, refunds, entitlements, reviews, content, feature flags and audit logs."*)
The broadest and least-specified of the four. Bulk administrative actions (taxonomy changes across many products, refund processing that might trigger downstream emails/webhooks, audit-log generation) are plausible candidates for background work, but FR-015's text names *capabilities*, not *operations with latency characteristics*. **No specific job type is named in the current spec.** What MVP-019 concretely needs from the audit-logging side (NFR-009: *"Destructive admin actions require reason capture and audit logging"*) is synchronous, not queue-shaped — the audit record itself should commit in the same transaction as the action it records, the same append-only pattern already used for `DeletionRequestEvent`/`ArticlePublishEvent`. Flagging this because it means MVP-019 is *not* automatically a strong argument for queue infrastructure the way TD-004/TD-015/MVP-012's release-file path are; it may simply inherit whatever queue exists by then for its own bulk-action UX, if any.

---

## 3. Options

Three architectures, presented without a preferred winner, since vendor/architecture selection is explicitly not this analysis's call (it also interacts with the unresolved hosting question, open question 5).

### Option A — Postgres-backed queue (no new infrastructure)

A `job` table in the existing database, workers claiming rows via `SELECT ... FOR UPDATE SKIP LOCKED` (native Postgres row-locking, no polyfill needed), either hand-rolled or via a library (`pg-boss`, `graphile-worker` are the two mature options in this space).

- **Operational cost:** lowest. No new service to provision, monitor, back up, or secure — the existing Postgres instance (already the system of record, already backed up per NFR-007) is the queue too. No new secrets, no new network egress rules.
- **Added infrastructure:** none beyond the existing database connection the app already has. `apps/worker` becomes a long-running Node process (or scheduled invocation) polling/claiming rows — still needs *some* process to run it, whatever the hosting answer turns out to be.
- **Local/CI test story:** strong — the same embedded-Postgres-in-CI pattern already used for every DB-gated integration test in this repo (`describe.skipIf(!process.env.DATABASE_URL)`) extends directly to job-table tests. No new test infrastructure category.
- **Failure modes:** row-level locking means the queue's own reliability is exactly Postgres's reliability — no separate failure domain to reason about. Throughput ceiling is Postgres's (fine at this project's stated scale; would not be the first choice for very high job volume, which is not this project's stated problem). `SKIP LOCKED` avoids the classic double-claim race, but a worker crash mid-job requires a visibility-timeout/lease-expiry design (a claimed-but-not-completed row must become reclaimable).
- **Hosting interaction:** hosting-region-agnostic — wherever Postgres already lives, this lives. No new vendor-region decision required, which is notable given open question 5 (hosting region) is itself unresolved.

### Option B — A dedicated queue service or managed provider

Two sub-variants, since they have materially different trade-offs:

**B1 — BullMQ + Redis** (the unratified ADR-004 table entry). Requires a Redis instance (self-hosted or managed, e.g. Upstash, Redis Cloud). BullMQ is mature, well-documented, supports delayed jobs/retries/backoff/rate-limiting natively.
- **Operational cost:** a new stateful service to provision, secure, and back up (or accept Redis's queue data as non-durable/best-effort, which is a real design choice — Redis persistence modes trade durability for latency). A new secret (Redis connection string) to manage per environment.
- **Added infrastructure:** Redis, plus whatever hosts the worker process continuously (BullMQ workers are long-running, not naturally serverless-invocation-shaped).
- **Local/CI test story:** needs a real or in-memory Redis in CI (e.g. `redis-server` as a GitHub Actions service container, the same pattern already used for Postgres/MinIO/ClamAV in this repo's CI — mechanically straightforward, but it is a fourth service container, not a free lunch).
- **Failure modes:** Redis becomes a second system of record for "did this job run" — if Redis and Postgres ever disagree (e.g., Redis restarts and loses unpersisted jobs), there is a reconciliation problem this project doesn't have today. Mature retry/backoff/dead-letter support out of the box is a real strength.
- **Hosting interaction:** ties directly to a Redis vendor/region choice, which does not exist yet and would itself need to align with wherever the app and Postgres end up hosted (open question 5) — this is the concrete way B1 "interacts with the unresolved hosting question" the story instruction flags.

**B2 — A managed job/queue platform** (e.g., Inngest, Trigger.dev, AWS SQS + Lambda, Upstash QStash). Offloads the operational burden entirely to a vendor.
- **Operational cost:** lowest *ongoing* ops burden of any option (no server to run), but introduces a new vendor relationship, a new pricing model to evaluate, and — for several of these — a webhook-based invocation model that means the "worker" is actually more HTTP routes in `apps/web`, not a separate `apps/worker` process at all, which is a real architectural fork from what `apps/worker` currently implies.
- **Added infrastructure:** none self-hosted; a new external dependency and a new class of vendor lock-in.
- **Local/CI test story:** varies widely by vendor — some ship a local dev CLI/emulator (Inngest does), others are much harder to exercise offline, which matters for a project that has been consistently disciplined about not depending on live vendor calls in CI (the email/storage/scanning adapters are all designed around exactly this).
- **Failure modes:** delegated to the vendor's own SLA; the project inherits whatever that vendor's outage/incident history is.
- **Hosting interaction:** several of these platforms are most naturally paired with a specific hosting platform (e.g., Inngest with Vercel) — another concrete way vendor choice and hosting choice are coupled, reinforcing why this isn't a call to make in isolation from open question 5.

### Option C — Something else: an outbox-pattern retry, no true async worker

A middle path worth naming honestly: keep the work synchronous-in-request as today, but wrap each external call in a durable "attempt" record (an `EmailSend`-style row already exists for email; an equivalent could exist for scans) and add a lightweight, scheduled reconciliation job (a cron-triggered route, or a scheduled GitHub Action hitting an internal endpoint) that finds `FAILED`/`STUCK` rows and retries them on a delay — without building a general-purpose job queue at all.
- **Operational cost:** near-zero new infrastructure — a scheduled trigger (Vercel Cron, or any host's equivalent) calling an existing-shaped API route.
- **Added infrastructure:** none beyond a cron trigger, which most hosting platforms provide natively.
- **Local/CI test story:** simplest of all three — it's an ordinary route handler, testable exactly like every other route in this codebase today.
- **Failure modes:** does not solve the *request-blocking* problem (§1a/§1b's requests would still block on the first attempt) — it only adds a retry path for what already failed. If the goal is "don't make the user wait," this option does not achieve it; if the goal is "don't lose a failed send/scan forever," it does. This is a materially smaller solution than Options A/B and should not be presented as equivalent to them — it is included because it is honestly viable for the retry/durability half of the problem, not because it is a full substitute for a queue.
- **Hosting interaction:** minimal — cron/scheduled-trigger support is close to universal across hosting platforms, so this option is the least coupled to the unresolved hosting decision.

---

## 4. Semantics the design must answer explicitly

Answered generically per option-family where the answer differs; stated as an open question where it doesn't yet have one (see §9).

- **Delivery guarantee:** Option A (`SKIP LOCKED`) and Option B1 (BullMQ) both naturally give **at-least-once** delivery (a crashed worker's claimed-but-unfinished job becomes reclaimable and re-delivered) — **not** at-most-once. This is the right default for this project's two known consumers (a file scan or an email send both being "run again if unsure" is more correct than "silently drop"), but it means **every job handler must be idempotent by construction**, not by accident.
- **Idempotency:** for email, `EmailSend`'s existing row (message type + user + bounded time window) is already the natural dedupe key, as TD-015 itself proposes. For file scans, `FileScan`'s existing state machine (uploaded → quarantined → scanning → clean/rejected) already has a natural "already terminal, no-op" check. Neither needs a new idempotency mechanism invented — both already have one, just not wired to a retry path yet.
- **Retry policy and backoff:** not decided here. Needs a concrete answer (e.g., exponential backoff, N attempts, then dead-letter) as part of implementation, not pre-work — flagged as an open question (§9) rather than guessed.
- **Dead-letter handling:** whoever inspects a permanently-failed job is an operational/admin-tooling question that has no obvious owner yet (MVP-019, if it exists by then; otherwise nothing). Flagged as an open question (§9).
- **Ordering:** neither known consumer (file scan, email) has an ordering requirement between different jobs — each job is independent per upload/per message. Within a single upload's own multi-step pipeline, steps are already sequential by virtue of being one job (queuing doesn't need to reorder them, just move the whole sequence off the request thread, or model it as several small jobs with real inter-step ordering, which is itself a design choice not made here).
- **Visibility for a stuck/failed job:** no admin surface exists to see this today, and none is proposed by this pre-work — this is squarely MVP-019's shape (per its own FR-015 text: "admins can manage... audit logs") if it lands after queue infrastructure exists, or a gap if queue infrastructure lands first. Flagged as an open question (§9).
- **Correlation to the triggering request:** `packages/telemetry/src/correlation.ts` already exists and is built for exactly this — `runWithCorrelationId(fn, existingId)` accepts a reused ID specifically so it can be reattached across a hop, rather than minting a fresh one. **This does not happen automatically across a process boundary** — `AsyncLocalStorage` is scoped to one process's async call chain and does not survive serialization. A queued job would need its enqueue call to read `getCorrelationId()` from the request context and store it explicitly in the job payload, then the worker would need to call `runWithCorrelationId(handler, job.correlationId)` when processing it. This is a small, well-understood piece of glue code, not a redesign — but it must be deliberate, or job-side logs silently lose the correlation-ID thread the rest of this project's observability relies on.

---

## 5. Data and security impact

- **Any new table** (a job table, under Option A or as auxiliary bookkeeping under Option B) gets a hand-written, reversible migration and `ENABLE ROW LEVEL SECURITY`, per the established, unconditional convention (`docs/final-decisions.md`, 2026-09-17) — no exception proposed here.
- **What a job payload may contain:** an identifier (user ID, upload ID, product ID) and the minimal parameters needed to re-derive the work (e.g., a storage key, not the file's bytes; a message type and recipient user ID, not the rendered email body). **What it must never contain**, consistent with NFR-006 (*"Logs exclude secrets, payment details and uploaded asset contents"*) and this project's standing data-minimisation practice (already visible in `auth.ts`'s comment about never storing a raw email address before a `User` row exists): no secrets, no file contents, no rendered message bodies with PII, no payment details. A file-scan job payload should carry a storage key and re-fetch the object when the worker runs, not carry the bytes in the queue itself (this also keeps job rows small, which matters for Option A's Postgres-as-queue approach specifically).
- **Authorization a job runs with:** a worker process is not a request-scoped actor — it has no session, no user context of its own. It must run with a fixed, narrowly-scoped service identity (e.g., its own database role or its own storage/email adapter credentials), bounded to exactly the operations its known job types perform, not the app's full request-time authorization surface. This mirrors the existing pattern where `ADMIN` is "coarse-grained by design" (flagged as a known, accepted position in the dependency-analysis discussion preceding this story) — a worker's authority should be scoped even more narrowly than that, since it has no human behind it to hold accountable for an individual action.
- **What a poisoned or malformed job can do:** must not crash the worker process or block other queued jobs behind it (a lesson directly visible in §1a's own finding — a full-file AV scan with no scan-duration timeout is exactly the kind of single bad input that could otherwise monopolize a shared resource). A malformed job (unparseable payload, references a since-deleted row) should fail fast, get recorded, and free the worker for the next job — not retried indefinitely on the same bad input forever (this is part of what "dead-letter" in §4 is for).

---

## 6. Testing

- **Unit-testable in isolation:** job *handler* logic (the actual work a job does) should be a plain function taking typed input and returning a typed result, exactly the pattern this codebase already uses everywhere (`validateCompatibilityEntry`, `completeFileUpload` itself) — testable with Vitest, no real queue involved, the same way `completeFileUpload()` is already unit-testable today by injecting fake storage/scan adapters.
- **Integration-testable against a real Postgres:** under Option A specifically, the queue *mechanics themselves* (claim, lock, complete, retry-on-crash) are DB-gated integration tests exactly like every other DB-gated suite in this repo — no new test category, just new test files following the existing `describe.skipIf(!process.env.DATABASE_URL)` convention.
- **CI without real external calls:** already solved for the two known consumers — `FakeScanAdapter`/`ConsoleEmailAdapter` already exist and are already how this project avoids live vendor calls in CI. A queue layer sits *between* the trigger and these adapters and does not change that discipline; the adapters stay fakeable regardless of which option is chosen.
- **Deterministic worker testing:** the hardest part regardless of option — a worker loop is inherently about timing (poll interval, lease expiry, retry delay). The honest answer is that these need to be *injectable* (a fake clock, or a "process exactly one job and exit" mode for tests) rather than tested by actually waiting out real delays, the same discipline already visible in this codebase's `formatVerifiedDate`'s injectable `now: Date` parameter and `validateCompatibilityEntry`'s injectable `now`.
- **Interaction with BUG-015 (open, unresolved):** direct and worth naming. BUG-015 is a test-isolation race between two *packages'* integration suites sharing one CI Postgres container with no isolation. A job-queue table, if implemented as Option A, would be **exactly the same class of shared, mutable, cross-package state** — any package's integration tests that enqueue or claim jobs against a shared test database would need the same isolation discipline BUG-015's own unresolved recommendation calls for (per-package database isolation), or the new queue table becomes a second surface for the identical flake. This is a reason to resolve BUG-015's isolation strategy *before or alongside* implementing Option A specifically, not a reason to avoid Option A — but it is a real, concrete dependency between the two, not a hypothetical one.

---

## 7. Sequencing (proposal only — not added to the backlog)

Whether this is its own story or folded in: **its own story is the more defensible shape**, for one concrete reason already visible in §2 — three separate stories (TD-004's own resolution, TD-015's own resolution, and MVP-012's release-file path) would all need the *same* infrastructure, and building it inside whichever lands first means the other two inherit an architecture decision made under a different story's time pressure and acceptance criteria, not its own. TD-004 and TD-015 already independently proposed this same shape ("a dedicated 'job queue foundation' story," in both records' own words) before this pre-work was ever commissioned.

**Proposed scope (draft, not approved):** a minimal, generic job-enqueue/claim/complete/retry mechanism (whichever option is eventually chosen) plus the `apps/worker` runtime to consume it, with **no specific job handler migrated onto it as part of this story** — TD-004's file scan and TD-015's email sends migrate afterward, each as its own small follow-up (see §8), so this foundation story's own surface area stays small and reviewable.

**Proposed acceptance criteria (draft, not approved):**
- A job can be enqueued with a typed payload, claimed by exactly one worker at a time, marked complete or failed, and a failed job is retried per a defined backoff policy up to a defined attempt limit, then dead-lettered.
- A crashed worker's claimed-but-incomplete job becomes reclaimable after a defined lease timeout (no job is lost to a worker crash).
- The correlation ID present at enqueue time is present in every log line the worker emits while processing that job.
- Local and CI test suites exercise the queue mechanics without any real external vendor call.
- New table(s), if Option A, carry a reversible migration and RLS per the standing convention.
- Documentation states, explicitly, which of TD-004/TD-015/MVP-012's needs this foundation does *not* yet solve (the actual migration of those handlers onto it), so a reader doesn't assume this story silently fixes those tech-debt records.

**Proposed estimate (draft, not approved):** given no existing partial implementation to build on (§1e), real queue-mechanics testing requirements (§6), and a genuinely open architecture choice (§3) that isn't this story's own to make first — this reads as comparable in size to MVP-006 (13 points, the largest single-story estimate on the current board) rather than a small corrective change. Offered as an anchor for whoever schedules it, not a precise figure.

---

## 8. Migration path

**TD-004 (file scan):** the existing `POST /api/files/uploads/complete` handler would enqueue a job carrying the storage key and the `FileScan` row's ID (not the file bytes, per §5), then return `202` immediately. The `FileScan` state machine already models `SCANNING` as a real state — no schema change needed on that table itself for this part. The worker re-fetches the object, runs the same policy/magic-byte/scan/move sequence already written in `completeFileUpload()` (the pure logic doesn't need to change, only where it's invoked from), and updates the row on completion. **This can be done incrementally**: the same handler function could be called from either the request path (today) or a job consumer (after), behind a feature flag — CLAUDE.md's own standing rule ("Use feature flags for incomplete or risky modules") applies directly here, letting the cutover be reversible rather than a hard swap.

**TD-015 (email):** the sign-in and deletion-request call sites would enqueue an email-send job instead of awaiting `sendTransactional`/`sendOptional` directly. The open design fork named in §2 (does "sign-in request accepted" mean "email enqueued" or "email sent") needs an answer before this migrates — it is not a mechanical swap the way the file-scan path is, because the sign-in flow's current failure-propagation behavior is a deliberate design choice (§1b), not an accident to route around. **Can be done incrementally per call site**: the deletion-request acknowledgement (already fire-and-forget on failure today) is the lower-risk one to migrate first; the sign-in link send (currently blocking-and-failing by design) is the one that needs the product decision first.

**MVP-012's release-file submission**, once that story exists, would call the *same* migrated file-scan job type TD-004 established — not a new pipeline, confirming §2's point that this is the same consumer, not a distinct one.

---

## 9. Open questions surfaced (drafted for `docs/open-questions.md`, NOT yet added — see note)

**Note on placement:** the story instruction's stop-gate names only `planning/prework/TD-004-prework-analysis.md` as the file to commit. These are drafted here, fully formatted, ready to insert into `docs/open-questions.md` once reviewed — inserting them into the shared ledger before that review felt like the more conservative reading of "pre-work only," so it was not done as part of this commit. Say if you'd rather they be added now.

Each below would be its own new numbered item (next available: 52+), all **NOT APPROVED**, each with a safest reversible default stated:

1. **Job-queue architecture** (Option A/B1/B2/C from §3). *Safest reversible default if forced to pick one today:* Option A (Postgres-backed) — lowest operational cost, no new hosting-region coupling, strongest fit with this project's existing test-infrastructure discipline, and the only option that doesn't front-run the unresolved hosting decision (open question 5). Stated as the safest *default*, not a recommendation to adopt without the product owner's own comparison.
2. **Sign-in email semantics once queued**: does a sign-in request succeed once the email job is enqueued, or only once sent? *Safest reversible default:* keep today's blocking-and-failing behavior for sign-in specifically (don't migrate it in the first pass), migrate only the deletion-request acknowledgement path first, per §8's own lower-risk ordering.
3. **Retry policy and backoff parameters** (attempt count, delay curve) for any job type. *Safest reversible default:* a conservative, generic starting policy (e.g., 3 attempts, exponential backoff starting at 30s) applied uniformly, revisited per job type once real failure-rate data exists, rather than tuning per type from zero data.
4. **Dead-letter visibility/ownership**: who inspects a permanently-failed job, and through what surface, before MVP-019 (admin console) exists. *Safest reversible default:* a dead-lettered job is a normal `ERROR`-level structured log line (this project's existing observability stack, per ADR-004's OpenTelemetry/Sentry row) until a real admin surface exists — no bespoke UI built ahead of MVP-019.
5. **Worker hosting/process model** (a long-running process vs. scheduled/serverless invocation) — genuinely coupled to the unresolved hosting decision (open question 5) and not separable from it. *Safest reversible default:* none stated; this one is downstream of open question 5 resolving, not independently answerable.

---

## 10. Files that would change if implemented, and ADRs required

**If Option A (Postgres-backed) is chosen:**
- `packages/db/prisma/schema/*.prisma` — new `Job` model (or similarly named), its own migration file(s), RLS enabled.
- A new domain/adapter package pair, e.g. `packages/domain/jobs` + `packages/adapters/jobs`, following the exact structural pattern already used for every other domain (types + pure logic in the domain package, `PrismaXxxRepository` in the adapter — the same split TD-008's work and the `privacy`/`content` packages already established).
- `apps/worker/src/index.ts` — from a boot-proving stub to a real consumer loop; `apps/worker/package.json` gains real runtime dependencies for the first time.
- `apps/web/lib/complete-file-upload.ts` and its route — modified to enqueue instead of (or in addition to, behind a flag) running inline.
- `packages/adapters/notifications/src/notification-service.ts` and its two call sites (`auth.ts`, the deletion-requests route) — same shape of change.
- `packages/telemetry/src/correlation.ts` — likely no change to the module itself, but new call sites using `runWithCorrelationId`'s existing `existingId` parameter inside the worker.
- **ADR required:** a new ADR (or an amendment to ADR-004, given its background-jobs row was never actually accepted) formally deciding the queue architecture — this pre-work explicitly does not make that decision, so whichever option is eventually chosen needs its own ADR entry before implementation, consistent with `CLAUDE.md`'s "architecture defaults, not immutable vendor commitments... any change requires an ADR."

**If Option B1/B2 is chosen instead:** the same domain/adapter/worker shape above, plus a new adapter wrapping the chosen client library/SDK (mirroring how `ResendEmailAdapter`/`S3StorageAdapter` wrap their vendors today), a new CI service container (B1) or new vendor credential (B2), and the same required new ADR.

**If Option C (outbox + scheduled retry) is chosen:** smaller footprint — no new package pair, no `apps/worker` build-out; a new scheduled-trigger route plus reuse of `EmailSend`'s existing shape (and a new equivalent for file scans) as the retry bookkeeping. Still needs an ADR, since it's still a change to the TRD's stated architecture default (a durable queue), just a smaller one.

---

## Summary

No decision is made in this document. The clearest, spec-grounded findings: (1) exactly two real consumers exist in shipped code today (file scan, email), both already well-understood and already carrying their own audit/state-machine scaffolding that a queue would reuse, not replace; (2) `apps/worker` is genuinely empty — there is nothing partial to build on; (3) the ADR table's "BullMQ + Redis" reads as decided but is not, confirmed by its own Status line and the absence of any ratification in `docs/final-decisions.md`; (4) MVP-009 and MVP-019 are weaker, less-specified consumers than TD-004/TD-015/MVP-012 imply — naming them honestly as under-specified rather than inventing requirements for them; (5) BUG-015's unresolved test-isolation question has a direct, concrete interaction with Option A specifically, not a hypothetical one.
