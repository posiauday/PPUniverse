/**
 * Scheduled publishing (MVP-050; docs/final-decisions.md, 2026-10-09): pure
 * rules for the time an admin picks. A scheduled guide or update stays a
 * DRAFT until the first visit after its time publishes it, so these rules
 * only decide which times may be set.
 */

/** What an admin did to a draft's schedule. A new time is another SCHEDULED. */
export type ScheduleAction = "SCHEDULED" | "CANCELLED";

/** A schedule must be at least this far ahead, so it can't be in the past by the time it saves. */
export const SCHEDULE_MIN_LEAD_MS = 60 * 1000;

/** And at most a year ahead: anything further is almost certainly a typo in the year. */
export const SCHEDULE_MAX_AHEAD_MS = 366 * 24 * 60 * 60 * 1000;

export type ScheduleTimeProblem = "invalid" | "past" | "too-far";

/**
 * An ISO 8601 date and time with an explicit offset ("Z" or "+02:00"), as the
 * admin form sends it after converting the admin's local time. A time without
 * an offset is refused rather than read in the server's time zone.
 */
const ISO_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

export function parseScheduleTime(value: unknown): Date | null {
  if (typeof value !== "string" || !ISO_WITH_OFFSET.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Null when `at` may be set as a publish time at `now`; otherwise why not. */
export function scheduleTimeProblem(at: Date, now: Date): ScheduleTimeProblem | null {
  if (Number.isNaN(at.getTime())) return "invalid";
  const ahead = at.getTime() - now.getTime();
  if (ahead < SCHEDULE_MIN_LEAD_MS) return "past";
  if (ahead > SCHEDULE_MAX_AHEAD_MS) return "too-far";
  return null;
}

export const SCHEDULE_PROBLEM_MESSAGE: Record<ScheduleTimeProblem, string> = {
  invalid: "Enter a date and time.",
  past: "Choose a time at least a minute from now.",
  "too-far": "Choose a time within the next year.",
};
