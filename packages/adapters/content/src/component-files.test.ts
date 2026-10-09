import { describe, expect, it } from "vitest";
import { readComponentFolders } from "./component-files.js";

/**
 * The component library gate (MVP-049): every folder in content/components
 * must be importable. component.md parses; the folder is named after its
 * slug; component.yaml passes Microsoft's pa.yaml v3.0 schema, holds exactly
 * one canvas component and meets the LowCodeStacks standard; variations only
 * set real inputs; and slugs and component names are unique. Runs in CI, so a
 * broken component fails the build before it can be imported.
 */
describe("content/components", () => {
  const folders = readComponentFolders();

  it("has at least one component", () => {
    expect(folders.length).toBeGreaterThan(0);
  });

  it.each(folders.map((entry) => [entry.folder, entry.result] as const))(
    "%s is a valid, standard component",
    (_folder, result) => {
      expect(result.ok ? [] : result.errors).toEqual([]);
    },
  );

  // A generator once turned Parent.TemplateWidth into "Parent.TemplateMax(...)"
  // (first Navigation shell paste-test, 2026-10-09): valid YAML, an error in Studio.
  it.each(folders.map((entry) => [entry.folder, entry.result] as const))(
    "%s reads only Parent's real size properties",
    (_folder, result) => {
      if (!result.ok) return;
      const used = [...result.component.yaml.matchAll(/\bParent\.([A-Za-z]+)/g)].map(
        (match) => match[1],
      );
      expect(
        used.filter(
          (name) => !["Width", "Height", "TemplateWidth", "TemplateHeight"].includes(name!),
        ),
      ).toEqual([]);
    },
  );

  // Studio reads a control's properties by the version after "@": ModernCheckbox@1.0.0 has no
  // Checked, so the Data table's first paste-test failed (PA2108, 2026-10-09, BUG-043).
  it.each(folders.map((entry) => [entry.folder, entry.result] as const))(
    "%s asks for a checkbox version that has Checked",
    (_folder, result) => {
      if (!result.ok) return;
      const versions = [...result.component.yaml.matchAll(/Control: ModernCheckbox@([\d.]+)/g)].map(
        (match) => match[1],
      );
      expect(versions.filter((version) => version === "1.0.0" || version === "1.0.1")).toEqual([]);
    },
  );

  it("uses each slug and component name once", () => {
    const ok = folders.flatMap((entry) => (entry.result.ok ? [entry.result.component] : []));
    const names = ok.map((component) => component.componentName);
    expect(new Set(names).size).toBe(names.length);
  });
});
