import type { ConsentCategory, DeletionRequestRecord, DeletionRequestState } from "./types.js";

/**
 * The deletion-request lifecycle (docs/final-decisions.md, "MVP-020 open
 * questions 46, 47 and 48", question 46 / pre-work analysis question 6).
 * Pure lookup — no database, no knowledge of who is calling; the caller
 * (the route) is responsible for checking the actor is allowed to make this
 * particular transition (see isSelfServiceTransition / isAdminTransition
 * below) before calling this.
 */
const ALLOWED_TRANSITIONS: Record<DeletionRequestState, readonly DeletionRequestState[]> = {
  SUBMITTED: ["UNDER_REVIEW", "WITHDRAWN"],
  UNDER_REVIEW: ["APPROVED", "DENIED", "WITHDRAWN"],
  APPROVED: ["COMPLETED"],
  DENIED: [],
  WITHDRAWN: [],
  COMPLETED: [],
};

export function isValidDeletionRequestTransition(
  from: DeletionRequestState,
  to: DeletionRequestState,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** SUBMITTED/WITHDRAWN — created and withdrawn by the requester themselves. */
export function isSelfServiceTransition(to: DeletionRequestState): boolean {
  return to === "SUBMITTED" || to === "WITHDRAWN";
}

/** UNDER_REVIEW/APPROVED/DENIED/COMPLETED — only an ADMIN may cause these. */
export function isAdminTransition(to: DeletionRequestState): boolean {
  return to === "UNDER_REVIEW" || to === "APPROVED" || to === "DENIED" || to === "COMPLETED";
}

/** A reason is required by application logic for DENIED — optional elsewhere. */
export function isReasonRequired(to: DeletionRequestState): boolean {
  return to === "DENIED";
}

/** SUBMITTED, UNDER_REVIEW or APPROVED — an existing request that blocks a
 * new submission and appears in the admin queue. DENIED/WITHDRAWN/COMPLETED
 * are terminal for that request (a user who still wants deletion submits a
 * new one). */
export function isActiveDeletionRequestState(state: DeletionRequestState): boolean {
  return state === "SUBMITTED" || state === "UNDER_REVIEW" || state === "APPROVED";
}

/** MVP set only — see types.ts's ConsentCategory comment. */
export function isConsentCategory(value: string): value is ConsentCategory {
  return value === "TERMS_OF_SERVICE" || value === "MARKETING_EMAIL";
}

/**
 * The request's current state, derived from its event history — never
 * stored redundantly (DeletionRequest itself has no status column; see
 * privacy.prisma). Events are expected ordered oldest to newest, matching
 * PrivacyRepository's documented return shape; if a request somehow has no
 * events yet (should not happen — creation always writes a SUBMITTED event
 * in the same operation), this throws rather than guessing.
 */
export function currentDeletionRequestState(
  request: Pick<DeletionRequestRecord, "events">,
): DeletionRequestState {
  const last = request.events.at(-1);
  if (!last) {
    throw new Error("DeletionRequest has no events — expected at least SUBMITTED");
  }
  return last.toState;
}
