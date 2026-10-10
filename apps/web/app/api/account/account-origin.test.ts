import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Site review, 2026-10-10: the account write routes refuse other sites, like
 * every other write route, before looking at the session.
 */
const session = vi.hoisted(() => ({ read: vi.fn(async () => null) }));
vi.mock("next-auth/next", () => ({ getServerSession: session.read }));
vi.mock("../../../lib/auth", () => ({ authOptions: {} }));
vi.mock("@ppu/db", () => ({ prisma: {} }));
vi.mock("@ppu/adapter-privacy", () => ({ PrismaPrivacyRepository: class {} }));
vi.mock("@ppu/adapter-entitlements", () => ({ PrismaEntitlementRepository: class {} }));
vi.mock("@ppu/adapter-catalog", () => ({ PrismaCatalogRepository: class {} }));
vi.mock("@ppu/adapter-identity", () => ({ PrismaSessionRepository: class {} }));
vi.mock("../../../lib/commerce", () => ({ commerceRepository: {} }));
vi.mock("../../../lib/current-session", () => ({ getCurrentSessionId: async () => null }));

const ORIGIN = "https://lowcodestacks.example";
const params = <T>(value: T) => ({ params: Promise.resolve(value) });

const routes = [
  ["consent", async () => (await import("./consent/route")).POST, params({})],
  ["deletion request", async () => (await import("./deletion-requests/route")).POST, params({})],
  [
    "withdraw deletion request",
    async () => (await import("./deletion-requests/[id]/route")).DELETE,
    params({ id: "d-1" }),
  ],
  [
    "free product claim",
    async () => (await import("../products/[slug]/entitlement/route")).POST,
    params({ slug: "p" }),
  ],
  [
    "session revoke",
    async () => (await import("../me/sessions/[id]/route")).DELETE,
    params({ id: "s-1" }),
  ],
] as const;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
  session.read.mockClear();
});

describe("account write routes refuse other sites", () => {
  it.each(routes)(
    "%s",
    async (_name, load, context) => {
      const handler = (await load()) as (request: Request, context: unknown) => Promise<Response>;
      for (const origin of [null, "https://evil.example"]) {
        const headers: Record<string, string> = { "Content-Type": "text/plain" };
        if (origin) headers["Origin"] = origin;
        const response = await handler(
          new Request(`${ORIGIN}/api/x`, {
            method: "POST",
            headers,
            body: '{"category":"MARKETING_EMAIL","granted":true}',
          }),
          context,
        );
        expect(response.status).toBe(403);
      }
      expect(session.read).not.toHaveBeenCalled();
      // From the site itself it gets past the check (and asks for a session).
      const own = await handler(
        new Request(`${ORIGIN}/api/x`, { method: "POST", headers: { Origin: ORIGIN }, body: "{}" }),
        context,
      );
      expect(own.status).toBe(401);
      // Loading a route the first time takes a few seconds on a busy machine.
    },
    20_000,
  );
});
