import {
  isValidLessonMinutes,
  isValidLessonOutcomes,
  isValidLessonPosition,
  isValidLessonSlug,
  isValidLessonTitle,
  isValidSortOrder,
  isValidTopicSlug,
  isValidTopicSummary,
  isValidTopicTitle,
  lessonBodyProblems,
  type LessonInput,
  type TopicInput,
} from "./learn.js";
import { isValidTechnology } from "./technology.js";
import type { Technology } from "./types.js";
import { parseIsoDate } from "./update-source.js";

/**
 * Learn source files (MVP-048): topics and lessons are written as Markdown
 * files in the repository, reviewed in a pull request, then imported as
 * DRAFTS for the product owner to publish, like guides (article-source.ts).
 *
 *   content/topics/<area>/<topic-slug>/topic.md
 *   ---
 *   title: "Delegation in Power Apps"
 *   slug: power-apps-delegation
 *   technology: POWER_APPS
 *   summary: "Why a gallery stops at 500 rows, and how to see every row."
 *   order: 1
 *   ---
 *
 *   content/topics/<area>/<topic-slug>/<position>-<lesson-slug>.md
 *   ---
 *   title: "Which formulas delegate"
 *   slug: which-formulas-delegate
 *   position: 2
 *   minutes: 12
 *   outcome: "Tell a delegable formula from one that isn't"
 *   outcome: "Know why the delegation warning matters"
 *   checkedOn: 2026-10-07
 *   ---
 *   The body, in the fixed lesson shape (learn.ts, LESSON_SECTIONS).
 *
 * `outcome` is the only key that repeats (2 or 3 times). Every value goes
 * through the same validators as the admin editor.
 */

export type TopicSourceResult = { ok: true; topic: TopicInput } | { ok: false; errors: string[] };
export type LessonSourceResult =
  { ok: true; lesson: LessonInput } | { ok: false; errors: string[] };

const BYTE_ORDER_MARK = new RegExp(`^${String.fromCharCode(0xfeff)}`);

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

/** Front matter as key -> values (in order), plus the body, or the errors. */
export function frontMatter(
  text: string,
  keys: readonly string[],
  repeatable: readonly string[] = [],
): { fields: Map<string, string[]>; body: string; errors: string[] } | { errors: string[] } {
  const source = text.replace(/\r\n/g, "\n").replace(BYTE_ORDER_MARK, "");
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { errors: ["missing front matter: the file must start with a --- block"] };
  const errors: string[] = [];
  const fields = new Map<string, string[]>();
  for (const line of (match[1] as string).split("\n")) {
    if (line.trim() === "") continue;
    const colon = line.indexOf(":");
    const key = colon > 0 ? line.slice(0, colon).trim() : "";
    if (!keys.includes(key)) {
      errors.push(`unknown front-matter line: ${line.trim()}`);
      continue;
    }
    const values = fields.get(key) ?? [];
    if (values.length > 0 && !repeatable.includes(key)) errors.push(`duplicate key: ${key}`);
    values.push(unquote(line.slice(colon + 1)));
    fields.set(key, values);
  }
  return { fields, body: (match[2] as string).trim(), errors };
}

export const first = (fields: Map<string, string[]>, key: string) => fields.get(key)?.[0] ?? "";

/** A whole number written as digits only, or NaN. */
const whole = (value: string) => (/^\d+$/.test(value) ? Number(value) : Number.NaN);

export function parseTopicSource(text: string): TopicSourceResult {
  const parsed = frontMatter(text, ["title", "slug", "technology", "summary", "order"]);
  if (!("fields" in parsed)) return { ok: false, errors: parsed.errors };
  const { fields, body, errors } = parsed;
  const title = first(fields, "title");
  const slug = first(fields, "slug");
  const technology = first(fields, "technology");
  const summary = first(fields, "summary");
  const sortOrder = whole(first(fields, "order"));

  if (!isValidTopicTitle(title)) errors.push("title is required and must be 120 characters or fewer");
  if (!isValidTopicSlug(slug)) errors.push("slug must be lower-case and hyphen-separated");
  if (!isValidTechnology(technology)) errors.push("technology must be one of the seven areas");
  if (!isValidTopicSummary(summary))
    errors.push("summary is required and must be 300 characters or fewer");
  if (!isValidSortOrder(sortOrder)) errors.push("order must be a whole number from 0 to 999");
  if (body !== "") errors.push("topic.md has front matter only; lessons go in their own files");

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, topic: { title, slug, technology: technology as Technology, summary, sortOrder } };
}

export function parseLessonSource(text: string): LessonSourceResult {
  const parsed = frontMatter(
    text,
    ["title", "slug", "position", "minutes", "outcome", "checkedOn"],
    ["outcome"],
  );
  if (!("fields" in parsed)) return { ok: false, errors: parsed.errors };
  const { fields, body, errors } = parsed;
  const title = first(fields, "title");
  const slug = first(fields, "slug");
  const position = whole(first(fields, "position"));
  const minutes = whole(first(fields, "minutes"));
  const outcomes = fields.get("outcome") ?? [];
  const checkedOnValue = first(fields, "checkedOn");
  const checkedOn = checkedOnValue === "" ? null : parseIsoDate(checkedOnValue);

  if (!isValidLessonTitle(title))
    errors.push("title is required and must be 120 characters or fewer");
  if (!isValidLessonSlug(slug)) errors.push("slug must be lower-case and hyphen-separated");
  if (!isValidLessonPosition(position)) errors.push("position must be a whole number from 1 to 6");
  if (!isValidLessonMinutes(minutes)) errors.push("minutes must be a whole number from 1 to 60");
  if (!isValidLessonOutcomes(outcomes))
    errors.push("give 2 or 3 outcome lines, each 140 characters or fewer");
  if (checkedOnValue !== "" && !checkedOn) errors.push("checkedOn must be a date as YYYY-MM-DD");
  errors.push(...lessonBodyProblems(body));

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, lesson: { title, slug, position, minutes, outcomes, body, checkedOn } };
}
