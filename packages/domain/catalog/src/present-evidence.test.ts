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

  it("carries the evidence summary and a formatted verified date for a Tested entry", () => {
    const view = presentProductEvidence({
      ...empty,
      compatibility: [
        entry({
          evidenceStatus: "TESTED",
          evidenceSummary: "Repeatable regression pass.",
          lastVerifiedAt: "2026-03-12",
        }),
      ],
    });
    const row = view.compatibility[0];
    expect(row?.evidenceStatusLabel).toBe("Tested");
    expect(row?.evidenceSummary).toBe("Repeatable regression pass.");
    expect(row?.lastVerified).toEqual({ iso: "2026-03-12", label: "12 March 2026" });
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
  it("lists the three approved statuses in order with their definitions", () => {
    expect(EVIDENCE_LEGEND.map((item) => item.label)).toEqual([
      "Tested",
      "Creator Declared",
      "Not Verified",
    ]);
    expect(EVIDENCE_LEGEND.every((item) => item.definition.length > 0)).toBe(true);
  });

  it("states that the minimum release wave is a claim, not a guarantee", () => {
    expect(EVIDENCE_MESSAGES.minimumReleaseWaveNote).toContain("claims compatibility");
    expect(EVIDENCE_MESSAGES.minimumReleaseWaveNote).toContain("not proof");
  });

  it("never produces a certification-style label (Certified / Approved / Officially Supported / Marketplace Verified)", () => {
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
          evidenceStatus: "TESTED",
          evidenceSummary: "Repeatable pass.",
          lastVerifiedAt: "2026-01-05",
        }),
        entry({ id: "c2", platformArea: "POWER_BI", evidenceStatus: "NOT_VERIFIED" }),
        entry({ id: "c3", platformArea: "COPILOT_STUDIO", evidenceStatus: "CREATOR_DECLARED" }),
      ],
    });
    expect(JSON.stringify(view)).not.toMatch(FORBIDDEN);
  });
});
