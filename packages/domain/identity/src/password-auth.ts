import { createHash, randomBytes } from "node:crypto";
import {
  hashPassword,
  needsRehash,
  verifyAgainstDummy,
  verifyPassword,
} from "./password-hashing.js";
import { checkPasswordLocally, type PasswordProblem } from "./password-policy.js";
import {
  ACCOUNT_RULE,
  IP_RULE,
  isLocked,
  recordFailure,
  type ThrottleRule,
  type ThrottleState,
} from "./sign-in-throttle.js";

/**
 * Email and password sign-in flows (MVP-036; docs/plans/mvp-036-password-sign-in.md).
 *
 * The rule that shapes everything here: a password is attached to an account
 * only by someone who has opened an email sent to that address. A sign-up
 * keeps its password hash on the emailed token until the link is confirmed, so
 * nobody can pre-register someone else's address with their own password.
 *
 * Answers never reveal whether an account exists: sign-up and "forgot
 * password" always say "check your email", and a failed sign-in is always
 * "email or password is incorrect".
 */

export type PasswordTokenPurpose = "CONFIRM_SIGNUP" | "SET_PASSWORD";

export interface StoredToken {
  email: string;
  pendingHash: string | null;
}

export interface PasswordAuthStore {
  findUserByEmail(email: string): Promise<{ id: string; emailVerified: Date | null } | null>;
  /** Creates the user with a verified email, or marks an existing one verified. */
  createOrVerifyUser(email: string, now: Date): Promise<{ id: string }>;
  getCredential(userId: string): Promise<string | null>;
  setCredential(userId: string, hash: string): Promise<void>;
  createToken(token: {
    tokenHash: string;
    purpose: PasswordTokenPurpose;
    email: string;
    pendingHash: string | null;
    expiresAt: Date;
  }): Promise<void>;
  /** The unused, unexpired token, without using it up. */
  peekToken(
    tokenHash: string,
    purpose: PasswordTokenPurpose,
    now: Date,
  ): Promise<StoredToken | null>;
  /** Marks the token used and returns it, only if it was unused and unexpired (atomically). */
  consumeToken(
    tokenHash: string,
    purpose: PasswordTokenPurpose,
    now: Date,
  ): Promise<StoredToken | null>;
  createSession(userId: string, sessionToken: string, expires: Date): Promise<void>;
  deleteSessions(userId: string): Promise<void>;
  getThrottle(key: string): Promise<ThrottleState | null>;
  saveThrottle(key: string, state: ThrottleState): Promise<void>;
  clearThrottle(key: string): Promise<void>;
}

/** true = found in a breach; false = not found; null = couldn't check (service unavailable). */
export interface BreachChecker {
  isBreached(password: string): Promise<boolean | null>;
}

export interface PasswordMailer {
  sendConfirmSignup(email: string, token: string): Promise<void>;
  sendSetPassword(email: string, token: string, userId: string): Promise<void>;
}

export interface PasswordAuthDeps {
  store: PasswordAuthStore;
  breaches: BreachChecker;
  mailer: PasswordMailer;
  siteName: string;
  now?: () => Date;
  /** Called when the breach check couldn't run, so the outage is logged. */
  onBreachCheckUnavailable?: () => void;
}

export const TOKEN_LIFETIME_MS = 60 * 60_000;
export const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60_000;
/** Emails per address (and per IP) per hour, so nobody can flood an inbox. */
export const MAIL_RULE: ThrottleRule = {
  maxFailures: 5,
  windowMs: 60 * 60_000,
  lockMs: 60 * 60_000,
};
const MAIL_IP_RULE: ThrottleRule = { maxFailures: 20, windowMs: 60 * 60_000, lockMs: 60 * 60_000 };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPlausibleEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

/** The value stored for a token or throttle key: SHA-256, hex. Raw values never touch the database. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export type SignUpResult =
  { ok: true } | { ok: false; problems: PasswordProblem[] } | { ok: false; invalidEmail: true };
export type SignInResult =
  { ok: true; userId: string } | { ok: false; reason: "invalid" | "locked" };
export type TokenResult = { ok: true; userId: string } | { ok: false; reason: "invalid-link" };
export type ResetResult = TokenResult | { ok: false; reason: "weak"; problems: PasswordProblem[] };

export class PasswordAuth {
  private readonly now: () => Date;

  constructor(private readonly deps: PasswordAuthDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  /** Local rules, then the breach check. An unavailable breach service doesn't block. */
  async checkPassword(password: string, email: string): Promise<PasswordProblem[]> {
    const problems = checkPasswordLocally(password, { email, siteName: this.deps.siteName });
    if (problems.length > 0) return problems;
    const breached = await this.deps.breaches.isBreached(password);
    if (breached === null) this.deps.onBreachCheckUnavailable?.();
    return breached ? ["found-in-breach"] : [];
  }

  async signUp(input: { email: string; password: string; ip: string }): Promise<SignUpResult> {
    const email = normalizeEmail(input.email);
    if (!isPlausibleEmail(email)) return { ok: false, invalidEmail: true };
    const problems = await this.checkPassword(input.password, email);
    if (problems.length > 0) return { ok: false, problems };

    if (!(await this.mayEmail(email, input.ip))) return { ok: true };
    // Hashed for both branches, so the time taken doesn't reveal which one ran.
    const pendingHash = await hashPassword(input.password);
    const user = await this.deps.store.findUserByEmail(email);
    const token = newToken();
    const expiresAt = new Date(this.now().getTime() + TOKEN_LIFETIME_MS);
    if (user) {
      // Already has an account: never say so. Its owner gets a link to set a password instead.
      await this.deps.store.createToken({
        tokenHash: sha256(token),
        purpose: "SET_PASSWORD",
        email,
        pendingHash: null,
        expiresAt,
      });
      await this.deps.mailer.sendSetPassword(email, token, user.id);
    } else {
      await this.deps.store.createToken({
        tokenHash: sha256(token),
        purpose: "CONFIRM_SIGNUP",
        email,
        pendingHash,
        expiresAt,
      });
      await this.deps.mailer.sendConfirmSignup(email, token);
    }
    return { ok: true };
  }

  /** The emailed confirmation link: creates (or verifies) the account and attaches the password. */
  async confirmSignUp(token: string): Promise<TokenResult> {
    const stored = await this.deps.store.consumeToken(sha256(token), "CONFIRM_SIGNUP", this.now());
    if (!stored?.pendingHash) return { ok: false, reason: "invalid-link" };
    const user = await this.deps.store.createOrVerifyUser(stored.email, this.now());
    await this.deps.store.setCredential(user.id, stored.pendingHash);
    return { ok: true, userId: user.id };
  }

  async signIn(input: { email: string; password: string; ip: string }): Promise<SignInResult> {
    const email = normalizeEmail(input.email);
    const accountKey = sha256(`account:${email}`);
    const ipKey = sha256(`ip:${input.ip}`);
    const now = this.now();
    const [accountState, ipState] = await Promise.all([
      this.deps.store.getThrottle(accountKey),
      this.deps.store.getThrottle(ipKey),
    ]);
    if (isLocked(accountState, now) || isLocked(ipState, now))
      return { ok: false, reason: "locked" };

    const user = isPlausibleEmail(email) ? await this.deps.store.findUserByEmail(email) : null;
    const stored = user ? await this.deps.store.getCredential(user.id) : null;
    const matches = stored
      ? await verifyPassword(input.password, stored)
      : await verifyAgainstDummy(input.password);
    if (!user || !stored || !matches || !user.emailVerified) {
      await Promise.all([
        this.deps.store.saveThrottle(accountKey, recordFailure(accountState, ACCOUNT_RULE, now)),
        this.deps.store.saveThrottle(ipKey, recordFailure(ipState, IP_RULE, now)),
      ]);
      return { ok: false, reason: "invalid" };
    }
    await this.deps.store.clearThrottle(accountKey);
    if (needsRehash(stored))
      await this.deps.store.setCredential(user.id, await hashPassword(input.password));
    return { ok: true, userId: user.id };
  }

  /** "Forgot password": always the same answer; a link goes only to an existing account. */
  async requestPasswordReset(input: { email: string; ip: string }): Promise<void> {
    const email = normalizeEmail(input.email);
    if (!isPlausibleEmail(email)) return;
    if (!(await this.mayEmail(email, input.ip))) return;
    const user = await this.deps.store.findUserByEmail(email);
    if (!user) return;
    const token = newToken();
    await this.deps.store.createToken({
      tokenHash: sha256(token),
      purpose: "SET_PASSWORD",
      email,
      pendingHash: null,
      expiresAt: new Date(this.now().getTime() + TOKEN_LIFETIME_MS),
    });
    await this.deps.mailer.sendSetPassword(email, token, user.id);
  }

  /** Sets a new password from an emailed link, and signs out every other session. */
  async resetPassword(input: { token: string; password: string }): Promise<ResetResult> {
    const tokenHash = sha256(input.token);
    const peeked = await this.deps.store.peekToken(tokenHash, "SET_PASSWORD", this.now());
    if (!peeked) return { ok: false, reason: "invalid-link" };
    const problems = await this.checkPassword(input.password, peeked.email);
    if (problems.length > 0) return { ok: false, reason: "weak", problems };
    const stored = await this.deps.store.consumeToken(tokenHash, "SET_PASSWORD", this.now());
    if (!stored) return { ok: false, reason: "invalid-link" };
    const user = await this.deps.store.createOrVerifyUser(stored.email, this.now());
    await this.deps.store.setCredential(user.id, await hashPassword(input.password));
    await this.deps.store.deleteSessions(user.id);
    await this.deps.store.clearThrottle(sha256(`account:${stored.email}`));
    return { ok: true, userId: user.id };
  }

  /** A new database session, the same kind Auth.js creates. */
  async startSession(userId: string): Promise<{ sessionToken: string; expires: Date }> {
    const sessionToken = randomBytes(32).toString("hex");
    const expires = new Date(this.now().getTime() + SESSION_LIFETIME_MS);
    await this.deps.store.createSession(userId, sessionToken, expires);
    return { sessionToken, expires };
  }

  /**
   * Whether one more email may go to this address from this IP now, counting it
   * if so: the same per-address (MAIL_RULE) and per-IP budgets as the password
   * emails, so the emailed sign-in link shares them (site review, 2026-10-10).
   */
  async allowEmailTo(input: { email: string; ip: string }): Promise<boolean> {
    return this.mayEmail(normalizeEmail(input.email), input.ip);
  }

  private async mayEmail(email: string, ip: string): Promise<boolean> {
    const now = this.now();
    const emailKey = sha256(`mail:${email}`);
    const ipKey = sha256(`mail-ip:${ip}`);
    const [emailState, ipState] = await Promise.all([
      this.deps.store.getThrottle(emailKey),
      this.deps.store.getThrottle(ipKey),
    ]);
    if (isLocked(emailState, now) || isLocked(ipState, now)) return false;
    await Promise.all([
      this.deps.store.saveThrottle(emailKey, recordFailure(emailState, MAIL_RULE, now)),
      this.deps.store.saveThrottle(ipKey, recordFailure(ipState, MAIL_IP_RULE, now)),
    ]);
    return true;
  }
}
