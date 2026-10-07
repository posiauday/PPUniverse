import { describe, expect, it } from "vitest";
import {
  AVATAR_SHAPES,
  AVATAR_TINTS,
  avatarFromSeed,
  cleanCommentBody,
  cleanDisplayName,
  commentParts,
  displayNameKey,
  generateDisplayName,
} from "./comments.js";

describe("cleanCommentBody (MVP-040)", () => {
  it("tidies line endings and outer blank lines, keeping code indentation", () => {
    const result = cleanCommentBody("\r\n\r\nUse a scope:\r\n\r\n\r\n\r\n```\r\n  Try\r\n```\r\n\r\n");
    expect(result).toEqual({ ok: true, body: "Use a scope:\n\n```\n  Try\n```" });
  });

  it("refuses too short, too long and too many links", () => {
    expect(cleanCommentBody("   short   ")).toEqual({ ok: false, problem: "too-short" });
    expect(cleanCommentBody("a".repeat(2001))).toEqual({ ok: false, problem: "too-long" });
    expect(cleanCommentBody("a".repeat(2000)).ok).toBe(true);
    const links = "See https://a.example/x, https://b.example/y and http://c.example/z";
    expect(cleanCommentBody(links)).toEqual({ ok: false, problem: "too-many-links" });
    expect(cleanCommentBody("See https://a.example/x and https://b.example/y").ok).toBe(true);
  });

  it("counts an emoji as one character", () => {
    expect(cleanCommentBody("👍".repeat(10)).ok).toBe(true);
    expect(cleanCommentBody("👍".repeat(9))).toEqual({ ok: false, problem: "too-short" });
  });
});

describe("commentParts", () => {
  it("splits paragraphs and fenced code; an unclosed fence stays text", () => {
    expect(commentParts("First.\n\nSecond line\nwraps.\n\n```js\nlet a = 1;\n```\nAfter.")).toEqual([
      { kind: "text", text: "First." },
      { kind: "text", text: "Second line\nwraps." },
      { kind: "code", text: "let a = 1;" },
      { kind: "text", text: "After." },
    ]);
    expect(commentParts("Before\n```\nnever closed")).toEqual([
      { kind: "text", text: "Before" },
      { kind: "text", text: "never closed" },
    ]);
  });
});

describe("display names", () => {
  it("generates an adjective, a noun and a three-digit number", () => {
    const values = [0, 0.99, 0.5];
    let call = 0;
    const name = generateDisplayName(() => values[call++ % values.length]!);
    expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ \d{3}$/);
    expect(name).toBe("Swift Filter 550");
  });

  it("accepts letters in any language, digits, spaces and . _ -", () => {
    expect(cleanDisplayName("  Priya   K.  ")).toEqual({ ok: true, name: "Priya K." });
    expect(cleanDisplayName("Zoë_dev-2")).toEqual({ ok: true, name: "Zoë_dev-2" });
  });

  it("refuses names that are short, long, symbol-only or official-looking", () => {
    expect(cleanDisplayName("Al")).toEqual({ ok: false, problem: "too-short" });
    expect(cleanDisplayName("a".repeat(31))).toEqual({ ok: false, problem: "too-long" });
    expect(cleanDisplayName("<script>")).toEqual({ ok: false, problem: "characters" });
    expect(cleanDisplayName("12345")).toEqual({ ok: false, problem: "characters" });
    for (const name of ["Admin", "Site Moderator", "Maker Desk", "LowCode Stacks team", "Microsoft MVP"]) {
      expect(cleanDisplayName(name)).toEqual({ ok: false, problem: "reserved" });
    }
  });

  it("keys names so case and repeated spaces can't make a copy", () => {
    expect(displayNameKey("  Tidy   Trigger 418 ")).toBe(displayNameKey("tidy trigger 418"));
  });
});

describe("avatarFromSeed", () => {
  it("is deterministic and uses only our tints and shapes", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const spec = avatarFromSeed(`seed-${i}`);
      expect(avatarFromSeed(`seed-${i}`)).toEqual(spec);
      expect(AVATAR_TINTS).toContain(spec.tint);
      expect(AVATAR_SHAPES).toContain(spec.shape);
      seen.add(`${spec.tint}/${spec.shape}`);
    }
    // Spread across most combinations, not stuck on a few.
    expect(seen.size).toBeGreaterThan(30);
  });
});
