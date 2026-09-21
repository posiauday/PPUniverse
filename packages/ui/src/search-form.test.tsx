import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchForm } from "./search-form.js";

describe("SearchForm", () => {
  it("renders a GET form to the given action with the query input pre-filled", () => {
    render(<SearchForm action="/search" defaultValue="forms" />);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    expect(input.value).toBe("forms");
    expect(input.getAttribute("name")).toBe("q");
  });

  it("preserves other active params as hidden inputs", () => {
    const { container } = render(
      <SearchForm
        action="/search"
        preserveParams={{ sort: "recent", category: "power-apps-components" }}
      />,
    );
    const sortInput = container.querySelector('input[name="sort"]') as HTMLInputElement;
    const categoryInput = container.querySelector('input[name="category"]') as HTMLInputElement;
    expect(sortInput.value).toBe("recent");
    expect(categoryInput.value).toBe("power-apps-components");
  });

  it("omits a hidden input entirely when that param is not set", () => {
    const { container } = render(
      <SearchForm action="/search" preserveParams={{ sort: undefined }} />,
    );
    expect(container.querySelector('input[name="sort"]')).toBeNull();
  });
});
