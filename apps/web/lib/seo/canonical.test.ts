import { describe, expect, it } from "vitest";
import { categoryUrl, homeUrl, productUrl } from "./canonical.js";

const ORIGIN = "https://example.com";

describe("canonical URL builders", () => {
  it("builds the home URL with a single trailing slash", () => {
    expect(homeUrl(ORIGIN)).toBe("https://example.com/");
  });

  it("builds category and product URLs with no trailing slash", () => {
    expect(categoryUrl(ORIGIN, "power-apps-components")).toBe(
      "https://example.com/categories/power-apps-components",
    );
    expect(productUrl(ORIGIN, "sample-component")).toBe(
      "https://example.com/products/sample-component",
    );
  });

  it("adds ?page=N only for a whole page number of 2 or more", () => {
    expect(categoryUrl(ORIGIN, "c", 2)).toBe("https://example.com/categories/c?page=2");
    expect(categoryUrl(ORIGIN, "c", 37)).toBe("https://example.com/categories/c?page=37");
  });

  it.each([1, 0, -1, 1.5, Number.NaN, null, undefined])(
    "normalizes page %s to the base URL",
    (page) => {
      expect(categoryUrl(ORIGIN, "c", page)).toBe("https://example.com/categories/c");
    },
  );

  it("URL-encodes slugs so a path can never be altered by data", () => {
    expect(productUrl(ORIGIN, "a b/c?d#e")).toBe("https://example.com/products/a%20b%2Fc%3Fd%23e");
    expect(categoryUrl(ORIGIN, "../admin")).toBe("https://example.com/categories/..%2Fadmin");
  });
});
