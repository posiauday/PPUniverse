import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AzureComingSoonPage, { metadata } from "./page";

describe("the Azure coming-soon page (2026-10-09)", () => {
  it("is kept out of search until the first Azure guides are published", () => {
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("says it's coming soon, lists the planned areas and asks what to cover first", () => {
    const text = renderToStaticMarkup(<AzureComingSoonPage />).replace(/<[^>]+>/g, " ");
    expect(text).toContain("Coming soon");
    expect(text).toContain("Azure + Power Platform");
    expect(text).toContain("Cost &amp; FinOps");
    expect(text).toContain("Which Azure problem should we cover first?");
    // The independence line lives in the footer, not repeated here (2026-10-10).
    expect(text).not.toContain("affiliated");
  });
});
