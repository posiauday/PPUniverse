import type { ArticleSummary } from "@ppu/domain-content";
import { describe, expect, it } from "vitest";
import { GUIDES_FEED_PATH, buildGuidesFeed, withGuidesFeed } from "./guides-feed";

function guide(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  return {
    slug: "why-didnt-my-trigger-fire",
    title: "Why didn't my flow trigger? A checklist",
    type: "TUTORIAL",
    technology: "POWER_AUTOMATE",
    topic: null,
    excerpt: "Ten checks <in order> & fast.",
    publishedAt: new Date("2026-10-06T10:00:00Z"),
    ...overrides,
  };
}

describe("buildGuidesFeed (MVP-046)", () => {
  it("is RSS 2.0 with absolute links, a self link and one item per guide", () => {
    const xml = buildGuidesFeed("https://example.com", [guide()]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(xml).toContain("<link>https://example.com/guides</link>");
    expect(xml).toContain(`href="https://example.com${GUIDES_FEED_PATH}" rel="self"`);
    expect(xml).toContain("<link>https://example.com/guides/why-didnt-my-trigger-fire</link>");
    expect(xml).toContain("<pubDate>Tue, 06 Oct 2026 10:00:00 GMT</pubDate>");
    expect(xml).toContain("<category>Power Automate</category>");
    expect(xml).toContain("<category>Fix</category>");
    expect(xml.match(/<item>/g)).toHaveLength(1);
  });

  it("escapes text, and leaves out what a guide doesn't have", () => {
    const xml = buildGuidesFeed("https://example.com", [
      guide({ technology: null, excerpt: null }),
    ]);
    expect(xml).toContain("<title>Why didn&apos;t my flow trigger? A checklist</title>");
    expect(xml).not.toContain("<description>Ten");
    expect(xml).not.toContain("Power Automate</category>");
    expect(buildGuidesFeed("https://example.com", [guide()])).toContain(
      "<description>Ten checks &lt;in order&gt; &amp; fast.</description>",
    );
  });

  it("is a valid, empty channel with no guides", () => {
    const xml = buildGuidesFeed("https://example.com", []);
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("<lastBuildDate>");
  });
});

describe("withGuidesFeed", () => {
  it("adds the feed to a page's head, keeping its canonical", () => {
    const metadata = withGuidesFeed(
      { alternates: { canonical: "https://example.com/guides" } },
      { ok: true, origin: "https://example.com" },
    );
    expect(metadata.alternates).toEqual({
      canonical: "https://example.com/guides",
      types: {
        "application/rss+xml": [
          {
            url: `https://example.com${GUIDES_FEED_PATH}`,
            title: "LowCodeStacks: Power Platform guides",
          },
        ],
      },
    });
    const none = withGuidesFeed({ title: "T" }, { ok: false, reason: "MISSING" });
    expect(none).toEqual({ title: "T" });
  });
});
