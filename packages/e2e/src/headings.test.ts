import { describe, expect, it } from "vitest";
import { headingOrderProblems } from "./headings.js";

const h = (level: number, text = `Heading ${level}`) => ({ level, text });

describe("heading outline", () => {
  it("accepts a well-formed outline, including going back up a level", () => {
    expect(headingOrderProblems([h(1), h(2), h(3), h(3), h(2), h(3)])).toEqual([]);
  });

  it("flags the h1 to h3 skip that BUG-007 found on the category and search pages", () => {
    const problems = headingOrderProblems([h(1, "Search"), h(3, "Some product"), h(3, "Another")]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(
      /h1 \("Search"\) is followed by h3 \("Some product"\), skipping a level/,
    );
  });

  it("flags a missing h1 and multiple h1s", () => {
    expect(headingOrderProblems([h(2), h(3)])).toEqual(
      expect.arrayContaining([expect.stringMatching(/exactly one h1, found 0/)]),
    );
    expect(headingOrderProblems([h(1), h(1)])).toEqual(
      expect.arrayContaining([expect.stringMatching(/exactly one h1, found 2/)]),
    );
  });

  it("flags a page whose first heading is not the h1", () => {
    expect(headingOrderProblems([h(2, "Intro"), h(1, "Title")])).toEqual(
      expect.arrayContaining([expect.stringMatching(/first heading is an h2/)]),
    );
  });

  it("flags a page with no headings", () => {
    expect(headingOrderProblems([])).toEqual(["the page has no headings"]);
  });
});
