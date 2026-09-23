import { describe, expect, it } from "vitest";
import {
  isPubliclyVisible,
  isValidArticleBody,
  isValidArticleExcerpt,
  isValidArticleSlug,
  isValidArticleStatusTransition,
  isValidArticleTitle,
  isValidArticleType,
} from "./transitions.js";
import type { ArticleStatus } from "./types.js";

const ALL_STATUSES: ArticleStatus[] = ["DRAFT", "PUBLISHED"];

describe("isValidArticleStatusTransition", () => {
  it("allows DRAFT -> PUBLISHED", () => {
    expect(isValidArticleStatusTransition("DRAFT", "PUBLISHED")).toBe(true);
  });

  it("rejects PUBLISHED as a source (no unpublish/republish path)", () => {
    for (const to of ALL_STATUSES) {
      expect(isValidArticleStatusTransition("PUBLISHED", to)).toBe(false);
    }
  });

  it("rejects re-entering DRAFT from anywhere", () => {
    for (const from of ALL_STATUSES) {
      expect(isValidArticleStatusTransition(from, "DRAFT")).toBe(false);
    }
  });
});

describe("isPubliclyVisible", () => {
  it("only PUBLISHED is publicly visible", () => {
    expect(isPubliclyVisible({ status: "PUBLISHED" })).toBe(true);
    expect(isPubliclyVisible({ status: "DRAFT" })).toBe(false);
  });
});

describe("isValidArticleType", () => {
  it("accepts exactly the three built types", () => {
    expect(isValidArticleType("TUTORIAL")).toBe(true);
    expect(isValidArticleType("PATTERN")).toBe(true);
    expect(isValidArticleType("COMPARISON")).toBe(true);
  });

  it("rejects LEARNING_PATH (deferred, docs/open-questions.md item 50) and garbage input", () => {
    expect(isValidArticleType("LEARNING_PATH")).toBe(false);
    expect(isValidArticleType("")).toBe(false);
    expect(isValidArticleType("tutorial")).toBe(false);
  });
});

describe("isValidArticleSlug", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(isValidArticleSlug("power-automate-approvals")).toBe(true);
    expect(isValidArticleSlug("a")).toBe(true);
    expect(isValidArticleSlug("a1-b2")).toBe(true);
  });

  it("rejects empty, uppercase, spaces, leading/trailing/doubled hyphens", () => {
    expect(isValidArticleSlug("")).toBe(false);
    expect(isValidArticleSlug("Power-Automate")).toBe(false);
    expect(isValidArticleSlug("power automate")).toBe(false);
    expect(isValidArticleSlug("-leading")).toBe(false);
    expect(isValidArticleSlug("trailing-")).toBe(false);
    expect(isValidArticleSlug("double--hyphen")).toBe(false);
  });

  it("rejects a slug over 200 characters", () => {
    expect(isValidArticleSlug("a".repeat(201))).toBe(false);
    expect(isValidArticleSlug("a".repeat(200))).toBe(true);
  });
});

describe("isValidArticleTitle", () => {
  it("rejects empty or whitespace-only titles", () => {
    expect(isValidArticleTitle("")).toBe(false);
    expect(isValidArticleTitle("   ")).toBe(false);
  });

  it("accepts a normal title and rejects one over 200 characters", () => {
    expect(isValidArticleTitle("Getting started with Power Automate approvals")).toBe(true);
    expect(isValidArticleTitle("a".repeat(201))).toBe(false);
  });
});

describe("isValidArticleBody", () => {
  it("rejects empty or whitespace-only body", () => {
    expect(isValidArticleBody("")).toBe(false);
    expect(isValidArticleBody("   \n  ")).toBe(false);
  });

  it("accepts non-empty markdown body", () => {
    expect(isValidArticleBody("# Heading\n\nSome content.")).toBe(true);
  });
});

describe("isValidArticleExcerpt", () => {
  it("accepts null", () => {
    expect(isValidArticleExcerpt(null)).toBe(true);
  });

  it("accepts up to 500 characters and rejects more", () => {
    expect(isValidArticleExcerpt("a".repeat(500))).toBe(true);
    expect(isValidArticleExcerpt("a".repeat(501))).toBe(false);
  });
});
