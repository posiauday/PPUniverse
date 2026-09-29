import { describe, expect, it } from "vitest";
import { MAX_SHARE_TITLE_LENGTH, shareTitle } from "./share-image";
import { SITE_NAME } from "./site";

describe("shareTitle", () => {
  it("keeps a short title as-is and strips invisible or direction-override characters", () => {
    expect(shareTitle("Intro")).toBe("Intro");
    expect(shareTitle(`Evil${String.fromCharCode(0x202e)}Title`)).toBe("EvilTitle");
  });

  it("falls back to the site name for an empty title", () => {
    expect(shareTitle("   ")).toBe(SITE_NAME);
    expect(shareTitle(null)).toBe(SITE_NAME);
  });

  it("shortens a long title at a word boundary so it always fits the card", () => {
    const long = "word ".repeat(60).trim();
    const result = shareTitle(long);
    expect(result.length).toBeLessThanOrEqual(MAX_SHARE_TITLE_LENGTH);
    expect(result.endsWith("word…")).toBe(true);
  });
});
