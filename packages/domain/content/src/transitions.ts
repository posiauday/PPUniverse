import type { ArticleStatus, ArticleType } from "./types.js";

/**
 * Pure content rules (MVP-017, FR-014). No database, no knowledge of who is
 * calling — the caller (the API route) checks the actor is ADMIN before any
 * of this runs (docs/final-decisions.md, "MVP-017 implementation:
 * content-publishing authorization reuses ADMIN").
 */

const ARTICLE_TYPES: readonly ArticleType[] = ["TUTORIAL", "PATTERN", "COMPARISON"];

export function isValidArticleType(value: string): value is ArticleType {
  return (ARTICLE_TYPES as readonly string[]).includes(value);
}

/**
 * DRAFT -> PUBLISHED is the only allowed transition in this pass. There is
 * no unpublish/republish path yet (not specified by FR-014 or FR-011 for
 * this story) — publishing is a one-way, deliberate, ADMIN-only action,
 * matching the append-only ArticlePublishEvent log it produces.
 */
const ALLOWED_TRANSITIONS: Record<ArticleStatus, readonly ArticleStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: [],
};

export function isValidArticleStatusTransition(from: ArticleStatus, to: ArticleStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Mirrors packages/domain/catalog/src/visibility.ts's isPubliclyVisible exactly. */
export function isPubliclyVisible(article: { status: ArticleStatus }): boolean {
  return article.status === "PUBLISHED";
}

/** Lowercase, hyphen-separated, ASCII alphanumeric segments — no leading/trailing/
 * doubled hyphens, 1-200 characters. Deliberately conservative: nothing about this
 * story needs unicode slugs, and a narrower allow-list is easier to widen later
 * than to narrow after real data exists. */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 200;

export function isValidArticleSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug);
}

const MAX_TITLE_LENGTH = 200;
const MAX_EXCERPT_LENGTH = 500;

export function isValidArticleTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= MAX_TITLE_LENGTH;
}

export function isValidArticleBody(body: string): boolean {
  return body.trim().length > 0;
}

/** Optional field: null/empty is fine, but a supplied value has a length cap
 * (matches evidence.prisma's notes/evidence-summary 500-character precedent). */
export function isValidArticleExcerpt(excerpt: string | null): boolean {
  return excerpt === null || excerpt.length <= MAX_EXCERPT_LENGTH;
}
