import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LibraryNav } from "./LibraryNav";

const components = [
  { slug: "button", title: "Button", category: "buttons-and-actions", access: "MEMBERS" },
  { slug: "tabs", title: "Tabs", category: "navigation-and-layout", access: "OPEN" },
] as const;

describe("LibraryNav", () => {
  it("notes sign-in on members-only components for a signed-out reader", () => {
    const html = renderToStaticMarkup(<LibraryNav components={components} />);
    expect(html.match(/>sign-in</g)).toHaveLength(1);
  });

  it("drops the note once the reader is signed in (2026-10-09)", () => {
    const html = renderToStaticMarkup(<LibraryNav components={components} signedIn />);
    expect(html).not.toContain(">sign-in<");
    expect(html).toContain("Button");
  });
});
