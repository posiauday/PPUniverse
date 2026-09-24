import { describe, expect, it } from "vitest";
import {
  ASSIGNABLE_EVIDENCE_STATUSES,
  EVIDENCE_STATUSES,
  EVIDENCE_STATUS_DEFINITIONS,
  EVIDENCE_STATUS_LABELS,
  PLATFORM_AREAS,
  PLATFORM_AREA_LABELS,
  formatReleaseWave,
  formatVerifiedDate,
  maxReleaseYear,
  validateCompatibilityEntry,
} from "./compatibility.js";

const NOW = new Date("2026-09-21T12:00:00Z");

const valid = {
  platformArea: "POWER_APPS",
  minReleaseYear: 2025,
  minReleaseWave: 2,
  evidenceStatus: "CREATOR_DECLARED",
};

function codes(result: ReturnType<typeof validateCompatibilityEntry>): string[] {
  return result.ok ? [] : result.errors.map((error) => error.code);
}

describe("approved vocabulary", () => {
  it("offers exactly the seven approved platform areas, with the approved names", () => {
    expect(PLATFORM_AREAS.map((area) => PLATFORM_AREA_LABELS[area])).toEqual([
      "Power Apps",
      "Power Automate",
      "Power BI",
      "Dataverse",
      "Power Pages",
      "Copilot Studio",
      "Microsoft Fabric",
    ]);
  });

  it("does not treat Architecture or Governance (marketplace categories) as platform areas", () => {
    const joined = PLATFORM_AREAS.join(" ").toLowerCase();
    expect(joined).not.toContain("architecture");
    expect(joined).not.toContain("governance");
  });

  it("offers exactly two assignable evidence statuses, in display order (TD-008)", () => {
    expect(ASSIGNABLE_EVIDENCE_STATUSES).toEqual(["CREATOR_DECLARED", "MARKETPLACE_REVIEWED"]);
    expect(EVIDENCE_STATUS_DEFINITIONS.CREATOR_DECLARED).toBe(
      "The compatibility information was supplied by the creator and has not been independently certified by the marketplace.",
    );
    expect(EVIDENCE_STATUS_DEFINITIONS.MARKETPLACE_REVIEWED).toBe(
      "A moderator reviewed the submitted compatibility statement for completeness, plausibility, prohibited claims and publication readiness. This does not mean independently tested, certified, guaranteed, Microsoft approved, Microsoft certified, officially supported or verified compatible.",
    );
  });

  it("keeps TESTED and NOT_VERIFIED as known enum values, but never as assignable ones (TD-008)", () => {
    expect(EVIDENCE_STATUSES).toContain("TESTED");
    expect(EVIDENCE_STATUSES).toContain("NOT_VERIFIED");
    expect(ASSIGNABLE_EVIDENCE_STATUSES).not.toContain("TESTED");
    expect(ASSIGNABLE_EVIDENCE_STATUSES).not.toContain("NOT_VERIFIED");
    expect(EVIDENCE_STATUS_LABELS.TESTED).toBe("Tested");
    expect(EVIDENCE_STATUS_LABELS.NOT_VERIFIED).toBe("Not Verified");
  });
});

describe("formatting", () => {
  it("renders the structured release wave as '<year> release wave <n>'", () => {
    expect(formatReleaseWave(2025, 2)).toBe("2025 release wave 2");
    expect(formatReleaseWave(2026, 1)).toBe("2026 release wave 1");
  });

  it("formats a verified date without depending on locale or timezone", () => {
    expect(formatVerifiedDate("2026-03-12")).toBe("12 March 2026");
    expect(formatVerifiedDate("2025-12-01")).toBe("1 December 2025");
  });

  it("returns null for something that is not a real calendar date", () => {
    expect(formatVerifiedDate("2026-02-30")).toBeNull();
    expect(formatVerifiedDate("12/03/2026")).toBeNull();
    expect(formatVerifiedDate("")).toBeNull();
  });

  it("allows release years up to two years beyond the current year", () => {
    expect(maxReleaseYear(NOW)).toBe(2028);
  });
});

describe("validateCompatibilityEntry", () => {
  it("accepts a minimal Creator Declared entry", () => {
    const result = validateCompatibilityEntry(valid, NOW);
    expect(result).toEqual({
      ok: true,
      value: {
        platformArea: "POWER_APPS",
        minReleaseYear: 2025,
        minReleaseWave: 2,
        notes: null,
        evidenceStatus: "CREATOR_DECLARED",
        evidenceSummary: null,
        lastVerifiedAt: null,
      },
    });
  });

  it("rejects a release wave with no platform area", () => {
    const result = validateCompatibilityEntry(
      { minReleaseYear: 2025, minReleaseWave: 2, evidenceStatus: "CREATOR_DECLARED" },
      NOW,
    );
    expect(codes(result)).toContain("PLATFORM_AREA_REQUIRED");
  });

  it("rejects Architecture and Governance as platform areas", () => {
    expect(
      codes(validateCompatibilityEntry({ ...valid, platformArea: "ARCHITECTURE" }, NOW)),
    ).toEqual(["PLATFORM_AREA_INVALID"]);
    expect(
      codes(validateCompatibilityEntry({ ...valid, platformArea: "GOVERNANCE" }, NOW)),
    ).toEqual(["PLATFORM_AREA_INVALID"]);
  });

  it("requires both the release year and the release wave", () => {
    const result = validateCompatibilityEntry(
      { platformArea: "POWER_BI", evidenceStatus: "CREATOR_DECLARED" },
      NOW,
    );
    expect(codes(result)).toEqual(["RELEASE_YEAR_REQUIRED", "RELEASE_WAVE_REQUIRED"]);
  });

  it("validates the release year against the supported range", () => {
    expect(codes(validateCompatibilityEntry({ ...valid, minReleaseYear: 2018 }, NOW))).toEqual([
      "RELEASE_YEAR_OUT_OF_RANGE",
    ]);
    expect(validateCompatibilityEntry({ ...valid, minReleaseYear: 2019 }, NOW).ok).toBe(true);
    expect(validateCompatibilityEntry({ ...valid, minReleaseYear: 2028 }, NOW).ok).toBe(true);
    expect(codes(validateCompatibilityEntry({ ...valid, minReleaseYear: 2029 }, NOW))).toEqual([
      "RELEASE_YEAR_OUT_OF_RANGE",
    ]);
    expect(codes(validateCompatibilityEntry({ ...valid, minReleaseYear: 2025.5 }, NOW))).toEqual([
      "RELEASE_YEAR_OUT_OF_RANGE",
    ]);
  });

  it("only allows release wave 1 or 2", () => {
    expect(validateCompatibilityEntry({ ...valid, minReleaseWave: 1 }, NOW).ok).toBe(true);
    for (const wave of [0, 3, 1.5, -1]) {
      expect(codes(validateCompatibilityEntry({ ...valid, minReleaseWave: wave }, NOW))).toEqual([
        "RELEASE_WAVE_INVALID",
      ]);
    }
  });

  it("requires a valid evidence status", () => {
    expect(codes(validateCompatibilityEntry({ ...valid, evidenceStatus: undefined }, NOW))).toEqual(
      ["EVIDENCE_STATUS_REQUIRED"],
    );
    expect(
      codes(validateCompatibilityEntry({ ...valid, evidenceStatus: "CERTIFIED" }, NOW)),
    ).toEqual(["EVIDENCE_STATUS_INVALID"]);
  });

  it("rejects TESTED as reserved, with its own error code, distinct from ordinary invalid input (TD-008)", () => {
    expect(codes(validateCompatibilityEntry({ ...valid, evidenceStatus: "TESTED" }, NOW))).toEqual([
      "EVIDENCE_STATUS_RESERVED_OR_LEGACY",
    ]);
  });

  it("rejects NOT_VERIFIED as legacy, with the same error code as TESTED (TD-008)", () => {
    expect(
      codes(validateCompatibilityEntry({ ...valid, evidenceStatus: "NOT_VERIFIED" }, NOW)),
    ).toEqual(["EVIDENCE_STATUS_RESERVED_OR_LEGACY"]);
  });

  it("rejects TESTED even when a full evidence summary and verified date are supplied — reserved is reserved regardless (TD-008)", () => {
    const result = validateCompatibilityEntry(
      {
        ...valid,
        evidenceStatus: "TESTED",
        evidenceSummary: "Repeatable regression pass.",
        lastVerifiedAt: "2026-03-12",
      },
      NOW,
    );
    expect(codes(result)).toEqual(["EVIDENCE_STATUS_RESERVED_OR_LEGACY"]);
  });

  it("accepts a fully evidenced Marketplace Reviewed entry", () => {
    const result = validateCompatibilityEntry(
      {
        ...valid,
        evidenceStatus: "MARKETPLACE_REVIEWED",
        evidenceSummary: "Repeatable regression pass.",
        lastVerifiedAt: "2026-03-12",
      },
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects an invalid or future last-verified date, but accepts today", () => {
    expect(
      codes(validateCompatibilityEntry({ ...valid, lastVerifiedAt: "2026-02-30" }, NOW)),
    ).toEqual(["LAST_VERIFIED_INVALID"]);
    expect(
      codes(validateCompatibilityEntry({ ...valid, lastVerifiedAt: "2026-09-22" }, NOW)),
    ).toEqual(["LAST_VERIFIED_IN_FUTURE"]);
    expect(validateCompatibilityEntry({ ...valid, lastVerifiedAt: "2026-09-21" }, NOW).ok).toBe(
      true,
    );
  });

  it("caps notes and evidence summary at 500 characters", () => {
    expect(validateCompatibilityEntry({ ...valid, notes: "x".repeat(500) }, NOW).ok).toBe(true);
    expect(codes(validateCompatibilityEntry({ ...valid, notes: "x".repeat(501) }, NOW))).toEqual([
      "NOTES_TOO_LONG",
    ]);
    expect(
      codes(validateCompatibilityEntry({ ...valid, evidenceSummary: "x".repeat(501) }, NOW)),
    ).toEqual(["EVIDENCE_SUMMARY_TOO_LONG"]);
  });

  it("treats whitespace-only notes as absent and sanitizes the rest", () => {
    const blank = validateCompatibilityEntry({ ...valid, notes: "   " }, NOW);
    expect(blank.ok && blank.value.notes).toBeNull();

    const zeroWidthSpace = String.fromCharCode(0x200b);
    const dirty = validateCompatibilityEntry(
      { ...valid, notes: `Requires${zeroWidthSpace} Dataverse.\n` },
      NOW,
    );
    expect(dirty.ok && dirty.value.notes).toBe("Requires Dataverse.");
  });

  it("reports every problem at once instead of stopping at the first", () => {
    const result = validateCompatibilityEntry({}, NOW);
    expect(codes(result)).toEqual([
      "PLATFORM_AREA_REQUIRED",
      "RELEASE_YEAR_REQUIRED",
      "RELEASE_WAVE_REQUIRED",
      "EVIDENCE_STATUS_REQUIRED",
    ]);
  });
});
