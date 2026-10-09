import { first, frontMatter } from "./learn-source.js";
import type { ArticleStatus } from "./types.js";

/**
 * The Power Apps component library (MVP-049; docs/final-decisions.md,
 * 2026-10-08, "Power Apps component library: first, copy-paste YAML, free";
 * plan: docs/plans/power-apps-component-library.md).
 *
 * A component is written in the repository as a folder:
 *
 *   content/components/<slug>/component.md     front matter + the guide
 *   content/components/<slug>/component.yaml   the paste-ready YAML
 *   content/components/<slug>/variations.yaml  optional named presets
 *
 * reviewed in a pull request, checked in CI against Microsoft's pa.yaml
 * schema and the standard below, and imported as a DRAFT. Nothing is public
 * until the product owner has paste-tested it in Power Apps Studio, recorded
 * the Studio version, and published it.
 */

export const COMPONENT_CATEGORIES = [
  { id: "buttons-and-actions", name: "Buttons and actions" },
  { id: "inputs-and-forms", name: "Inputs and forms" },
  { id: "dialogs-and-feedback", name: "Dialogs and feedback" },
  { id: "navigation-and-layout", name: "Navigation and layout" },
  { id: "data-display", name: "Data display" },
  { id: "states", name: "Empty, loading and error states" },
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number]["id"];

/** OPEN: anyone can copy the YAML. MEMBERS: free, but copying needs sign-in. */
export const COMPONENT_ACCESS = ["OPEN", "MEMBERS"] as const;
export type ComponentAccess = (typeof COMPONENT_ACCESS)[number];

/** The six custom property kinds a canvas component can have, in display order. */
export const PROPERTY_KINDS = [
  "Input",
  "Output",
  "InputFunction",
  "OutputFunction",
  "Event",
  "Action",
] as const;
export type PropertyKind = (typeof PROPERTY_KINDS)[number];

export const PROPERTY_KIND_LABEL: Record<PropertyKind, string> = {
  Input: "Inputs",
  Output: "Outputs",
  InputFunction: "Input functions",
  OutputFunction: "Output functions",
  Event: "Events",
  Action: "Actions",
};

/** One of each kind, for "1 output" rather than "1 outputs". */
const PROPERTY_KIND_SINGULAR: Record<PropertyKind, string> = {
  Input: "input",
  Output: "output",
  InputFunction: "input function",
  OutputFunction: "output function",
  Event: "event",
  Action: "action",
};

/** "4 inputs · 1 output · 1 event": how many properties of each kind, in PROPERTY_KINDS order. */
export function propertyCounts(properties: readonly { kind: PropertyKind }[]): string {
  return PROPERTY_KINDS.map((kind) => ({
    kind,
    count: properties.filter((property) => property.kind === kind).length,
  }))
    .filter((entry) => entry.count > 0)
    .map(
      (entry) =>
        `${entry.count} ${entry.count === 1 ? PROPERTY_KIND_SINGULAR[entry.kind] : PROPERTY_KIND_LABEL[entry.kind].toLowerCase()}`,
    )
    .join(" · ");
}

export interface ComponentParameter {
  name: string;
  dataType: string;
  description: string;
  /** The default formula without its leading "=". Studio needs one on every parameter. */
  defaultValue?: string | null;
}

/** One custom property, read from the component's YAML. */
export interface ComponentProperty {
  name: string;
  kind: PropertyKind;
  /** DataType for data properties, ReturnType for functions, events and actions. */
  dataType: string;
  description: string;
  /** The default formula without its leading "=", or null when there is none. */
  defaultValue: string | null;
  parameters: ComponentParameter[];
}

/** A named preset: the component with some inputs set, shown as a variation. */
export interface ComponentVariation {
  name: string;
  description: string;
  /** Input name -> Power Fx formula, such as { Appearance: '"Outline"' }. */
  settings: Record<string, string>;
}

export const COMPONENT_TITLE_MAX = 80;
export const COMPONENT_SUMMARY_MAX = 300;
export const COMPONENT_NAME_PREFIX = "lcs";

export const isValidComponentSlug = (value: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
export const isValidComponentTitle = (value: string) =>
  value.trim().length > 0 && value.length <= COMPONENT_TITLE_MAX;
export const isValidComponentSummary = (value: string) =>
  value.trim().length >= 20 && value.length <= COMPONENT_SUMMARY_MAX;
export const isValidComponentCategory = (value: string): value is ComponentCategory =>
  COMPONENT_CATEGORIES.some((category) => category.id === value);
export const isValidComponentAccess = (value: string): value is ComponentAccess =>
  (COMPONENT_ACCESS as readonly string[]).includes(value);
/** major.minor.patch, such as 1.0.0. */
export const isValidComponentVersion = (value: string) => /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value);

export function categoryName(id: string): string {
  return COMPONENT_CATEGORIES.find((category) => category.id === id)?.name ?? id;
}

/** What component.md holds: everything but the YAML. */
export interface ComponentSource {
  title: string;
  slug: string;
  category: ComponentCategory;
  summary: string;
  access: ComponentAccess;
  version: string;
  needsModernControls: boolean;
  /** The guide, as Markdown. */
  guide: string;
}

export type ComponentSourceResult =
  { ok: true; component: ComponentSource } | { ok: false; errors: string[] };

export function parseComponentSource(text: string): ComponentSourceResult {
  const parsed = frontMatter(text, [
    "title",
    "slug",
    "category",
    "summary",
    "access",
    "version",
    "modernControls",
  ]);
  if (!("fields" in parsed)) return { ok: false, errors: parsed.errors };
  const { fields, body, errors } = parsed;
  const title = first(fields, "title");
  const slug = first(fields, "slug");
  const category = first(fields, "category");
  const summary = first(fields, "summary");
  const access = first(fields, "access");
  const version = first(fields, "version");
  const modernControls = first(fields, "modernControls");

  if (!isValidComponentTitle(title))
    errors.push(`title is required and must be ${COMPONENT_TITLE_MAX} characters or fewer`);
  if (!isValidComponentSlug(slug)) errors.push("slug must be lower-case and hyphen-separated");
  if (!isValidComponentCategory(category))
    errors.push(`category must be one of: ${COMPONENT_CATEGORIES.map((c) => c.id).join(", ")}`);
  if (!isValidComponentSummary(summary))
    errors.push(`summary must be 20 to ${COMPONENT_SUMMARY_MAX} characters`);
  if (!isValidComponentAccess(access)) errors.push("access must be OPEN or MEMBERS");
  if (!isValidComponentVersion(version)) errors.push("version must look like 1.0.0");
  if (modernControls !== "yes" && modernControls !== "no")
    errors.push("modernControls must be yes or no");
  if (!/^## /m.test(body)) errors.push("the guide needs at least one ## section");
  if (/^# /m.test(body)) errors.push("headings in the guide start at ##");

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    component: {
      title,
      slug,
      category: category as ComponentCategory,
      summary,
      access: access as ComponentAccess,
      version,
      needsModernControls: modernControls === "yes",
      guide: body,
    },
  };
}

/**
 * The LowCodeStacks component standard (docs/plans/power-apps-component-library.md),
 * the parts a machine can check. Returns the problems; empty means it passes.
 */
export function componentStandardProblems(
  name: string,
  properties: readonly ComponentProperty[],
): string[] {
  const problems: string[] = [];
  if (!new RegExp(`^${COMPONENT_NAME_PREFIX}[A-Z][A-Za-z0-9]*$`).test(name))
    problems.push(
      `the component name must be ${COMPONENT_NAME_PREFIX} + PascalCase, such as lcsButton`,
    );
  if (properties.length === 0) problems.push("a component needs at least one custom property");
  for (const property of properties) {
    if (!/^[A-Z][A-Za-z0-9]*$/.test(property.name))
      problems.push(`${property.name}: property names are PascalCase`);
    if (property.description.trim().length < 10)
      problems.push(`${property.name}: needs a description of at least 10 characters`);
    if (property.kind === "Input" && property.defaultValue === null)
      problems.push(`${property.name}: an input needs a default`);
    for (const parameter of property.parameters) {
      if (parameter.description.trim().length === 0)
        problems.push(`${property.name}(${parameter.name}): parameters need a description`);
      // Studio writes a Default on every parameter, and a paste without one fails
      // (the product owner's paste-tests, 2026-10-08).
      if (parameter.defaultValue === null || parameter.defaultValue === undefined)
        problems.push(`${property.name}(${parameter.name}): parameters need a Default`);
    }
  }
  return problems;
}

/** Problems with the variations against the component's inputs; empty means fine. */
export function variationProblems(
  variations: readonly ComponentVariation[],
  properties: readonly ComponentProperty[],
): string[] {
  const inputs = new Set(properties.filter((p) => p.kind === "Input").map((p) => p.name));
  const problems: string[] = [];
  const names = new Set<string>();
  for (const variation of variations) {
    if (variation.name.trim() === "") problems.push("every variation needs a name");
    if (names.has(variation.name)) problems.push(`duplicate variation: ${variation.name}`);
    names.add(variation.name);
    if (variation.description.trim() === "")
      problems.push(`${variation.name}: needs a description`);
    for (const key of Object.keys(variation.settings)) {
      if (!inputs.has(key))
        problems.push(`${variation.name}: ${key} is not an input of the component`);
    }
  }
  return problems;
}

/** A component as the admin sees it. */
export interface ComponentRecord extends Omit<ComponentSource, "guide"> {
  id: string;
  guide: string;
  /** The component's name in Power Apps, such as lcsButton. */
  componentName: string;
  yaml: string;
  properties: ComponentProperty[];
  variations: ComponentVariation[];
  status: ArticleStatus;
  publishedAt: Date | null;
  /** Hidden components stay published but don't show on the site. */
  hidden: boolean;
  /** A draft shown as "Coming soon": a card and page, nothing to copy. Ignored once published. */
  comingSoon: boolean;
  /** When the product owner last paste-tested this YAML, and in which Studio version. */
  testedAt: Date | null;
  testedStudioVersion: string | null;
  updatedAt: Date;
}

/** What the import step writes: the source plus what was read from the YAML. */
export interface ComponentCreateInput extends ComponentSource {
  componentName: string;
  yaml: string;
  properties: ComponentProperty[];
  variations: ComponentVariation[];
  authorUserId: string;
}

/** What the admin can change on a component. */
export interface ComponentAdminUpdate {
  access?: ComponentAccess;
  hidden?: boolean;
  comingSoon?: boolean;
}

/**
 * What the site shows of a "Coming soon" component (docs/final-decisions.md,
 * 2026-10-09): its card and page with a blurred picture. Never its YAML,
 * guide or variations, which aren't tested yet.
 */
export type ComponentTeaser = Pick<
  ComponentRecord,
  "id" | "slug" | "title" | "summary" | "category" | "componentName" | "access"
>;

/** A component can be published once its current YAML has been paste-tested. */
export function canPublishComponent(
  component: Pick<ComponentRecord, "status" | "testedAt">,
): boolean {
  return component.status === "DRAFT" && component.testedAt !== null;
}

export const STUDIO_VERSION_MAX = 40;
export const isValidStudioVersion = (value: string) =>
  /^[0-9A-Za-z.\- ]+$/.test(value.trim()) && value.trim().length <= STUDIO_VERSION_MAX;

export interface ComponentRepository {
  findBySlug(slug: string): Promise<ComponentRecord | null>;
  findById(id: string): Promise<ComponentRecord | null>;
  create(input: ComponentCreateInput): Promise<ComponentRecord>;
  /** Replaces a DRAFT's content from its source files and clears its test record. */
  replaceDraft(id: string, input: ComponentCreateInput): Promise<ComponentRecord>;
  listForAdmin(): Promise<ComponentRecord[]>;
  /** Published and not hidden, for the site. */
  listPublic(): Promise<ComponentRecord[]>;
  findPublicBySlug(slug: string): Promise<ComponentRecord | null>;
  /** Drafts marked Coming soon and not hidden, for the site. */
  listComingSoon(): Promise<ComponentTeaser[]>;
  findComingSoonBySlug(slug: string): Promise<ComponentTeaser | null>;
  updateSettings(
    id: string,
    change: ComponentAdminUpdate,
    actorUserId: string,
  ): Promise<ComponentRecord>;
  markTested(id: string, studioVersion: string, actorUserId: string): Promise<ComponentRecord>;
  publish(id: string, actorUserId: string): Promise<ComponentRecord>;
  /**
   * A PUBLISHED component back to a draft marked Coming soon (docs/final-decisions.md,
   * 2026-10-09, "Component library: back to Coming soon"). Keeps its test record, so it
   * can be published again; the next import updates it from its files, as any draft.
   */
  moveToComingSoon(id: string, actorUserId: string): Promise<ComponentRecord>;
}
