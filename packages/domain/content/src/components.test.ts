import { describe, expect, it } from "vitest";
import {
  canPublishComponent,
  componentStandardProblems,
  isValidStudioVersion,
  parseComponentSource,
  variationProblems,
  type ComponentProperty,
} from "./components.js";

const SOURCE = `---
title: "Button"
slug: button
category: buttons-and-actions
summary: "A modern button with four looks and a busy state."
access: OPEN
version: 1.0.0
modernControls: yes
---
## Use it

Text.
`;

const input = (name: string, extra: Partial<ComponentProperty> = {}): ComponentProperty => ({
  name,
  kind: "Input",
  dataType: "Text",
  description: "A long enough description.",
  defaultValue: '""',
  parameters: [],
  ...extra,
});

describe("parseComponentSource", () => {
  it("reads a valid component.md", () => {
    const result = parseComponentSource(SOURCE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.component).toMatchObject({
        slug: "button",
        access: "OPEN",
        needsModernControls: true,
        version: "1.0.0",
      });
      expect(result.component.guide).toContain("## Use it");
    }
  });

  it("names every problem", () => {
    const bad = SOURCE.replace("buttons-and-actions", "widgets")
      .replace("access: OPEN", "access: PAID")
      .replace("1.0.0", "v1")
      .replace("modernControls: yes", "modernControls: maybe")
      .replace("## Use it", "# Use it");
    const result = parseComponentSource(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const text = result.errors.join(" | ");
      expect(text).toMatch(/category must be one of/);
      expect(text).toMatch(/access must be OPEN or MEMBERS/);
      expect(text).toMatch(/version must look like 1.0.0/);
      expect(text).toMatch(/modernControls must be yes or no/);
      expect(text).toMatch(/headings in the guide start at ##/);
    }
  });
});

describe("the component standard", () => {
  it("passes a well-formed component", () => {
    expect(componentStandardProblems("lcsButton", [input("Label")])).toEqual([]);
  });

  it("needs the lcs prefix, PascalCase names, descriptions and input defaults", () => {
    const problems = componentStandardProblems("Button1", [
      input("label"),
      input("Size", { description: "short" }),
      input("Mode", { defaultValue: null }),
    ]);
    expect(problems).toHaveLength(4);
  });

  it("checks variations only set inputs", () => {
    const properties = [input("Label"), input("OnSelect", { kind: "Event" })];
    expect(variationProblems([{ name: "A", description: "Fine.", settings: { Label: '"x"' } }], properties)).toEqual([]);
    expect(variationProblems([{ name: "B", description: "Bad.", settings: { OnSelect: "true" } }], properties)).toHaveLength(1);
  });
});

describe("publishing", () => {
  it("needs a tested draft", () => {
    expect(canPublishComponent({ status: "DRAFT", testedAt: null })).toBe(false);
    expect(canPublishComponent({ status: "DRAFT", testedAt: new Date() })).toBe(true);
    expect(canPublishComponent({ status: "PUBLISHED", testedAt: new Date() })).toBe(false);
  });

  it("accepts a Studio version like the one Studio shows", () => {
    expect(isValidStudioVersion("3.26093.12")).toBe(true);
    expect(isValidStudioVersion("<script>")).toBe(false);
  });
});
