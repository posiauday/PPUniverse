import type { PrismaClient } from "@ppu/db";
import {
  isValidArticleStatusTransition,
  type ArticleCreateInput,
  type ArticleRecord,
  type ArticleSitemapEntries,
  type ArticleStatus,
  type ArticleType,
  type ArticleUpdateInput,
  type ContentRepository,
} from "@ppu/domain-content";

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
      const updated = await tx.article.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt },
      });
      await tx.articlePublishEvent.create({
        data: { articleId: id, actorUserId, action: "PUBLISHED" },
      });
      return updated;
    });
    return toArticleRecord(article);
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
      select: { slug: true },
      orderBy: { slug: "asc" },
      take: maxEntries + 1,
    });
    return {
      slugs: rows.slice(0, maxEntries).map((row) => row.slug),
      truncated: rows.length > maxEntries,
    };
  }
}

function toArticleRecord(row: {
  id: string;
  slug: string;
  title: string;
  type: string;
  body: string;
  excerpt: string | null;
  status: string;
  publishedAt: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}): ArticleRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type as ArticleType,
    body: row.body,
    excerpt: row.excerpt,
    status: row.status as ArticleStatus,
    publishedAt: row.publishedAt,
    authorUserId: row.authorUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
