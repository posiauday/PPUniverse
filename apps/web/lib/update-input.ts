import {
  UPDATE_ACTION_MAX,
  UPDATE_REPLACEMENT_MAX,
  isValidOptionalText,
  isValidTechnology,
  isValidUpdateKind,
  isValidUpdateSlug,
  isValidUpdateSourceUrl,
  isValidUpdateSummary,
  isValidUpdateTitle,
  parseIsoDate,
  type Technology,
  type UpdateInput,
  type UpdateKind,
} from "@ppu/domain-content";

/** The JSON body of the admin update create/edit routes; every field untrusted. */
export interface UpdateInputBody {
  slug?: unknown;
  title?: unknown;
  summary?: unknown;
  technology?: unknown;
  kind?: unknown;
  action?: unknown;
  sourceUrl?: unknown;
  effectiveDate?: unknown;
  replacement?: unknown;
}

export type UpdateInputResult =
  { ok: true; input: UpdateInput } | { ok: false; fieldErrors: Record<string, string[]> };

/** "", null or absent means none; anything else must be a string. */
function optionalString(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() === "" ? null : value.trim();
}

/**
 * Validates an admin update body (MVP-033 slice D) with the same validators
 * the content importer uses (@ppu/domain-content), shared by the create and
 * edit routes so the two can never disagree.
 */
export function parseUpdateBody(body: UpdateInputBody): UpdateInputResult {
  const fieldErrors: Record<string, string[]> = {};

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!isValidUpdateSlug(slug))
    fieldErrors["slug"] = ["slug must be lowercase and hyphen-separated (e.g. grid-deprecated)."];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!isValidUpdateTitle(title))
    fieldErrors["title"] = ["title is required and must be 160 characters or fewer."];
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  if (!isValidUpdateSummary(summary))
    fieldErrors["summary"] = ["summary is required and must be 500 characters or fewer."];

  const technologyValue = optionalString(body.technology);
  if (
    technologyValue === undefined ||
    (technologyValue !== null && !isValidTechnology(technologyValue))
  )
    fieldErrors["technology"] = ["technology must be one of the seven areas, or empty."];

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!isValidUpdateKind(kind))
    fieldErrors["kind"] = ["kind must be one of FEATURE, LICENSING, DEPRECATION, RETIREMENT."];

  const action = optionalString(body.action);
  if (action === undefined || !isValidOptionalText(action, UPDATE_ACTION_MAX))
    fieldErrors["action"] = ["action must be 40 characters or fewer."];

  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  if (!isValidUpdateSourceUrl(sourceUrl))
    fieldErrors["sourceUrl"] = ["source must be an https link on microsoft.com or a subdomain."];

  const effective = optionalString(body.effectiveDate);
  const effectiveDate = typeof effective === "string" ? parseIsoDate(effective) : null;
  if (effective === undefined || (typeof effective === "string" && !effectiveDate))
    fieldErrors["effectiveDate"] = ["effective date must be a date as YYYY-MM-DD, or empty."];

  const replacement = optionalString(body.replacement);
  if (replacement === undefined || !isValidOptionalText(replacement, UPDATE_REPLACEMENT_MAX))
    fieldErrors["replacement"] = ["replacement must be 160 characters or fewer."];

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    input: {
      slug,
      title,
      summary,
      technology: technologyValue as Technology | null,
      kind: kind as UpdateKind,
      action: action as string | null,
      sourceUrl,
      effectiveDate,
      replacement: replacement as string | null,
    },
  };
}
