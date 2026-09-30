import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./product-card.js";

describe("ProductCard", () => {
  it("renders as a link with the product name, summary, and category badge", () => {
    render(
      <ProductCard
        href="/products/sample-component"
        name="Sample Component"
        summary="A reusable form control."
        categoryName="Power Apps Components"
      />,
    );
    const link = screen.getByRole("link", { name: /sample component/i });
    expect(link.getAttribute("href")).toBe("/products/sample-component");
    expect(screen.getByText("A reusable form control.")).toBeDefined();
    expect(screen.getByText("Power Apps Components")).toBeDefined();
  });
});
