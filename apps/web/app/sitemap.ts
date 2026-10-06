import { logger } from "@ppu/telemetry";
import type { MetadataRoute } from "next";
import { catalogRepository } from "../lib/catalog";
import { contentRepository } from "../lib/content";
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
    warn: (event, fields) => logger.warn(event, fields),
  });
}
