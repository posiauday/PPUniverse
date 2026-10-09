import { Prisma, qualifiedTable, type PrismaClient } from "@ppu/db";
import {
  isValidArticleStatusTransition,
  SEARCH_MATCH_END,
  SEARCH_MATCH_START,
  type ArticleCreateInput,
  type ArticleSearchHit,
  type ArticleRecord,
  type ArticleSitemapEntries,
  type ArticleSummary,
  type ArticleStatus,
  type ArticleType,
  type ArticleUpdateInput,
  type ContentRepository,
  type Technology,
} from "@ppu/domain-content";

/** MVP-050: the most scheduled drafts one pass publishes; the next visit publishes the rest. */
export const DUE_BATCH_SIZE = 20;

/** Both match markers, for stripping them from source text (see SEARCH_MATCH_START). */
const MARKERS = SEARCH_MATCH_START + SEARCH_MATCH_END;
/** ts_headline options: wrap every match in the markers; the title in full. */
const TITLE_HEADLINE_OPTIONS = `StartSel=${SEARCH_MATCH_START}, StopSel=${SEARCH_MATCH_END}, HighlightAll=true`;
/** ...and the snippet as one short fragment around the best match. */
const SNIPPET_HEADLINE_OPTIONS = `StartSel=${SEARCH_MATCH_START}, StopSel=${SEARCH_MATCH_END}, MaxWords=26, MinWords=12, ShortWord=2, MaxFragments=1`;

export class PrismaContentRepository implements ContentRepository {
  constructor(private readonly db: PrismaClient) {}

  /** Always created DRAFT (the Prisma column default) — publishing is a
   * separate, deliberate action (publishArticle), never implicit. */
  async createArticle(input: ArticleCreateInput): Promise<ArticleRecord> {
    const row = await this.db.article.create({
      data: {
        slug: input.slug,
        title: input.title,
        type: input.type,
        technology: input.technology,
        topic: input.topic,
        body: input.body,
        excerpt: input.excerpt,
        authorUserId: input.authorUserId,
      },
    });
    return toArticleRecord(row);
  }

  /** Content-only fields — never touches status/publishedAt (see
   * ArticleUpdateInput's doc comment in @ppu/domain-content). */
  async updateArticle(id: string, input: ArticleUpdateInput): Promise<ArticleRecord> {
    const row = await this.db.article.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title,
        type: input.type,
        technology: input.technology,
        topic: input.topic,
        body: input.body,
        excerpt: input.excerpt,
      },
    });
    return toArticleRecord(row);
  }

  /**
   * Transitions DRAFT -> PUBLISHED, sets publishedAt, and appends a
   * PUBLISHED ArticlePublishEvent, all inside one transaction. Re-checks
   * the transition against the row's actual current status (not a
   * caller-supplied belief), so a race between two publish requests can
   * never double-publish or silently overwrite publishedAt.
   */
  async publishArticle(id: string, actorUserId: string): Promise<ArticleRecord> {
    const publishedAt = new Date();
    const article = await this.db.$transaction(async (tx) => {
      const current = await tx.article.findUnique({ where: { id } });
      if (!current) {
        throw new Error(`Article ${id} not found`);
      }
      if (!isValidArticleStatusTransition(current.status as ArticleStatus, "PUBLISHED")) {
        throw new Error(`Cannot publish an Article in status ${current.status}`);
      }
      // MVP-050: publishing by hand also clears any schedule.
      const updated = await tx.article.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt, scheduledFor: null },
      });
      await tx.articlePublishEvent.create({
        data: { articleId: id, actorUserId, action: "PUBLISHED" },
      });
      return updated;
    });
    return toArticleRecord(article);
  }

  /** MVP-050: sets or changes a DRAFT's publish time, with its audit event, atomically. */
  async scheduleArticle(id: string, at: Date, actorUserId: string): Promise<ArticleRecord> {
    const article = await this.db.$transaction(async (tx) => {
      const current = await tx.article.findUnique({ where: { id } });
      if (!current) throw new Error(`Article ${id} not found`);
      if (current.status !== "DRAFT") {
        throw new Error(`Cannot schedule an Article in status ${current.status}`);
      }
      const updated = await tx.article.update({ where: { id }, data: { scheduledFor: at } });
      await tx.articleScheduleEvent.create({
        data: { articleId: id, actorUserId, action: "SCHEDULED", scheduledFor: at },
      });
      return updated;
    });
    return toArticleRecord(article);
  }

  /** MVP-050: clears a DRAFT's publish time, with its audit event, atomically. */
  async cancelArticleSchedule(id: string, actorUserId: string): Promise<ArticleRecord> {
    const article = await this.db.$transaction(async (tx) => {
      const current = await tx.article.findUnique({ where: { id } });
      if (!current) throw new Error(`Article ${id} not found`);
      if (current.status !== "DRAFT" || !current.scheduledFor) {
        throw new Error(`Article ${id} has no schedule to cancel`);
      }
      const updated = await tx.article.update({ where: { id }, data: { scheduledFor: null } });
      await tx.articleScheduleEvent.create({
        data: { articleId: id, actorUserId, action: "CANCELLED" },
      });
      return updated;
    });
    return toArticleRecord(article);
  }

  /**
   * MVP-050: publishes the DRAFTs whose time has come. Each one is claimed
   * with a conditional UPDATE (still DRAFT, still the same time), so when two
   * visits run this at once, Postgres lets only one of them publish a row and
   * the other skips it. publishedAt is the scheduled time; the PUBLISHED
   * event names the admin who last scheduled it.
   */
  async publishDueArticles(now: Date): Promise<ArticleRecord[]> {
    const due = await this.db.article.findMany({
      where: { status: "DRAFT", scheduledFor: { lte: now } },
      select: { id: true, scheduledFor: true, authorUserId: true },
      orderBy: [{ scheduledFor: "asc" }, { id: "asc" }],
      take: DUE_BATCH_SIZE,
    });
    const published: ArticleRecord[] = [];
    for (const candidate of due) {
      const scheduledFor = candidate.scheduledFor as Date;
      const row = await this.db.$transaction(async (tx) => {
        const claimed = await tx.article.updateMany({
          where: { id: candidate.id, status: "DRAFT", scheduledFor },
          data: { status: "PUBLISHED", publishedAt: scheduledFor, scheduledFor: null },
        });
        if (claimed.count === 0) return null;
        const scheduled = await tx.articleScheduleEvent.findFirst({
          where: { articleId: candidate.id, action: "SCHEDULED" },
          orderBy: { createdAt: "desc" },
          select: { actorUserId: true },
        });
        await tx.articlePublishEvent.create({
          data: {
            articleId: candidate.id,
            actorUserId: scheduled?.actorUserId ?? candidate.authorUserId,
            action: "PUBLISHED",
          },
        });
        return tx.article.findUnique({ where: { id: candidate.id } });
      });
      if (row) published.push(toArticleRecord(row));
    }
    return published;
  }

  async findArticleById(id: string): Promise<ArticleRecord | null> {
    const row = await this.db.article.findUnique({ where: { id } });
    return row ? toArticleRecord(row) : null;
  }

  async findArticleBySlug(slug: string): Promise<ArticleRecord | null> {
    const row = await this.db.article.findUnique({ where: { slug } });
    return row ? toArticleRecord(row) : null;
  }

  async findPublishedArticleBySlug(slug: string): Promise<ArticleRecord | null> {
    const row = await this.db.article.findFirst({ where: { slug, status: "PUBLISHED" } });
    return row ? toArticleRecord(row) : null;
  }

  async listArticles(): Promise<ArticleRecord[]> {
    const rows = await this.db.article.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toArticleRecord);
  }

  /**
   * PUBLISHED slugs only, ordered by slug for deterministic sitemap output —
   * mirrors @ppu/adapter-catalog's listSitemapEntries exactly (one extra row
   * fetched purely to learn whether the list was truncated).
   */
  async listPublishedArticleSlugs(maxEntries: number): Promise<ArticleSitemapEntries> {
    if (!Number.isInteger(maxEntries) || maxEntries < 0) {
      throw new RangeError("maxEntries must be a non-negative integer");
    }
    const rows = await this.db.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: "asc" },
      take: maxEntries + 1,
    });
    return {
      entries: rows
        .slice(0, maxEntries)
        .map((row) => ({ slug: row.slug, updatedAt: row.updatedAt })),
      truncated: rows.length > maxEntries,
    };
  }

  async listPublishedArticleSummaries(options: {
    limit: number;
    type?: ArticleType;
    types?: readonly ArticleType[];
    technology?: Technology;
    excludeSlug?: string;
  }): Promise<ArticleSummary[]> {
    const rows = await this.db.article.findMany({
      where: {
        status: "PUBLISHED",
        ...(options.type ? { type: options.type } : {}),
        ...(options.types ? { type: { in: [...options.types] } } : {}),
        ...(options.technology ? { technology: options.technology } : {}),
        ...(options.excludeSlug ? { slug: { not: options.excludeSlug } } : {}),
      },
      select: {
        slug: true,
        title: true,
        type: true,
        technology: true,
        topic: true,
        excerpt: true,
        publishedAt: true,
      },
      orderBy: [{ publishedAt: "desc" }, { slug: "asc" }],
      take: options.limit,
    });
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      type: row.type as ArticleType,
      technology: row.technology as Technology | null,
      topic: row.topic,
      excerpt: row.excerpt,
      // PUBLISHED rows always have publishedAt set.
      publishedAt: row.publishedAt as Date,
    }));
  }

  /**
   * PostgreSQL full-text search, the MVP search baseline (CLAUDE.md), the
   * same approach as the catalog's searchProducts. websearch_to_tsquery
   * accepts anything a person types (quotes, "or", a leading minus) and never
   * raises a syntax error. The title outranks the excerpt, which outranks the
   * body. The vector is computed per query: fine at launch size; an indexed
   * generated column is the step up if the library grows large.
   */
  async searchPublishedArticles(options: {
    query: string;
    limit: number;
    technology?: Technology;
  }): Promise<ArticleSearchHit[]> {
    const query = options.query.trim();
    if (!query) return [];
    const document = Prisma.sql`(
      setweight(to_tsvector('english', a."title"), 'A') ||
      setweight(to_tsvector('english', coalesce(a."excerpt", '')), 'B') ||
      setweight(to_tsvector('english', a."body"), 'C')
    )`;
    // The snippet text: the excerpt then the body, with the marker characters
    // removed and the Markdown punctuation and link targets blanked out, so a
    // snippet reads as prose.
    const snippetSource = Prisma.sql`regexp_replace(
      translate(coalesce(a."excerpt", '') || ' ' || a."body", ${MARKERS}, ''),
      '\\]\\([^)]*\\)|[][#*_\`>|]', ' ', 'g'
    )`;
    const titleSource = Prisma.sql`translate(a."title", ${MARKERS}, '')`;
    // A hub's search box (MVP-037) narrows to its own area; a bound parameter, never spliced.
    const inArea = options.technology
      ? Prisma.sql`AND a."technology"::text = ${options.technology}`
      : Prisma.empty;
    const rows = await this.db.$queryRaw<
      Array<{
        slug: string;
        title: string;
        type: string;
        technology: string | null;
        topic: string | null;
        excerpt: string | null;
        publishedAt: Date;
        titleMarked: string;
        snippetMarked: string;
      }>
    >`
      SELECT a."slug", a."title", a."type"::text AS "type",
             a."technology"::text AS "technology", a."topic", a."excerpt", a."publishedAt",
             ts_headline('english', ${titleSource}, q, ${TITLE_HEADLINE_OPTIONS}) AS "titleMarked",
             ts_headline('english', ${snippetSource}, q, ${SNIPPET_HEADLINE_OPTIONS}) AS "snippetMarked"
      FROM ${Prisma.raw(qualifiedTable("articles"))} a, websearch_to_tsquery('english', ${query}) q
      WHERE a."status" = 'PUBLISHED' AND ${document} @@ q ${inArea}
      ORDER BY ts_rank(${document}, q) DESC, a."publishedAt" DESC, a."slug" ASC
      LIMIT ${options.limit}
    `;
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      type: row.type as ArticleType,
      technology: row.technology as Technology | null,
      topic: row.topic,
      excerpt: row.excerpt,
      publishedAt: row.publishedAt,
      titleMarked: row.titleMarked,
      snippetMarked: row.snippetMarked.replace(/\s+/g, " ").trim(),
    }));
  }
}

function toArticleRecord(row: {
  id: string;
  slug: string;
  title: string;
  type: string;
  technology: string | null;
  topic: string | null;
  body: string;
  excerpt: string | null;
  status: string;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}): ArticleRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type as ArticleType,
    technology: row.technology as Technology | null,
    topic: row.topic,
    body: row.body,
    excerpt: row.excerpt,
    status: row.status as ArticleStatus,
    publishedAt: row.publishedAt,
    scheduledFor: row.scheduledFor,
    authorUserId: row.authorUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
