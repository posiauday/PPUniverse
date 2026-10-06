# MVP-036 — Email and password sign-in: build plan

**Decisions:** `docs/final-decisions.md`, 2026-10-06:
- "Sign-in methods" (passwords: yes, "build it properly");
- "Email and password sign-in: rules (MVP-036)" (12-character minimum, the HIBP check, confirm the email first).

## Requirement and acceptance (backlog row MVP-036, NFR-002)
- **Sign up** with an email and a password. A confirmation email is sent, and the password works only after the link is opened and confirmed.
- **Sign in** with an email and a password. This creates the same **database session** as the email link and Google, so `/account/sessions` lists it and sign-out works.
- **Forgot password:** an emailed link sets a new password. It works for any account, so it is also how a Google or email-link user adds a password. Setting a password signs out every other session.
- **Passwords:**
  - 12–128 characters, any characters, no composition rules;
  - refused if found in Have I Been Pwned, if they contain the email's name part or the site name, or if they are one repeated character.
- **Throttling:** failed sign-ins are limited per account (5 in 15 minutes, then a 15-minute wait) and per IP address (30 in 15 minutes). Messages never reveal whether an account exists.
- **Privacy notice:** new version, covering the password hash, the HIBP check, and stored attempt counters (hashed keys).
- **Accessibility:** every new page and state passes the WCAG 2.2 AA gate at 320 to 1280 px.

## Design
**Hashing:** Node `crypto.scrypt`, N=2^17, r=8, p=1, a 16-byte salt and a 64-byte key. Stored as `scrypt$17$8$1$<salt b64>$<key b64>`. Compared with `timingSafeEqual`. When the email is unknown, a dummy hash is still computed, so the response time doesn't reveal whether the account exists.

**Data** (migration `20261007000000_add_password_sign_in`; additive, with RLS on every new table):
- `password_credentials`: `userId` (primary key, foreign key to `users` with cascade), `hash`, `createdAt`, `updatedAt`.
- `password_tokens`:
  - `id`, `tokenHash` (unique, SHA-256 of a 32-byte random token), `purpose` (`CONFIRM_SIGNUP` | `SET_PASSWORD`), `email`, `pendingHash` (confirm-signup only), `expiresAt` (1 hour), `usedAt`, `createdAt`;
  - the raw token exists only in the email.
- `auth_throttle`: `key` (SHA-256 of `account:<email>` or `ip:<address>`), `failures`, `windowStart`, `lockedUntil`.
- `EmailMessageType` gains `PASSWORD_CONFIRM` and `PASSWORD_SET_LINK`.

**Why the pending hash sits on the token:** a password is attached to an account only by someone who opened the email. Otherwise an attacker could pre-register someone else's address with the attacker's own password, and keep it after the real owner later signs in by email link.

**Flows:**
- **Sign up:**
  - **New email:** store the pending hash on a `CONFIRM_SIGNUP` token, then send the confirmation email.
  - **Existing account:** send a `SET_PASSWORD` link instead. The page shows the same "check your email" message either way.
- **Confirm:** the link opens a page with a **Confirm** button (scanner-safe, as on `/signin/confirm`). Pressing it POSTs the token, which then:
  - creates the user with a verified email, or verifies the existing one;
  - stores the credential;
  - marks the token used;
  - signs the person in.
- **Sign in:** check the throttle, verify the password, require a verified email, create the session, and set Auth.js's session cookie (`__Secure-next-auth.session-token` on HTTPS; `HttpOnly`, `SameSite=Lax`, `Path=/`, 30 days).
- **Forgot password:** always answers "if an account exists, we've emailed a link". It sends a `SET_PASSWORD` token only to an existing account.
- **Reset:** a form with the new password POSTs with the token. It checks the password rules and HIBP, stores the hash, marks the token used, deletes all of the user's sessions, then signs in fresh.

**Forged-request protection:** every POST route requires `Origin` to match the site origin (rejected with 403 otherwise). It accepts only a JSON object of string fields, up to 4 KB (as built: form-encoded bodies were not needed, since every form posts JSON).

**Code:**
- `packages/domain/identity`: password policy, hashing, throttle decision, the flow service and its ports, plus in-memory doubles.
- `packages/adapters/identity`: the Prisma repository and the HIBP client.
- `apps/web`:
  - routes under `/api/auth/password/*`;
  - pages `/signup`, `/password/confirm`, `/password/forgot`, `/password/reset`;
  - the password form on `/signin`;
  - noindex on the new pages;
  - email copy;
  - the Privacy notice.

## Security review checklist (checked against the build before Done)
- No plaintext password or raw token is logged or stored.
- Error messages and timing don't reveal which accounts exist.
- Throttling covers both accounts and IP addresses.
- Tokens are single-use and expire after 1 hour.
- Resetting a password ends every other session.
- Requests from other origins are rejected.
- The cookie flags match Auth.js's.
- The HIBP request carries only the 5-character prefix, with padding, and has a timeout.
- The new tables have RLS.
- The CSP is unchanged: HIBP is called from the server only.

## Security review (as built, 2026-10-06)
Each checklist item, checked against the code rather than this plan:
- **No plaintext password or raw token is logged or stored.**
  - Pass: tokens are stored as SHA-256, passwords as scrypt hashes.
  - The routes log only a user ID or a failure reason.
  - The request wrapper logs route names, never queries, so a reset link's token isn't logged.
  - The forgot-password failure log keeps only the error's name.
- **Errors and timing don't reveal which accounts exist.**
  - Pass, after two fixes found in this review:
    - sign-up hashed only for new emails;
    - "forgot password" took longer for real accounts (it sent an email), and an email failure answered 500 only for them.
  - Now sign-up always hashes, both routes answer no sooner than 1.5 s (`MIN_ANSWER_MS`), and a forgot-password email failure is logged with the answer still ok.
  - Sign-in checks a dummy hash for unknown emails.
- **Throttling covers accounts and IP addresses:** pass. It also covers email sends per address and per IP. Counters are deleted a day after their last use.
- **Single-use, 1-hour tokens:** pass. Consuming a token is one conditional update, so of two racing requests only one wins (integration test).
- **Reset ends every session:** pass (domain and integration tests).
- **Other origins rejected:** pass, with a 403 on all five routes (route tests). Deploy previews have their own origin, so they refuse too: documented in `docs/15-deployment.md`.
- **Cookie flags match Auth.js:** pass. The cookie is `__Secure-next-auth.session-token`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` (route test).
- **HIBP request:** pass. It sends the 5-character prefix with `Add-Padding` and has a 2-second timeout (unit tests).
- **RLS on the new tables:** pass. All three have `ENABLE ROW LEVEL SECURITY` in the migration.
- **CSP unchanged:** pass. HIBP is called by the server only.

**Accepted risk:** someone who knows an email can lock its password sign-in for 15 minutes, by failing 5 times. The email link and Google still work, so it isn't a lockout from the account.

## Tests
- **Unit:**
  - the policy (lengths, Unicode, email and site-name rules);
  - hashing (round trip, mismatch, tampered string, parameter parsing);
  - throttle decisions;
  - the flow service with in-memory doubles: pre-registration attack, existing-account sign-up, unverified sign-in refused, reset ends sessions, expired or used token;
  - the HIBP client (padding, a match, a timeout falling back);
  - the routes (origin check, generic errors).
- **Integration** (Postgres): the repository and throttle persistence.
- **Accessibility gate:** sign-in with the password form, sign-up, check-email, confirm, forgot and reset pages, including their error states.

## Migration impact
Additive only, plus two `EmailMessageType` values. Rollback is in the migration's header. No existing row changes. Production applies it automatically on deploy (`deploy-migrations.mjs`).
