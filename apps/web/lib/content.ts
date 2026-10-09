import { PrismaContentRepository } from "@ppu/adapter-content";
import { prisma } from "@ppu/db";
import type { ArticleType, Technology } from "@ppu/domain-content";
import { publishDueContent } from "./scheduled-publishing";

/**
 * Guides. Every public read first publishes any scheduled guide or update
 * whose time has passed (MVP-050, lib/scheduled-publishing.ts), so the first
 * visit after the time already shows it. Admin reads (by id, all statuses)
 * don't.
 */
class SchedulingContentRepository extends PrismaContentRepository {
  override async findPublishedArticleBySlug(slug: string) {
    await publishDueContent();
    return super.findPublishedArticleBySlug(slug);
  }

  override async listPublishedArticleSlugs(maxEntries: number) {
    await publishDueContent();
    return super.listPublishedArticleSlugs(maxEntries);
  }

  override async listPublishedArticleSummaries(options: {
    limit: number;
    type?: ArticleType;
    types?: readonly ArticleType[];
    technology?: Technology;
    excludeSlug?: string;
  }) {
    await publishDueContent();
    return super.listPublishedArticleSummaries(options);
  }

  override async searchPublishedArticles(options: {
    query: string;
    limit: number;
    technology?: Technology;
  }) {
    await publishDueContent();
    return super.searchPublishedArticles(options);
  }
}

export const contentRepository = new SchedulingContentRepository(prisma);
