import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Changing roles (MVP-047): the route and lib/roles' transaction, with the
 * database faked as an in-memory transaction.
 */
const state = vi.hoisted(() => ({
  admin: true,
  users: new Map<string, { role: string }>(),
  events: [] as Array<Record<string, string>>,
  isolation: "",
}));

vi.mock("@ppu/db", () => {
  const tx = {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => state.users.get(where.id) ?? null,
      count: async () => [...state.users.values()].filter((u) => u.role === "ADMIN").length,
      update: async ({ where, data }: { where: { id: string }; data: { role: string } }) => {
        state.users.set(where.id, { role: data.role });
      },
    },
    roleChangeEvent: {
      create: async ({ data }: { data: Record<string, string> }) => {
        state.events.push(data);
      },
    },
  };
  return {
    prisma: {
      $transaction: async (fn: (t: typeof tx) => unknown, options: { isolationLevel: string }) => {
        state.isolation = options.isolationLevel;
        return fn(tx);
      },
    },
  };
});
vi.mock("../../../../lib/require-admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../lib/require-admin")>()),
  requireAdmin: async () => (state.admin ? { userId: "admin-1" } : null),
}));
vi.mock("@ppu/telemetry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ppu/telemetry")>()),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const route = await import("./[id]/role/route");

function post(id: string, body: unknown) {
  return route.POST(
    new Request(`https://lowcodestacks.example/api/admin/users/${id}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

beforeEach(() => {
  state.admin = true;
  state.users = new Map([
    ["admin-1", { role: "ADMIN" }],
    ["user-2", { role: "MEMBER" }],
  ]);
  state.events = [];
});

afterEach(() => vi.clearAllMocks());

describe("POST /api/admin/users/[id]/role (MVP-047)", () => {
  it("makes a member a contributor, in a serializable transaction, and records it", async () => {
    const response = await post("user-2", { role: "CONTRIBUTOR" });
    expect(response.status).toBe(200);
    expect(state.users.get("user-2")).toEqual({ role: "CONTRIBUTOR" });
    expect(state.isolation).toBe("Serializable");
    expect(state.events).toEqual([
      { targetUserId: "user-2", actorUserId: "admin-1", fromRole: "MEMBER", toRole: "CONTRIBUTOR" },
    ]);
  });

  it("refuses the admin's own role, the last admin, a no-op and an unknown role", async () => {
    expect(await (await post("admin-1", { role: "MEMBER" })).json()).toEqual({ error: "self" });
    state.users.set("admin-2", { role: "ADMIN" });
    state.users.set("admin-1", { role: "MEMBER" }); // admin-2 is now the only admin
    state.admin = true;
    expect(await (await post("admin-2", { role: "MEMBER" })).json()).toEqual({
      error: "last-admin",
    });
    expect(await (await post("user-2", { role: "MEMBER" })).json()).toEqual({ error: "same" });
    expect((await post("user-2", { role: "OWNER" })).status).toBe(400);
    expect((await post("nobody", { role: "ADMIN" })).status).toBe(404);
    expect(state.events).toEqual([]);
  });

  it("is a 404 for anyone who isn't an admin", async () => {
    state.admin = false;
    expect((await post("user-2", { role: "ADMIN" })).status).toBe(404);
    expect(state.users.get("user-2")).toEqual({ role: "MEMBER" });
  });
});
