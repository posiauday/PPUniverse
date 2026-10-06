import { PasswordAuth, sha256 } from "@ppu/domain-identity";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPasswordAuthStore } from "./password-auth-store.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database
 * (see session-repository.integration.test.ts). Exercises the whole sign-up,
 * sign-in and reset flow against the real tables (MVP-036).
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);
const EMAIL = "password-store@example.test";
const PASSWORD = "green flows run on monday";

describe.skipIf(!hasDatabase)("PrismaPasswordAuthStore (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let store: PrismaPasswordAuthStore;
  const mail: { kind: string; token: string }[] = [];
  let auth: PasswordAuth;

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    store = new PrismaPasswordAuthStore(db);
    auth = new PasswordAuth({
      store,
      siteName: "LowCodeStacks",
      breaches: { isBreached: () => Promise.resolve(false) },
      mailer: {
        sendConfirmSignup: (_email, token) =>
          Promise.resolve(void mail.push({ kind: "confirm", token })),
        sendSetPassword: (_email, token) => Promise.resolve(void mail.push({ kind: "set", token })),
      },
    });
    await cleanUp();
  });

  async function cleanUp() {
    await db.user.deleteMany({ where: { email: EMAIL } });
    await db.passwordToken.deleteMany({ where: { email: EMAIL } });
    const keys = [
      `account:${EMAIL}`,
      "ip:203.0.113.9",
      `mail:${EMAIL}`,
      "mail-ip:203.0.113.9",
      "ip:198.51.100.200",
      "ip:198.51.100.201",
    ].map(sha256);
    await db.authThrottle.deleteMany({ where: { key: { in: keys } } });
  }

  afterAll(async () => {
    await cleanUp();
    await db.$disconnect();
  });

  it("signs up, confirms, signs in, resets and ends old sessions against the real tables", async () => {
    expect(await auth.signUp({ email: EMAIL, password: PASSWORD, ip: "203.0.113.9" })).toEqual({
      ok: true,
    });
    const token = mail[0]!.token;
    const row = await db.passwordToken.findFirstOrThrow({ where: { email: EMAIL } });
    expect(row.tokenHash).toBe(sha256(token));
    expect(row.tokenHash).not.toContain(token);

    const confirmed = await auth.confirmSignUp(token);
    expect(confirmed.ok).toBe(true);
    const user = await db.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(user.emailVerified).not.toBeNull();
    expect((await auth.confirmSignUp(token)).ok).toBe(false);

    const signedIn = await auth.signIn({ email: EMAIL, password: PASSWORD, ip: "203.0.113.9" });
    expect(signedIn).toEqual({ ok: true, userId: user.id });
    const session = await auth.startSession(user.id);
    expect(await db.session.count({ where: { sessionToken: session.sessionToken } })).toBe(1);

    await auth.requestPasswordReset({ email: EMAIL, ip: "203.0.113.9" });
    const reset = await auth.resetPassword({
      token: mail[1]!.token,
      password: "a brand new passphrase",
    });
    expect(reset).toEqual({ ok: true, userId: user.id });
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
    expect((await auth.signIn({ email: EMAIL, password: PASSWORD, ip: "203.0.113.9" })).ok).toBe(
      false,
    );
    expect(
      (await auth.signIn({ email: EMAIL, password: "a brand new passphrase", ip: "203.0.113.9" }))
        .ok,
    ).toBe(true);
  });

  it("deletes links and throttle counters a day after they stop mattering", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const oldKey = sha256("ip:198.51.100.200");
    // An explicit value overrides @updatedAt, so the row looks untouched for two days.
    await db.authThrottle.create({
      data: { key: oldKey, failures: 3, windowStart: twoDaysAgo, updatedAt: twoDaysAgo },
    });
    await db.passwordToken.create({
      data: {
        tokenHash: sha256("old-link"),
        purpose: "SET_PASSWORD",
        email: EMAIL,
        expiresAt: twoDaysAgo,
      },
    });

    await store.saveThrottle(sha256("ip:198.51.100.201"), {
      failures: 1,
      windowStart: new Date(),
      lockedUntil: null,
    });
    await store.createToken({
      tokenHash: sha256("new-link"),
      purpose: "SET_PASSWORD",
      email: EMAIL,
      pendingHash: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    expect(await db.authThrottle.count({ where: { key: oldKey } })).toBe(0);
    expect(await db.passwordToken.count({ where: { tokenHash: sha256("old-link") } })).toBe(0);
    expect(await db.passwordToken.count({ where: { tokenHash: sha256("new-link") } })).toBe(1);
  });

  it("deletes the password hash when the user is deleted", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email: EMAIL } });
    await db.user.delete({ where: { id: user.id } });
    expect(await db.passwordCredential.count({ where: { userId: user.id } })).toBe(0);
  });
});
