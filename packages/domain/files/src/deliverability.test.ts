import { describe, expect, it } from "vitest";
import { assertDeliverable, FileNotDeliverableError, isDeliverable } from "./deliverability.js";
import type { FileScanStatus } from "./types.js";

describe("isDeliverable", () => {
  it("is true only for CLEAN", () => {
    expect(isDeliverable({ status: "CLEAN" })).toBe(true);
  });

  it.each<FileScanStatus>(["UPLOADED", "QUARANTINED", "SCANNING", "REJECTED", "OVERRIDDEN"])(
    "is false for %s",
    (status) => {
      expect(isDeliverable({ status })).toBe(false);
    },
  );
});

describe("assertDeliverable", () => {
  it("does not throw for CLEAN", () => {
    expect(() => assertDeliverable({ status: "CLEAN" })).not.toThrow();
  });

  it("throws FileNotDeliverableError for REJECTED", () => {
    expect(() => assertDeliverable({ status: "REJECTED" })).toThrow(FileNotDeliverableError);
  });

  it("throws FileNotDeliverableError for an unscanned file still in progress", () => {
    expect(() => assertDeliverable({ status: "SCANNING" })).toThrow(FileNotDeliverableError);
  });
});
