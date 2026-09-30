// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-theme");
  document.cookie = "lcs-theme=; Path=/; Max-Age=0";
});

describe("ThemeToggle", () => {
  it("is a named toggle button whose pressed state reflects the theme", () => {
    render(<ThemeToggle initialTheme="light" />);
    const button = screen.getByRole("button", { name: "Dark theme" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("switches the page theme at once and remembers it in the cookie", () => {
    render(<ThemeToggle initialTheme="light" />);
    const button = screen.getByRole("button", { name: "Dark theme" });

    fireEvent.click(button);
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.cookie).toContain("lcs-theme=dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(button);
    expect(document.documentElement.dataset["theme"]).toBe("light");
    expect(document.cookie).toContain("lcs-theme=light");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });
});
