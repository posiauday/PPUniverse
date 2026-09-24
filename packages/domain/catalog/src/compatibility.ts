import { normalizeDisplayText } from "./text.js";
import type { CompatibilityEvidenceStatus, PlatformArea } from "./types.js";

/**
 * Compatibility model approved by the product owner (docs/final-decisions.md,
 * 2026-09-21). The labels below are deliberately limited to the approved
 * vocabulary: never "Certified", "Approved", "Officially Supported" or
 * "Marketplace Verified" — those need a separate documented process.
 */
export const PLATFORM_AREAS: readonly PlatformArea[] = [
  "POWER_APPS",
  "POWER_AUTOMATE",
  "POWER_BI",
  "DATAVERSE",
  "POWER_PAGES",
  "COPILOT_STUDIO",
  "MICROSOFT_FABRIC",
];

export const PLATFORM_AREA_LABELS: Record<PlatformArea, string> = {
  POWER_APPS: "Power Apps",
  POWER_AUTOMATE: "Power Automate",
  POWER_BI: "Power BI",
  DATAVERSE: "Dataverse",
  POWER_PAGES: "Power Pages",
  COPILOT_STUDIO: "Copilot Studio",
  MICROSOFT_FABRIC: "Microsoft Fabric",
};

/**
 * Vocabulary corrected 2026-09-24 (TD-008; docs/final-decisions.md, 2026-09-21
 * "Product-owner responses to MVP-005 open items" section B). Only
 * CREATOR_DECLARED and MARKETPLACE_REVIEWED are assignable -- see
 * ASSIGNABLE_EVIDENCE_STATUSES below, used by the validator. TESTED and
 * NOT_VERIFIED are reserved/legacy: kept here only so existing/legacy rows
 * still have a label if ever read directly, never offered as a choice and
 * never shown in the public legend (present-evidence.ts filters both out).
 */
export const EVIDENCE_STATUSES: readonly CompatibilityEvidenceStatus[] = [
  "TESTED",
  "CREATOR_DECLARED",
  "NOT_VERIFIED",
  "MARKETPLACE_REVIEWED",
];

/** The only statuses a caller may assign (TD-008). Order is display order. */
export const ASSIGNABLE_EVIDENCE_STATUSES: readonly CompatibilityEvidenceStatus[] = [
  "CREATOR_DECLARED",
  "MARKETPLACE_REVIEWED",
];

export const EVIDENCE_STATUS_LABELS: Record<CompatibilityEvidenceStatus, string> = {
  TESTED: "Tested",
  CREATOR_DECLARED: "Creator Declared",
  NOT_VERIFIED: "Not Verified",
  MARKETPLACE_REVIEWED: "Marketplace Reviewed",
};

/** Approved wording only (docs/final-decisions.md, 2026-09-21, section B) -- do not paraphrase. */
export const EVIDENCE_STATUS_DEFINITIONS: Record<CompatibilityEvidenceStatus, string> = {
  TESTED:
    "Reserved. Not assignable, not inferred from other data, and not migrated to from any other status.",
  CREATOR_DECLARED:
    "The compatibility information was supplied by the creator and has not been independently certified by the marketplace.",
  NOT_VERIFIED: "Legacy. Not assignable. Unreviewed information is Creator Declared, not this.",
  MARKETPLACE_REVIEWED:
    "A moderator reviewed the submitted compatibility statement for completeness, plausibility, prohibited claims and publication readiness. This does not mean independently tested, certified, guaranteed, Microsoft approved, Microsoft certified, officially supported or verified compatible.",
};

/** 2019 is the earliest Microsoft release-wave year. The database check is wider (to 2100) so a new year never needs a migration. */
export const MIN_RELEASE_YEAR = 2019;
export const RELEASE_YEAR_LOOKAHEAD = 2;
export const RELEASE_WAVES: readonly number[] = [1, 2];
export const MAX_COMPATIBILITY_TEXT_LENGTH = 500;

export function maxReleaseYear(now: Date): number {
  return now.getUTCFullYear() + RELEASE_YEAR_LOOKAHEAD;
}

/** e.g. (2025, 2) -> "2025 release wave 2" */
export function formatReleaseWave(year: number, wave: number): string {
  return `${year} release wave ${wave}`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Milliseconds (UTC midnight) for a strict `YYYY-MM-DD` calendar date, or null if it isn't a real date. */
function parseIsoDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const roundTrip = new Date(time);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day
  ) {
    return null;
  }
  return time;
}

/** "2026-03-12" -> "12 March 2026". Manual, not Intl, so server and browser can never disagree. */
export function formatVerifiedDate(iso: string): string | null {
  if (parseIsoDate(iso) === null) {
    return null;
  }
  const [year, month, day] = iso.split("-");
  const monthName = MONTH_NAMES[Number(month) - 1];
  return monthName ? `${Number(day)} ${monthName} ${year}` : null;
}

export type CompatibilityErrorCode =
  | "PLATFORM_AREA_REQUIRED"
  | "PLATFORM_AREA_INVALID"
  | "RELEASE_YEAR_REQUIRED"
  | "RELEASE_YEAR_OUT_OF_RANGE"
  | "RELEASE_WAVE_REQUIRED"
  | "RELEASE_WAVE_INVALID"
  | "EVIDENCE_STATUS_REQUIRED"
  | "EVIDENCE_STATUS_INVALID"
  | "EVIDENCE_STATUS_RESERVED_OR_LEGACY"
  | "NOTES_TOO_LONG"
  | "EVIDENCE_SUMMARY_TOO_LONG"
  | "LAST_VERIFIED_INVALID"
  | "LAST_VERIFIED_IN_FUTURE";

export interface CompatibilityEntryInput {
  platformArea?: string | null;
  minReleaseYear?: number | null;
  minReleaseWave?: number | null;
  notes?: string | null;
  evidenceStatus?: string | null;
  evidenceSummary?: string | null;
  lastVerifiedAt?: string | null;
}

export interface CompatibilityValidationError {
  field: keyof CompatibilityEntryInput;
  code: CompatibilityErrorCode;
}

export interface ValidCompatibilityEntry {
  platformArea: PlatformArea;
  minReleaseYear: number;
  minReleaseWave: number;
  notes: string | null;
  evidenceStatus: CompatibilityEvidenceStatus;
  evidenceSummary: string | null;
  lastVerifiedAt: string | null;
}

export type CompatibilityValidationResult =
  | { ok: true; value: ValidCompatibilityEntry }
  | { ok: false; errors: CompatibilityValidationError[] };

/**
 * The write-side rules from the approved compatibility model. No caller
 * writes compatibility data yet (the creator editor is MVP-012); this exists
 * so that story reuses one definition of "valid" that matches the database
 * CHECK constraints. `now` is injectable so the year range and the
 * "not in the future" rule are testable.
 */
export function validateCompatibilityEntry(
  input: CompatibilityEntryInput,
  now: Date = new Date(),
): CompatibilityValidationResult {
  const errors: CompatibilityValidationError[] = [];

  // A release wave with no platform area is never valid: the area is required.
  const rawArea = input.platformArea?.trim();
  if (!rawArea) {
    errors.push({ field: "platformArea", code: "PLATFORM_AREA_REQUIRED" });
  } else if (!PLATFORM_AREAS.includes(rawArea as PlatformArea)) {
    errors.push({ field: "platformArea", code: "PLATFORM_AREA_INVALID" });
  }

  const year = input.minReleaseYear;
  if (year === null || year === undefined) {
    errors.push({ field: "minReleaseYear", code: "RELEASE_YEAR_REQUIRED" });
  } else if (!Number.isInteger(year) || year < MIN_RELEASE_YEAR || year > maxReleaseYear(now)) {
    errors.push({ field: "minReleaseYear", code: "RELEASE_YEAR_OUT_OF_RANGE" });
  }

  const wave = input.minReleaseWave;
  if (wave === null || wave === undefined) {
    errors.push({ field: "minReleaseWave", code: "RELEASE_WAVE_REQUIRED" });
  } else if (!RELEASE_WAVES.includes(wave)) {
    errors.push({ field: "minReleaseWave", code: "RELEASE_WAVE_INVALID" });
  }

  // TD-008: only CREATOR_DECLARED and MARKETPLACE_REVIEWED may ever be
  // assigned through this function. TESTED and NOT_VERIFIED are reserved/
  // legacy and are rejected with their own code, distinct from ordinary
  // garbage input, so a caller can tell "you tried a real but forbidden
  // status" from "that isn't a status at all".
  const rawStatus = input.evidenceStatus?.trim();
  if (!rawStatus) {
    errors.push({ field: "evidenceStatus", code: "EVIDENCE_STATUS_REQUIRED" });
  } else if (rawStatus === "TESTED" || rawStatus === "NOT_VERIFIED") {
    errors.push({ field: "evidenceStatus", code: "EVIDENCE_STATUS_RESERVED_OR_LEGACY" });
  } else if (!ASSIGNABLE_EVIDENCE_STATUSES.includes(rawStatus as CompatibilityEvidenceStatus)) {
    errors.push({ field: "evidenceStatus", code: "EVIDENCE_STATUS_INVALID" });
  }

  const notes = normalizeDisplayText(input.notes);
  if (notes !== null && notes.length > MAX_COMPATIBILITY_TEXT_LENGTH) {
    errors.push({ field: "notes", code: "NOTES_TOO_LONG" });
  }

  const evidenceSummary = normalizeDisplayText(input.evidenceSummary);
  if (evidenceSummary !== null && evidenceSummary.length > MAX_COMPATIBILITY_TEXT_LENGTH) {
    errors.push({ field: "evidenceSummary", code: "EVIDENCE_SUMMARY_TOO_LONG" });
  }

  const rawVerified = input.lastVerifiedAt?.trim() || null;
  if (rawVerified !== null) {
    const verifiedTime = parseIsoDate(rawVerified);
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (verifiedTime === null) {
      errors.push({ field: "lastVerifiedAt", code: "LAST_VERIFIED_INVALID" });
    } else if (verifiedTime > today) {
      errors.push({ field: "lastVerifiedAt", code: "LAST_VERIFIED_IN_FUTURE" });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      platformArea: rawArea as PlatformArea,
      minReleaseYear: year as number,
      minReleaseWave: wave as number,
      notes,
      evidenceStatus: rawStatus as CompatibilityEvidenceStatus,
      evidenceSummary,
      lastVerifiedAt: rawVerified,
    },
  };
}
