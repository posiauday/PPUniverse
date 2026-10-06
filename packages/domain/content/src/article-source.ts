import { isValidTechnology, isValidTopic } from "./technology.js";
import {
  isValidArticleBody,
  isValidArticleExcerpt,
  isValidArticleSlug,
  isValidArticleTitle,
  isValidArticleType,
} from "./transitions.js";
import type { ArticleType, Technology } from "./types.js";

/**
 * Article source files (MVP-029): launch content is written as Markdown files
 * in the repository (content/articles/<section>/<slug>.md) so every article
 * is reviewed in a pull request, then imported as a DRAFT for the product
 * owner to publish. A file is a small front-matter header between "---"
 * lines, then the Markdown body:
 *
 *   ---
 *   title: "Delegation in Power Apps: why your gallery stops at 500 rows"
 *   slug: power-apps-delegation-500-rows
 *   type: TUTORIAL
 *   technology: POWER_APPS
 *   topic: data-and-delegation
 *   excerpt: "Why an app shows only part of your data, and how to fix it."
 *   searchPhrase: "power apps delegation 500 rows"
 *   ---
 *   Body...
 *
 * Only these seven keys are allowed (`topic`, MVP-033, is one of the
 * technology's hub sections and needs a technology), each on one line; values may be quoted.
 * `searchPhrase` (2026-10-06) is the words people type to find the page. It is
 * optional here and isn't stored; the content gate (content-files.test.ts)
 * requires it for launch content and checks that the title, excerpt and
 * opening paragraph use it.
 * Every value goes through exactly the validators the admin editor's API
 * uses, so an imported article is one the editor would have accepted.
 */

export interface ArticleSource {
  slug: string;
  title: string;
  type: ArticleType;
  technology: Technology | null;
  topic: string | null;
  excerpt: string | null;
  /** The search phrase the page targets, or null when omitted. Not persisted. */
  searchPhrase: string | null;
  body: string;
}

export type ArticleSourceResult =
  { ok: true; article: ArticleSource } | { ok: false; errors: string[] };

const KEYS = ["title", "slug", "type", "technology", "topic", "excerpt", "searchPhrase"] as const;
type Key = (typeof KEYS)[number];

/** Longest allowed search phrase: a few words, never a keyword list. */
export const MAX_SEARCH_PHRASE_LENGTH = 80;

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

/** A leading byte-order mark (some editors add one), built from its code so no invisible character sits in this source. */
const BYTE_ORDER_MARK = new RegExp(`^${String.fromCharCode(0xfeff)}`);

export function parseArticleSource(text: string): ArticleSourceResult {
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

  const body = (match[2] as string).trim();
  const title = fields.title ?? "";
  const slug = fields.slug ?? "";
  const type = fields.type ?? "";
  const technologyValue = fields.technology ?? "";
  const excerptValue = fields.excerpt ?? "";
  const topicValue = fields.topic ?? "";
  const searchPhraseValue = (fields.searchPhrase ?? "").trim();

  if (!isValidArticleTitle(title))
    errors.push("title is required and must be 200 characters or fewer");
  if (!isValidArticleSlug(slug)) errors.push("slug must be lower-case and hyphen-separated");
  if (!isValidArticleType(type))
    errors.push("type must be TUTORIAL, PATTERN, COMPARISON, KPI_GUIDE or REFERENCE");
  if (technologyValue !== "" && !isValidTechnology(technologyValue)) {
    errors.push("technology must be one of the seven areas, or omitted");
  }
  if (topicValue !== "") {
    if (technologyValue === "") errors.push("topic needs a technology");
    else if (isValidTechnology(technologyValue) && !isValidTopic(technologyValue, topicValue))
      errors.push(`topic must be one of ${technologyValue}'s sections`);
  }
  const excerpt = excerptValue === "" ? null : excerptValue;
  if (!isValidArticleExcerpt(excerpt)) errors.push("excerpt must be 500 characters or fewer");
  if (!isValidArticleBody(body)) errors.push("body is required");
  if (searchPhraseValue.length > MAX_SEARCH_PHRASE_LENGTH)
    errors.push(`searchPhrase must be ${MAX_SEARCH_PHRASE_LENGTH} characters or fewer`);
  if (searchPhraseValue.includes(","))
    errors.push("searchPhrase is one phrase, not a comma-separated keyword list");

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    article: {
      slug,
      title,
      type: type as ArticleType,
      technology: technologyValue === "" ? null : (technologyValue as Technology),
      topic: topicValue === "" ? null : topicValue,
      excerpt,
      searchPhrase: searchPhraseValue === "" ? null : searchPhraseValue,
      body,
    },
  };
}
