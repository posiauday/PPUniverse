import { describe, expect, it } from "vitest";
import {
  ACCEPTED_MIN_VOTES,
  REPORT_MAX_LENGTH,
  cleanReportMessage,
  isAcceptedFix,
} from "./feedback.js";

describe("isAcceptedFix (MVP-039)", () => {
  it("needs at least 10 votes and at least 80% Yes", () => {
    expect(isAcceptedFix({ yes: 8, no: 2 })).toBe(true);
    expect(isAcceptedFix({ yes: 7, no: 2 })).toBe(false); // 9 votes
    expect(isAcceptedFix({ yes: 7, no: 3 })).toBe(false); // 70%
    expect(isAcceptedFix({ yes: 0, no: 0 })).toBe(false);
    expect(isAcceptedFix({ yes: 40, no: 10 })).toBe(true);
    expect(ACCEPTED_MIN_VOTES).toBe(10);
  });
});

describe("cleanReportMessage (MVP-038)", () => {
  it("trims and tidies spaces, keeping line breaks", () => {
    expect(cleanReportMessage("  The limit   changed\r\nto 10,000.  ")).toEqual({
      ok: true,
      message: "The limit changed\nto 10,000.",
    });
  });

  it("refuses notes that are too short or too long, counting emoji as one", () => {
    expect(cleanReportMessage("wrong")).toEqual({ ok: false, problem: "too-short" });
    expect(cleanReportMessage("x".repeat(REPORT_MAX_LENGTH + 1))).toEqual({
      ok: false,
      problem: "too-long",
    });
    expect(cleanReportMessage("✅".repeat(REPORT_MAX_LENGTH)).ok).toBe(true);
  });
});
