import { describe, expect, it } from "vitest";
import {
  SCHEDULE_MAX_AHEAD_MS,
  SCHEDULE_MIN_LEAD_MS,
  parseScheduleTime,
  scheduleTimeProblem,
} from "./schedule.js";

const now = new Date("2026-10-09T12:00:00.000Z");

describe("parseScheduleTime", () => {
  it("reads a UTC time and one with an offset", () => {
    expect(parseScheduleTime("2026-10-12T15:00:00.000Z")?.toISOString()).toBe(
      "2026-10-12T15:00:00.000Z",
    );
    expect(parseScheduleTime("2026-10-12T09:00-06:00")?.toISOString()).toBe(
      "2026-10-12T15:00:00.000Z",
    );
  });

  it("refuses a time with no offset, which the server would read in its own zone", () => {
    expect(parseScheduleTime("2026-10-12T15:00")).toBeNull();
    expect(parseScheduleTime("2026-10-12")).toBeNull();
  });

  it("refuses anything that isn't a date-time string", () => {
    for (const value of [undefined, null, 1760281200000, "", "tomorrow", "2026-13-40T99:00Z"]) {
      expect(parseScheduleTime(value)).toBeNull();
    }
  });
});

describe("scheduleTimeProblem", () => {
  it("accepts a time from a minute to a year ahead", () => {
    expect(scheduleTimeProblem(new Date(now.getTime() + SCHEDULE_MIN_LEAD_MS), now)).toBeNull();
    expect(scheduleTimeProblem(new Date(now.getTime() + SCHEDULE_MAX_AHEAD_MS), now)).toBeNull();
  });

  it("refuses the past and the next minute", () => {
    expect(scheduleTimeProblem(new Date(now.getTime() - 1), now)).toBe("past");
    expect(scheduleTimeProblem(new Date(now.getTime() + SCHEDULE_MIN_LEAD_MS - 1), now)).toBe(
      "past",
    );
  });

  it("refuses more than a year ahead", () => {
    expect(scheduleTimeProblem(new Date(now.getTime() + SCHEDULE_MAX_AHEAD_MS + 1), now)).toBe(
      "too-far",
    );
  });

  it("calls an invalid date invalid", () => {
    expect(scheduleTimeProblem(new Date(Number.NaN), now)).toBe("invalid");
  });
});
