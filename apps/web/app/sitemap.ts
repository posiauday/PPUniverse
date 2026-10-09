import { logger } from "@ppu/telemetry";
import type { MetadataRoute } from "next";
import { catalogRepository } from "../lib/catalog";
import { contentRepository } from "../lib/content";
import { componentRepository } from "../lib/components";
import { learnEnabled } from "../lib/feature-flags";
import { componentsLibraryOn } from "../lib/site-switches";
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
    // MVP-048: /topics and each published topic with a published lesson, only
    // while the Learn module is on (FEATURE_LEARN). Not the lessons: they need
    // sign-in and are noindex (docs/final-decisions.md, 2026-10-08).
    listLearnEntries: async () => {
      if (!learnEnabled()) return [];
      const topics = (await learnRepository.listPublishedTopics()).filter(
        (topic) => topic.lessons.length > 0,
      );
      if (topics.length === 0) return [];
      return [
        { path: "/topics" },
        ...topics.map((topic) => ({
          path: `/topics/${encodeURIComponent(topic.slug)}`,
          lastModified: topic.updatedAt,
        })),
      ];
    },
    // MVP-049: /components and each public component, only while the library
    // is switched on (/admin/settings). Members-only components are listed too: their
    // pages are public; only copying the YAML needs sign-in.
    listComponentEntries: async () => {
      if (!(await componentsLibraryOn())) return [];
      const components = await componentRepository.listPublic();
      if (components.length === 0) return [];
      return [
        { path: "/components" },
        ...components.map((component) => ({
          path: `/components/${encodeURIComponent(component.slug)}`,
          lastModified: component.updatedAt,
        })),
      ];
    },
    warn: (event, fields) => logger.warn(event, fields),
  });
}
