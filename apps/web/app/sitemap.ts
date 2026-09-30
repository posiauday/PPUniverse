import { logger } from "@ppu/telemetry";
import type { MetadataRoute } from "next";
import { catalogRepository } from "../lib/catalog";
import { contentRepository } from "../lib/content";
import { generateSitemap } from "../lib/seo/sitemap";
import { getSiteUrl } from "../lib/site-url";

// Reads the database, so it renders per request (see apps/web/app/page.tsx for
// why catalog pages are not statically generated at build time).
export const dynamic = "force-dynamic";

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSitemap({
    getSite: getSiteUrl,
    repository: catalogRepository,
    contentRepository,
    warn: (event, fields) => logger.warn(event, fields),
  });
}
