import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination } from "./pagination.js";

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} hrefFor={(p) => `?page=${p}`} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("omits the Previous link on the first page", () => {
    render(<Pagination page={1} totalPages={3} hrefFor={(p) => `?page=${p}`} />);
    expect(screen.queryByText(/Previous/)).toBeNull();
    expect(screen.getByText(/Next/)).toBeDefined();
  });

  it("omits the Next link on the last page", () => {
    render(<Pagination page={3} totalPages={3} hrefFor={(p) => `?page=${p}`} />);
    expect(screen.queryByText(/Next/)).toBeNull();
    expect(screen.getByText(/Previous/)).toBeDefined();
  });

  it("shows both links on a middle page with correct hrefs", () => {
    render(<Pagination page={2} totalPages={3} hrefFor={(p) => `?page=${p}`} />);
    expect(screen.getByText(/Previous/).getAttribute("href")).toBe("?page=1");
    expect(screen.getByText(/Next/).getAttribute("href")).toBe("?page=3");
  });
});
