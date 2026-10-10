import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ComponentArt, hasComponentArt } from "./ComponentArt";

const LIBRARY = join(__dirname, "../../../../content/components");

/** Every component in the library, by the name its YAML defines (lcsButton, …). */
const names = readdirSync(LIBRARY, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const yaml = readFileSync(join(LIBRARY, entry.name, "component.yaml"), "utf8");
    return /^ComponentDefinitions:\r?\n {2}(\w+):/m.exec(yaml)?.[1] ?? entry.name;
  });

describe("ComponentArt (2026-10-10, two looks, alive on hover)", () => {
  it.each(names)("draws %s, not the plain tile", (name) => {
    expect(hasComponentArt(name)).toBe(true);
  });

  it("is decorative and its pointer only shows on hover", () => {
    const html = renderToStaticMarkup(<ComponentArt componentName="lcsTreeView" />);
    expect(html).toMatch(/^<span aria-hidden="true"/);
    expect(html).toContain("opacity-0");
    expect(html).toContain("group-hover:opacity-100");
  });

  it("keeps its motion behind the reduced-motion setting", () => {
    const html = renderToStaticMarkup(<ComponentArt componentName="lcsButton" />);
    expect(html).not.toMatch(/(?<![-:\w])transition-all/);
    expect(html).toContain("motion-safe:transition-all");
  });
});
