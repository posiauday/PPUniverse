import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoryCard } from "./category-card.js";

describe("CategoryCard", () => {
  it("renders as a link to the given href with the category name", () => {
    render(<CategoryCard href="/categories/power-apps-components" name="Power Apps Components" />);
    const link = screen.getByRole("link", { name: /power apps components/i });
    expect(link.getAttribute("href")).toBe("/categories/power-apps-components");
  });

  it("renders a description when provided", () => {
    render(<CategoryCard href="/categories/x" name="X" description="A description" />);
    expect(screen.getByText("A description")).toBeDefined();
  });

  it("omits the description when not provided", () => {
    render(<CategoryCard href="/categories/x" name="X" />);
    expect(screen.queryByText(/description/i)).toBeNull();
  });
});
