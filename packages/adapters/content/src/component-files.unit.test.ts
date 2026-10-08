import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readComponentFolder } from "./component-files.js";

const MD = `---
title: "Toggle"
slug: toggle
category: inputs-and-forms
summary: "A switch that turns a setting on or off, with a label."
access: MEMBERS
version: 1.0.0
modernControls: no
---
## Use it

Text.
`;

const YAML = `ComponentDefinitions:
  lcsToggle:
    DefinitionType: CanvasComponent
    CustomProperties:
      IsOn:
        PropertyKind: Input
        DataType: Boolean
        Description: "Whether the toggle is on."
        Default: =false
      OnChange:
        PropertyKind: Event
        ReturnType: None
        Description: "Runs when the toggle changes."
        Parameters:
          - Value:
              DataType: Boolean
              Description: "The new value."
        Default: =false
`;

function folder(files: Record<string, string>, name = "toggle") {
  const root = mkdtempSync(join(tmpdir(), "lcs-"));
  const path = join(root, name);
  mkdirSync(path);
  for (const [file, content] of Object.entries(files)) writeFileSync(join(path, file), content);
  return readComponentFolder(path, name);
}

describe("readComponentFolder", () => {
  it("reads the source, the properties (without the leading =) and the variations", () => {
    const result = folder({
      "component.md": MD,
      "component.yaml": YAML,
      "variations.yaml": '- name: On\n  description: Starts on.\n  settings:\n    IsOn: =true\n',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.component.componentName).toBe("lcsToggle");
    expect(result.component.access).toBe("MEMBERS");
    expect(result.component.needsModernControls).toBe(false);
    expect(result.component.properties).toEqual([
      { name: "IsOn", kind: "Input", dataType: "Boolean", description: "Whether the toggle is on.", defaultValue: "false", parameters: [] },
      {
        name: "OnChange",
        kind: "Event",
        dataType: "None",
        description: "Runs when the toggle changes.",
        defaultValue: "false",
        parameters: [{ name: "Value", dataType: "Boolean", description: "The new value." }],
      },
    ]);
    expect(result.component.variations).toEqual([
      { name: "On", description: "Starts on.", settings: { IsOn: "true" } },
    ]);
  });

  it("rejects YAML that fails Microsoft's schema", () => {
    const result = folder({ "component.md": MD, "component.yaml": "Screens: 12\n" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/Microsoft's schema/);
  });

  it("enforces the standard: lcs name, described properties, input defaults", () => {
    const bad = YAML.replace("lcsToggle", "Toggle1").replace('Description: "Whether the toggle is on."', 'Description: "x"');
    const result = folder({ "component.md": MD, "component.yaml": bad });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/lcs \+ PascalCase/);
      expect(result.errors.join(" ")).toMatch(/IsOn: needs a description/);
    }
  });

  it("rejects a variation that sets something that isn't an input", () => {
    const result = folder({
      "component.md": MD,
      "component.yaml": YAML,
      "variations.yaml": "- name: Odd\n  description: Sets an event.\n  settings:\n    OnChange: =true\n",
    });
    expect(result.ok).toBe(false);
  });

  it("needs the folder to be named after the slug", () => {
    const result = folder({ "component.md": MD, "component.yaml": YAML }, "other");
    expect(result.ok).toBe(false);
  });
});
