import { describe, expect, it } from "vitest";
import {
  isCategoryVariant,
  resolveCategoryIndexing,
  type CategoryIndexingDecision,
  type RawSearchParams,
} from "./category-indexing.js";

/** 30 PUBLISHED products at the default page size of 12 is three pages. */
const THREE_PAGES = 30;

const decide = (searchParams: RawSearchParams, total = THREE_PAGES): CategoryIndexingDecision =>
  resolveCategoryIndexing({ searchParams, total });

const BASE = { index: false, canonicalPage: null } as const;

describe("base category URL", () => {
  it("is indexable and self-canonical to the base URL when it has PUBLISHED products", () => {
    expect(decide({})).toEqual({ index: true, canonicalPage: null, reason: "BASE" });
  });

  it("ignores parameters whose value is undefined", () => {
    expect(decide({ page: undefined, q: undefined })).toEqual({
      index: true,
      canonicalPage: null,
      reason: "BASE",
    });
  });
});

describe("page=1 normalization", () => {
  it("stays indexable and canonicalizes to the base URL, not to ?page=1", () => {
    expect(decide({ page: "1" })).toEqual({ index: true, canonicalPage: null, reason: "PAGE_ONE" });
  });
});

describe("valid ?page=N", () => {
  it.each([2, 3])("page %i is indexable and self-canonical to that exact URL", (page) => {
    expect(decide({ page: String(page) })).toEqual({
      index: true,
      canonicalPage: page,
      reason: "PAGINATED",
    });
  });

  it("does not canonicalize a later page back to page 1", () => {
    expect(decide({ page: "2" }).canonicalPage).not.toBeNull();
  });

  it("treats the last page as valid and the one after it as out of range", () => {
    expect(decide({ page: "3" }, 36).reason).toBe("PAGINATED");
    expect(decide({ page: "4" }, 36).reason).toBe("OUT_OF_RANGE_PAGE");
    expect(decide({ page: "4" }, 37).reason).toBe("PAGINATED");
  });
});

describe("search-query variant (?q=)", () => {
  it.each([{ q: "button" }, { q: "" }])(
    "%j is noindex, follow with the base canonical",
    (params) => {
      expect(decide(params)).toEqual({ ...BASE, reason: "VARIANT_PARAMS" });
    },
  );
});

describe("sort-only variant (?sort=)", () => {
  it.each(["newest", "recent", "alphabetical", "relevance", ""])(
    "sort=%j is noindex, follow with the base canonical, valid value or not",
    (sort) => {
      expect(decide({ sort })).toEqual({ ...BASE, reason: "VARIANT_PARAMS" });
    },
  );
});

describe("filter parameters", () => {
  it.each([
    { license: "personal" },
    { compatibility: "power-apps" },
    { platformArea: "POWER_APPS" },
    { pageSize: "24" },
    { utm_source: "newsletter" },
    { anything: "at-all" },
  ])("%j is noindex, follow with the base canonical", (params) => {
    expect(decide(params)).toEqual({ ...BASE, reason: "VARIANT_PARAMS" });
  });
});

describe("mixed parameters", () => {
  it.each([
    { page: "2", q: "button" },
    { page: "2", sort: "recent" },
    { page: "2", license: "personal" },
    { page: "1", q: "button" },
    { q: "button", sort: "alphabetical", page: "3" },
  ])("%j is noindex, follow with the base canonical — pagination does not rescue it", (params) => {
    expect(decide(params)).toEqual({ ...BASE, reason: "VARIANT_PARAMS" });
  });
});

describe("empty category (zero PUBLISHED products)", () => {
  it("is noindex, follow and canonicalizes to the base URL", () => {
    expect(decide({}, 0)).toEqual({ ...BASE, reason: "EMPTY_CATEGORY" });
  });

  it.each(["1", "2", "5"])("stays noindex for ?page=%s", (page) => {
    expect(decide({ page }, 0)).toEqual({ ...BASE, reason: "EMPTY_CATEGORY" });
  });

  it("treats a missing or nonsensical total as empty rather than indexable", () => {
    expect(decide({}, Number.NaN).index).toBe(false);
    expect(decide({}, -3).index).toBe(false);
  });

  it("becomes indexable as soon as it has one PUBLISHED product", () => {
    expect(decide({}, 1)).toEqual({ index: true, canonicalPage: null, reason: "BASE" });
  });
});

describe("out-of-range pagination", () => {
  it.each(["4", "999", "999999999"])(
    "?page=%s beyond the last page is noindex with the base canonical",
    (page) => {
      expect(decide({ page })).toEqual({ ...BASE, reason: "OUT_OF_RANGE_PAGE" });
    },
  );

  it("a single-page category has no valid page 2", () => {
    expect(decide({ page: "2" }, 12)).toEqual({ ...BASE, reason: "OUT_OF_RANGE_PAGE" });
    expect(decide({ page: "2" }, 13).reason).toBe("PAGINATED");
  });
});

describe("invalid page values never become an indexable duplicate", () => {
  it.each(["0", "-1", "abc", "1.5", "02", "", " 2", "2 ", "1e1", "+2", "9999999999"])(
    "?page=%j is noindex with the base canonical",
    (page) => {
      expect(decide({ page })).toEqual({ ...BASE, reason: "INVALID_PAGE" });
    },
  );

  it("treats a repeated page parameter as invalid", () => {
    expect(decide({ page: ["1", "2"] })).toEqual({ ...BASE, reason: "INVALID_PAGE" });
  });

  it("never yields an indexable decision for any invalid value", () => {
    for (const page of ["0", "-1", "abc", "1.5", "02", "", "9999999999"]) {
      expect(decide({ page }).index, page).toBe(false);
    }
  });
});

describe("isCategoryVariant", () => {
  it("is false for no parameters or page alone, true for anything else", () => {
    expect(isCategoryVariant({})).toBe(false);
    expect(isCategoryVariant({ page: "2" })).toBe(false);
    expect(isCategoryVariant({ q: "x" })).toBe(true);
    expect(isCategoryVariant({ page: "2", pageSize: "24" })).toBe(true);
  });
});
