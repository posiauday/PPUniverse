import { describe, expect, it } from "vitest";
import { InMemorySessionRepository } from "./session-repository.js";
import type { SessionSummary } from "./types.js";

function makeSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "session-1",
    userId: "user-1",
    expires: new Date("2026-12-31T00:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("InMemorySessionRepository", () => {
  it("lists only the requested user's sessions", async () => {
    const repo = new InMemorySessionRepository([
      makeSession({ id: "a", userId: "user-1" }),
      makeSession({ id: "b", userId: "user-2" }),
    ]);
    const result = await repo.listByUser("user-1");
    expect(result.map((s) => s.id)).toEqual(["a"]);
  });

  it("returns null from findById when the session is absent", async () => {
    const repo = new InMemorySessionRepository([]);
    expect(await repo.findById("missing")).toBeNull();
  });

  it("removes a session on deleteById", async () => {
    const repo = new InMemorySessionRepository([makeSession({ id: "a" })]);
    await repo.deleteById("a");
    expect(await repo.findById("a")).toBeNull();
  });
});
