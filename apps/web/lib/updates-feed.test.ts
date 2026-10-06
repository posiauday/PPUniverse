import type { PublishedUpdate } from "@ppu/domain-content";
import { describe, expect, it } from "vitest";
import { UPDATES_FEED_PATH, buildUpdatesFeed } from "./updates-feed";

function update(overrides: Partial<PublishedUpdate> = {}): PublishedUpdate {
  return {
    id: "u1",
    slug: "power-automate-mobile-app-retired",
    title: "Power Automate mobile app retired",
    summary: "Approvers should use the Approvals app in Teams.",
    technology: "POWER_AUTOMATE",
    kind: "RETIREMENT",
    action: "Move approvers to Teams",
    sourceUrl: "https://learn.microsoft.com/power-platform/important-changes-coming#a",
    effectiveDate: new Date("2026-08-31T00:00:00Z"),
    replacement: null,
    publishedAt: new Date("2026-10-03T12:00:00Z"),
    ...overrides,
  };
}

describe("buildUpdatesFeed (MVP-033, open question 66)", () => {
  it("is RSS 2.0 with absolute links, a self link and one item per update", () => {
    const xml = buildUpdatesFeed("https://example.com", [update()]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(xml).toContain("<link>https://example.com/updates</link>");
    expect(xml).toContain(`href="https://example.com${UPDATES_FEED_PATH}" rel="self"`);
    expect(xml).toContain(
      "<link>https://example.com/updates#power-automate-mobile-app-retired</link>",
    );
    expect(xml).toContain("<pubDate>Sat, 03 Oct 2026 12:00:00 GMT</pubDate>");
    expect(xml).toContain("<lastBuildDate>Sat, 03 Oct 2026 12:00:00 GMT</lastBuildDate>");
    expect(xml).toContain("<category>Power Automate</category>");
    expect(xml.match(/<item>/g)).toHaveLength(1);
  });

  it("escapes XML in every text field", () => {
    const xml = buildUpdatesFeed("https://example.com", [
      update({ title: `Grids <old> & "new"`, summary: "Use A & B." }),
    ]);
    expect(xml).toContain("<title>Grids &lt;old&gt; &amp; &quot;new&quot;</title>");
    expect(xml).toContain("Use A &amp; B.");
    expect(xml).not.toContain("<old>");
  });

  it("an update with no technology has no category, and an empty feed has no items", () => {
    expect(buildUpdatesFeed("https://example.com", [update({ technology: null })])).not.toContain(
      "<category>",
    );
    const empty = buildUpdatesFeed("https://example.com", []);
    expect(empty).not.toContain("<item>");
    expect(empty).not.toContain("<lastBuildDate>");
  });
});
