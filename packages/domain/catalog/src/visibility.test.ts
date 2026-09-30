import { describe, expect, it } from "vitest";
import { isPubliclyVisible } from "./visibility.js";

describe("isPubliclyVisible", () => {
  it("is true for a PUBLISHED product", () => {
    expect(isPubliclyVisible({ status: "PUBLISHED" })).toBe(true);
  });

  it("is false for a DRAFT product", () => {
    expect(isPubliclyVisible({ status: "DRAFT" })).toBe(false);
  });
});
