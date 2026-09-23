import { describe, expect, it } from "vitest";
import { isDownloadAllowed, isProductEligibleForFreeEntitlement } from "./eligibility.js";

describe("isProductEligibleForFreeEntitlement", () => {
  it("is eligible when PUBLISHED", () => {
    expect(isProductEligibleForFreeEntitlement({ status: "PUBLISHED" })).toBe(true);
  });

  it("is not eligible when DRAFT", () => {
    expect(isProductEligibleForFreeEntitlement({ status: "DRAFT" })).toBe(false);
  });
});

describe("isDownloadAllowed", () => {
  it("is allowed when revokedAt is null", () => {
    expect(isDownloadAllowed({ revokedAt: null })).toBe(true);
  });

  it("is denied when revokedAt is set", () => {
    expect(isDownloadAllowed({ revokedAt: new Date() })).toBe(false);
  });
});
