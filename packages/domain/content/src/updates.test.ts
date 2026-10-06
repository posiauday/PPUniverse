import { describe, expect, it } from "vitest";
import { parseIsoDate, parseUpdateSource } from "./update-source.js";
import { isValidUpdateSourceUrl, trackerLabel } from "./updates.js";

const VALID = `---
title: "Power Automate mobile app retired"
slug: power-automate-mobile-app-retired
kind: RETIREMENT
technology: POWER_AUTOMATE
action: "Move approvers to Teams"
source: https://learn.microsoft.com/power-platform/important-changes-coming
effective: 2026-08-31
replacement: "Approvals app in Microsoft Teams"
---
The iOS and Android app is deprecated.
Existing cloud flows keep running.
`;

describe("isValidUpdateSourceUrl (MVP-033)", () => {
  it.each([
    ["https://learn.microsoft.com/power-platform/important-changes-coming", true],
    ["https://microsoft.com/x", true],
    ["https://www.microsoft.com/en-us/power-platform/blog/", true],
    ["http://learn.microsoft.com/x", false],
    ["https://microsoft.com.example.org/x", false],
    ["https://evilmicrosoft.com/x", false],
    ["https://user:pass@learn.microsoft.com/x", false],
    ["javascript:alert(1)", false],
    ["not a url", false],
  ])("%s -> %s", (url, ok) => {
    expect(isValidUpdateSourceUrl(url)).toBe(ok);
  });
});

describe("trackerLabel", () => {
  const now = new Date("2026-10-03T00:00:00Z");
  it("says Removed (month and year only) once a retirement date passes, Retires before it, Deprecated for a deprecation", () => {
    const date = new Date("2026-08-31T00:00:00Z");
    expect(trackerLabel({ kind: "RETIREMENT", effectiveDate: date }, now)).toBe("Removed Aug 2026");
    expect(
      trackerLabel({ kind: "RETIREMENT", effectiveDate: new Date("2026-12-01T00:00:00Z") }, now),
    ).toBe("Retires Dec 2026");
    expect(trackerLabel({ kind: "DEPRECATION", effectiveDate: date }, now)).toBe(
      "Deprecated Aug 2026",
    );
    expect(trackerLabel({ kind: "DEPRECATION", effectiveDate: null }, now)).toBeNull();
  });
});

describe("parseUpdateSource", () => {
  it("parses front matter and joins the body into one summary line", () => {
    expect(parseUpdateSource(VALID)).toEqual({
      ok: true,
      update: {
        title: "Power Automate mobile app retired",
        slug: "power-automate-mobile-app-retired",
        kind: "RETIREMENT",
        technology: "POWER_AUTOMATE",
        action: "Move approvers to Teams",
        sourceUrl: "https://learn.microsoft.com/power-platform/important-changes-coming",
        effectiveDate: new Date("2026-08-31T00:00:00Z"),
        replacement: "Approvals app in Microsoft Teams",
        summary: "The iOS and Android app is deprecated. Existing cloud flows keep running.",
      },
    });
  });

  it("rejects a non-Microsoft source, a bad date and an unknown kind, naming each", () => {
    const result = parseUpdateSource(
      VALID.replace("https://learn.microsoft.com", "https://example.org")
        .replace("2026-08-31", "2026-02-30")
        .replace("kind: RETIREMENT", "kind: RUMOUR"),
    );
    expect(!result.ok && result.errors).toEqual([
      "kind must be FEATURE, LICENSING, DEPRECATION or RETIREMENT",
      "source must be an https link on microsoft.com or a subdomain",
      "effective must be a date as YYYY-MM-DD",
    ]);
  });

  it("reads only real calendar dates", () => {
    expect(parseIsoDate("2026-02-28")?.toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(parseIsoDate("28/02/2026")).toBeNull();
  });
});
