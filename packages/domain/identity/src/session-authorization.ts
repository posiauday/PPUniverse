import type { SessionSummary } from "./types.js";

export type RevokeSessionDenialReason = "NOT_FOUND" | "NOT_OWNER" | "IS_CURRENT_SESSION";

export type RevokeSessionDecision =
  { allowed: true } | { allowed: false; reason: RevokeSessionDenialReason };

/**
 * "Revoke a session" is a self-service action scoped to the caller's own
 * sessions, and deliberately excludes the caller's current session — ending
 * the current session is sign-out, a separate action (docs/13 §5,
 * planning/github/03-user-stories.md STORY-002b).
 */
export function decideRevokeSession(
  targetSession: SessionSummary | null,
  context: { requestingUserId: string; currentSessionId: string },
): RevokeSessionDecision {
  if (!targetSession) {
    return { allowed: false, reason: "NOT_FOUND" };
  }
  if (targetSession.userId !== context.requestingUserId) {
    return { allowed: false, reason: "NOT_OWNER" };
  }
  if (targetSession.id === context.currentSessionId) {
    return { allowed: false, reason: "IS_CURRENT_SESSION" };
  }
  return { allowed: true };
}

export function toSessionListView(
  sessions: SessionSummary[],
  currentSessionId: string,
): Array<SessionSummary & { isCurrent: boolean }> {
  return sessions.map((session) => ({
    ...session,
    isCurrent: session.id === currentSessionId,
  }));
}
