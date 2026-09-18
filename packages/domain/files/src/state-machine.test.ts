import { describe, expect, it } from "vitest";
import {
  assertValidTransition,
  canTransition,
  InvalidFileScanTransitionError,
} from "./state-machine.js";

describe("canTransition", () => {
  it.each([
    ["UPLOADED", "QUARANTINED", true],
    ["QUARANTINED", "SCANNING", true],
    ["QUARANTINED", "REJECTED", true],
    ["SCANNING", "CLEAN", true],
    ["SCANNING", "REJECTED", true],
    ["REJECTED", "OVERRIDDEN", true],
  ] as const)("%s -> %s is %s", (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });

  it.each([
    ["UPLOADED", "SCANNING"],
    ["UPLOADED", "CLEAN"],
    ["QUARANTINED", "CLEAN"],
    ["QUARANTINED", "OVERRIDDEN"],
    ["SCANNING", "UPLOADED"],
    ["CLEAN", "REJECTED"],
    ["CLEAN", "SCANNING"],
    ["REJECTED", "CLEAN"],
    ["OVERRIDDEN", "CLEAN"],
  ] as const)("%s -> %s is rejected", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });
});

describe("assertValidTransition", () => {
  it("does not throw for a valid transition", () => {
    expect(() => assertValidTransition("QUARANTINED", "SCANNING")).not.toThrow();
  });

  it("throws InvalidFileScanTransitionError for an invalid transition", () => {
    expect(() => assertValidTransition("CLEAN", "REJECTED")).toThrow(
      InvalidFileScanTransitionError,
    );
  });
});
