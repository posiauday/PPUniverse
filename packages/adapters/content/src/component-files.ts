import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROPERTY_KINDS,
  componentStandardProblems,
  parseComponentSource,
  variationProblems,
  type ComponentCreateInput,
  type ComponentParameter,
  type ComponentProperty,
  type ComponentVariation,
  type PropertyKind,
} from "@ppu/domain-content";

/**
 * Reads and checks the component library's source folders (MVP-049):
 *
 *   content/components/<slug>/component.md      front matter + guide
 *   content/components/<slug>/component.yaml    the paste-ready pa.yaml
 *   content/components/<slug>/variations.yaml   optional presets
 *
 * A folder passes when component.md parses, the folder is named after its
 * slug, the YAML is valid against Microsoft's pa.yaml v3.0 schema
 * (schema/pa.schema.v3.0.yaml), holds exactly one canvas component, meets the
 * LowCodeStacks standard (@ppu/domain-content componentStandardProblems), and
 * every variation sets real inputs. Used by the CI gate
 * (component-files.test.ts) and the import step (scripts/import-components.mjs).
 */

// js-yaml 3 and Ajv are CommonJS; load them the CommonJS way so this works
// both compiled (NodeNext) and under Vitest.
const require = createRequire(import.meta.url);
const yaml = require("js-yaml") as { safeLoad(text: string): unknown };
const Ajv = require("ajv").default as new (options: Record<string, unknown>) => {
  compile(schema: unknown): ((data: unknown) => boolean) & {
    errors?: Array<{ instancePath: string; message?: string }> | null;
  };
};

export const COMPONENTS_ROOT = fileURLToPath(
  new URL("../../../../content/components/", import.meta.url),
);
const SCHEMA_FILE = fileURLToPath(new URL("../schema/pa.schema.v3.0.yaml", import.meta.url));

let validator: ReturnType<InstanceType<typeof Ajv>["compile"]> | null = null;

/**
 * Power Apps Studio doesn't accept the published schema for function
 * properties: pasting an InputFunction or OutputFunction with `ReturnType`
 * fails with "PA1011: The keyword 'DataType' is required" and "PA1003: The
 * schema keyword 'ReturnType' is not known" (the product owner's paste-test of
 * lcsButton, 2026-10-08). Studio wants `DataType` for the function's return
 * type. Events and actions keep `ReturnType`. So the checker follows Studio:
 * functions must use DataType, and ReturnType on them is an error.
 */
function acceptStudioFunctionTypes(schema: Record<string, unknown>): void {
  const definitions = schema["definitions"] as Record<string, { allOf?: unknown[] }>;
  for (const rule of definitions["ComponentDefinition-CustomProperty"]?.allOf ?? []) {
    const branch = rule as {
      if?: { properties?: { PropertyKind?: { const?: string } } };
      then?: { required?: string[]; properties?: Record<string, unknown> };
    };
    const kind = branch.if?.properties?.PropertyKind?.const;
    if ((kind !== "InputFunction" && kind !== "OutputFunction") || !branch.then?.properties)
      continue;
    branch.then.required = ["DataType"];
    delete branch.then.properties["ReturnType"];
    branch.then.properties["DataType"] = { $ref: "#/definitions/pfx-data-type" };
  }
}

/** Microsoft's schema, compiled once. One upstream pattern has an unmatched ")"; it's fixed here. */
function schemaValidator() {
  if (validator) return validator;
  const text = readFileSync(SCHEMA_FILE, "utf8").replace(
    "^([a-zA-Z][a-zA-Z0-9]{1,7})_)?",
    "^(([a-zA-Z][a-zA-Z0-9]{1,7})_)?",
  );
  const schema = yaml.safeLoad(text) as Record<string, unknown>;
  delete schema["$schema"];
  acceptStudioFunctionTypes(schema);
  validator = new Ajv({ allErrors: true, strict: false, unicodeRegExp: false }).compile(schema);
  return validator;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === "string" ? value : "");
/** A formula as written in pa.yaml ("=Text"), without its leading "=". */
const formula = (value: unknown): string | null => {
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value !== "string") return null;
  return value.startsWith("=") ? value.slice(1) : value;
};

/**
 * Properties Power Apps Studio rejected on paste for a control type, found by
 * the product owner's paste-tests ("PA2108: Unknown property"). Keyed by the
 * control's name without its version.
 */
const REJECTED_PROPERTIES: Record<string, { properties: string[]; instead: string }> = {
  "Classic/Button": {
    properties: ["AccessibleLabel"],
    instead: "a classic button's accessible name is its Text (make it transparent to hide it)",
  },
};

/** Problems with properties Studio is known to reject, in every control of the component. */
export function rejectedPropertyProblems(children: unknown): string[] {
  const problems: string[] = [];
  const walk = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (!isRecord(entry)) continue;
      for (const [name, control] of Object.entries(entry)) {
        if (!isRecord(control)) continue;
        const type = text(control["Control"]).split("@")[0] ?? "";
        const rule = REJECTED_PROPERTIES[type];
        const properties = isRecord(control["Properties"]) ? control["Properties"] : {};
        for (const property of rule?.properties ?? []) {
          if (property in properties)
            problems.push(
              `${name}: Studio doesn't accept ${property} on ${type}; ${rule?.instead ?? ""}`,
            );
        }
        walk(control["Children"]);
      }
    }
  };
  walk(children);
  return problems;
}

/** The custom properties of one component definition, in the YAML's order. */
export function readProperties(definition: Record<string, unknown>): ComponentProperty[] {
  const custom = isRecord(definition["CustomProperties"]) ? definition["CustomProperties"] : {};
  return Object.entries(custom).map(([name, raw]) => {
    const property = isRecord(raw) ? raw : {};
    const parameters: ComponentParameter[] = Array.isArray(property["Parameters"])
      ? property["Parameters"].flatMap((entry) =>
          isRecord(entry)
            ? Object.entries(entry).map(([parameterName, detail]) => ({
                name: parameterName,
                dataType: text(isRecord(detail) ? detail["DataType"] : ""),
                description: text(isRecord(detail) ? detail["Description"] : ""),
                defaultValue: formula(isRecord(detail) ? detail["Default"] : undefined),
              }))
            : [],
        )
      : [];
    const kind = text(property["PropertyKind"]) as PropertyKind;
    return {
      name,
      kind,
      dataType: text(property["DataType"]) || text(property["ReturnType"]),
      description: text(property["Description"]),
      defaultValue: formula(property["Default"]),
      parameters,
    };
  });
}

/** variations.yaml: a list of { name, description, settings: { Input: =formula } }. */
export function readVariations(source: unknown): {
  variations: ComponentVariation[];
  errors: string[];
} {
  if (source === undefined || source === null) return { variations: [], errors: [] };
  if (!Array.isArray(source)) return { variations: [], errors: ["variations.yaml must be a list"] };
  const variations = source.map((entry) => {
    const item = isRecord(entry) ? entry : {};
    const settings = isRecord(item["settings"]) ? item["settings"] : {};
    return {
      name: text(item["name"]),
      description: text(item["description"]),
      settings: Object.fromEntries(
        Object.entries(settings).map(([key, value]) => [key, formula(value) ?? ""]),
      ),
    };
  });
  return { variations, errors: [] };
}

export type ComponentFolderResult =
  | { ok: true; component: Omit<ComponentCreateInput, "authorUserId"> }
  | { ok: false; errors: string[] };

/** Reads and checks one component folder. */
export function readComponentFolder(path: string, folder: string): ComponentFolderResult {
  const errors: string[] = [];
  const mdFile = join(path, "component.md");
  const yamlFile = join(path, "component.yaml");
  if (!existsSync(mdFile)) errors.push("missing component.md");
  if (!existsSync(yamlFile)) errors.push("missing component.yaml");
  if (errors.length > 0) return { ok: false, errors };

  const source = parseComponentSource(readFileSync(mdFile, "utf8"));
  if (!source.ok) return { ok: false, errors: source.errors.map((e) => `component.md: ${e}`) };
  if (source.component.slug !== folder)
    errors.push(`the folder must be named after the slug, ${source.component.slug}`);

  const yamlText = readFileSync(yamlFile, "utf8").replace(/\r\n/g, "\n");
  let document: unknown;
  try {
    document = yaml.safeLoad(yamlText);
  } catch (error) {
    return { ok: false, errors: [`component.yaml is not valid YAML: ${(error as Error).message}`] };
  }
  const validate = schemaValidator();
  if (!validate(document)) {
    for (const problem of (validate.errors ?? []).slice(0, 10))
      errors.push(
        `component.yaml fails Microsoft's schema at ${problem.instancePath || "/"}: ${problem.message ?? ""}`,
      );
    return { ok: false, errors };
  }
  const definitions =
    isRecord(document) && isRecord(document["ComponentDefinitions"])
      ? document["ComponentDefinitions"]
      : {};
  const names = Object.keys(definitions);
  if (names.length !== 1 || (isRecord(document) && Object.keys(document).length !== 1))
    return {
      ok: false,
      errors: [
        "component.yaml must hold exactly one entry under ComponentDefinitions, and nothing else",
      ],
    };
  const componentName = names[0] as string;
  const definition = definitions[componentName];
  if (!isRecord(definition) || definition["DefinitionType"] !== "CanvasComponent")
    return { ok: false, errors: ["the definition must be a CanvasComponent"] };

  const properties = readProperties(definition);
  for (const property of properties) {
    if (!(PROPERTY_KINDS as readonly string[]).includes(property.kind))
      errors.push(`${property.name}: unknown PropertyKind ${property.kind}`);
  }
  errors.push(...componentStandardProblems(componentName, properties));
  errors.push(...rejectedPropertyProblems(definition["Children"]));

  const variationsFile = join(path, "variations.yaml");
  let variations: ComponentVariation[] = [];
  if (existsSync(variationsFile)) {
    let parsed: unknown;
    try {
      parsed = yaml.safeLoad(readFileSync(variationsFile, "utf8"));
    } catch (error) {
      parsed = undefined;
      errors.push(`variations.yaml is not valid YAML: ${(error as Error).message}`);
    }
    const read = readVariations(parsed);
    errors.push(...read.errors.map((e) => `variations.yaml: ${e}`));
    variations = read.variations;
    errors.push(...variationProblems(variations, properties).map((e) => `variations.yaml: ${e}`));
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    component: { ...source.component, componentName, yaml: yamlText, properties, variations },
  };
}

/** Every folder under content/components, read and checked. */
export function readComponentFolders(
  root: string = COMPONENTS_ROOT,
): Array<{ folder: string; result: ComponentFolderResult }> {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => statSync(join(root, name)).isDirectory())
    .map((folder) => ({ folder, result: readComponentFolder(join(root, folder), folder) }));
}
