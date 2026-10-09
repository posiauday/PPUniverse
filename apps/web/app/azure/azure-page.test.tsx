import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AzureComingSoonPage, { metadata } from "./page";

describe("the Azure coming-soon page (2026-10-09)", () => {
  it("is kept out of search until the first Azure guides are published", () => {
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("says it's coming soon, lists the planned areas and says the site is independent", () => {
    const text = renderToStaticMarkup(<AzureComingSoonPage />).replace(/<[^>]+>/g, " ");
    expect(text).toContain("Coming soon");
    expect(text).toContain("Azure + Power Platform");
    expect(text).toContain("Cost &amp; FinOps");
    expect(text).toMatch(/isn.t affiliated with, endorsed by or certified by\s+Microsoft/);
  });
});
