import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * MVP-050: the schedule routes for guides and updates. Both behave the same,
 * so every case runs against each.
 */

const getServerSession = vi.fn();
const findUnique = vi.fn();
const articles = {
  findArticleById: vi.fn(),
  scheduleArticle: vi.fn(),
  cancelArticleSchedule: vi.fn(),
};
const updates = {
  findUpdateById: vi.fn(),
  scheduleUpdate: vi.fn(),
  cancelUpdateSchedule: vi.fn(),
};

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));
vi.mock("../../../../../../lib/content", () => ({ contentRepository: articles }));
vi.mock("../../../../../../lib/updates", () => ({ updateRepository: updates }));

const guideRoute = await import("./route");
const updateRoute = await import("../../../updates/[id]/schedule/route");

const ORIGIN = "https://lowcodestacks.example";
const FUTURE = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

const KINDS = [
  {
    name: "guide",
    route: guideRoute,
    find: articles.findArticleById,
    schedule: articles.scheduleArticle,
    cancel: articles.cancelArticleSchedule,
    key: "article",
  },
  {
    name: "update",
    route: updateRoute,
    find: updates.findUpdateById,
    schedule: updates.scheduleUpdate,
    cancel: updates.cancelUpdateSchedule,
    key: "update",
  },
] as const;

function request(method: "PUT" | "DELETE", body?: unknown, origin: string | null = ORIGIN) {
  return new Request(`${ORIGIN}/api/admin/x/schedule`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const params = { params: Promise.resolve({ id: "c1" }) };

function signedInAs(role: "ADMIN" | "MEMBER" | null) {
  getServerSession.mockResolvedValue(role ? { user: { id: "admin-1" } } : null);
  findUnique.mockResolvedValue(role ? { role } : null);
}

const draft = (scheduledFor: Date | null = null) => ({ id: "c1", status: "DRAFT", scheduledFor });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe.each(KINDS)("the $name schedule route (MVP-050)", (kind) => {
  it.each([null, "MEMBER"] as const)("gives %s the same 404 as an unknown route", async (role) => {
    signedInAs(role);
    for (const response of [
      await kind.route.PUT(request("PUT", { publishAt: FUTURE.toISOString() }), params),
      await kind.route.DELETE(request("DELETE"), params),
    ]) {
      expect(response.status).toBe(404);
      expect((await response.json()).message).toBe("Not found.");
    }
    expect(kind.schedule).not.toHaveBeenCalled();
    expect(kind.cancel).not.toHaveBeenCalled();
  });

  it("refuses a request from another site, or with no Origin", async () => {
    signedInAs("ADMIN");
    kind.find.mockResolvedValue(draft(FUTURE));
    for (const origin of ["https://evil.example", null]) {
      expect(
        (await kind.route.PUT(request("PUT", { publishAt: FUTURE.toISOString() }, origin), params))
          .status,
      ).toBe(403);
      expect((await kind.route.DELETE(request("DELETE", undefined, origin), params)).status).toBe(
        403,
      );
    }
    expect(kind.schedule).not.toHaveBeenCalled();
    expect(kind.cancel).not.toHaveBeenCalled();
  });

  it.each([
    [{ publishAt: "2026-10-12T15:00" }, "Enter a date and time."],
    [{ publishAt: new Date(Date.now() - 60_000).toISOString() }, "at least a minute from now"],
    [
      { publishAt: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString() },
      "within the next year",
    ],
    [{}, "Enter a date and time."],
  ])("refuses %j", async (payload, message) => {
    signedInAs("ADMIN");
    kind.find.mockResolvedValue(draft());
    const response = await kind.route.PUT(request("PUT", payload), params);
    expect(response.status).toBe(400);
    expect((await response.json()).fieldErrors.publishAt[0]).toContain(message);
    expect(kind.schedule).not.toHaveBeenCalled();
  });

  it("schedules a draft at the time sent, as the signed-in admin", async () => {
    signedInAs("ADMIN");
    kind.find.mockResolvedValue(draft());
    kind.schedule.mockResolvedValue(draft(FUTURE));
    const response = await kind.route.PUT(request("PUT", { publishAt: FUTURE.toISOString() }), params);
    expect(response.status).toBe(200);
    expect(kind.schedule).toHaveBeenCalledWith("c1", FUTURE, "admin-1");
    expect((await response.json())[kind.key]).toEqual({
      id: "c1",
      status: "DRAFT",
      scheduledFor: FUTURE.toISOString(),
    });
  });

  it("won't schedule a published item, or cancel a schedule that isn't there", async () => {
    signedInAs("ADMIN");
    kind.find.mockResolvedValue({ id: "c1", status: "PUBLISHED", scheduledFor: null });
    expect(
      (await kind.route.PUT(request("PUT", { publishAt: FUTURE.toISOString() }), params)).status,
    ).toBe(409);
    kind.find.mockResolvedValue(draft());
    expect((await kind.route.DELETE(request("DELETE"), params)).status).toBe(409);
    expect(kind.schedule).not.toHaveBeenCalled();
    expect(kind.cancel).not.toHaveBeenCalled();
  });

  it("cancels a schedule", async () => {
    signedInAs("ADMIN");
    kind.find.mockResolvedValue(draft(FUTURE));
    kind.cancel.mockResolvedValue(draft());
    const response = await kind.route.DELETE(request("DELETE"), params);
    expect(response.status).toBe(200);
    expect(kind.cancel).toHaveBeenCalledWith("c1", "admin-1");
    expect((await response.json())[kind.key].scheduledFor).toBeNull();
  });

  it("is a 404 for an unknown id", async () => {
    signedInAs("ADMIN");
    kind.find.mockResolvedValue(null);
    expect(
      (await kind.route.PUT(request("PUT", { publishAt: FUTURE.toISOString() }), params)).status,
    ).toBe(404);
    expect((await kind.route.DELETE(request("DELETE"), params)).status).toBe(404);
  });
});
