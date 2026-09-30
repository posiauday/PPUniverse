import { describe, expect, it } from "vitest";
import { buildCatalogUrl } from "./catalog-url.js";

describe("buildCatalogUrl", () => {
  it("returns the bare path when there are no params", () => {
    expect(buildCatalogUrl("/search", {}, {})).toBe("/search");
  });

  it("applies overrides on top of current params", () => {
    expect(
      buildCatalogUrl("/search", { q: "forms", sort: "recent" }, { sort: "alphabetical" }),
    ).toBe("/search?q=forms&sort=alphabetical");
  });

  it("drops a param entirely when its override value is undefined", () => {
    expect(buildCatalogUrl("/search", { q: "forms", page: "2" }, { page: undefined })).toBe(
      "/search?q=forms",
    );
  });

  it("drops a param whose value is an empty string", () => {
    expect(buildCatalogUrl("/search", { q: "" }, {})).toBe("/search");
  });
});
