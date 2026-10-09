import type { ArticleRecord, UpdateRecord } from "@ppu/domain-content";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ppu/db", () => ({ prisma: {} }));
vi.mock("@ppu/adapter-content", () => ({
  PrismaContentRepository: class {},
  PrismaUpdateRepository: class {},
}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("./indexnow", () => ({ notifyIndexNow: vi.fn() }));
vi.mock("./site-url", () => ({
  getSiteUrl: () => ({ ok: true, origin: "https://lowcodestacks.example" }),
}));

const { createDuePublisher, DUE_CHECK_INTERVAL_MS } = await import("./scheduled-publishing");

const article = (slug: string) => ({ id: `id-${slug}`, slug }) as ArticleRecord;
const update = (slug: string) => ({ id: `id-${slug}`, slug }) as UpdateRecord;

function setup(published: { articles?: ArticleRecord[]; updates?: UpdateRecord[] } = {}) {
  let clock = new Date("2026-10-12T15:00:00.000Z").getTime();
  const deps = {
    publishDueArticles: vi.fn(async () => published.articles ?? []),
    publishDueUpdates: vi.fn(async () => published.updates ?? []),
    announce: vi.fn(),
    now: () => new Date(clock),
  };
  return {
    deps,
    publishDue: createDuePublisher(deps),
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

describe("createDuePublisher (MVP-050)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publishes what is due at the visit's time and tells search engines about it", async () => {
    const { deps, publishDue } = setup({
      articles: [article("fix-a-flow")],
      updates: [update("approvals-retire")],
    });
    await publishDue();

    const now = new Date("2026-10-12T15:00:00.000Z");
    expect(deps.publishDueArticles).toHaveBeenCalledWith(now);
    expect(deps.publishDueUpdates).toHaveBeenCalledWith(now);
    expect(deps.announce).toHaveBeenCalledWith([
      "https://lowcodestacks.example/guides/fix-a-flow",
      "https://lowcodestacks.example/guides",
      "https://lowcodestacks.example/updates",
    ]);
  });

  it("announces nothing when nothing was due", async () => {
    const { deps, publishDue } = setup();
    await publishDue();
    expect(deps.announce).not.toHaveBeenCalled();
  });

  it("checks at most once per interval", async () => {
    const { deps, publishDue, advance } = setup();
    await publishDue();
    advance(DUE_CHECK_INTERVAL_MS - 1);
    await publishDue();
    expect(deps.publishDueArticles).toHaveBeenCalledTimes(1);

    advance(1);
    await publishDue();
    expect(deps.publishDueArticles).toHaveBeenCalledTimes(2);
  });

  it("makes reads that arrive during a check wait for that check instead of starting another", async () => {
    let finish: (value: ArticleRecord[]) => void = () => undefined;
    const { deps, publishDue } = setup();
    deps.publishDueArticles.mockImplementationOnce(
      () =>
        new Promise<ArticleRecord[]>((resolve) => {
          finish = resolve;
        }),
    );
    let firstDone = false;
    let secondDone = false;
    const first = publishDue().then(() => (firstDone = true));
    const second = publishDue().then(() => (secondDone = true));
    await Promise.resolve();
    expect([firstDone, secondDone]).toEqual([false, false]);

    finish([article("fix-a-flow")]);
    await Promise.all([first, second]);
    expect(deps.publishDueArticles).toHaveBeenCalledTimes(1);
    expect(deps.announce).toHaveBeenCalledTimes(1);
  });

  it("never lets a failure break the page", async () => {
    const { deps, publishDue } = setup();
    deps.publishDueUpdates.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(publishDue()).resolves.toBeUndefined();
    expect(deps.announce).not.toHaveBeenCalled();
  });
});
