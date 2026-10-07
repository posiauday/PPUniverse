import type { PrismaClient } from "@ppu/db";
import type {
  FeedbackRepository,
  GuideFeedbackRow,
  OpenReport,
  VoteSummary,
} from "@ppu/domain-content";

/** Counters untouched for a day are deleted, as the Privacy notice says. */
const KEEP_FOR_MS = 24 * 60 * 60 * 1000;

/**
 * Votes and reports on guides (MVP-039, MVP-038). Neither table holds
 * anything about the visitor. Abuse limits use the shared hashed-counter
 * table (auth_throttle, from MVP-036), whose rows are deleted after a day.
 */
export class PrismaFeedbackRepository implements FeedbackRepository {
  constructor(private readonly db: PrismaClient) {}

  async recordVote(articleId: string, helpful: boolean): Promise<void> {
    await this.db.articleVote.create({ data: { articleId, helpful } });
  }

  async recordReport(articleId: string, message: string): Promise<void> {
    await this.db.articleReport.create({ data: { articleId, message } });
  }

  async voteSummary(articleId: string): Promise<VoteSummary> {
    const rows = await this.db.articleVote.groupBy({
      by: ["helpful"],
      where: { articleId },
      _count: { _all: true },
    });
    return {
      yes: rows.find((row) => row.helpful)?._count._all ?? 0,
      no: rows.find((row) => !row.helpful)?._count._all ?? 0,
    };
  }

  async listVoteSummaries(): Promise<GuideFeedbackRow[]> {
    const rows = await this.db.articleVote.groupBy({
      by: ["articleId", "helpful"],
      _count: { _all: true },
    });
    const byArticle = new Map<string, VoteSummary>();
    for (const row of rows) {
      const summary = byArticle.get(row.articleId) ?? { yes: 0, no: 0 };
      if (row.helpful) summary.yes += row._count._all;
      else summary.no += row._count._all;
      byArticle.set(row.articleId, summary);
    }
    if (byArticle.size === 0) return [];
    const articles = await this.db.article.findMany({
      where: { id: { in: [...byArticle.keys()] } },
      select: { id: true, slug: true, title: true },
    });
    return articles
      .map((article) => ({
        articleId: article.id,
        slug: article.slug,
        title: article.title,
        ...(byArticle.get(article.id) ?? { yes: 0, no: 0 }),
      }))
      .sort((a, b) => b.yes + b.no - (a.yes + a.no) || a.title.localeCompare(b.title));
  }

  async listOpenReports(limit: number): Promise<OpenReport[]> {
    const rows = await this.db.articleReport.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
      select: {
        id: true,
        message: true,
        createdAt: true,
        article: { select: { slug: true, title: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      articleSlug: row.article.slug,
      articleTitle: row.article.title,
      message: row.message,
      createdAt: row.createdAt,
    }));
  }

  async closeReport(id: string): Promise<boolean> {
    const { count } = await this.db.articleReport.deleteMany({ where: { id } });
    return count === 1;
  }

  async consumeAllowance(
    keyHash: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean> {
    const cutoff = new Date(now.getTime() - KEEP_FOR_MS);
    await this.db.authThrottle.deleteMany({
      where: { updatedAt: { lt: cutoff }, OR: [{ lockedUntil: null }, { lockedUntil: { lt: cutoff } }] },
    });
    const row = await this.db.authThrottle.findUnique({ where: { key: keyHash } });
    if (row && now.getTime() - row.windowStart.getTime() < windowMs) {
      if (row.failures >= limit) return false;
      await this.db.authThrottle.update({
        where: { key: keyHash },
        data: { failures: { increment: 1 } },
      });
      return true;
    }
    await this.db.authThrottle.upsert({
      where: { key: keyHash },
      create: { key: keyHash, failures: 1, windowStart: now },
      update: { failures: 1, windowStart: now, lockedUntil: null },
    });
    return true;
  }
}
