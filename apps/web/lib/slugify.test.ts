import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("slugify", () => {
  it("lower-cases and hyphenates", () => {
    expect(slugify("Delegation in Power Apps")).toBe("delegation-in-power-apps");
  });

  it("drops apostrophes and accents, and reads & as and", () => {
    expect(slugify("What's new: Café & Dataverse")).toBe("whats-new-cafe-and-dataverse");
    expect(slugify("Copilot’s answers")).toBe("copilots-answers");
  });

  it("collapses punctuation and trims the ends", () => {
    expect(slugify("  --Power Fx (v2)!! -- ")).toBe("power-fx-v2");
  });

  it("is empty when there is nothing to keep", () => {
    expect(slugify("")).toBe("");
    expect(slugify("!!!")).toBe("");
  });

  it("cuts a long title at a word and always matches the slug pattern", () => {
    const slug = slugify(
      "A very long guide title that keeps going well past the length anyone would want in an address bar",
    );
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).toMatch(SLUG_PATTERN);
    expect(slug.endsWith("-")).toBe(false);
    expect(slugify("x".repeat(120))).toHaveLength(80);
  });
});
