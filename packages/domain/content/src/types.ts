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

export type ArticleType = "TUTORIAL" | "PATTERN" | "COMPARISON" | "KPI_GUIDE" | "REFERENCE";

/** MVP-028: the technology sections. See technology.ts for names and URLs. */
/** The six Microsoft products, plus the cross-product Governance & admin area
 * (MVP-033; docs/final-decisions.md, "Governance & admin area"). */
export type Technology =
  | "POWER_APPS"
  | "POWER_AUTOMATE"
  | "POWER_BI"
  | "COPILOT_STUDIO"
  | "DATAVERSE"
  | "POWER_PAGES"
  | "GOVERNANCE_ADMIN";

/** A Technology that is a Microsoft product (everything but Governance & admin). */
export type ProductTechnology = Exclude<Technology, "GOVERNANCE_ADMIN">;

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
  /** MVP-028: the technology section it appears in; null means none (cross-cutting). */
  technology: Technology | null;
  /** MVP-033: the section of its area's hub (one of TECHNOLOGY_TOPICS[technology]);
   * null means none chosen, and the hub shows it in the area's first section. */
  topic: string | null;
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
  technology: Technology | null;
  /** MVP-033: the section of its area's hub (one of TECHNOLOGY_TOPICS[technology]);
   * null means none chosen, and the hub shows it in the area's first section. */
  topic: string | null;
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
  technology: Technology | null;
  /** MVP-033: the section of its area's hub (one of TECHNOLOGY_TOPICS[technology]);
   * null means none chosen, and the hub shows it in the area's first section. */
  topic: string | null;
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

/** PUBLISHED Articles for sitemap.xml (FR-017), each with its real
 * last-modified time so crawlers can prioritise updated content (TD-010, SEO
 * story). Article.updatedAt changes on every edit and on publish, so it is
 * accurate -- unlike products, which stay without lastmod. */
export interface ArticleSitemapEntries {
  entries: Array<{ slug: string; updatedAt: Date }>;
  truncated: boolean;
}

/** What the /learn hub and related-article lists need -- no body. */
export interface ArticleSummary {
  slug: string;
  title: string;
  type: ArticleType;
  technology: Technology | null;
  /** MVP-033: the section of its area's hub (one of TECHNOLOGY_TOPICS[technology]);
   * null means none chosen, and the hub shows it in the area's first section. */
  topic: string | null;
  excerpt: string | null;
  publishedAt: Date;
}

/** Marks the start and end of a matched word in ArticleSearchHit's marked
 * text. Control characters, stripped from the source text first, so they
 * can never come from an article itself. */
export const SEARCH_MATCH_START = "\u0001";
export const SEARCH_MATCH_END = "\u0002";

/** One site-search result: the summary, plus the title and a short snippet
 * with every matched word wrapped in SEARCH_MATCH_START / SEARCH_MATCH_END.
 * Plain text otherwise -- never markup. */
export interface ArticleSearchHit extends ArticleSummary {
  titleMarked: string;
  snippetMarked: string;
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
  /** PUBLISHED Articles, newest first, at most `limit`. Optionally one type
   * (`type`) or any of several (`types`), one technology section (MVP-028),
   * and excluding one slug (the article being viewed). */
  listPublishedArticleSummaries(options: {
    limit: number;
    type?: ArticleType;
    types?: readonly ArticleType[];
    technology?: Technology;
    excludeSlug?: string;
  }): Promise<ArticleSummary[]>;
  /** PUBLISHED Articles matching a site search (MVP-031, open question 63),
   * best match first, at most `limit`. Full-text over the title, excerpt and
   * body, weighted in that order. A blank query matches nothing. */
  searchPublishedArticles(options: { query: string; limit: number }): Promise<ArticleSearchHit[]>;
}
