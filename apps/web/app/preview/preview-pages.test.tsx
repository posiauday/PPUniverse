import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * MVP-050: the draft previews. Admins see the draft as it will look, under a
 * preview banner, with nothing that only a published guide has; anyone else
 * gets the ordinary 404; a published item goes to its public page.
 */

const requireAdmin = vi.hoisted(() => vi.fn());
const content = vi.hoisted(() => ({
  findArticleById: vi.fn(),
  listPublishedArticleSummaries: vi.fn().mockResolvedValue([]),
}));
const updates = vi.hoisted(() => ({ findUpdateById: vi.fn() }));
const voteSummary = vi.hoisted(() => vi.fn());
const loadGuideComments = vi.hoisted(() => vi.fn());

vi.mock("../../lib/require-admin", () => ({ requireAdmin }));
vi.mock("../../lib/content", () => ({ contentRepository: content }));
vi.mock("../../lib/updates", () => ({ updateRepository: updates }));
vi.mock("../../lib/feedback", () => ({ feedbackRepository: { voteSummary } }));
vi.mock("../../lib/comments", () => ({ loadGuideComments }));
vi.mock("@ppu/telemetry", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`);
  },
  usePathname: () => "/",
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; children?: unknown; className?: string }) =>
      createElement("a", { href: props.href, className: props.className }, props.children as never),
  };
});

const { default: PreviewGuidePage, generateMetadata: guideMetadata } =
  await import("./guides/[id]/page");
const { default: PreviewUpdatePage, generateMetadata: updateMetadata } =
  await import("./updates/[id]/page");

const params = { params: Promise.resolve({ id: "d1" }) };
const SCHEDULED = new Date("2026-10-12T15:00:00.000Z");

const draftGuide = {
  id: "d1",
  slug: "fix-a-stuck-flow",
  title: "Why did my flow stop? A checklist",
  type: "TUTORIAL",
  technology: "POWER_AUTOMATE",
  topic: null,
  body: "## First check\n\nLook at the run history.",
  excerpt: "Find the cause fast.",
  status: "DRAFT",
  publishedAt: null,
  scheduledFor: SCHEDULED,
  authorUserId: "admin-1",
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: new Date("2026-10-02T00:00:00Z"),
};

const draftUpdate = {
  id: "d1",
  slug: "approvals-retire",
  title: "Approvals in Outlook retire",
  summary: "Use the Teams app instead.",
  technology: "POWER_AUTOMATE",
  kind: "RETIREMENT",
  action: "Move approvers",
  sourceUrl: "https://learn.microsoft.com/power-platform/important-changes-coming",
  effectiveDate: null,
  replacement: null,
  status: "DRAFT",
  publishedAt: null,
  scheduledFor: null,
  authorUserId: "admin-1",
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: new Date("2026-10-02T00:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  content.listPublishedArticleSummaries.mockResolvedValue([]);
});

describe("the guide preview (MVP-050)", () => {
  it("shows an admin the draft as it will look, under a preview banner, never indexed", async () => {
    requireAdmin.mockResolvedValue({ userId: "admin-1" });
    content.findArticleById.mockResolvedValue(draftGuide);

    const markup = renderToStaticMarkup(await PreviewGuidePage(params));
    expect(markup).toContain("<strong>Preview.</strong> This guide is a draft");
    expect(markup).toContain('dateTime="2026-10-12T15:00:00.000Z"');
    expect(markup).toContain("Why did my flow stop?");
    expect(markup).toContain("First check");
    expect(markup).toContain('href="/admin/content/d1/edit"');

    const metadata = await guideMetadata(params);
    expect(metadata.title).toContain("Preview: Why did my flow stop? A checklist");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("leaves out votes, comments, the copy link and the structured data", async () => {
    requireAdmin.mockResolvedValue({ userId: "admin-1" });
    content.findArticleById.mockResolvedValue(draftGuide);

    const markup = renderToStaticMarkup(await PreviewGuidePage(params));
    expect(voteSummary).not.toHaveBeenCalled();
    expect(loadGuideComments).not.toHaveBeenCalled();
    expect(markup).not.toContain("Did this fix it?");
    expect(markup).not.toContain("application/ld+json");
  });

  it("gives anyone but an admin the ordinary 404, without reading the draft", async () => {
    requireAdmin.mockResolvedValue(null);
    await expect(PreviewGuidePage(params)).rejects.toThrow("NOT_FOUND");
    expect(content.findArticleById).not.toHaveBeenCalled();
    expect((await guideMetadata(params)).title).not.toContain("Preview");
  });

  it("sends a published guide to its public page", async () => {
    requireAdmin.mockResolvedValue({ userId: "admin-1" });
    content.findArticleById.mockResolvedValue({ ...draftGuide, status: "PUBLISHED" });
    await expect(PreviewGuidePage(params)).rejects.toThrow("REDIRECT /guides/fix-a-stuck-flow");
  });
});

describe("the update preview (MVP-050)", () => {
  it("shows an admin the card as it will appear on Updates", async () => {
    requireAdmin.mockResolvedValue({ userId: "admin-1" });
    updates.findUpdateById.mockResolvedValue(draftUpdate);

    const markup = renderToStaticMarkup(await PreviewUpdatePage(params));
    expect(markup).toContain("This update is a draft, not scheduled");
    expect(markup).toContain("Approvals in Outlook retire");
    expect(markup).toContain("Use the Teams app instead.");
    expect((await updateMetadata(params)).robots).toEqual({ index: false, follow: false });
  });

  it("is a 404 for anyone else and goes to /updates once published", async () => {
    requireAdmin.mockResolvedValue(null);
    await expect(PreviewUpdatePage(params)).rejects.toThrow("NOT_FOUND");

    requireAdmin.mockResolvedValue({ userId: "admin-1" });
    updates.findUpdateById.mockResolvedValue({ ...draftUpdate, status: "PUBLISHED" });
    await expect(PreviewUpdatePage(params)).rejects.toThrow("REDIRECT /updates#approvals-retire");
  });
});
