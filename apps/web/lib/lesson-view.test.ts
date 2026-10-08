import { describe, expect, it } from "vitest";
import { lessonView, neighbours, sectionId } from "./lesson-view";

const BODY = [
  "## The idea",
  "",
  "The source does the work.",
  "",
  "## How it works",
  "",
  "### Read it left to right",
  "",
  "Every part must be understood.",
  "",
  "## The important things",
  "",
  "1. All or nothing.",
  "",
  "## Try it",
  "",
  "Set the limit to 1.",
  "",
  "## Check yourself",
  "",
  "> [!CHECK] Q1?",
  "> - [x] A",
  ">   Yes.",
  "> - [ ] B",
  ">   No.",
  "",
  "## Sources",
  "",
  "- [Delegation](https://learn.microsoft.com/power-apps/)",
].join("\n");

describe("lessonView (MVP-048)", () => {
  it("splits the body into the fixed sections, in order, with page ids", () => {
    const view = lessonView(BODY);
    expect(view.sections.map((section) => section.id)).toEqual([
      "lesson_the-idea",
      "lesson_how-it-works",
      "lesson_the-important-things",
      "lesson_try-it",
      "lesson_check-yourself",
      "lesson_sources",
    ]);
    expect(view.sections[1]?.markdown).toBe(
      "### Read it left to right\n\nEvery part must be understood.",
    );
  });

  it("draws Check yourself from the parsed questions, not as Markdown", () => {
    const view = lessonView(BODY);
    expect(view.sections[4]?.markdown).toBe("");
    expect(view.checks).toHaveLength(1);
    expect(view.checks[0]?.options.map((option) => option.correct)).toEqual([true, false]);
  });

  it("gives section ids an underscore, which heading slugs never have", () => {
    expect(sectionId("The important things")).toContain("_");
  });
});

describe("neighbours", () => {
  const lessons = [{ position: 1 }, { position: 2 }, { position: 4 }];
  it("finds the previous and next published lessons, skipping gaps", () => {
    expect(neighbours(lessons, 2)).toEqual({ previous: { position: 1 }, next: { position: 4 } });
    expect(neighbours(lessons, 1).previous).toBeNull();
    expect(neighbours(lessons, 4).next).toBeNull();
  });
});
