import { describe, expect, it } from "vitest";
import {
  checkProductPublishReadiness,
  isReleaseMutable,
  isValidProductName,
  isValidProductSlug,
  isValidProductStatusTransition,
  isValidProductStatusChangeTransition,
  isValidProductStatusChangeReason,
  isValidProductSummary,
  isValidReleaseVersion,
  ProductNotDraftError,
  ProductNotFoundError,
  ProductNotReadyError,
  ProductStatusChangeReasonRequiredError,
  ProductStatusTransitionNotAllowedError,
  ReleaseAlreadyPublishedError,
  ReleaseNotFoundError,
  ReleaseNotFoundForProductError,
  ReleaseNotReadyError,
} from "./product.js";
import type { ProductPublishSnapshot, ProductStatus } from "./types.js";

const ALL_STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"];

describe("isValidProductSlug", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(isValidProductSlug("power-automate-approvals")).toBe(true);
    expect(isValidProductSlug("a")).toBe(true);
    expect(isValidProductSlug("a1-b2")).toBe(true);
  });

  it("rejects empty, uppercase, spaces, leading/trailing/doubled hyphens", () => {
    expect(isValidProductSlug("")).toBe(false);
    expect(isValidProductSlug("Power-Automate")).toBe(false);
    expect(isValidProductSlug("power automate")).toBe(false);
    expect(isValidProductSlug("-leading")).toBe(false);
    expect(isValidProductSlug("trailing-")).toBe(false);
    expect(isValidProductSlug("double--hyphen")).toBe(false);
  });

  it("rejects a slug over 200 characters", () => {
    expect(isValidProductSlug("a".repeat(201))).toBe(false);
    expect(isValidProductSlug("a".repeat(200))).toBe(true);
  });
});

describe("isValidProductName", () => {
  it("rejects empty or whitespace-only names", () => {
    expect(isValidProductName("")).toBe(false);
    expect(isValidProductName("   ")).toBe(false);
  });

  it("accepts a normal name and rejects one over 200 characters", () => {
    expect(isValidProductName("Approval Workflow Starter Kit")).toBe(true);
    expect(isValidProductName("a".repeat(201))).toBe(false);
    expect(isValidProductName("a".repeat(200))).toBe(true);
  });
});

describe("isValidProductSummary", () => {
  it("rejects empty or whitespace-only summaries", () => {
    expect(isValidProductSummary("")).toBe(false);
    expect(isValidProductSummary("   ")).toBe(false);
  });

  it("accepts a normal summary and rejects one over 500 characters", () => {
    expect(isValidProductSummary("A short, factual summary.")).toBe(true);
    expect(isValidProductSummary("a".repeat(501))).toBe(false);
    expect(isValidProductSummary("a".repeat(500))).toBe(true);
  });
});

describe("isValidReleaseVersion", () => {
  it("rejects empty or whitespace-only versions", () => {
    expect(isValidReleaseVersion("")).toBe(false);
    expect(isValidReleaseVersion("   ")).toBe(false);
  });

  it("accepts any non-empty free-text version (no format enforced)", () => {
    expect(isValidReleaseVersion("1.0.0")).toBe(true);
    expect(isValidReleaseVersion("2026-09-24")).toBe(true);
    expect(isValidReleaseVersion("v1")).toBe(true);
    expect(isValidReleaseVersion("release one")).toBe(true);
  });

  it("rejects a version over 50 characters", () => {
    expect(isValidReleaseVersion("a".repeat(51))).toBe(false);
    expect(isValidReleaseVersion("a".repeat(50))).toBe(true);
  });
});

describe("isValidProductStatusTransition", () => {
  it("allows DRAFT -> PUBLISHED", () => {
    expect(isValidProductStatusTransition("DRAFT", "PUBLISHED")).toBe(true);
  });

  it("rejects PUBLISHED as a source (no unpublish/republish path)", () => {
    for (const to of ALL_STATUSES) {
      expect(isValidProductStatusTransition("PUBLISHED", to)).toBe(false);
    }
  });

  it("rejects re-entering DRAFT from anywhere", () => {
    for (const from of ALL_STATUSES) {
      expect(isValidProductStatusTransition(from, "DRAFT")).toBe(false);
    }
  });

  it("rejects SUSPENDED/ARCHIVED -> PUBLISHED (reinstating is changeProductStatus's concern, not publishProductWithRelease's)", () => {
    expect(isValidProductStatusTransition("SUSPENDED", "PUBLISHED")).toBe(false);
    expect(isValidProductStatusTransition("ARCHIVED", "PUBLISHED")).toBe(false);
  });
});

describe("isValidProductStatusChangeTransition (MVP-019)", () => {
  it("allows PUBLISHED <-> SUSPENDED", () => {
    expect(isValidProductStatusChangeTransition("PUBLISHED", "SUSPENDED")).toBe(true);
    expect(isValidProductStatusChangeTransition("SUSPENDED", "PUBLISHED")).toBe(true);
  });

  it("allows PUBLISHED -> ARCHIVED and SUSPENDED -> ARCHIVED", () => {
    expect(isValidProductStatusChangeTransition("PUBLISHED", "ARCHIVED")).toBe(true);
    expect(isValidProductStatusChangeTransition("SUSPENDED", "ARCHIVED")).toBe(true);
  });

  it("rejects DRAFT as a source or destination", () => {
    for (const to of ALL_STATUSES) {
      expect(isValidProductStatusChangeTransition("DRAFT", to)).toBe(false);
    }
    for (const from of ALL_STATUSES) {
      expect(isValidProductStatusChangeTransition(from, "DRAFT")).toBe(false);
    }
  });

  it("rejects any transition out of ARCHIVED -- it is terminal", () => {
    for (const to of ALL_STATUSES) {
      expect(isValidProductStatusChangeTransition("ARCHIVED", to)).toBe(false);
    }
  });

  it("rejects no-op self-transitions", () => {
    expect(isValidProductStatusChangeTransition("PUBLISHED", "PUBLISHED")).toBe(false);
    expect(isValidProductStatusChangeTransition("SUSPENDED", "SUSPENDED")).toBe(false);
    expect(isValidProductStatusChangeTransition("ARCHIVED", "ARCHIVED")).toBe(false);
  });
});

describe("isValidProductStatusChangeReason", () => {
  it("rejects empty or whitespace-only reasons", () => {
    expect(isValidProductStatusChangeReason("")).toBe(false);
    expect(isValidProductStatusChangeReason("   ")).toBe(false);
  });

  it("accepts a normal reason and rejects one over 1000 characters", () => {
    expect(isValidProductStatusChangeReason("Temporary pause for maintenance.")).toBe(true);
    expect(isValidProductStatusChangeReason("a".repeat(1001))).toBe(false);
    expect(isValidProductStatusChangeReason("a".repeat(1000))).toBe(true);
  });
});

describe("ProductStatusTransitionNotAllowedError / ProductStatusChangeReasonRequiredError", () => {
  it("identify their product id and carry distinct names", () => {
    const transitionError = new ProductStatusTransitionNotAllowedError(
      "product-1",
      "DRAFT",
      "SUSPENDED",
    );
    expect(transitionError.productId).toBe("product-1");
    expect(transitionError.fromStatus).toBe("DRAFT");
    expect(transitionError.toStatus).toBe("SUSPENDED");
    expect(transitionError.name).toBe("ProductStatusTransitionNotAllowedError");

    const reasonError = new ProductStatusChangeReasonRequiredError("product-1");
    expect(reasonError.productId).toBe("product-1");
    expect(reasonError.name).toBe("ProductStatusChangeReasonRequiredError");
  });
});

describe("isReleaseMutable", () => {
  it("is true for a draft release (publishedAt null)", () => {
    expect(isReleaseMutable({ publishedAt: null })).toBe(true);
  });

  it("is false once publishedAt is set", () => {
    expect(isReleaseMutable({ publishedAt: new Date() })).toBe(false);
  });
});

describe("product/release publish error classes", () => {
  it("each carries the identifying fields callers need to build a specific response", () => {
    expect(new ProductNotFoundError("p1").productId).toBe("p1");
    expect(new ProductNotDraftError("p1", "PUBLISHED").status).toBe("PUBLISHED");
    expect(new ReleaseNotFoundForProductError("r1", "p1").releaseId).toBe("r1");
    expect(new ReleaseAlreadyPublishedError("r1").releaseId).toBe("r1");
    expect(new ReleaseNotReadyError("r1").releaseId).toBe("r1");
    expect(new ProductNotReadyError(["license", "release"]).missingFields).toEqual([
      "license",
      "release",
    ]);
    expect(new ReleaseNotFoundError("r1").releaseId).toBe("r1");
  });

  it("each has a distinct .name so route handlers can pattern-match without instanceof pitfalls across module boundaries", () => {
    const names = [
      new ProductNotFoundError("p1").name,
      new ProductNotDraftError("p1", "DRAFT").name,
      new ReleaseNotFoundForProductError("r1", "p1").name,
      new ReleaseAlreadyPublishedError("r1").name,
      new ReleaseNotReadyError("r1").name,
      new ProductNotReadyError([]).name,
      new ReleaseNotFoundError("r1").name,
    ];
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("checkProductPublishReadiness", () => {
  const readySnapshot: ProductPublishSnapshot = {
    licenseCount: 1,
    hasSupportPolicy: true,
    compatibilityCount: 1,
    releasesWithCleanFileCount: 1,
  };

  it("is ready when every mandatory field is present", () => {
    expect(checkProductPublishReadiness(readySnapshot)).toEqual({
      ready: true,
      missingFields: [],
    });
  });

  it("reports a missing license", () => {
    const result = checkProductPublishReadiness({ ...readySnapshot, licenseCount: 0 });
    expect(result.ready).toBe(false);
    expect(result.missingFields).toEqual(["license"]);
  });

  it("reports a missing support policy", () => {
    const result = checkProductPublishReadiness({ ...readySnapshot, hasSupportPolicy: false });
    expect(result.ready).toBe(false);
    expect(result.missingFields).toEqual(["supportPolicy"]);
  });

  it("reports missing compatibility", () => {
    const result = checkProductPublishReadiness({ ...readySnapshot, compatibilityCount: 0 });
    expect(result.ready).toBe(false);
    expect(result.missingFields).toEqual(["compatibility"]);
  });

  it("reports a missing release with a clean attached file", () => {
    const result = checkProductPublishReadiness({
      ...readySnapshot,
      releasesWithCleanFileCount: 0,
    });
    expect(result.ready).toBe(false);
    expect(result.missingFields).toEqual(["release"]);
  });

  it("reports every missing field, in fixed order, when nothing is present", () => {
    const result = checkProductPublishReadiness({
      licenseCount: 0,
      hasSupportPolicy: false,
      compatibilityCount: 0,
      releasesWithCleanFileCount: 0,
    });
    expect(result.ready).toBe(false);
    expect(result.missingFields).toEqual(["license", "supportPolicy", "compatibility", "release"]);
  });

  it("never reports price as missing (out of scope -- MVP-007)", () => {
    const result = checkProductPublishReadiness({
      licenseCount: 0,
      hasSupportPolicy: false,
      compatibilityCount: 0,
      releasesWithCleanFileCount: 0,
    });
    expect(result.missingFields).not.toContain("price");
  });
});
