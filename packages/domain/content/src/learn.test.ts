import { describe, expect, it } from "vitest";
import {
  isValidLessonMinutes,
  isValidLessonOutcomes,
  isValidLessonPosition,
  isValidSortOrder,
  knowledgeCheckProblems,
  lessonBodyProblems,
  lessonSection,
  parseKnowledgeChecks,
} from "./learn.js";
import { parseLessonSource, parseTopicSource } from "./learn-source.js";

const VALID_LESSON_BODY = [
  "## The idea",
  "",
  "When a formula can be handed to the data source, the source does the work.",
  "",
  "## How it works",
  "",
  "Read the formula left to right.",
  "",
  "```",
  "## Not a heading: inside a code block",
  "```",
  "",
  "## The important things",
  "",
  "1. All or nothing.",
  "",
  "## Try it",
  "",
  "In a trial environment, set the data row limit to 1.",
  "",
  "## Check yourself",
  "",
  "> [!CHECK] A gallery uses Search() on a SharePoint list of 5,000 rows. What does it show?",
  "> - [ ] Matches from all 5,000 rows",
  ">   Search() isn't delegated to SharePoint, so not every row is checked.",
  "> - [x] Matches from the first 500 rows",
  ">   Correct: Power Apps searches the first 500 rows on the device.",
  "",
  "> [!CHECK] Does Today() stop a filter delegating?",
  "> - [ ] Yes",
  ">   It doesn't depend on the row, so it's worked out first.",
  "> - [x] No",
  ">   Correct: it's sent to the source as a plain value.",
  "",
  "## Sources",
  "",
  "- [Understand delegation](https://learn.microsoft.com/power-apps/maker/canvas-apps/delegation-overview), checked 7 Oct 2026",
].join("\n");

describe("parseKnowledgeChecks", () => {
  it("reads each question, its answers, the right one and every explanation", () => {
    const questions = parseKnowledgeChecks(VALID_LESSON_BODY);
    expect(questions).toHaveLength(2);
    expect(questions[1]).toEqual({
      prompt: "Does Today() stop a filter delegating?",
      options: [
        { text: "Yes", correct: false, why: "It doesn't depend on the row, so it's worked out first." },
        { text: "No", correct: true, why: "Correct: it's sent to the source as a plain value." },
      ],
    });
  });

  it("joins a wrapped explanation and ends a question at the first line outside the quote", () => {
    const [question] = parseKnowledgeChecks(
      ["> [!CHECK] Q?", "> - [X] A", ">   One", ">   two.", "> - [ ] B", ">   No.", "", "> - [ ] C"].join("\n"),
    );
    expect(question?.options).toEqual([
      { text: "A", correct: true, why: "One two." },
      { text: "B", correct: false, why: "No." },
    ]);
  });
});

describe("knowledgeCheckProblems (Microsoft Learn's knowledge-check rules)", () => {
  const ok = { prompt: "Q?", options: [{ text: "A", correct: true, why: "Yes." }, { text: "B", correct: false, why: "No." }] };

  it("accepts a question with one right answer and an explanation for each", () => {
    expect(knowledgeCheckProblems(ok)).toEqual([]);
  });

  it.each([
    ["no right answer", { ...ok, options: ok.options.map((o) => ({ ...o, correct: false })) }, "exactly one right answer"],
    ["two right answers", { ...ok, options: ok.options.map((o) => ({ ...o, correct: true })) }, "exactly one right answer"],
    ["a missing explanation", { ...ok, options: [ok.options[0]!, { text: "B", correct: false, why: "" }] }, "explanation under every answer"],
    ["one answer only", { ...ok, options: [ok.options[0]!] }, "2 to 4 answers"],
    ["all of the above", { ...ok, options: [ok.options[0]!, { text: "All of the above", correct: false, why: "No." }] }, "all/none of the above"],
    ["no question", { ...ok, prompt: " " }, "has no question"],
  ])("refuses %s", (_label, question, problem) => {
    expect(knowledgeCheckProblems(question).join("\n")).toContain(problem);
  });
});

describe("lessonBodyProblems (the fixed lesson shape)", () => {
  it("accepts a body in the fixed shape", () => {
    expect(lessonBodyProblems(VALID_LESSON_BODY)).toEqual([]);
  });

  it("ignores headings inside code blocks when reading the sections", () => {
    expect(lessonSection(VALID_LESSON_BODY, "How it works")).toContain("## Not a heading");
  });

  it("refuses missing or reordered sections", () => {
    const reordered = VALID_LESSON_BODY.replace("## The idea", "## Try it first");
    expect(lessonBodyProblems(reordered)[0]).toContain("must be exactly, in order");
  });

  it("needs 2 or 3 questions, and only in Check yourself", () => {
    const oneQuestion = VALID_LESSON_BODY.replace(/> \[!CHECK\] Does Today[\s\S]*?plain value\.\n/, "");
    expect(lessonBodyProblems(oneQuestion)).toContain('"Check yourself" needs 2 or 3 knowledge-check questions');
    const misplaced = VALID_LESSON_BODY.replace(
      "1. All or nothing.",
      "> [!CHECK] Q?\n> - [x] A\n>   Yes.\n> - [ ] B\n>   No.",
    );
    expect(lessonBodyProblems(misplaced)).toContain('knowledge checks belong in the "Check yourself" section only');
  });

  it("needs a Microsoft Learn source", () => {
    const noSource = VALID_LESSON_BODY.replace("https://learn.microsoft.com/", "https://example.org/");
    expect(lessonBodyProblems(noSource)).toContain('"Sources" needs at least one link to a learn.microsoft.com page');
  });
});

describe("validators", () => {
  it("bounds positions, minutes, outcomes and sort order", () => {
    expect([1, 6].map(isValidLessonPosition)).toEqual([true, true]);
    expect([0, 7, 1.5].map(isValidLessonPosition)).toEqual([false, false, false]);
    expect([1, 60, 0, 61].map(isValidLessonMinutes)).toEqual([true, true, false, false]);
    expect(isValidLessonOutcomes(["a", "b"])).toBe(true);
    expect(isValidLessonOutcomes(["a"])).toBe(false);
    expect(isValidLessonOutcomes(["a", "b", "c", "d"])).toBe(false);
    expect(isValidLessonOutcomes(["a", " "])).toBe(false);
    expect([0, 999, -1, 1000].map(isValidSortOrder)).toEqual([true, true, false, false]);
  });
});

describe("parseTopicSource", () => {
  const topic = [
    "---",
    'title: "Delegation in Power Apps"',
    "slug: power-apps-delegation",
    "technology: POWER_APPS",
    'summary: "Why a gallery stops at 500 rows, and how to see every row."',
    "order: 1",
    "---",
    "",
  ].join("\n");

  it("parses a valid topic.md", () => {
    expect(parseTopicSource(topic)).toEqual({
      ok: true,
      topic: {
        title: "Delegation in Power Apps",
        slug: "power-apps-delegation",
        technology: "POWER_APPS",
        summary: "Why a gallery stops at 500 rows, and how to see every row.",
        sortOrder: 1,
      },
    });
  });

  it("reports every problem at once", () => {
    const bad = topic.replace("POWER_APPS", "EXCEL").replace("order: 1", "order: first") + "Body text.";
    expect(parseTopicSource(bad)).toEqual({
      ok: false,
      errors: [
        "technology must be one of the seven areas",
        "order must be a whole number from 0 to 999",
        "topic.md has front matter only; lessons go in their own files",
      ],
    });
  });
});

describe("parseLessonSource", () => {
  const lesson = [
    "---",
    'title: "Which formulas delegate"',
    "slug: which-formulas-delegate",
    "position: 2",
    "minutes: 12",
    "outcome: \"Tell a delegable formula from one that isn't\"",
    'outcome: "Know why the delegation warning matters"',
    "checkedOn: 2026-10-07",
    "---",
    VALID_LESSON_BODY,
  ].join("\n");

  it("parses a valid lesson, with its repeated outcomes in order", () => {
    const result = parseLessonSource(lesson.replace(/\n/g, "\r\n"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lesson).toMatchObject({
      slug: "which-formulas-delegate",
      position: 2,
      minutes: 12,
      outcomes: ["Tell a delegable formula from one that isn't", "Know why the delegation warning matters"],
      checkedOn: new Date("2026-10-07T00:00:00Z"),
    });
    expect(result.lesson.body).toBe(VALID_LESSON_BODY);
  });

  it("refuses bad values and a body out of shape", () => {
    const bad = lesson
      .replace("position: 2", "position: 9")
      .replace("checkedOn: 2026-10-07", "checkedOn: 2026-02-30")
      .replace("## Sources", "## Further reading");
    const result = parseLessonSource(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain("position must be a whole number from 1 to 6");
    expect(result.errors).toContain("checkedOn must be a date as YYYY-MM-DD");
    expect(result.errors.join("\n")).toContain("must be exactly, in order");
  });

  it("only lets outcome repeat", () => {
    const result = parseLessonSource(lesson.replace("minutes: 12", "minutes: 12\nminutes: 9"));
    expect(result.ok ? [] : result.errors).toContain("duplicate key: minutes");
  });
});
