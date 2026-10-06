import { describe, expect, it } from "vitest";
import { ACCOUNT_RULE, isLocked, recordFailure } from "./sign-in-throttle.js";

const at = (minutes: number) => new Date(Date.UTC(2026, 9, 6, 12, minutes));

describe("sign-in throttle", () => {
  it("locks after the fifth failure inside 15 minutes, for 15 minutes", () => {
    let state = null;
    for (let i = 0; i < 4; i++) state = recordFailure(state, ACCOUNT_RULE, at(i));
    expect(isLocked(state, at(4))).toBe(false);
    state = recordFailure(state, ACCOUNT_RULE, at(4));
    expect(isLocked(state, at(5))).toBe(true);
    expect(isLocked(state, at(18))).toBe(true);
    expect(isLocked(state, at(19))).toBe(false);
  });

  it("starts a new window once 15 minutes have passed", () => {
    let state = null;
    for (let i = 0; i < 4; i++) state = recordFailure(state, ACCOUNT_RULE, at(i));
    state = recordFailure(state, ACCOUNT_RULE, at(16));
    expect(state.failures).toBe(1);
    expect(isLocked(state, at(16))).toBe(false);
  });

  it("is never locked with no history", () => {
    expect(isLocked(null, at(0))).toBe(false);
  });
});
