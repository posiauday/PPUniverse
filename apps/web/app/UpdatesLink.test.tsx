// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LAST_VISIT_KEY, markVisited } from "../lib/updates-visit";
import { UpdatesLink } from "./UpdatesLink";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const recent = () => [
  new Date(Date.now() - 60_000).toISOString(),
  new Date(Date.now() - 120_000).toISOString(),
];

describe("UpdatesLink (MVP-033 slice D)", () => {
  it("shows the new count, and tells screen readers 'Updates, N new'", () => {
    render(<UpdatesLink publishedTimes={recent()} className="x" />);
    const link = screen.getByRole("link", { name: "Updates, 2 new" });
    expect(link.getAttribute("href")).toBe("/updates");
    expect(link.querySelector(".updates-badge")?.textContent).toBe("2");
  });

  it("is a plain link when nothing is new since the last visit", () => {
    window.localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
    render(<UpdatesLink publishedTimes={recent()} className="x" />);
    expect(
      screen.getByRole("link", { name: "Updates" }).querySelector(".updates-badge"),
    ).toBeNull();
  });

  it("clears as soon as /updates records the visit", () => {
    render(<UpdatesLink publishedTimes={recent()} className="x" />);
    expect(screen.getByRole("link", { name: "Updates, 2 new" })).toBeTruthy();
    act(() => markVisited(Date.now()));
    expect(screen.getByRole("link", { name: "Updates" })).toBeTruthy();
  });
});
