import { PrismaUpdateRepository } from "@ppu/adapter-content";
import { prisma } from "@ppu/db";
import type { Technology } from "@ppu/domain-content";
import { publishDueContent } from "./scheduled-publishing";

/**
 * Platform updates (MVP-033 slice D). Public reads first publish anything
 * scheduled whose time has passed (MVP-050), as lib/content.ts does.
 */
class SchedulingUpdateRepository extends PrismaUpdateRepository {
  override async listPublishedUpdates(options: { limit: number; technology?: Technology }) {
    await publishDueContent();
    return super.listPublishedUpdates(options);
  }

  override async listPublishedUpdateTimes(limit: number) {
    await publishDueContent();
    return super.listPublishedUpdateTimes(limit);
  }
}

export const updateRepository = new SchedulingUpdateRepository(prisma);
