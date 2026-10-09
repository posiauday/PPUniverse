import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The /api/auth/password/* routes (MVP-036): the HTTP layer only. The flows
 * themselves are tested in @ppu/domain-identity; here the real
 * lib/password-auth module is loaded (same-origin check, session cookie)
 * with the database and email modules stubbed, and the flow methods spied on.
 */
vi.mock("@ppu/db", () => ({ prisma: {} }));
vi.mock("../../../../lib/email", () => ({ notificationService: { sendTransactional: vi.fn() } }));
const recordTermsAcceptance = vi.fn().mockResolvedValue({ policyVersionId: "terms-v1" });
vi.mock("../../../../lib/terms-acceptance", () => ({ recordTermsAcceptance }));

const { passwordAuth } = await import("../../../../lib/password-auth");
const { MIN_ANSWER_MS, atLeast } = await import("../../../../lib/password-request");
const signup = await import("./signup/route");
const confirm = await import("./confirm/route");
const signin = await import("./signin/route");
const forgot = await import("./forgot/route");
const reset = await import("./reset/route");

const ORIGIN = "https://lowcodestacks.example";
const SESSION = { sessionToken: "a".repeat(64), expires: new Date("2026-11-05T00:00:00Z") };

function post(path: string, body: unknown, origin: string | null = ORIGIN): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers["Origin"] = origin;
  return new Request(`${ORIGIN}/api/auth/password/${path}`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
  vi.stubEnv("NEXTAUTH_URL", ORIGIN);
  vi.spyOn(passwordAuth, "startSession").mockResolvedValue(SESSION);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("every password route", () => {
  const routes = [
    ["signup", signup.POST, { email: "a@example.test", password: "x", acceptTerms: "yes" }],
    ["confirm", confirm.POST, { token: "t" }],
    ["signin", signin.POST, { email: "a@example.test", password: "x" }],
    ["forgot", forgot.POST, { email: "a@example.test" }],
    ["reset", reset.POST, { token: "t", password: "x" }],
  ] as const;

  it.each(routes)(
    "%s refuses another site's request (no Origin, or a different one)",
    async (path, handler, body) => {
      expect((await handler(post(path, body, null))).status).toBe(403);
      expect((await handler(post(path, body, "https://evil.example"))).status).toBe(403);
    },
  );

  it.each(routes)(
    "%s refuses a body that isn't a small JSON object of strings",
    async (path, handler) => {
      expect((await handler(post(path, "not json"))).status).toBe(400);
      expect((await handler(post(path, { email: 1, password: 2, token: 3 }))).status).toBe(400);
      expect((await handler(post(path, "x".repeat(5000)))).status).toBe(400);
    },
  );

  it.each(routes)("%s is never cached", async (path, handler) => {
    expect((await handler(post(path, "not json"))).headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("POST /api/auth/password/signin", () => {
  it("signs in with a session cookie the rest of the site reads", async () => {
    vi.spyOn(passwordAuth, "signIn").mockResolvedValue({ ok: true, userId: "user-1" });
    const response = await signin.POST(post("signin", { email: "a@example.test", password: "pw" }));
    expect(response.status).toBe(200);
    const cookie = response.headers.get("Set-Cookie") ?? "";
    expect(cookie).toContain(`__Secure-next-auth.session-token=${SESSION.sessionToken}`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//i);
  });

  it("answers a wrong password with 401 and no cookie, and a lock with 429", async () => {
    const signIn = vi.spyOn(passwordAuth, "signIn");
    signIn.mockResolvedValueOnce({ ok: false, reason: "invalid" });
    const wrong = await signin.POST(post("signin", { email: "a@example.test", password: "pw" }));
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: "invalid" });
    expect(wrong.headers.get("Set-Cookie")).toBeNull();

    signIn.mockResolvedValueOnce({ ok: false, reason: "locked" });
    expect(
      (await signin.POST(post("signin", { email: "a@example.test", password: "pw" }))).status,
    ).toBe(429);
  });

  it("passes the Netlify client address to the throttle", async () => {
    const signIn = vi
      .spyOn(passwordAuth, "signIn")
      .mockResolvedValue({ ok: false, reason: "invalid" });
    const request = post("signin", { email: "a@example.test", password: "pw" });
    request.headers.set("x-nf-client-connection-ip", "203.0.113.7");
    await signin.POST(request);
    expect(signIn).toHaveBeenCalledWith({
      email: "a@example.test",
      password: "pw",
      ip: "203.0.113.7",
    });
  });
});

describe("POST /api/auth/password/signup", () => {
  it("answers ok without saying whether the email already has an account", async () => {
    vi.spyOn(passwordAuth, "signUp").mockResolvedValue({ ok: true });
    const response = await signup.POST(
      post("signup", { email: "a@example.test", password: "pw", acceptTerms: "yes" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns every password problem as a readable message", async () => {
    vi.spyOn(passwordAuth, "signUp").mockResolvedValue({
      ok: false,
      problems: ["too-short", "found-in-breach"],
    });
    const response = await signup.POST(
      post("signup", { email: "a@example.test", password: "pw", acceptTerms: "yes" }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string; problems: string[] };
    expect(body.error).toBe("weak-password");
    expect(body.problems).toHaveLength(2);
    expect(body.problems[0]).toMatch(/at least 12 characters/);
  });
});

describe("POST /api/auth/password/signup without agreeing", () => {
  it("refuses a sign-up that doesn't agree to the Terms, before anything is sent", async () => {
    const signUp = vi.spyOn(passwordAuth, "signUp");
    signUp.mockClear();
    const response = await signup.POST(
      post("signup", { email: "a@example.test", password: "pw", acceptTerms: "no" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "terms" });
    expect(signUp).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/password/confirm and /reset", () => {
  it("confirm signs in on a good token and says invalid-link otherwise", async () => {
    const confirmSignUp = vi.spyOn(passwordAuth, "confirmSignUp");
    confirmSignUp.mockResolvedValueOnce({ ok: true, userId: "user-1" });
    recordTermsAcceptance.mockClear();
    const good = await confirm.POST(post("confirm", { token: "t" }));
    expect(good.status).toBe(200);
    expect(good.headers.get("Set-Cookie")).toContain(SESSION.sessionToken);
    // The sign-up agreed to the Terms; confirming the link records it.
    expect(recordTermsAcceptance).toHaveBeenCalledWith("user-1");

    recordTermsAcceptance.mockClear();
    confirmSignUp.mockResolvedValueOnce({ ok: false, reason: "invalid-link" });
    const bad = await confirm.POST(post("confirm", { token: "t" }));
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: "invalid-link" });
    expect(recordTermsAcceptance).not.toHaveBeenCalled();
  });

  it("reset returns problems for a weak password and signs in after a good one", async () => {
    const resetPassword = vi.spyOn(passwordAuth, "resetPassword");
    resetPassword.mockResolvedValueOnce({ ok: false, reason: "weak", problems: ["too-short"] });
    const weak = await reset.POST(post("reset", { token: "t", password: "pw" }));
    expect(weak.status).toBe(400);
    expect(((await weak.json()) as { error: string }).error).toBe("weak-password");

    resetPassword.mockResolvedValueOnce({ ok: false, reason: "invalid-link" });
    expect(await (await reset.POST(post("reset", { token: "t", password: "pw" }))).json()).toEqual({
      error: "invalid-link",
    });

    resetPassword.mockResolvedValueOnce({ ok: true, userId: "user-1" });
    const done = await reset.POST(post("reset", { token: "t", password: "pw" }));
    expect(done.status).toBe(200);
    expect(done.headers.get("Set-Cookie")).toContain(SESSION.sessionToken);
  });
});

describe("POST /api/auth/password/forgot", () => {
  it("always answers ok, no sooner than the minimum time", async () => {
    vi.spyOn(passwordAuth, "requestPasswordReset").mockResolvedValue(undefined);
    const started = Date.now();
    const response = await forgot.POST(post("forgot", { email: "nobody@example.test" }));
    expect(Date.now() - started).toBeGreaterThanOrEqual(MIN_ANSWER_MS - 20);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("still answers ok when the email can't be sent, so a failure doesn't reveal the account", async () => {
    vi.spyOn(passwordAuth, "requestPasswordReset").mockRejectedValue(
      new Error("provider refused bob@example.test"),
    );
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await forgot.POST(post("forgot", { email: "bob@example.test" }));
    expect(response.status).toBe(200);
    expect(errors.mock.calls.flat().join(" ")).not.toContain("bob@example.test");
  });
});

describe("atLeast", () => {
  it("waits out the rest of the floor after fast work, and adds nothing after slow work", async () => {
    vi.useFakeTimers();
    try {
      let done = false;
      const fast = atLeast(1000, () => Promise.resolve("x")).then((value) => {
        done = true;
        return value;
      });
      await vi.advanceTimersByTimeAsync(999);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await fast).toBe("x");

      const slow = atLeast(10, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "y";
      });
      await vi.advanceTimersByTimeAsync(50);
      expect(await slow).toBe("y");
    } finally {
      vi.useRealTimers();
    }
  });
});
