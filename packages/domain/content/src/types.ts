/**
 * Content domain (MVP-017, FR-014). This pass builds `Article` only —
 * tutorials, patterns and comparison pages, discriminated by `type`.
 * `LearningPath`/`LearningPathItem` and `SEORecord` are deferred (see
 * docs/final-decisions.md, "MVP-017 implementation: `Article` only this
 * pass...", and docs/open-questions.md item 50) and have no types here.
 * `/collections/[slug]` and `Collection`/`CollectionItem` are out of scope
 * of MVP-017 entirely (docs/final-decisions.md, "MVP-017 /
 * `/collections/[slug]` scope conflict...") and are never referenced by
 * this package.
 */

export type ArticleType = "TUTORIAL" | "PATTERN" | "COMPARISON";

/** Mirrors packages/domain/catalog/src's ProductStatus pattern: DRAFT never
 * renders publicly; PUBLISHED does. `publishedAt` null means draft. */
export type ArticleStatus = "DRAFT" | "PUBLISHED";

/** Only one action exists today (publishing). Modeled as an enum, not a
 * boolean/timestamp-only signal, so a future action (e.g. UNPUBLISHED) is
 * one more union member and one more repository call, not a schema
 * redesign. */
export type ArticlePublishEventAction = "PUBLISHED";

export interface ArticleRecord {
  id: string;
  slug: string;
  title: string;
  type: ArticleType;
  /** Markdown source. Never rendered as raw HTML — see apps/web's render path. */
  body: string;
  /** Used for the page's meta description; null means none was supplied. */
  excerpt: string | null;
  status: ArticleStatus;
  /** Null means draft (never published). Immutable once set — see
   * evidence.prisma's Release.publishedAt comment (FR-011) for the same
   * rationale applied here: a correction after publication is a new
   * ArticlePublishEvent, not a rewrite of this timestamp. */
  publishedAt: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleCreateInput {
  slug: string;
  title: string;
  type: ArticleType;
  body: string;
  excerpt: string | null;
  authorUserId: string;
}

/** Content-only fields. Deliberately excludes `status`/`publishedAt` — those
 * change only through `ContentRepository.publishArticle`, never a general
 * update, so a bad or accidental edit can never silently unpublish or
 * republish an Article. */
export interface ArticleUpdateInput {
  slug: string;
  title: string;
  type: ArticleType;
  body: string;
  excerpt: string | null;
}

export interface ArticlePublishEventRecord {
  id: string;
  articleId: string;
  actorUserId: string;
  action: ArticlePublishEventAction;
  createdAt: Date;
}

/** Slugs eligible for sitemap.xml (FR-017 precedent, MVP-021): PUBLISHED
 * Articles only. Mirrors @ppu/domain-catalog's SitemapEntries shape. */
export interface ArticleSitemapEntries {
  slugs: string[];
  truncated: boolean;
}

/**
 * The persistence contract this domain package needs, implemented by
 * @ppu/adapter-content's PrismaContentRepository — mirrors the
 * domain-defines-the-interface / adapter-implements-it-against-Prisma
 * pattern @ppu/domain-privacy already established.
 */
export interface ContentRepository {
  createArticle(input: ArticleCreateInput): Promise<ArticleRecord>;
  /** Content-only edit (see ArticleUpdateInput) — never changes status or publishedAt. */
  updateArticle(id: string, input: ArticleUpdateInput): Promise<ArticleRecord>;
  /** Transitions DRAFT -> PUBLISHED, sets publishedAt and appends a
   * PUBLISHED ArticlePublishEvent, atomically. Rejects (throws) if the
   * Article is already PUBLISHED — the caller must check
   * isValidArticleStatusTransition first for a friendly error. */
  publishArticle(id: string, actorUserId: string): Promise<ArticleRecord>;
  findArticleById(id: string): Promise<ArticleRecord | null>;
  /** Any status — the admin editor's own lookup, and the slug-uniqueness check. */
  findArticleBySlug(slug: string): Promise<ArticleRecord | null>;
  /** PUBLISHED only — the public /learn/[slug] read path. */
  findPublishedArticleBySlug(slug: string): Promise<ArticleRecord | null>;
  /** Every Article, every status, newest first — the admin list. */
  listArticles(): Promise<ArticleRecord[]>;
  /** PUBLISHED slugs only, ordered, for sitemap.xml. */
  listPublishedArticleSlugs(maxEntries: number): Promise<ArticleSitemapEntries>;
}
