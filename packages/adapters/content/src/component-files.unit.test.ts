import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  readComponentFolder,
  rejectedPropertyProblems,
  sizeFromVariableProblems,
} from "./component-files.js";

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
      "variations.yaml": "- name: On\n  description: Starts on.\n  settings:\n    IsOn: =true\n",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.component.componentName).toBe("lcsToggle");
    expect(result.component.access).toBe("MEMBERS");
    expect(result.component.needsModernControls).toBe(false);
    expect(result.component.properties).toEqual([
      {
        name: "IsOn",
        kind: "Input",
        dataType: "Boolean",
        description: "Whether the toggle is on.",
        defaultValue: "false",
        parameters: [],
      },
      {
        name: "OnChange",
        kind: "Event",
        dataType: "None",
        description: "Runs when the toggle changes.",
        defaultValue: "false",
        parameters: [
          {
            name: "Value",
            dataType: "Boolean",
            description: "The new value.",
            defaultValue: "false",
          },
        ],
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
    const bad = YAML.replace("lcsToggle", "Toggle1").replace(
      'Description: "Whether the toggle is on."',
      'Description: "x"',
    );
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
      "variations.yaml":
        "- name: Odd\n  description: Sets an event.\n  settings:\n    OnChange: =true\n",
    });
    expect(result.ok).toBe(false);
  });

  it("follows Studio for function properties: DataType, not ReturnType (the lcsButton pilot paste-test, 2026-10-08)", () => {
    const fn = (typeKey: string) => `${YAML}      Format:
        PropertyKind: InputFunction
        ${typeKey}: Text
        Description: "Formats the label for display."
        Parameters:
          - Text:
              DataType: Text
              Description: "The label."
              Default: =""
        Default: =Text
`;
    expect(folder({ "component.md": MD, "component.yaml": fn("DataType") }).ok).toBe(true);
    const rejected = folder({ "component.md": MD, "component.yaml": fn("ReturnType") });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.errors.join(" ")).toMatch(/required property 'DataType'/);
  });

  it("needs a Default on every parameter, as Studio writes", () => {
    const noDefault = YAML.replace("              Default: =false\n", "");
    const result = folder({ "component.md": MD, "component.yaml": noDefault });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.join(" ")).toMatch(/OnChange\(Value\): parameters need a Default/);
  });

  it("catches properties Studio rejects, in nested controls too", () => {
    const children = [
      {
        cnt: {
          Control: "GroupContainer@1.5.0",
          Children: [
            {
              btnHit: {
                Control: "Classic/Button@2.2.0",
                Properties: { AccessibleLabel: '="Save"' },
              },
            },
          ],
        },
      },
    ];
    expect(rejectedPropertyProblems(children)).toEqual([
      "btnHit: Studio doesn't accept AccessibleLabel on Classic/Button; a classic button's accessible name is its Text (make it transparent to hide it)",
    ]);
    expect(
      rejectedPropertyProblems([
        { btn: { Control: "ModernButton@1.0.0", Properties: { AccessibleLabel: '="Save"' } } },
      ]),
    ).toEqual([]);
  });

  it("rejects a component sized from one of its own variables", () => {
    const yamlText = "OnSelect: =Set(locOpen, !locOpen)";
    expect(
      sizeFromVariableProblems(yamlText, { Width: "=If(locOpen, 240, 56)", Height: "=56" }),
    ).toEqual(["the component's Width reads the variable locOpen; size it from its inputs only"]);
    expect(sizeFromVariableProblems(yamlText, { Width: "=If(lcsFab.SpeedDial, 240, 56)" })).toEqual(
      [],
    );
  });

  it("needs the folder to be named after the slug", () => {
    const result = folder({ "component.md": MD, "component.yaml": YAML }, "other");
    expect(result.ok).toBe(false);
  });
});
