import {
  LESSON_MINUTES_MAX,
  LESSON_OUTCOMES_MAX,
  LESSON_OUTCOMES_MIN,
  LESSON_OUTCOME_MAX,
  LESSON_POSITION_MAX,
  TOPIC_SORT_ORDER_MAX,
  isValidLessonMinutes,
  isValidLessonOutcomes,
  isValidLessonPosition,
  isValidLessonSlug,
  isValidLessonTitle,
  isValidSortOrder,
  isValidTechnology,
  isValidTopicSlug,
  isValidTopicSummary,
  isValidTopicTitle,
  lessonBodyProblems,
  parseIsoDate,
  type LessonInput,
  type Technology,
  type TopicInput,
} from "@ppu/domain-content";

/**
 * Validates the admin's Learn topic and lesson bodies (MVP-048 slice 1b) with
 * the same validators as the content importer (@ppu/domain-content), so a
 * lesson saved in the admin is one the importer would accept: the fixed
 * lesson shape and the knowledge-check rules included. Shared by the create
 * and edit routes so the two can never disagree. Every field is untrusted.
 */

export type FieldErrors = Record<string, string[]>;
export type TopicInputResult =
  { ok: true; input: TopicInput } | { ok: false; fieldErrors: FieldErrors };
export type LessonInputResult =
  { ok: true; input: LessonInput } | { ok: false; fieldErrors: FieldErrors };

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** A whole number from a number or a digits-only string; NaN otherwise. */
function whole(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\s*\d+\s*$/.test(value)) return Number(value);
  return Number.NaN;
}

export function parseTopicBody(body: Record<string, unknown>): TopicInputResult {
  const fieldErrors: FieldErrors = {};
  const slug = str(body["slug"]);
  if (!isValidTopicSlug(slug))
    fieldErrors["slug"] = [
      "slug must be lowercase and hyphen-separated (e.g. power-apps-delegation).",
    ];
  const title = str(body["title"]);
  if (!isValidTopicTitle(title))
    fieldErrors["title"] = ["title is required and must be 120 characters or fewer."];
  const summary = str(body["summary"]);
  if (!isValidTopicSummary(summary))
    fieldErrors["summary"] = ["summary is required and must be 300 characters or fewer."];
  const technology = str(body["technology"]);
  if (!isValidTechnology(technology)) fieldErrors["technology"] = ["choose an area."];
  const sortOrder = whole(body["sortOrder"]);
  if (!isValidSortOrder(sortOrder))
    fieldErrors["sortOrder"] = [`order must be a whole number from 0 to ${TOPIC_SORT_ORDER_MAX}.`];

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    input: { slug, title, summary, technology: technology as Technology, sortOrder },
  };
}

/** Outcomes arrive as an array of strings, or as text with one outcome per line. */
function outcomesOf(value: unknown): string[] | null {
  const lines =
    typeof value === "string"
      ? value.split(/\r?\n/)
      : Array.isArray(value) && value.every((item) => typeof item === "string")
        ? (value as string[])
        : null;
  return lines ? lines.map((line) => line.trim()).filter((line) => line !== "") : null;
}

export function parseLessonBody(body: Record<string, unknown>): LessonInputResult {
  const fieldErrors: FieldErrors = {};
  const slug = str(body["slug"]);
  if (!isValidLessonSlug(slug))
    fieldErrors["slug"] = [
      "slug must be lowercase and hyphen-separated (e.g. which-formulas-delegate).",
    ];
  const title = str(body["title"]);
  if (!isValidLessonTitle(title))
    fieldErrors["title"] = ["title is required and must be 120 characters or fewer."];
  const position = whole(body["position"]);
  if (!isValidLessonPosition(position))
    fieldErrors["position"] = [`position must be a whole number from 1 to ${LESSON_POSITION_MAX}.`];
  const minutes = whole(body["minutes"]);
  if (!isValidLessonMinutes(minutes))
    fieldErrors["minutes"] = [`minutes must be a whole number from 1 to ${LESSON_MINUTES_MAX}.`];
  const outcomes = outcomesOf(body["outcomes"]);
  if (!outcomes || !isValidLessonOutcomes(outcomes))
    fieldErrors["outcomes"] = [
      `give ${LESSON_OUTCOMES_MIN} or ${LESSON_OUTCOMES_MAX} outcomes, one per line, each ${LESSON_OUTCOME_MAX} characters or fewer.`,
    ];
  const checkedOnValue = str(body["checkedOn"]);
  const checkedOn = checkedOnValue === "" ? null : parseIsoDate(checkedOnValue);
  if (checkedOnValue !== "" && !checkedOn)
    fieldErrors["checkedOn"] = ["checked on must be a date as YYYY-MM-DD, or empty."];
  const lessonBody =
    typeof body["body"] === "string" ? body["body"].replace(/\r\n/g, "\n").trim() : "";
  const shape = lessonBodyProblems(lessonBody);
  if (shape.length > 0) fieldErrors["body"] = shape;

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    input: {
      slug,
      title,
      position,
      minutes,
      outcomes: outcomes as string[],
      body: lessonBody,
      checkedOn,
    },
  };
}
