import type { ArticleSummary } from "@ppu/domain-content";
import { logger } from "@ppu/telemetry";
import { HUB_TOPICS, groupIntoSections, startHerePath, type HubKey } from "./technology-hubs";

/** How many of an area's sections the menu lists (the approved board shows four). */
export const MENU_SECTION_COUNT = 4;

/** How many published guides the menu reads to count them, as the /learn hub does. */
const MENU_ARTICLE_LIMIT = 500;

export interface MenuArea {
  key: HubKey;
  name: string;
  slug: string;
  tint: string;
  ink: string;
}

export interface TechnologyMenuArea {
  key: HubKey;
  name: string;
  href: string;
  tint: string;
  ink: string;
  /** Published guides in the area; null when they could not be loaded. */
  count: number | null;
  /** The label beside the area's name (menuCountLabel), worked out here so the
   * client menu imports only types from this server module. */
  countLabel: string | null;
  /** The first guide of the hub's "New here?" path, when it has one. */
  startHere: { title: string; href: string } | null;
  /** The area's first sections, linking to their cards on the hub. */
  sections: ReadonlyArray<{ name: string; href: string }>;
}

/**
 * The header's Technologies menu (MVP-033; the approved "Header and
 * Technologies menu" board): for every area, its guide count, the first guide
 * of its hub's "New here?" path and its first sections. It reuses the hub's
 * own grouping, so the menu and the hub never disagree. `articles` is null
 * when the guides could not be loaded: the menu then still lists every area
 * and its sections, without counts or a start-here guide.
 */
export function buildTechnologyMenu(
  areas: readonly MenuArea[],
  articles: readonly ArticleSummary[] | null,
): TechnologyMenuArea[] {
  return areas.map((area) => {
    const href = `/${area.slug}`;
    const own = articles?.filter((article) => article.technology === area.key) ?? [];
    const first = startHerePath(groupIntoSections(area.key, own))[0];
    const count = articles ? own.length : null;
    return {
      key: area.key,
      name: area.name,
      href,
      tint: area.tint,
      ink: area.ink,
      count,
      countLabel: menuCountLabel({ key: area.key, count }),
      startHere: first ? { title: first.title, href: `/learn/${first.slug}` } : null,
      sections: HUB_TOPICS[area.key]
        .slice(0, MENU_SECTION_COUNT)
        .map((topic) => ({ name: topic.name, href: `${href}#${topic.id}` })),
    };
  });
}

/**
 * Loads the menu for the site header. The header is on every page, error
 * pages included, so a failed read never breaks the page: it is logged and
 * the menu falls back to areas and sections only.
 */
export async function loadTechnologyMenu(
  areas: readonly MenuArea[],
  deps: {
    listPublishedArticleSummaries: (options: { limit: number }) => Promise<ArticleSummary[]>;
  },
): Promise<TechnologyMenuArea[]> {
  try {
    const articles = await deps.listPublishedArticleSummaries({ limit: MENU_ARTICLE_LIMIT });
    return buildTechnologyMenu(areas, articles);
  } catch (error) {
    logger.error("technology-menu.load-failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return buildTechnologyMenu(areas, null);
  }
}

/** The count label beside an area's name. */
export function menuCountLabel(area: Pick<TechnologyMenuArea, "key" | "count">): string | null {
  if (area.count === null) return null;
  if (area.count === 0) return area.key === "GOVERNANCE_ADMIN" ? "New" : "Coming soon";
  return area.count === 1 ? "1 guide" : `${area.count} guides`;
}
