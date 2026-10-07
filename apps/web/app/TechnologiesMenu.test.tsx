// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TechnologyMenuArea } from "../lib/technology-menu";
import { TechnologiesMenu } from "./TechnologiesMenu";

const AREAS: TechnologyMenuArea[] = [
  {
    key: "POWER_APPS",
    name: "Power Apps",
    href: "/power-apps",
    tint: "bg-tech-apps",
    ink: "text-tech-apps-ink",
    count: 4,
    countLabel: "4 guides",
    startHere: { title: "Canvas or model-driven?", href: "/learn/canvas-or-model-driven" },
    sections: [{ name: "Choose & plan", href: "/power-apps#choose-and-plan" }],
  },
  {
    key: "POWER_BI",
    name: "Power BI",
    href: "/power-bi",
    tint: "bg-tech-bi",
    ink: "text-tech-bi-ink",
    count: 1,
    countLabel: "1 guide",
    startHere: null,
    sections: [],
  },
  {
    key: "GOVERNANCE_ADMIN",
    name: "Governance & admin",
    href: "/governance",
    tint: "bg-tech-gov",
    ink: "text-tech-gov-ink",
    count: 0,
    countLabel: "New",
    startHere: null,
    sections: [],
  },
];

afterEach(cleanup);

describe("TechnologiesMenu", () => {
  it("starts closed, with its links hidden", () => {
    render(<TechnologiesMenu areas={AREAS} />);
    const button = screen.getByRole("button", { name: "Power Platform" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: "Power Apps" })).toBeNull();
  });

  it("opens to show every area link, and the button controls the panel", () => {
    render(<TechnologiesMenu areas={AREAS} />);
    const button = screen.getByRole("button", { name: "Power Platform" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const panel = document.getElementById(button.getAttribute("aria-controls") as string);
    expect(panel?.hidden).toBe(false);
    expect(screen.getByRole("link", { name: "Power BI" }).getAttribute("href")).toBe("/power-bi");
  });

  it("shows each area's count, start-here guide and sections, and a way into Guides by goal", () => {
    render(<TechnologiesMenu areas={AREAS} />);
    fireEvent.click(screen.getByRole("button", { name: "Power Platform" }));
    expect(screen.getByText("4 guides")).toBeTruthy();
    expect(screen.getByText("1 guide")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Start here.*Canvas or model-driven\?/ })
        .getAttribute("href"),
    ).toBe("/learn/canvas-or-model-driven");
    expect(screen.getByRole("link", { name: "Choose & plan" }).getAttribute("href")).toBe(
      "/power-apps#choose-and-plan",
    );
    expect(screen.getByRole("link", { name: /every guide by goal/ }).getAttribute("href")).toBe(
      "/learn",
    );
  });

  it("marks Governance & admin as new until its first guides exist", () => {
    render(<TechnologiesMenu areas={AREAS} />);
    fireEvent.click(screen.getByRole("button", { name: "Power Platform" }));
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByText("First guides coming soon")).toBeTruthy();
  });

  it("closes on Escape and returns focus to the button", () => {
    render(<TechnologiesMenu areas={AREAS} />);
    const button = screen.getByRole("button", { name: "Power Platform" });
    fireEvent.click(button);
    screen.getByRole("link", { name: "Power Apps" }).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("closes on a click outside it, and when a link is followed", () => {
    render(
      <div>
        <TechnologiesMenu areas={AREAS} />
        <p>outside</p>
      </div>,
    );
    const button = screen.getByRole("button", { name: "Power Platform" });
    fireEvent.click(button);
    fireEvent.pointerDown(screen.getByText("outside"));
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("link", { name: "Power BI" }));
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});
