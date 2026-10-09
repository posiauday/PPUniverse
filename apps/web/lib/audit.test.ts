import { describe, expect, it, vi } from "vitest";

/** MVP-050: schedules, and update publishes, appear in the audit log. */

const none = () => ({ findMany: vi.fn().mockResolvedValue([]) });
const prisma = vi.hoisted(() => ({}) as Record<string, { findMany: ReturnType<typeof vi.fn> }>);

vi.mock("@ppu/db", () => ({ prisma }));
vi.mock("./catalog", () => ({
  catalogRepository: { listRecentProductStatusEvents: vi.fn().mockResolvedValue([]) },
}));

Object.assign(prisma, {
  releasePublishEvent: none(),
  deletionRequestEvent: none(),
  articlePublishEvent: none(),
  learnPublishEvent: none(),
  componentEvent: none(),
  roleChangeEvent: none(),
  siteSwitchEvent: none(),
  updatePublishEvent: {
    findMany: vi.fn().mockResolvedValue([
      {
        id: "up1",
        actorUserId: "admin-1",
        createdAt: new Date("2026-10-12T15:00:05Z"),
        update: { title: "Approvals in Outlook retire" },
      },
    ]),
  },
  articleScheduleEvent: {
    findMany: vi.fn().mockResolvedValue([
      {
        id: "as1",
        actorUserId: "admin-1",
        action: "SCHEDULED",
        scheduledFor: new Date("2026-10-12T15:00:00Z"),
        createdAt: new Date("2026-10-09T10:00:00Z"),
        article: { title: "Fix a stuck flow" },
      },
    ]),
  },
  updateScheduleEvent: {
    findMany: vi.fn().mockResolvedValue([
      {
        id: "us1",
        actorUserId: "admin-1",
        action: "CANCELLED",
        scheduledFor: null,
        createdAt: new Date("2026-10-09T11:00:00Z"),
        update: { title: "Approvals in Outlook retire" },
      },
    ]),
  },
});

const { listRecentAuditLogEntries } = await import("./audit");

describe("listRecentAuditLogEntries (MVP-050)", () => {
  it("lists update publishes and schedule changes, newest first, with the time in UTC", async () => {
    const entries = await listRecentAuditLogEntries(10);
    expect(entries.map((entry) => [entry.domain, entry.summary])).toEqual([
      ["update_publish", 'Published update "Approvals in Outlook retire"'],
      ["content_schedule", 'Cancelled the schedule of update "Approvals in Outlook retire"'],
      [
        "content_schedule",
        'Scheduled article "Fix a stuck flow" to publish at Oct 12, 2026, 3:00 PM UTC',
      ],
    ]);
  });
});
