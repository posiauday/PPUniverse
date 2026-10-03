import { isValidTechnology } from "./technology.js";
import type { Technology } from "./types.js";
import {
  UPDATE_ACTION_MAX,
  UPDATE_REPLACEMENT_MAX,
  isValidOptionalText,
  isValidUpdateKind,
  isValidUpdateSlug,
  isValidUpdateSourceUrl,
  isValidUpdateSummary,
  isValidUpdateTitle,
  type UpdateInput,
  type UpdateKind,
} from "./updates.js";

/**
 * Update source files (MVP-033 slice D): the agent drafts platform updates as
 * small files in the repository (content/updates/<slug>.md) so each is
 * reviewed in a pull request, then imported as a DRAFT for the product owner
 * to publish, exactly like articles (article-source.ts). Front matter, then
 * the summary as the body:
 *
 *   ---
 *   title: "Power Automate mobile app retired"
 *   slug: power-automate-mobile-app-retired
 *   kind: RETIREMENT
 *   technology: POWER_AUTOMATE
 *   action: "Move approvers to Teams"
 *   source: https://learn.microsoft.com/power-platform/important-changes-coming
 *   effective: 2026-08-31
 *   replacement: "Approvals app in Microsoft Teams"
 *   ---
 *   One or two plain sentences, in our words.
 *
 * Every value goes through the validators the admin API uses.
 */

export type UpdateSourceResult = { ok: true; update: UpdateInput } | { ok: false; errors: string[] };

const KEYS = [
  "title",
  "slug",
  "kind",
  "technology",
  "action",
  "source",
  "effective",
  "replacement",
] as const;
type Key = (typeof KEYS)[number];

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

/** "YYYY-MM-DD" as midnight UTC, or null if it is not a real calendar date. */
export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

const BYTE_ORDER_MARK = new RegExp(`^${String.fromCharCode(0xfeff)}`);

export function parseUpdateSource(text: string): UpdateSourceResult {
  const source = text.replace(/\r\n/g, "\n").replace(BYTE_ORDER_MARK, "");
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match)
    return { ok: false, errors: ["missing front matter: the file must start with a --- block"] };

  const errors: string[] = [];
  const fields: Partial<Record<Key, string>> = {};
  for (const line of (match[1] as string).split("\n")) {
    if (line.trim() === "") continue;
    const colon = line.indexOf(":");
    const key = colon > 0 ? line.slice(0, colon).trim() : "";
    if (!(KEYS as readonly string[]).includes(key)) {
      errors.push(`unknown front-matter line: ${line.trim()}`);
      continue;
    }
    if (fields[key as Key] !== undefined) errors.push(`duplicate key: ${key}`);
    fields[key as Key] = unquote(line.slice(colon + 1));
  }

  const summary = (match[2] as string).trim().replace(/\s+/g, " ");
  const title = fields.title ?? "";
  const slug = fields.slug ?? "";
  const kind = fields.kind ?? "";
  const technology = fields.technology ?? "";
  const action = fields.action ? fields.action : null;
  const sourceUrl = fields.source ?? "";
  const effective = fields.effective ?? "";
  const replacement = fields.replacement ? fields.replacement : null;
  const effectiveDate = effective === "" ? null : parseIsoDate(effective);

  if (!isValidUpdateTitle(title)) errors.push("title is required and must be 160 characters or fewer");
  if (!isValidUpdateSlug(slug)) errors.push("slug must be lower-case and hyphen-separated");
  if (!isValidUpdateKind(kind))
    errors.push("kind must be FEATURE, LICENSING, DEPRECATION or RETIREMENT");
  if (technology !== "" && !isValidTechnology(technology))
    errors.push("technology must be one of the seven areas, or omitted");
  if (!isValidOptionalText(action, UPDATE_ACTION_MAX))
    errors.push("action must be 40 characters or fewer");
  if (!isValidUpdateSourceUrl(sourceUrl))
    errors.push("source must be an https link on microsoft.com or a subdomain");
  if (effective !== "" && !effectiveDate) errors.push("effective must be a date as YYYY-MM-DD");
  if (!isValidOptionalText(replacement, UPDATE_REPLACEMENT_MAX))
    errors.push("replacement must be 160 characters or fewer");
  if (!isValidUpdateSummary(summary))
    errors.push("summary (the body) is required and must be 500 characters or fewer");

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    update: {
      slug,
      title,
      summary,
      technology: technology === "" ? null : (technology as Technology),
      kind: kind as UpdateKind,
      action,
      sourceUrl,
      effectiveDate,
      replacement,
    },
  };
}
