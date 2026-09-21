import type { MetadataRoute } from "next";
import { buildRobots } from "../lib/seo/robots";
import { getSiteUrl } from "../lib/site-url";

// Evaluated per request, not at build time: the site origin is validated (and a
// misconfiguration reported) when the file is served, never during `next build`.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(getSiteUrl());
}
