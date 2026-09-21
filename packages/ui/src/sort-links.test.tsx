import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SortLinks } from "./sort-links.js";

describe("SortLinks", () => {
  it("renders relevance, recent, and alphabetical when includeRelevance is true", () => {
    render(<SortLinks hrefFor={(s) => `?sort=${s}`} current="relevance" includeRelevance={true} />);
    expect(screen.getByText("Relevance")).toBeDefined();
    expect(screen.getByText("Newest")).toBeDefined();
    expect(screen.getByText("A–Z")).toBeDefined();
  });

  it("omits relevance when there is no active search query", () => {
    render(<SortLinks hrefFor={(s) => `?sort=${s}`} current="recent" includeRelevance={false} />);
    expect(screen.queryByText("Relevance")).toBeNull();
  });

  it("marks the current sort option with aria-current", () => {
    render(
      <SortLinks hrefFor={(s) => `?sort=${s}`} current="alphabetical" includeRelevance={false} />,
    );
    const link = screen.getByText("A–Z");
    expect(link.getAttribute("aria-current")).toBe("true");
    expect(screen.getByText("Newest").getAttribute("aria-current")).toBeNull();
  });

  it("builds each link's href via the provided function", () => {
    render(
      <SortLinks hrefFor={(s) => `/search?sort=${s}`} current="recent" includeRelevance={false} />,
    );
    expect(screen.getByText("A–Z").getAttribute("href")).toBe("/search?sort=alphabetical");
  });
});
