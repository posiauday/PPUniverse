// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { readingLine, TocSpy } from "./TocSpy";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

/** Puts a heading on the page at a given distance from the top of the window. */
function heading(id: string, top: number) {
  const element = document.createElement("h2");
  element.id = id;
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  document.body.append(element);
}

function current(): string | null {
  return document.querySelector("a[aria-current='location']")?.getAttribute("href") ?? null;
}

function spy(ids: string[]) {
  // jsdom has no layout: give the page a height, so the reader isn't "at the bottom".
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: 5000,
    configurable: true,
  });
  render(
    <TocSpy ids={ids}>
      <ol>
        {ids.map((id) => (
          <li key={id}>
            <a href={`#${id}`}>{id}</a>
          </li>
        ))}
      </ol>
    </TocSpy>,
  );
}

describe("TocSpy (BUG-037)", () => {
  it("draws the reading line about a third down the window, never above 160px", () => {
    expect(readingLine(800)).toBe(280);
    expect(readingLine(1000)).toBe(350);
    expect(readingLine(400)).toBe(160);
  });

  it("marks the section whose heading is in the top third, not only once it's under the header", () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    // The reader has just scrolled to "steps": its heading is below the sticky header.
    heading("intro", -400);
    heading("steps", 200);
    heading("checklist", 700);
    spy(["intro", "steps", "checklist"]);
    expect(current()).toBe("#steps");
  });

  it("marks the first section as soon as its heading reaches the reading area", () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    heading("first", 240);
    heading("second", 900);
    spy(["first", "second"]);
    expect(current()).toBe("#first");
  });

  it("marks nothing before the first heading", () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    heading("first", 500);
    heading("second", 1200);
    spy(["first", "second"]);
    expect(current()).toBeNull();
  });
});
