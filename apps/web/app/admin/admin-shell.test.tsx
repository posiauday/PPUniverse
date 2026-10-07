import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const count = (value: number) => vi.fn().mockResolvedValue(value);
  return {
    article: { count: vi.fn() },
    updateItem: { count: vi.fn() },
    articleReport: { count: count(2) },
    articleComment: { count: vi.fn() },
    articleVote: { count: vi.fn() },
  };
});
const path = vi.hoisted(() => ({ current: "/admin/content" }));

vi.mock("@ppu/db", () => ({ prisma: db }));
vi.mock("next/navigation", () => ({ usePathname: () => path.current }));
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: Record<string, unknown>) =>
      createElement("a", props, props["children"] as never),
  };
});

import { loadAdminCounts, waitingCount } from "../../lib/admin-overview";
import { AdminNav } from "./AdminNav";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("loadAdminCounts (MVP-047)", () => {
  it("counts published and draft content, reports, comments and this week's votes", async () => {
    vi.stubEnv("FEATURE_COMMENTS", "on");
    db.article.count.mockImplementation(async ({ where }) =>
      where.status === "PUBLISHED" ? 57 : 2,
    );
    db.updateItem.count.mockImplementation(async ({ where }) =>
      where.status === "PUBLISHED" ? 8 : 1,
    );
    db.articleComment.count.mockImplementation(async ({ where }) => ("reports" in where ? 3 : 19));
    db.articleVote.count.mockImplementation(async ({ where }) => ("helpful" in where ? 52 : 62));
    const counts = await loadAdminCounts(new Date("2026-10-07T12:00:00Z"));
    expect(counts).toEqual({
      guidesPublished: 57,
      guidesDraft: 2,
      updatesPublished: 8,
      updatesDraft: 1,
      guideReports: 2,
      reportedComments: 3,
      commentsThisWeek: 19,
      votesThisWeek: { total: 62, yes: 52 },
    });
    expect(waitingCount(counts)).toBe(2 + 3 + 2 + 1);
    // "This week" means the 7 days before now.
    const since = db.articleVote.count.mock.calls[0]![0].where.createdAt.gte as Date;
    expect(since.toISOString()).toBe("2026-09-30T12:00:00.000Z");
  });

  it("leaves comments out while they're off", async () => {
    db.article.count.mockResolvedValue(0);
    db.updateItem.count.mockResolvedValue(0);
    db.articleVote.count.mockResolvedValue(0);
    const counts = await loadAdminCounts();
    expect(counts.reportedComments).toBeNull();
    expect(counts.commentsThisWeek).toBeNull();
    expect(db.articleComment.count).not.toHaveBeenCalled();
  });
});

describe("AdminNav", () => {
  it("marks the current area and labels each count for screen readers", () => {
    const html = renderToStaticMarkup(
      <AdminNav
        groups={[
          { label: null, links: [{ href: "/admin", name: "Overview" }] },
          {
            label: "Content",
            links: [
              { href: "/admin/content", name: "Guides", count: { value: 57, label: "published" } },
              {
                href: "/admin/feedback",
                name: "Feedback",
                count: { value: 2, alert: true, label: "open reports" },
              },
            ],
          },
        ]}
      />,
    );
    expect(html).toContain('aria-label="Admin"');
    expect(html).toMatch(/href="\/admin\/content" aria-current="page"/);
    expect(html).not.toMatch(/href="\/admin" aria-current/);
    expect(html).toContain('57<span class="sr-only"> published</span>');
    expect(html).toContain('2<span class="sr-only"> open reports</span>');
  });
});
