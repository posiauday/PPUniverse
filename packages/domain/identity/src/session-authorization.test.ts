import { describe, expect, it } from "vitest";
import { decideRevokeSession, toSessionListView } from "./session-authorization.js";
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

describe("decideRevokeSession", () => {
  it("denies when the session does not exist", () => {
    const decision = decideRevokeSession(null, {
      requestingUserId: "user-1",
      currentSessionId: "session-current",
    });
    expect(decision).toEqual({ allowed: false, reason: "NOT_FOUND" });
  });

  it("denies when the session belongs to a different user", () => {
    const session = makeSession({ userId: "user-2" });
    const decision = decideRevokeSession(session, {
      requestingUserId: "user-1",
      currentSessionId: "session-current",
    });
    expect(decision).toEqual({ allowed: false, reason: "NOT_OWNER" });
  });

  it("denies revoking the caller's own current session", () => {
    const session = makeSession({ id: "session-current", userId: "user-1" });
    const decision = decideRevokeSession(session, {
      requestingUserId: "user-1",
      currentSessionId: "session-current",
    });
    expect(decision).toEqual({ allowed: false, reason: "IS_CURRENT_SESSION" });
  });

  it("allows revoking another of the caller's own sessions", () => {
    const session = makeSession({ id: "session-other", userId: "user-1" });
    const decision = decideRevokeSession(session, {
      requestingUserId: "user-1",
      currentSessionId: "session-current",
    });
    expect(decision).toEqual({ allowed: true });
  });
});

describe("toSessionListView", () => {
  it("marks the matching session as current and leaves others false", () => {
    const sessions = [makeSession({ id: "a" }), makeSession({ id: "b" }), makeSession({ id: "c" })];
    const view = toSessionListView(sessions, "b");
    expect(view.map((s) => [s.id, s.isCurrent])).toEqual([
      ["a", false],
      ["b", true],
      ["c", false],
    ]);
  });
});
