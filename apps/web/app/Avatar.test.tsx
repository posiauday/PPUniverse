import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Avatar, initialsOf } from "./Avatar";

describe("initialsOf", () => {
  it("takes the first letter of the first two words", () => {
    expect(initialsOf("Nimble Webhook 481")).toBe("NW");
    expect(initialsOf("  priya   k.  ")).toBe("PK");
  });

  it("handles one word, other alphabets and names without letters", () => {
    expect(initialsOf("Zoë_dev-2")).toBe("Z");
    expect(initialsOf("Émile Durand")).toBe("ÉD");
    expect(initialsOf("Нина Петрова")).toBe("НП");
    expect(initialsOf("42 Builder")).toBe("B");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("Avatar", () => {
  it("draws the critter for the same seed the same way, and is hidden from screen readers", () => {
    const one = renderToStaticMarkup(<Avatar seed="reader-1" />);
    expect(renderToStaticMarkup(<Avatar seed="reader-1" />)).toBe(one);
    expect(one).toContain('aria-hidden="true"');
    expect(one).not.toContain(" id=");
  });

  it("has no tile: a transparent background, with the light lift on both kinds", () => {
    for (const seed of ["reader-1", "crown"]) {
      const svg = renderToStaticMarkup(<Avatar seed={seed} name="Kiran Lee" />);
      expect(svg).not.toContain('width="64" height="64"');
      expect(svg).not.toContain("rounded-[30%]");
      expect(svg).toContain("avatar-lift");
    }
  });

  it("wears a name tag with the initials only when it has a name", () => {
    expect(renderToStaticMarkup(<Avatar seed="reader-1" />)).not.toContain("<text");
    const tagged = renderToStaticMarkup(<Avatar seed="reader-1" name="Tidy Trigger 418" />);
    expect(tagged).toContain(">TT</text>");
  });
});
