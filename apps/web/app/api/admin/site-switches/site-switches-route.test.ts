import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The admin's site switches (docs/final-decisions.md, 2026-10-09): the route,
 * and lib/site-switches with the database faked in memory.
 */
const state = vi.hoisted(() => ({
  admin: true,
  switches: new Map<string, { enabled: boolean; updatedByUserId: string }>(),
  events: [] as Array<{ key: string; enabled: boolean; actorUserId: string }>,
  revalidated: [] as string[],
}));

vi.mock("@ppu/db", () => ({
  prisma: {
    siteSwitch: {
      findMany: async () =>
        [...state.switches].map(([key, value]) => ({ key, enabled: value.enabled })),
      upsert: ({
        where,
        create,
        update,
      }: {
        where: { key: string };
        create: { enabled: boolean; updatedByUserId: string };
        update: { enabled: boolean; updatedByUserId: string };
      }) => ({
        run: () => state.switches.set(where.key, state.switches.has(where.key) ? update : create),
      }),
    },
    siteSwitchEvent: {
      create: ({ data }: { data: { key: string; enabled: boolean; actorUserId: string } }) => ({
        run: () => state.events.push(data),
      }),
    },
    $transaction: async (steps: Array<{ run: () => unknown }>) => steps.map((step) => step.run()),
  },
}));
vi.mock("next/cache", () => ({
  revalidatePath: (path: string, kind: string) => state.revalidated.push(`${path}:${kind}`),
}));
vi.mock("../../../../lib/require-admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../lib/require-admin")>()),
  requireAdmin: async () => (state.admin ? { userId: "admin-1" } : null),
}));
vi.mock("@ppu/telemetry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ppu/telemetry")>()),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const route = await import("./route");
const { resolveSwitch } = await import("../../../../lib/site-switches");

function post(body: unknown) {
  return route.POST(
    new Request("https://lowcodestacks.example/api/admin/site-switches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  state.admin = true;
  state.switches.clear();
  state.events = [];
  state.revalidated = [];
});

describe("POST /api/admin/site-switches", () => {
  it("flips the component library, records who did it and refreshes every page", async () => {
    const response = await post({ key: "components", enabled: true });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ key: "components", enabled: true });
    expect(state.switches.get("components")).toMatchObject({
      enabled: true,
      updatedByUserId: "admin-1",
    });
    expect(state.events).toEqual([{ key: "components", enabled: true, actorUserId: "admin-1" }]);
    expect(state.revalidated).toEqual(["/:layout"]);

    await post({ key: "components", enabled: false });
    expect(state.switches.get("components")?.enabled).toBe(false);
    expect(state.events).toHaveLength(2);
  });

  it("answers 404 to anyone but an admin, and changes nothing", async () => {
    state.admin = false;
    const response = await post({ key: "components", enabled: true });
    expect(response.status).toBe(404);
    expect(state.switches.size).toBe(0);
    expect(state.events).toHaveLength(0);
  });

  it("refuses an unknown switch or a value that isn't true or false", async () => {
    expect((await post({ key: "everything", enabled: true })).status).toBe(400);
    expect((await post({ key: "components", enabled: "yes" })).status).toBe(400);
    expect((await post({ key: "toString", enabled: true })).status).toBe(400);
    expect(state.events).toHaveLength(0);
  });
});

describe("resolveSwitch", () => {
  it("uses the admin's choice once made, and the environment until then", () => {
    expect(resolveSwitch(undefined, "on")).toBe(true);
    expect(resolveSwitch(undefined, undefined)).toBe(false);
    expect(resolveSwitch(false, "on")).toBe(false);
    expect(resolveSwitch(true, undefined)).toBe(true);
  });
});
