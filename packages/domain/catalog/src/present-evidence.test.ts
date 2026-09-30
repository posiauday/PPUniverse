import { describe, expect, it } from "vitest";
import { EVIDENCE_LEGEND, EVIDENCE_MESSAGES, presentProductEvidence } from "./present-evidence.js";
import type { CompatibilityEntry } from "./types.js";

const FORBIDDEN = /certified|approved|officially supported|marketplace verified/i;

const entry = (overrides: Partial<CompatibilityEntry> = {}): CompatibilityEntry => ({
  id: "c1",
  platformArea: "POWER_APPS",
  minReleaseYear: 2025,
  minReleaseWave: 2,
  notes: "Requires Dataverse and premium connectors.",
  evidenceStatus: "CREATOR_DECLARED",
  evidenceSummary: null,
  lastVerifiedAt: null,
  reviewedAt: null,
  ...overrides,
});

const empty = { licenses: [], currentVersion: null, support: null, compatibility: [] };

describe("presentProductEvidence", () => {
  it("shows the approved wording for a product with no evidence yet (legacy MVP-003 products)", () => {
    const view = presentProductEvidence(empty);
    expect(view.licenses).toEqual([]);
    expect(view.version).toBeNull();
    expect(view.support).toBeNull();
    expect(view.compatibility).toEqual([]);
    expect(view.messages.compatibilityEmpty).toBe(
      "Compatibility information has not yet been provided.",
    );
    expect(view.messages.licenseEmpty).toBe("License information has not yet been provided.");
    expect(view.messages.versionEmpty).toBe("Version information has not yet been provided.");
    expect(view.messages.supportEmpty).toBe("Support information has not yet been provided.");
  });

  it("maps a compatibility entry to display strings", () => {
    const view = presentProductEvidence({ ...empty, compatibility: [entry()] });
    expect(view.compatibility).toEqual([
      {
        id: "c1",
        platformAreaLabel: "Power Apps",
        minimumReleaseWaveLabel: "2025 release wave 2",
        evidenceStatus: "CREATOR_DECLARED",
        evidenceStatusLabel: "Creator Declared",
        evidenceSummary: null,
        lastVerified: null,
        notes: "Requires Dataverse and premium connectors.",
      },
    ]);
    expect(view.messages.lastVerifiedUnavailable).toBe("Not independently verified");
  });

  it("carries the evidence summary and a formatted verified date for a Marketplace Reviewed entry", () => {
    const view = presentProductEvidence({
      ...empty,
      compatibility: [
        entry({
          evidenceStatus: "MARKETPLACE_REVIEWED",
          evidenceSummary: "Repeatable regression pass.",
          lastVerifiedAt: "2026-03-12",
          reviewedAt: "2026-03-13T00:00:00.000Z",
        }),
      ],
    });
    const row = view.compatibility[0];
    expect(row?.evidenceStatusLabel).toBe("Marketplace Reviewed");
    expect(row?.evidenceSummary).toBe("Repeatable regression pass.");
    expect(row?.lastVerified).toEqual({ iso: "2026-03-12", label: "12 March 2026" });
  });

  it("filters out TESTED and NOT_VERIFIED rows entirely — fail closed (TD-008)", () => {
    const view = presentProductEvidence({
      ...empty,
      compatibility: [
        entry({ id: "reserved", evidenceStatus: "TESTED" }),
        entry({ id: "legacy", evidenceStatus: "NOT_VERIFIED" }),
        entry({ id: "visible", evidenceStatus: "CREATOR_DECLARED" }),
      ],
    });
    expect(view.compatibility.map((row) => row.id)).toEqual(["visible"]);
  });

  it("sanitizes creator-supplied text before it reaches the page", () => {
    const zeroWidthSpace = String.fromCharCode(0x200b);
    const rightToLeftOverride = String.fromCharCode(0x202e);
    const view = presentProductEvidence({
      ...empty,
      compatibility: [
        entry({
          notes: `Needs${zeroWidthSpace} a${rightToLeftOverride} gateway.\n`,
          evidenceSummary: "  ok  ",
        }),
      ],
    });
    expect(view.compatibility[0]?.notes).toBe("Needs a gateway.");
    expect(view.compatibility[0]?.evidenceSummary).toBe("ok");
  });

  it("preserves the order the repository returned", () => {
    const view = presentProductEvidence({
      ...empty,
      compatibility: [
        entry({ id: "a", platformArea: "POWER_APPS" }),
        entry({ id: "b", platformArea: "MICROSOFT_FABRIC" }),
      ],
    });
    expect(view.compatibility.map((row) => row.platformAreaLabel)).toEqual([
      "Power Apps",
      "Microsoft Fabric",
    ]);
  });

  it("presents license tiers, version and support", () => {
    const view = presentProductEvidence({
      licenses: [
        {
          id: "l1",
          slug: "personal",
          name: "Personal",
          description: "Single user, individual use.",
          sortOrder: 1,
        },
        {
          id: "l2",
          slug: "team",
          name: "Team",
          description: "Small team usage, shared organizational use.",
          sortOrder: 2,
        },
      ],
      currentVersion: " 1.2.0 ",
      support: { status: "CREATOR_SUPPORTED", channel: "https://example.test/support" },
      compatibility: [],
    });
    expect(view.licenses.map((license) => license.name)).toEqual(["Personal", "Team"]);
    expect(view.version).toBe("1.2.0");
    expect(view.support).toEqual({
      statusLabel: "Creator-supported",
      channelText: "https://example.test/support",
      channelHref: "https://example.test/support",
    });
  });

  it("shows a hostile support channel as plain text, never as a link", () => {
    const view = presentProductEvidence({
      ...empty,
      support: { status: "COMMUNITY_SUPPORTED", channel: "javascript:alert(1)" },
    });
    expect(view.support?.channelText).toBe("javascript:alert(1)");
    expect(view.support?.channelHref).toBeNull();
  });

  it("offers a support declaration with no channel (unsupported) without inventing one", () => {
    const view = presentProductEvidence({
      ...empty,
      support: { status: "UNSUPPORTED", channel: null },
    });
    expect(view.support).toEqual({
      statusLabel: "Unsupported",
      channelText: null,
      channelHref: null,
    });
  });
});

describe("evidence legend and wording", () => {
  it("lists only the two assignable statuses in order with their definitions (TD-008)", () => {
    expect(EVIDENCE_LEGEND.map((item) => item.label)).toEqual([
      "Creator Declared",
      "Marketplace Reviewed",
    ]);
    expect(EVIDENCE_LEGEND.every((item) => item.definition.length > 0)).toBe(true);
    expect(EVIDENCE_LEGEND.some((item) => item.label === "Tested")).toBe(false);
    expect(EVIDENCE_LEGEND.some((item) => item.label === "Not Verified")).toBe(false);
  });

  it("states that the minimum release wave is a claim, not a guarantee", () => {
    expect(EVIDENCE_MESSAGES.minimumReleaseWaveNote).toContain("claims compatibility");
    expect(EVIDENCE_MESSAGES.minimumReleaseWaveNote).toContain("not proof");
  });

  it("never produces a certification-style label in per-product content (Certified / Approved / Officially Supported / Marketplace Verified)", () => {
    // Scoped to the per-product parts of the view, not the static legend:
    // the approved Marketplace Reviewed definition itself legitimately says
    // "does not mean ... certified ... approved ... officially supported"
    // (docs/final-decisions.md, 2026-09-21) -- a disclaimer, not a claim.
    // This test's job is to catch an affirmative claim about a specific
    // product, which is a different thing from the legend's own negation.
    const view = presentProductEvidence({
      licenses: [
        {
          id: "l1",
          slug: "enterprise",
          name: "Enterprise",
          description: "Organization-wide use, custom commercial agreements possible.",
          sortOrder: 3,
        },
      ],
      currentVersion: "2.0.0",
      support: { status: "PLATFORM_SUPPORTED", channel: "https://example.test/help" },
      compatibility: [
        entry({
          evidenceStatus: "MARKETPLACE_REVIEWED",
          evidenceSummary: "Repeatable pass.",
          lastVerifiedAt: "2026-01-05",
          reviewedAt: "2026-01-06T00:00:00.000Z",
        }),
        entry({ id: "c2", platformArea: "POWER_BI", evidenceStatus: "CREATOR_DECLARED" }),
        entry({ id: "c3", platformArea: "COPILOT_STUDIO", evidenceStatus: "CREATOR_DECLARED" }),
      ],
    });
    const perProductContent = JSON.stringify({
      licenses: view.licenses,
      version: view.version,
      support: view.support,
      compatibility: view.compatibility,
    });
    expect(perProductContent).not.toMatch(FORBIDDEN);
  });

  it("the legend's own approved disclaimer wording is allowed to name what Marketplace Reviewed does not mean", () => {
    const reviewed = EVIDENCE_LEGEND.find((item) => item.label === "Marketplace Reviewed");
    expect(reviewed?.definition).toContain("does not mean");
  });
});
