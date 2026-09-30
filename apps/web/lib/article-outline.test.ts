import { describe, expect, it } from "vitest";
import { createSlugger, outlineOf, readingMinutes } from "./article-outline";

describe("createSlugger", () => {
  it("makes lower-case, hyphenated ids from only [a-z0-9-]", () => {
    const slug = createSlugger();
    expect(slug("Set Up the App!")).toBe("set-up-the-app");
    expect(slug("  Café & Crème  ")).toBe("cafe-creme");
    expect(slug('<img src=x onerror="1">')).toMatch(/^[a-z0-9-]+$/);
  });

  it("numbers repeats and never returns an empty id", () => {
    const slug = createSlugger();
    expect(slug("Setup")).toBe("setup");
    expect(slug("Setup")).toBe("setup-1");
    expect(slug("Setup")).toBe("setup-2");
    expect(slug("!!!")).toBe("section");
    expect(slug("???")).toBe("section-1");
  });
});

describe("outlineOf", () => {
  it("lists rendered h2 and h3 headings in order, with the ids ArticleBody gives them", () => {
    const outline = outlineOf(
      "# Intro\n\nText\n\n## Setup\n\n### Install\n\n#### Too deep\n\n## Setup\n\n```\n## not a heading\n```",
    );
    expect(outline).toEqual([
      { level: 2, text: "Intro", id: "intro" },
      { level: 2, text: "Setup", id: "setup" },
      { level: 3, text: "Install", id: "install" },
      { level: 2, text: "Setup", id: "setup-1" },
    ]);
  });

  it("uses the heading's text, not its Markdown syntax", () => {
    expect(outlineOf("## Use **named** `formulas`")[0]).toEqual({
      level: 2,
      text: "Use named formulas",
      id: "use-named-formulas",
    });
  });
});

describe("readingMinutes", () => {
  it("rounds to whole minutes at about 200 words a minute, never below 1", () => {
    expect(readingMinutes("one two three")).toBe(1);
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
  });
});
