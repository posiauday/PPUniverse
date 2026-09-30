import { describe, expect, it } from "vitest";
import { RESERVED_PREFIX, assertReserved, isReserved, newWorkerPrefix } from "./prefix.js";

describe("reserved test prefix", () => {
  it("is obviously non-production and unlike any seeded slug", () => {
    expect(RESERVED_PREFIX).toBe("zz-e2e-a11y-");
    for (const seeded of [
      "power-apps-components",
      "power-apps-templates",
      "power-automate-templates",
      "power-bi-templates",
      "architecture-blueprints",
      "governance-assets",
    ]) {
      expect(isReserved(seeded)).toBe(false);
    }
  });

  it("builds a per-worker prefix that starts with the reserved prefix", () => {
    const prefix = newWorkerPrefix(3, "abc123");
    expect(prefix).toBe("zz-e2e-a11y-abc123-w3-");
    expect(isReserved(prefix)).toBe(true);
    expect(isReserved(`${prefix}full`)).toBe(true);
  });

  it("gives different workers different prefixes even with the same token", () => {
    expect(newWorkerPrefix(0, "t")).not.toBe(newWorkerPrefix(1, "t"));
  });

  it("uses a fresh random token by default", () => {
    expect(newWorkerPrefix(0)).not.toBe(newWorkerPrefix(0));
  });

  it("refuses to let a seeded or real identifier be deleted", () => {
    expect(() => assertReserved("category", "power-apps-components")).toThrow(
      /reserved test prefix/,
    );
    expect(() => assertReserved("user", "person@example.com")).toThrow(/reserved test prefix/);
    expect(() => assertReserved("product", "")).toThrow(/reserved test prefix/);
    expect(() => assertReserved("product", "zz-e2e-a11y-abc-w0-full")).not.toThrow();
  });
});
