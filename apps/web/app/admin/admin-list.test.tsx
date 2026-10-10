import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: Record<string, unknown>) =>
      createElement("a", props, props["children"] as never),
  };
});

const { ListToolbar, StatusPill, listHref } = await import("./AdminList");

/** The admin lists' shared parts (MVP-052 phase 2, 2026-10-10). */
describe("admin lists", () => {
  it("builds a list address that keeps the search and filters and drops empty values", () => {
    expect(
      listHref("/admin/content", { q: "flow", tech: "POWER_APPS" }, { status: "drafts" }),
    ).toBe("/admin/content?q=flow&tech=POWER_APPS&status=drafts");
    expect(listHref("/admin/content", { q: undefined }, { status: undefined })).toBe(
      "/admin/content",
    );
  });

  it("is a GET search form whose tabs keep the search, with the current tab marked", () => {
    const html = renderToStaticMarkup(
      <ListToolbar
        path="/admin/updates"
        noun="updates"
        query="power bi"
        status="drafts"
        tabs={[
          { key: "all", label: "All", count: 9 },
          { key: "drafts", label: "Drafts", count: 2 },
        ]}
      />,
    );
    expect(html).toMatch(/<form role="search"[^>]*action="\/admin\/updates" method="get"/);
    expect(html).toContain('<span class="sr-only">Search updates</span>');
    expect(html).toContain('<input type="hidden" name="status" value="drafts"/>');
    expect(html).toContain('href="/admin/updates?q=power+bi"');
    expect(html).toMatch(
      /href="\/admin\/updates\?q=power\+bi&amp;status=drafts" aria-current="page"/,
    );
  });

  it("says the status in words, not only colour", () => {
    expect(renderToStaticMarkup(<StatusPill status="Scheduled" />)).toContain("Scheduled</span>");
  });
});
