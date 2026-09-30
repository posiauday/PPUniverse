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
  it("links the brand home and the main sections, with no heading of its own", () => {
    const html = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/learn"');
    expect(html).toContain('href="/search"');
    expect(html).toContain('aria-label="Main"');
    expect(html).not.toMatch(/<h[1-6]/);
  });

  it("offers Sign in to a guest and Account to a signed-in visitor", () => {
    expect(renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />)).toContain(
      'href="/signin"',
    );
    const signedIn = renderToStaticMarkup(<SiteHeader theme="dark" signedIn />);
    expect(signedIn).toContain('href="/account/sessions"');
    expect(signedIn).not.toContain('href="/signin"');
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
