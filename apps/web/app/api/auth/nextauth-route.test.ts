import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The guard in front of Auth.js (site review, 2026-10-10): an emailed
 * sign-in link counts against the password emails' mail budget.
 */
const handler = vi.hoisted(() => vi.fn(async () => new Response("auth.js")));
const budget = vi.hoisted(() => ({ allow: true, calls: [] as { email: string; ip: string }[] }));

vi.mock("next-auth", () => ({ default: () => handler }));
vi.mock("../../../lib/auth", () => ({ authOptions: {} }));
vi.mock("../../../lib/password-auth", () => ({
  clientIp: () => "203.0.113.5",
  siteOrigin: () => "https://lowcodestacks.example",
  passwordAuth: {
    allowEmailTo: async (input: { email: string; ip: string }) => {
      budget.calls.push(input);
      return budget.allow;
    },
  },
}));

const route = await import("./[...nextauth]/route");
const context = { params: Promise.resolve({ nextauth: ["signin", "email"] }) };

function linkRequest(json: boolean) {
  const body = new URLSearchParams({ email: "avery@contoso.com", csrfToken: "t" });
  if (json) body.set("json", "true");
  return new Request("https://lowcodestacks.example/api/auth/signin/email", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

beforeEach(() => {
  handler.mockClear();
  budget.allow = true;
  budget.calls = [];
});

describe("POST /api/auth/signin/email", () => {
  it("counts the email against the budget, then lets Auth.js send it", async () => {
    const response = await route.POST(linkRequest(true), context);
    expect(await response.text()).toBe("auth.js");
    expect(budget.calls).toEqual([{ email: "avery@contoso.com", ip: "203.0.113.5" }]);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("sends nothing over the budget, and tells the page to wait", async () => {
    budget.allow = false;
    const response = await route.POST(linkRequest(true), context);
    expect(await response.json()).toEqual({
      url: "https://lowcodestacks.example/signin?error=too-many",
    });
    const plain = await route.POST(linkRequest(false), context);
    expect(plain.status).toBe(302);
    expect(plain.headers.get("Location")).toBe(
      "https://lowcodestacks.example/signin?error=too-many",
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("leaves every other Auth.js request alone", async () => {
    budget.allow = false;
    const signOut = new Request("https://lowcodestacks.example/api/auth/signout", {
      method: "POST",
      body: new URLSearchParams({ csrfToken: "t" }),
    });
    expect(await (await route.POST(signOut, context)).text()).toBe("auth.js");
    expect(budget.calls).toEqual([]);
  });
});
