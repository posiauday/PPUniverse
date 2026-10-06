import { describe, expect, it } from "vitest";
import { InMemoryPasswordAuthStore } from "./password-auth-memory.js";
import { PasswordAuth, sha256, type BreachChecker } from "./password-auth.js";

const GOOD = "green flows run on monday";

function setup(options: { breached?: boolean | null } = {}) {
  const store = new InMemoryPasswordAuthStore();
  const sent: { kind: "confirm" | "set"; email: string; token: string }[] = [];
  let clock = new Date(Date.UTC(2026, 9, 6, 12, 0));
  let unavailable = 0;
  const breaches: BreachChecker = {
    isBreached: () => Promise.resolve("breached" in options ? (options.breached ?? null) : false),
  };
  const auth = new PasswordAuth({
    store,
    breaches,
    siteName: "LowCodeStacks",
    now: () => clock,
    onBreachCheckUnavailable: () => unavailable++,
    mailer: {
      sendConfirmSignup: (email, token) =>
        Promise.resolve(void sent.push({ kind: "confirm", email, token })),
      sendSetPassword: (email, token) =>
        Promise.resolve(void sent.push({ kind: "set", email, token })),
    },
  });
  return {
    store,
    auth,
    sent,
    unavailable: () => unavailable,
    advance: (minutes: number) => (clock = new Date(clock.getTime() + minutes * 60_000)),
  };
}

describe("PasswordAuth sign-up and confirmation", () => {
  it("signs up a new email only after the emailed link is confirmed", async () => {
    const t = setup();
    expect(
      await t.auth.signUp({ email: " Sam@Example.com ", password: GOOD, ip: "1.1.1.1" }),
    ).toEqual({ ok: true });
    expect(t.store.users).toEqual([]);
    expect(t.sent).toEqual([
      { kind: "confirm", email: "sam@example.com", token: expect.any(String) },
    ]);
    // The raw token is never stored, only its hash.
    expect(t.store.tokens[0]?.tokenHash).toBe(sha256(t.sent[0]!.token));

    const confirmed = await t.auth.confirmSignUp(t.sent[0]!.token);
    expect(confirmed.ok).toBe(true);
    expect(
      await t.auth.signIn({ email: "sam@example.com", password: GOOD, ip: "1.1.1.1" }),
    ).toEqual({
      ok: true,
      userId: "user-1",
    });
  });

  it("makes a confirmation link single-use and expire after an hour", async () => {
    const t = setup();
    await t.auth.signUp({ email: "a@example.com", password: GOOD, ip: "1" });
    await t.auth.signUp({ email: "b@example.com", password: GOOD, ip: "1" });
    expect((await t.auth.confirmSignUp(t.sent[0]!.token)).ok).toBe(true);
    expect(await t.auth.confirmSignUp(t.sent[0]!.token)).toEqual({
      ok: false,
      reason: "invalid-link",
    });
    t.advance(61);
    expect(await t.auth.confirmSignUp(t.sent[1]!.token)).toEqual({
      ok: false,
      reason: "invalid-link",
    });
  });

  it("never lets someone pre-register another person's address with their own password", async () => {
    const t = setup();
    // An attacker signs up with the victim's address but can't open the victim's inbox.
    await t.auth.signUp({
      email: "victim@example.com",
      password: "attacker chosen secret",
      ip: "6.6.6.6",
    });
    // The victim later joins by email link or Google, which creates a verified account.
    await t.store.createOrVerifyUser("victim@example.com", new Date());
    expect(
      await t.auth.signIn({
        email: "victim@example.com",
        password: "attacker chosen secret",
        ip: "6.6.6.6",
      }),
    ).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("answers the same for an existing account, but emails a set-password link instead", async () => {
    const t = setup();
    await t.store.createOrVerifyUser("sam@example.com", new Date());
    expect(await t.auth.signUp({ email: "sam@example.com", password: GOOD, ip: "1" })).toEqual({
      ok: true,
    });
    expect(t.sent.map((s) => s.kind)).toEqual(["set"]);
    expect(t.store.tokens[0]?.pendingHash).toBeNull();
  });

  it("refuses weak or breached passwords with every reason, and an invalid email", async () => {
    expect(
      await setup().auth.signUp({ email: "sam@example.com", password: "short", ip: "1" }),
    ).toEqual({
      ok: false,
      problems: ["too-short"],
    });
    expect(
      await setup({ breached: true }).auth.signUp({
        email: "sam@example.com",
        password: GOOD,
        ip: "1",
      }),
    ).toEqual({
      ok: false,
      problems: ["found-in-breach"],
    });
    expect(await setup().auth.signUp({ email: "not-an-email", password: GOOD, ip: "1" })).toEqual({
      ok: false,
      invalidEmail: true,
    });
  });

  it("doesn't block sign-up when the breach service is down, but reports it", async () => {
    const t = setup({ breached: null });
    expect(await t.auth.signUp({ email: "sam@example.com", password: GOOD, ip: "1" })).toEqual({
      ok: true,
    });
    expect(t.unavailable()).toBe(1);
  });

  it("stops emailing one address after five requests an hour, without saying so", async () => {
    const t = setup();
    for (let i = 0; i < 7; i++)
      await t.auth.signUp({ email: "flood@example.com", password: GOOD, ip: `ip-${i}` });
    expect(t.sent).toHaveLength(5);
  });
});

describe("PasswordAuth sign-in", () => {
  async function withAccount() {
    const t = setup();
    await t.auth.signUp({ email: "sam@example.com", password: GOOD, ip: "1" });
    await t.auth.confirmSignUp(t.sent[0]!.token);
    return t;
  }

  it("gives the same answer for a wrong password and an unknown email", async () => {
    const t = await withAccount();
    expect(
      await t.auth.signIn({ email: "sam@example.com", password: "wrong password here", ip: "1" }),
    ).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(await t.auth.signIn({ email: "nobody@example.com", password: GOOD, ip: "1" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("locks an account after five failures, even with the right password, then unlocks", async () => {
    const t = await withAccount();
    for (let i = 0; i < 5; i++)
      await t.auth.signIn({ email: "sam@example.com", password: "nope nope nope", ip: `ip-${i}` });
    expect(await t.auth.signIn({ email: "sam@example.com", password: GOOD, ip: "fresh" })).toEqual({
      ok: false,
      reason: "locked",
    });
    t.advance(16);
    expect(
      (await t.auth.signIn({ email: "sam@example.com", password: GOOD, ip: "fresh" })).ok,
    ).toBe(true);
  });

  it("creates a 30-day database session", async () => {
    const t = await withAccount();
    const session = await t.auth.startSession("user-1");
    expect(session.sessionToken).toMatch(/^[0-9a-f]{64}$/);
    expect(t.store.sessions).toEqual([
      { userId: "user-1", sessionToken: session.sessionToken, expires: session.expires },
    ]);
    expect(session.expires.getTime() - Date.UTC(2026, 9, 6, 12, 0)).toBe(30 * 24 * 60 * 60_000);
  });
});

describe("PasswordAuth forgot and reset", () => {
  it("emails a link only to an existing account, and the answer never differs", async () => {
    const t = setup();
    await t.store.createOrVerifyUser("google-user@example.com", new Date());
    await t.auth.requestPasswordReset({ email: "google-user@example.com", ip: "1" });
    await t.auth.requestPasswordReset({ email: "nobody@example.com", ip: "1" });
    expect(t.sent.map((s) => s.email)).toEqual(["google-user@example.com"]);
  });

  it("lets a Google or email-link user add a password, and signs out every other session", async () => {
    const t = setup();
    const user = await t.store.createOrVerifyUser("google-user@example.com", new Date());
    await t.store.createSession(user.id, "old-session", new Date(Date.UTC(2027, 0, 1)));
    await t.auth.requestPasswordReset({ email: "google-user@example.com", ip: "1" });
    const token = t.sent[0]!.token;

    expect(await t.auth.resetPassword({ token, password: "short" })).toEqual({
      ok: false,
      reason: "weak",
      problems: ["too-short"],
    });
    // A refused password doesn't use the link up.
    expect(await t.auth.resetPassword({ token, password: GOOD })).toEqual({
      ok: true,
      userId: user.id,
    });
    expect(t.store.sessions).toEqual([]);
    expect(
      (await t.auth.signIn({ email: "google-user@example.com", password: GOOD, ip: "1" })).ok,
    ).toBe(true);
    expect(await t.auth.resetPassword({ token, password: GOOD })).toEqual({
      ok: false,
      reason: "invalid-link",
    });
  });

  it("rejects a sign-up link used as a reset link", async () => {
    const t = setup();
    await t.auth.signUp({ email: "sam@example.com", password: GOOD, ip: "1" });
    expect(await t.auth.resetPassword({ token: t.sent[0]!.token, password: GOOD })).toEqual({
      ok: false,
      reason: "invalid-link",
    });
  });
});
