import { logger } from "@ppu/telemetry";
import type { MetadataRoute } from "next";
import { catalogRepository } from "../lib/catalog";
import { contentRepository } from "../lib/content";
import { learnEnabled } from "../lib/feature-flags";
import { learnRepository } from "../lib/learn";
import { generateSitemap } from "../lib/seo/sitemap";
import { getSiteUrl } from "../lib/site-url";
import { listSectionPathsWithContent } from "../lib/technology-sections";
import { updateRepository } from "../lib/updates";

// Reads the database, so it renders per request (see apps/web/app/page.tsx for
// why catalog pages are not statically generated at build time).
export const dynamic = "force-dynamic";

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSitemap({
    getSite: getSiteUrl,
    repository: catalogRepository,
    contentRepository,
    // The hubs with guides, then /updates once it has a published update
    // (MVP-033, open question 69). MAX_SECTION_PATHS reserves a slot for each.
    listSectionPaths: async () => {
      const [hubs, updates] = await Promise.all([
        listSectionPathsWithContent({ content: contentRepository, catalog: catalogRepository }),
        updateRepository.listPublishedUpdateTimes(1),
      ]);
      return updates.length > 0 ? [...hubs, "/updates"] : hubs;
    },
    // MVP-048: /topics, then each published topic and its published lessons,
    // only while the Learn module is switched on (FEATURE_LEARN).
    listLearnEntries: async () => {
      if (!learnEnabled()) return [];
      const topics = (await learnRepository.listPublishedTopics()).filter(
        (topic) => topic.lessons.length > 0,
      );
      if (topics.length === 0) return [];
      return [
        { path: "/topics" },
        ...topics.flatMap((topic) => {
          const base = `/topics/${encodeURIComponent(topic.slug)}`;
          return [
            { path: base, lastModified: topic.updatedAt },
            ...topic.lessons.map((lesson) => ({
              path: `${base}/${encodeURIComponent(lesson.slug)}`,
              lastModified: lesson.updatedAt,
            })),
          ];
        }),
      ];
    },
    warn: (event, fields) => logger.warn(event, fields),
  });
}
