import type { PrismaClient } from "@ppu/db";
import { describe, expect, it } from "vitest";
import { PrismaPrivacyRepository } from "./privacy-repository.js";

const AT = new Date("2026-10-08T00:00:00Z");
const event = (deletionRequestId: string) => ({
  id: `e-${deletionRequestId}`,
  deletionRequestId,
  toState: "SUBMITTED",
  actorUserId: "u1",
  reason: null,
  occurredAt: AT,
});

/**
 * BUG-030: listActiveDeletionRequests reads twice (the latest events, then the
 * active requests with their history). A request deleted between the reads
 * comes back with no events. It must be skipped, not fail the admin page.
 */
describe("PrismaPrivacyRepository.listActiveDeletionRequests", () => {
  it("skips a request that was deleted between its two reads", async () => {
    const db = {
      deletionRequestEvent: { findMany: async () => [event("kept"), event("gone")] },
      deletionRequest: {
        findMany: async () => [
          { id: "kept", userId: "u1", createdAt: AT, events: [event("kept")] },
          { id: "gone", userId: "u2", createdAt: AT, events: [] },
        ],
      },
    } as unknown as PrismaClient;

    const active = await new PrismaPrivacyRepository(db).listActiveDeletionRequests();
    expect(active.map((request) => request.id)).toEqual(["kept"]);
  });
});
