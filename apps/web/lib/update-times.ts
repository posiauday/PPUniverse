import { logger } from "@ppu/telemetry";

/** How many of the newest published updates the header badge looks at; it shows at most "9+". */
export const BADGE_UPDATE_LIMIT = 20;

/**
 * The publishedAt times of the newest updates, as ISO strings for the header
 * badge (MVP-033 slice D). The header is on every page, error pages included,
 * so a failed read never breaks the page: it is logged and the badge simply
 * shows nothing.
 */
export async function loadUpdateTimes(deps: {
  listPublishedUpdateTimes: (limit: number) => Promise<Date[]>;
}): Promise<string[]> {
  try {
    const times = await deps.listPublishedUpdateTimes(BADGE_UPDATE_LIMIT);
    return times.map((time) => time.toISOString());
  } catch (error) {
    logger.error("updates.badge_load_failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return [];
  }
}
