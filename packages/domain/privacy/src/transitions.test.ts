import { describe, expect, it } from "vitest";
import {
  currentDeletionRequestState,
  isActiveDeletionRequestState,
  isAdminTransition,
  isConsentCategory,
  isReasonRequired,
  isSelfServiceTransition,
  isValidDeletionRequestTransition,
} from "./transitions.js";
import type { DeletionRequestEventRecord, DeletionRequestState } from "./types.js";

const ALL_STATES: DeletionRequestState[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "DENIED",
  "WITHDRAWN",
  "COMPLETED",
];

function event(toState: DeletionRequestState, overrides: Partial<DeletionRequestEventRecord> = {}) {
  return {
    id: "evt-1",
    deletionRequestId: "req-1",
    toState,
    actorUserId: "user-1",
    reason: null,
    occurredAt: new Date(),
    ...overrides,
  };
}

describe("isValidDeletionRequestTransition", () => {
  it("allows exactly the documented lifecycle edges", () => {
    expect(isValidDeletionRequestTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(isValidDeletionRequestTransition("SUBMITTED", "WITHDRAWN")).toBe(true);
    expect(isValidDeletionRequestTransition("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(isValidDeletionRequestTransition("UNDER_REVIEW", "DENIED")).toBe(true);
    expect(isValidDeletionRequestTransition("UNDER_REVIEW", "WITHDRAWN")).toBe(true);
    expect(isValidDeletionRequestTransition("APPROVED", "COMPLETED")).toBe(true);
  });

  it("rejects every terminal state as a source", () => {
    for (const from of ["DENIED", "WITHDRAWN", "COMPLETED"] as const) {
      for (const to of ALL_STATES) {
        expect(isValidDeletionRequestTransition(from, to)).toBe(false);
      }
    }
  });

  it("rejects skipping a state (SUBMITTED straight to APPROVED/DENIED/COMPLETED)", () => {
    expect(isValidDeletionRequestTransition("SUBMITTED", "APPROVED")).toBe(false);
    expect(isValidDeletionRequestTransition("SUBMITTED", "DENIED")).toBe(false);
    expect(isValidDeletionRequestTransition("SUBMITTED", "COMPLETED")).toBe(false);
  });

  it("rejects withdrawing an already-approved request", () => {
    expect(isValidDeletionRequestTransition("APPROVED", "WITHDRAWN")).toBe(false);
  });

  it("rejects re-entering SUBMITTED from anywhere", () => {
    for (const from of ALL_STATES) {
      expect(isValidDeletionRequestTransition(from, "SUBMITTED")).toBe(false);
    }
  });
});

describe("isSelfServiceTransition / isAdminTransition", () => {
  it("classifies every state as exactly one of self-service or admin", () => {
    for (const to of ALL_STATES) {
      expect(isSelfServiceTransition(to)).toBe(!isAdminTransition(to));
    }
  });

  it("SUBMITTED and WITHDRAWN are self-service", () => {
    expect(isSelfServiceTransition("SUBMITTED")).toBe(true);
    expect(isSelfServiceTransition("WITHDRAWN")).toBe(true);
  });

  it("UNDER_REVIEW, APPROVED, DENIED, COMPLETED are admin-only", () => {
    expect(isAdminTransition("UNDER_REVIEW")).toBe(true);
    expect(isAdminTransition("APPROVED")).toBe(true);
    expect(isAdminTransition("DENIED")).toBe(true);
    expect(isAdminTransition("COMPLETED")).toBe(true);
  });
});

describe("isReasonRequired", () => {
  it("requires a reason only for DENIED", () => {
    for (const to of ALL_STATES) {
      expect(isReasonRequired(to)).toBe(to === "DENIED");
    }
  });
});

describe("isActiveDeletionRequestState", () => {
  it("SUBMITTED, UNDER_REVIEW and APPROVED are active", () => {
    expect(isActiveDeletionRequestState("SUBMITTED")).toBe(true);
    expect(isActiveDeletionRequestState("UNDER_REVIEW")).toBe(true);
    expect(isActiveDeletionRequestState("APPROVED")).toBe(true);
  });

  it("DENIED, WITHDRAWN and COMPLETED are not active", () => {
    expect(isActiveDeletionRequestState("DENIED")).toBe(false);
    expect(isActiveDeletionRequestState("WITHDRAWN")).toBe(false);
    expect(isActiveDeletionRequestState("COMPLETED")).toBe(false);
  });
});

describe("isConsentCategory", () => {
  it("accepts exactly the MVP set", () => {
    expect(isConsentCategory("TERMS_OF_SERVICE")).toBe(true);
    expect(isConsentCategory("MARKETING_EMAIL")).toBe(true);
  });

  it("rejects an analytics category (not built — FR-016 deferred) and garbage input", () => {
    expect(isConsentCategory("ANALYTICS")).toBe(false);
    expect(isConsentCategory("")).toBe(false);
    expect(isConsentCategory("terms_of_service")).toBe(false);
  });
});

describe("currentDeletionRequestState", () => {
  it("returns the last event's toState", () => {
    const request = {
      events: [
        event("SUBMITTED"),
        event("UNDER_REVIEW"),
        event("DENIED", { reason: "not eligible" }),
      ],
    };
    expect(currentDeletionRequestState(request)).toBe("DENIED");
  });

  it("returns the single event's state for a freshly submitted request", () => {
    expect(currentDeletionRequestState({ events: [event("SUBMITTED")] })).toBe("SUBMITTED");
  });

  it("throws rather than guessing when there are no events", () => {
    expect(() => currentDeletionRequestState({ events: [] })).toThrow(/no events/);
  });
});
