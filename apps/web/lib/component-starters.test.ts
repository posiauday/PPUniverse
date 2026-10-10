import { readdirSync } from "node:fs";
import { join } from "node:path";
import { cleanCommentBody } from "@ppu/domain-content";
import { describe, expect, it } from "vitest";
import { COMPONENT_STARTERS, componentStarter } from "./component-starters";

/** The component library's folders (MVP-049): each folder name is a slug. */
const SLUGS = readdirSync(join(__dirname, "../../../content/components"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe("component starters (MVP-053)", () => {
  it("has a drafted opener for every component, and none for a component that doesn't exist", () => {
    expect(SLUGS.length).toBeGreaterThan(0);
    expect(Object.keys(COMPONENT_STARTERS).sort()).toEqual([...SLUGS].sort());
  });

  it("drafts only text a comment may have, unchanged by the clean-up", () => {
    for (const [slug, text] of Object.entries(COMPONENT_STARTERS)) {
      const cleaned = cleanCommentBody(text);
      expect(cleaned, slug).toEqual({ ok: true, body: text });
    }
  });

  it("gives an empty box for an unknown component", () => {
    expect(componentStarter("no-such-component")).toBe("");
    expect(componentStarter("tree-view")).toContain("ExpandAll()");
  });
});
