import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findUnique = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));

const { POST } = await import("./route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/deletion-requests/req-1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * The deny-by-default admin check is this story's single most
 * security-critical new behaviour (docs/final-decisions.md, "MVP-020 open
 * questions 46, 47 and 48", question 48, constraint 4): a MEMBER must
 * receive the identical response an unauthenticated caller gets, revealing
 * nothing about the surface's existence. This is tested at the HTTP layer
 * directly, unlike MVP-010's entitlement route (which relied on the
 * accessibility/e2e layer alone) — the stakes here (an unapproved caller
 * actioning someone else's deletion request) justify the extra coverage.
 */
describe("POST /api/admin/deletion-requests/[id]", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    findUnique.mockReset();
  });

  it("returns 404, not 401, when there is no session", async () => {
    getServerSession.mockResolvedValue(null);

    const response = await POST(makeRequest({ toState: "UNDER_REVIEW" }), {
      params: Promise.resolve({ id: "req-1" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe("NOT_FOUND");
    expect(body.message).toBe("Not found.");
    // The role is never even queried once we know there is no session.
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns the identical 404 body for a signed-in MEMBER as for no session", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });

    const response = await POST(makeRequest({ toState: "UNDER_REVIEW" }), {
      params: Promise.resolve({ id: "req-1" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe("NOT_FOUND");
    expect(body.message).toBe("Not found.");
  });

  it("denies when the session's user row no longer exists", async () => {
    getServerSession.mockResolvedValue({ user: { id: "ghost-user" } });
    findUnique.mockResolvedValue(null);

    const response = await POST(makeRequest({ toState: "UNDER_REVIEW" }), {
      params: Promise.resolve({ id: "req-1" }),
    });

    expect(response.status).toBe(404);
  });

  it("rejects an invalid target state (400) even for a would-be admin, before any role check runs the risk of a bad write", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({ toState: "SUBMITTED" }), {
      params: Promise.resolve({ id: "req-1" }),
    });

    expect(response.status).toBe(400);
  });

  it("requires a non-empty reason for a DENIED transition", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });

    const response = await POST(makeRequest({ toState: "DENIED" }), {
      params: Promise.resolve({ id: "req-1" }),
    });

    expect(response.status).toBe(400);
  });
});
