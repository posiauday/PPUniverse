import { describe, expect, it } from "vitest";
import { isDownloadAllowed, isProductEligibleForFreeEntitlement } from "./eligibility.js";

describe("isProductEligibleForFreeEntitlement", () => {
  it("is eligible when PUBLISHED and unpriced", () => {
    expect(isProductEligibleForFreeEntitlement({ status: "PUBLISHED", hasPrice: false })).toBe(
      true,
    );
  });

  it("is never eligible when the product has a price, even if PUBLISHED", () => {
    expect(isProductEligibleForFreeEntitlement({ status: "PUBLISHED", hasPrice: true })).toBe(
      false,
    );
  });

  it("is not eligible when DRAFT, SUSPENDED or ARCHIVED", () => {
    for (const status of ["DRAFT", "SUSPENDED", "ARCHIVED"] as const) {
      expect(isProductEligibleForFreeEntitlement({ status, hasPrice: false })).toBe(false);
    }
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
