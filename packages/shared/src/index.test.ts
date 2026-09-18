import { describe, expect, it } from "vitest";
import { createErrorEnvelope } from "./error-envelope.js";
import { resolveBoundedPage } from "./pagination.js";

describe("createErrorEnvelope", () => {
  it("builds the required error envelope shape", () => {
    const envelope = createErrorEnvelope("NOT_FOUND", "Product not found", "corr-123");
    expect(envelope).toEqual({
      code: "NOT_FOUND",
      message: "Product not found",
      correlationId: "corr-123",
    });
  });

  it("includes optional fieldErrors and retryAfter only when provided", () => {
    const envelope = createErrorEnvelope("VALIDATION", "Invalid input", "corr-456", {
      fieldErrors: { email: ["Required"] },
      retryAfter: 30,
    });
    expect(envelope.fieldErrors).toEqual({ email: ["Required"] });
    expect(envelope.retryAfter).toBe(30);
  });
});

describe("resolveBoundedPage", () => {
  it("defaults to page 1 with the default page size", () => {
    expect(resolveBoundedPage({})).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });

  it("clamps page size to the configured maximum", () => {
    const result = resolveBoundedPage({ page: 2, pageSize: 1000 });
    expect(result).toEqual({ page: 2, pageSize: 100, skip: 100, take: 100 });
  });

  it("rejects non-positive page numbers by clamping to 1", () => {
    expect(resolveBoundedPage({ page: -5 }).page).toBe(1);
  });
});
