import { PrismaContentRepository, PrismaUpdateRepository } from "@ppu/adapter-content";
import { prisma } from "@ppu/db";
import type { ArticleRecord, UpdateRecord } from "@ppu/domain-content";
import { logger } from "@ppu/telemetry";
import { after } from "next/server";
import { notifyIndexNow } from "./indexnow";
import { learnIndexUrl, learnUrl } from "./seo/canonical";
import { getSiteUrl } from "./site-url";

/**
 * Scheduled publishing (MVP-050; docs/final-decisions.md, 2026-10-09, "a
 * schedule goes live on the first visit"). There is no timer: every public
 * read of guides and updates (lib/content.ts, lib/updates.ts) first runs
 * publishDueContent, which publishes the drafts whose time has passed. So the
 * first visit after the time, by anyone or by a search engine reading the
 * sitemap, publishes them, and that visit already sees them. Until then they
 * are drafts, so nobody can see them early.
 *
 * It checks at most once per DUE_CHECK_INTERVAL_MS per server instance, and a
 * request that arrives while a check runs waits for that check rather than
 * starting another. Postgres stops a double publish across instances (see
 * publishDueArticles). A failure is logged and never breaks the page.
 */

export const DUE_CHECK_INTERVAL_MS = 30 * 1000;

export interface DuePublisherDeps {
  publishDueArticles(now: Date): Promise<ArticleRecord[]>;
  publishDueUpdates(now: Date): Promise<UpdateRecord[]>;
  /** Tells search engines; must not throw. */
  announce(urls: string[]): void;
  now(): Date;
}

export function createDuePublisher(deps: DuePublisherDeps): () => Promise<void> {
  let nextCheckAt = 0;
  let running: Promise<void> | null = null;

  async function check(now: Date): Promise<void> {
    try {
      const [articles, updates] = await Promise.all([
        deps.publishDueArticles(now),
        deps.publishDueUpdates(now),
      ]);
      if (articles.length === 0 && updates.length === 0) return;
      logger.info("content.scheduled_published", {
        articleIds: articles.map((article) => article.id),
        updateIds: updates.map((update) => update.id),
      });
      const site = getSiteUrl();
      if (!site.ok) return;
      deps.announce([
        ...articles.map((article) => learnUrl(site.origin, article.slug)),
        ...(articles.length > 0 ? [learnIndexUrl(site.origin)] : []),
        ...(updates.length > 0 ? [`${site.origin}/updates`] : []),
      ]);
    } catch (error) {
      logger.error("content.scheduled_publish_failed", {
        reason: error instanceof Error ? error.name : "unknown",
      });
    }
  }

  return function publishDueContent(): Promise<void> {
    if (running) return running;
    const now = deps.now();
    if (now.getTime() < nextCheckAt) return Promise.resolve();
    nextCheckAt = now.getTime() + DUE_CHECK_INTERVAL_MS;
    running = check(now).finally(() => {
      running = null;
    });
    return running;
  };
}

/** IndexNow after the response is sent, so the visit isn't slowed (sent at once outside a request). */
function announce(urls: string[]): void {
  try {
    after(() => notifyIndexNow(urls).then(() => undefined));
  } catch {
    void notifyIndexNow(urls);
  }
}

const articles = new PrismaContentRepository(prisma);
const updates = new PrismaUpdateRepository(prisma);

export const publishDueContent = createDuePublisher({
  publishDueArticles: (now) => articles.publishDueArticles(now),
  publishDueUpdates: (now) => updates.publishDueUpdates(now),
  announce,
  now: () => new Date(),
});
