import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A component's team post (MVP-053): who may post it, on which components,
 * the comment text rules, and that it's saved as the admin.
 */
const state = vi.hoisted(() => ({
  admin: true,
  commentsOn: true,
  component: null as null | { id: string; status: string; hidden: boolean },
  saved: [] as Array<{ componentId: string; userId: string; body: string }>,
}));

vi.mock("../../../../lib/require-admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../lib/require-admin")>()),
  requireAdmin: async () => (state.admin ? { userId: "admin-1" } : null),
}));
vi.mock("../../../../lib/feature-flags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../lib/feature-flags")>()),
  commentsEnabled: () => state.commentsOn,
}));
vi.mock("../../../../lib/components", () => ({
  componentRepository: {
    findById: async (id: string) => (state.component?.id === id ? state.component : null),
  },
}));
vi.mock("../../../../lib/comments", () => ({
  secureRandom: () => 0.5,
  commentRepository: {
    getOrCreateProfile: async () => ({ displayName: "Admin", avatarSeed: "a" }),
    saveTeamPost: async (componentId: string, userId: string, body: string) => {
      state.saved.push({ componentId, userId, body });
      return { id: "team-1" };
    },
  },
}));
vi.mock("@ppu/telemetry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ppu/telemetry")>()),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const route = await import("./[id]/team-post/route");

const ORIGIN = "https://lowcodestacks.example";

function post(id: string, body: unknown, origin = ORIGIN) {
  return route.POST(
    new Request(`${ORIGIN}/api/admin/components/${id}/team-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

const OPENER = "Welcome! Tell us what you built with it.";

beforeEach(() => {
  state.admin = true;
  state.commentsOn = true;
  state.component = { id: "cmp-1", status: "PUBLISHED", hidden: false };
  state.saved = [];
});

afterEach(() => vi.clearAllMocks());

describe("POST /api/admin/components/[id]/team-post (MVP-053)", () => {
  it("saves the team post as the admin", async () => {
    const response = await post("cmp-1", { body: `\n${OPENER}\n\n\n` });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, id: "team-1" });
    expect(state.saved).toEqual([{ componentId: "cmp-1", userId: "admin-1", body: OPENER }]);
  });

  it("is a 404 for anyone who isn't an admin, and while comments are off", async () => {
    state.admin = false;
    expect((await post("cmp-1", { body: OPENER })).status).toBe(404);
    state.admin = true;
    state.commentsOn = false;
    expect((await post("cmp-1", { body: OPENER })).status).toBe(404);
    expect(state.saved).toEqual([]);
  });

  it("refuses a post from another site", async () => {
    expect((await post("cmp-1", { body: OPENER }, "https://elsewhere.example")).status).toBe(403);
    expect(state.saved).toEqual([]);
  });

  it("only posts on a published component that isn't hidden", async () => {
    expect((await post("missing", { body: OPENER })).status).toBe(404);
    state.component = { id: "cmp-1", status: "DRAFT", hidden: false };
    expect((await post("cmp-1", { body: OPENER })).status).toBe(409);
    state.component = { id: "cmp-1", status: "PUBLISHED", hidden: true };
    expect((await post("cmp-1", { body: OPENER })).status).toBe(409);
    expect(state.saved).toEqual([]);
  });

  it("applies the comment text rules", async () => {
    const short = await post("cmp-1", { body: "Hi" });
    expect(short.status).toBe(400);
    expect(JSON.stringify(await short.json())).toContain("at least 10 characters");
    const links = await post("cmp-1", {
      body: "See https://a.example https://b.example https://c.example please",
    });
    expect(links.status).toBe(400);
    expect((await post("cmp-1", { nope: true })).status).toBe(400);
    expect(state.saved).toEqual([]);
  });
});
