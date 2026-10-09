import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; children?: unknown; className?: string }) =>
      createElement("a", { href: props.href, className: props.className }, props.children as never),
  };
});
const listPublishedTopics = vi.fn(async () => []);
vi.mock("../../lib/learn", () => ({ learnRepository: { listPublishedTopics } }));

const { default: TopicsPage, generateMetadata } = await import("./page");

afterEach(() => {
  delete process.env["FEATURE_LEARN"];
  listPublishedTopics.mockClear();
});

/**
 * Learn before it opens (docs/final-decisions.md, 2026-10-09, "Top bar: ...
 * Learn coming soon"): the top bar's "Learn (Soon)" leads here.
 */
describe("/topics while Learn is off", () => {
  it("says Learn is coming soon, points to the guides, and stays out of search", async () => {
    const html = renderToStaticMarkup(await TopicsPage());
    const text = html.replace(/<[^>]+>/g, " ");
    expect(text).toContain("Coming soon");
    expect(html).toContain('href="/guides"');
    expect(listPublishedTopics).not.toHaveBeenCalled();
    const metadata = await generateMetadata();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("lists topics once Learn is switched on", async () => {
    process.env["FEATURE_LEARN"] = "on";
    const html = renderToStaticMarkup(await TopicsPage());
    expect(html.replace(/<[^>]+>/g, " ")).not.toContain("Coming soon");
    expect(listPublishedTopics).toHaveBeenCalled();
  });
});
