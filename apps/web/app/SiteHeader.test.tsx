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
  it("sends the Learn button to /topics only when the Learn module is on (MVP-048)", () => {
    const learnButton = /href="([^"]*)"[^>]*>Learn</g;
    const targets = (html: string) => [...html.matchAll(learnButton)].map((match) => match[1]);
    expect(
      targets(renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />)),
    ).not.toContain("/topics");
    process.env["FEATURE_LEARN"] = "on";
    try {
      const html = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
      expect(targets(html)).toContain("/topics");
    } finally {
      delete process.env["FEATURE_LEARN"];
    }
  });

  it("links the brand home and the main sections, with no heading of its own", () => {
    const html = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/learn"');
    expect(html).toContain('href="/search"');
    expect(html).toContain('aria-label="Main"');
    expect(html).not.toMatch(/<h[1-6]/);
  });

  it("names the top bar for what's behind it (MVP-045)", () => {
    const html = renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />);
    const text = html.replace(/<[^>]+>/g, " ");
    expect(html).toContain('href="/learn#tutorials"');
    expect(html).toContain('href="/learn#patterns"');
    expect(text).toContain("Power Platform");
    expect(text).toContain("Fixes");
    expect(text).toContain("Patterns");
    expect(text).toContain(" Learn ");
    expect(html).toContain('placeholder="Search an error or topic"');
    expect(text).not.toMatch(/Technologies|Start learning/);
  });

  it("offers Sign in to a guest and Account to a signed-in visitor", () => {
    expect(renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />)).toContain(
      'href="/signin"',
    );
    const signedIn = renderToStaticMarkup(<SiteHeader theme="dark" signedIn />);
    expect(signedIn).toContain('href="/account"');
    expect(signedIn).not.toContain('href="/signin"');
  });

  it("shows a signed-in reader's avatar, and the Admin link only to an admin", () => {
    const member = { isAdmin: false, displayName: "Ada Lovelace", avatarSeed: "seed-1" };
    const memberHtml = renderToStaticMarkup(<SiteHeader theme="light" signedIn viewer={member} />);
    expect(memberHtml).toContain("<svg");
    expect(memberHtml).toContain(">AL<");
    expect(memberHtml).not.toContain('href="/admin"');
    const adminHtml = renderToStaticMarkup(
      <SiteHeader theme="light" signedIn viewer={{ ...member, isAdmin: true }} />,
    );
    expect(adminHtml).toContain('href="/admin"');
    expect(renderToStaticMarkup(<SiteHeader theme="light" signedIn={false} />)).not.toContain(
      'href="/admin"',
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
