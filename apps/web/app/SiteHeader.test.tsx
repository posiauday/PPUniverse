import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; children?: unknown; className?: string }) =>
      createElement("a", { href: props.href, className: props.className }, props.children as never),
  };
});

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("marks Learn as Soon until the Learn module is on, and never has a Learn button (2026-10-09)", () => {
    const off = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
    expect(off).toContain('href="/topics"');
    expect(off.replace(/<[^>]+>/g, " ")).toMatch(/Learn\s+Soon/);
    process.env["FEATURE_LEARN"] = "on";
    try {
      const on = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
      expect(on).toContain('href="/topics"');
      expect(on.replace(/<[^>]+>/g, " ")).not.toMatch(/Learn\s+Soon/);
    } finally {
      delete process.env["FEATURE_LEARN"];
    }
  });

  it("has Azure, marked Soon, right after Power Platform (2026-10-09)", () => {
    const html = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
    const text = html.replace(/<[^>]+>/g, " ");
    expect(html).toContain('href="/azure"');
    expect(text).toMatch(/Azure\s+Soon/);
    // In the bar, between the Power Platform menu and Guides.
    const nav = text.slice(text.indexOf("Power Platform"));
    expect(nav.indexOf("Azure")).toBeLessThan(nav.indexOf("Guides"));
  });

  it("links the brand home and the main sections, with no heading of its own", () => {
    const html = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/guides"');
    expect(html).toContain('href="/search"');
    expect(html).toContain('aria-label="Main"');
    expect(html).not.toMatch(/<h[1-6]/);
  });

  it("names the top bar: Power Platform, Guides, Learn, Updates (2026-10-09)", () => {
    const html = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
    const text = html.replace(/<[^>]+>/g, " ");
    expect(text).toContain("Power Platform");
    expect(text).toContain("Guides");
    expect(text).toContain("Updates");
    expect(html).toContain('placeholder="Search an error or topic"');
    expect(text).not.toMatch(/Technologies|Start learning|Fixes|Patterns/);
    // The theme icon comes before the search box.
    expect(html.indexOf('aria-label="Dark theme"')).toBeLessThan(
      html.indexOf('placeholder="Search an error or topic"'),
    );
  });

  it("shows Components only while the library is switched on", () => {
    expect(renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />)).not.toContain(
      'href="/components"',
    );
    expect(
      renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} componentsOn />),
    ).toContain('href="/components"');
  });

  it("offers Sign in to a guest and Account to a signed-in visitor", () => {
    expect(renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />)).toContain(
      'href="/signin"',
    );
    const signedIn = renderToStaticMarkup(<SiteHeader theme="dark" signedIn />);
    expect(signedIn).toContain('href="/account"');
    expect(signedIn).not.toContain('href="/signin"');
  });

  it("shows a signed-in reader's avatar as the Account link, and no Admin link for anyone", () => {
    const member = {
      isAdmin: false,
      displayName: "Ada Lovelace",
      avatarSeed: "seed-1",
      needsTerms: false,
    };
    const memberHtml = renderToStaticMarkup(<SiteHeader theme="light" signedIn viewer={member} />);
    expect(memberHtml).toContain("<svg");
    expect(memberHtml).toContain(">AL<");
    expect(memberHtml).toContain('<span class="sr-only">Account</span>');
    expect(memberHtml).toContain('href="/account"');
    // Admin lives in the account area now (docs/final-decisions.md, 2026-10-08).
    const adminHtml = renderToStaticMarkup(
      <SiteHeader theme="light" signedIn viewer={{ ...member, isAdmin: true }} />,
    );
    expect(adminHtml).not.toContain('href="/admin"');
  });

  it("draws the crown for a reader whose avatar is the crown", () => {
    const king = {
      isAdmin: true,
      displayName: "King Lowcode",
      avatarSeed: "crown",
      needsTerms: false,
    };
    expect(renderToStaticMarkup(<SiteHeader theme="light" signedIn viewer={king} />)).toContain(
      'data-avatar="crown"',
    );
  });

  it("renders the toggle already pressed in the dark theme", () => {
    expect(renderToStaticMarkup(<SiteHeader theme="dark" signedIn={false} />)).toContain(
      'aria-pressed="true"',
    );
  });
});

describe("SiteFooter", () => {
  it("states plainly that the site is not affiliated with or endorsed by Microsoft", () => {
    expect(renderToStaticMarkup(<SiteFooter />)).toContain(
      "Not affiliated with, endorsed by or certified by Microsoft.",
    );
  });
});
