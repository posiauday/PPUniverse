import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  normalizeQuery,
  parsePage,
  parsePageSize,
  resolveSortOption,
  totalPages,
} from "./search-params.js";

describe("resolveSortOption", () => {
  it("defaults to relevance when a search query is present and no sort is given", () => {
    expect(resolveSortOption(undefined, true)).toBe("relevance");
  });

  it("defaults to recent when there is no search query and no sort is given", () => {
    expect(resolveSortOption(undefined, false)).toBe("recent");
  });

  it("falls back to recent if relevance is requested without a query", () => {
    expect(resolveSortOption("relevance", false)).toBe("recent");
  });

  it("respects an explicit valid sort", () => {
    expect(resolveSortOption("alphabetical", true)).toBe("alphabetical");
  });

  it("falls back to a safe default for an invalid sort value rather than throwing", () => {
    expect(resolveSortOption("not-a-real-sort", false)).toBe("recent");
  });
});

describe("normalizeQuery", () => {
  it("trims whitespace", () => {
    expect(normalizeQuery("  forms  ")).toBe("forms");
  });

  it("treats an empty/whitespace-only string as no query", () => {
    expect(normalizeQuery("   ")).toBeUndefined();
    expect(normalizeQuery("")).toBeUndefined();
    expect(normalizeQuery(undefined)).toBeUndefined();
  });
});

describe("parsePage", () => {
  it("parses a valid positive integer", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("falls back to 1 for missing, non-numeric, zero, or negative input", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
  });
});

describe("parsePageSize", () => {
  it("parses a valid positive integer within the max", () => {
    expect(parsePageSize("20")).toBe(20);
  });

  it("falls back to the default for missing or invalid input", () => {
    expect(parsePageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePageSize("abc")).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePageSize("0")).toBe(DEFAULT_PAGE_SIZE);
  });

  it("clamps to the maximum rather than allowing an unbounded page size", () => {
    expect(parsePageSize("9999")).toBe(MAX_PAGE_SIZE);
  });
});

describe("totalPages", () => {
  it("computes the ceiling of total divided by page size", () => {
    expect(totalPages(25, 12)).toBe(3);
    expect(totalPages(24, 12)).toBe(2);
  });

  it("is always at least 1, even with zero results", () => {
    expect(totalPages(0, 12)).toBe(1);
  });
});
