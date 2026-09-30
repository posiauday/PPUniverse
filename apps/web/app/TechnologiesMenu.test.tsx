// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TechnologiesMenu } from "./TechnologiesMenu";

const ITEMS = [
  { name: "Power Apps", href: "/power-apps" },
  { name: "Power BI", href: "/power-bi" },
];

afterEach(cleanup);

describe("TechnologiesMenu", () => {
  it("starts closed, with its links hidden", () => {
    render(<TechnologiesMenu items={ITEMS} />);
    const button = screen.getByRole("button", { name: "Technologies" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: "Power Apps" })).toBeNull();
  });

  it("opens to show every section link, and the button controls the list", () => {
    render(<TechnologiesMenu items={ITEMS} />);
    const button = screen.getByRole("button", { name: "Technologies" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const list = document.getElementById(button.getAttribute("aria-controls") as string);
    expect(list?.hidden).toBe(false);
    expect(screen.getByRole("link", { name: "Power BI" }).getAttribute("href")).toBe("/power-bi");
  });

  it("closes on Escape and returns focus to the button", () => {
    render(<TechnologiesMenu items={ITEMS} />);
    const button = screen.getByRole("button", { name: "Technologies" });
    fireEvent.click(button);
    screen.getByRole("link", { name: "Power Apps" }).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("closes on a click outside it", () => {
    render(
      <div>
        <TechnologiesMenu items={ITEMS} />
        <p>outside</p>
      </div>,
    );
    const button = screen.getByRole("button", { name: "Technologies" });
    fireEvent.click(button);
    fireEvent.pointerDown(screen.getByText("outside"));
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});
