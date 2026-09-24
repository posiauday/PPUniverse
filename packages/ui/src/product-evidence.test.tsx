import { presentProductEvidence, type CompatibilityEntry } from "@ppu/domain-catalog";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductEvidence } from "./product-evidence.js";

const none = { licenses: [], currentVersion: null, support: null, compatibility: [] };

const entry = (overrides: Partial<CompatibilityEntry> = {}): CompatibilityEntry => ({
  id: "c1",
  platformArea: "POWER_APPS",
  minReleaseYear: 2025,
  minReleaseWave: 2,
  notes: null,
  evidenceStatus: "CREATOR_DECLARED",
  evidenceSummary: null,
  lastVerifiedAt: null,
  reviewedAt: null,
  ...overrides,
});

const populated = presentProductEvidence({
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
  currentVersion: "1.1.0",
  support: { status: "CREATOR_SUPPORTED", channel: "https://example.test/support" },
  compatibility: [
    entry({
      id: "c1",
      platformArea: "POWER_APPS",
      notes: "Requires Dataverse and premium connectors.",
      evidenceStatus: "MARKETPLACE_REVIEWED",
      evidenceSummary: "Repeatable regression pass.",
      lastVerifiedAt: "2026-03-12",
      reviewedAt: "2026-03-13T00:00:00.000Z",
    }),
    entry({ id: "c2", platformArea: "POWER_AUTOMATE", evidenceStatus: "CREATOR_DECLARED" }),
    entry({
      id: "c3",
      platformArea: "MICROSOFT_FABRIC",
      minReleaseYear: 2026,
      minReleaseWave: 1,
      evidenceStatus: "CREATOR_DECLARED",
    }),
  ],
});

describe("ProductEvidence — no evidence provided yet", () => {
  it("shows the approved empty wording in every section and no table", () => {
    render(<ProductEvidence evidence={presentProductEvidence(none)} />);

    expect(screen.getByText("Compatibility information has not yet been provided.")).toBeDefined();
    expect(screen.getByText("License information has not yet been provided.")).toBeDefined();
    expect(screen.getByText("Version information has not yet been provided.")).toBeDefined();
    expect(screen.getByText("Support information has not yet been provided.")).toBeDefined();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("does not show the release-wave explanation or the status legend when there is nothing to explain", () => {
    render(<ProductEvidence evidence={presentProductEvidence(none)} />);
    expect(screen.queryByText(/earliest release wave/i)).toBeNull();
    expect(screen.queryByText("What the evidence statuses mean")).toBeNull();
  });
});

describe("ProductEvidence — structure", () => {
  it("has one h2 per section, in reading order", () => {
    render(<ProductEvidence evidence={populated} />);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["License", "Version", "Support", "Compatibility"]);
  });

  it("presents license tiers, the current version and the support status", () => {
    render(<ProductEvidence evidence={populated} />);
    expect(screen.getByText("Personal")).toBeDefined();
    expect(screen.getByText("Single user, individual use.")).toBeDefined();
    expect(screen.getByText("Team")).toBeDefined();
    expect(screen.getByText("1.1.0")).toBeDefined();
    expect(screen.getByText("Creator-supported")).toBeDefined();
  });
});

describe("ProductEvidence — compatibility matrix", () => {
  it("is a real table with a caption and the five approved column headers", () => {
    render(<ProductEvidence evidence={populated} />);
    const table = screen.getByRole("table", { name: /compatibility by platform area/i });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual([
      "Platform Area",
      "Minimum Release Wave",
      "Evidence Status",
      "Last Verified",
      "Notes",
    ]);
  });

  it("uses each platform area as the row header and shows one row per entry", () => {
    render(<ProductEvidence evidence={populated} />);
    const table = screen.getByRole("table");
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((header) => header.textContent),
    ).toEqual(["Power Apps", "Power Automate", "Microsoft Fabric"]);
  });

  it("shows the structured minimum release wave as '<year> release wave <n>'", () => {
    render(<ProductEvidence evidence={populated} />);
    // Power Apps and Power Automate both use 2025 release wave 2 in the fixture.
    expect(screen.getAllByText("2025 release wave 2", { selector: "td" })).toHaveLength(2);
    expect(screen.getAllByText("2026 release wave 1", { selector: "td" })).toHaveLength(1);
  });

  it("writes every evidence status out as text — never colour alone", () => {
    render(<ProductEvidence evidence={populated} />);
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);

    expect(within(rows[0]!).getByText("Marketplace Reviewed")).toBeDefined();
    expect(within(rows[1]!).getByText("Creator Declared")).toBeDefined();
    expect(within(rows[2]!).getByText("Creator Declared")).toBeDefined();
  });

  it("shows the evidence summary and a machine-readable verified date for a Marketplace Reviewed row", () => {
    render(<ProductEvidence evidence={populated} />);
    expect(screen.getByText("Repeatable regression pass.")).toBeDefined();
    const time = screen.getByText("12 March 2026");
    expect(time.tagName).toBe("TIME");
    expect(time.getAttribute("datetime")).toBe("2026-03-12");
  });

  it("reads 'Not independently verified' when there is no verified date", () => {
    render(<ProductEvidence evidence={populated} />);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(within(rows[1]!).getByText("Not independently verified")).toBeDefined();
    expect(within(rows[2]!).getByText("Not independently verified")).toBeDefined();
    expect(within(rows[1]!).queryByRole("time")).toBeNull();
  });

  it("shows notes, and a plain 'No notes' where there are none", () => {
    render(<ProductEvidence evidence={populated} />);
    expect(screen.getByText("Requires Dataverse and premium connectors.")).toBeDefined();
    expect(screen.getAllByText("No notes")).toHaveLength(2);
  });

  it("explains that the minimum release wave is a claim, not proof of later compatibility", () => {
    render(<ProductEvidence evidence={populated} />);
    expect(
      screen.getByText(/earliest release wave for which the product claims compatibility/i),
    ).toBeDefined();
    expect(screen.getByText(/not proof/i)).toBeDefined();
  });
});

describe("ProductEvidence — accessibility of the scroll region and legend", () => {
  it("wraps the table in a labelled, keyboard-focusable scroll region", () => {
    render(<ProductEvidence evidence={populated} />);
    const region = screen.getByRole("region", { name: /compatibility matrix/i });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.className).toContain("overflow-x-auto");
    expect(within(region).getByRole("table")).toBeDefined();
  });

  it("shows only the two assignable status definitions as visible text, in a definition list (TD-008)", () => {
    const { container } = render(<ProductEvidence evidence={populated} />);
    const terms = Array.from(container.querySelectorAll("dl dt")).map((term) => term.textContent);
    expect(terms).toEqual(["Creator Declared", "Marketplace Reviewed"]);
    expect(container.querySelectorAll("dl dd")).toHaveLength(2);
    expect(
      screen.getByText(
        "A moderator reviewed the submitted compatibility statement for completeness, plausibility, prohibited claims and publication readiness. This does not mean independently tested, certified, guaranteed, Microsoft approved, Microsoft certified, officially supported or verified compatible.",
      ),
    ).toBeDefined();
  });

  it("never shows 'Tested' or 'Not Verified' anywhere, even as legend text (TD-008)", () => {
    const { container } = render(<ProductEvidence evidence={populated} />);
    expect(container.textContent).not.toContain("Tested");
    expect(container.textContent).not.toContain("Not Verified");
  });

  it("puts nothing in hover-only title tooltips", () => {
    const { container } = render(<ProductEvidence evidence={populated} />);
    expect(container.querySelectorAll("[title]")).toHaveLength(0);
  });
});

describe("ProductEvidence — safety", () => {
  it("renders a safe support channel as a link, and a hostile one as plain text", () => {
    const { unmount } = render(<ProductEvidence evidence={populated} />);
    const link = screen.getByRole("link", { name: "https://example.test/support" });
    expect(link.getAttribute("href")).toBe("https://example.test/support");
    expect(link.getAttribute("rel")).toContain("noopener");
    unmount();

    render(
      <ProductEvidence
        evidence={presentProductEvidence({
          ...none,
          support: { status: "COMMUNITY_SUPPORTED", channel: "javascript:alert(1)" },
        })}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("javascript:alert(1)")).toBeDefined();
  });

  it("escapes creator-supplied markup instead of rendering it", () => {
    const { container } = render(
      <ProductEvidence
        evidence={presentProductEvidence({
          ...none,
          compatibility: [
            entry({ notes: "<script>alert(1)</script><img src=x onerror=alert(1)>" }),
          ],
        })}
      />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeDefined();
  });

  it("never renders a certification-style label outside the legend's own approved disclaimer text", () => {
    // Scoped to exclude the <dl> legend: the approved Marketplace Reviewed
    // definition itself legitimately says "does not mean ... certified ...
    // approved ... officially supported" (docs/final-decisions.md,
    // 2026-09-21) -- a disclaimer, not a claim. This test's job is to catch
    // an affirmative claim in the per-product content (table, licenses,
    // support), which is a different thing from the legend's own negation.
    const { container } = render(<ProductEvidence evidence={populated} />);
    const clone = container.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("dl").forEach((legend) => legend.remove());
    expect(clone.textContent).not.toMatch(
      /certified|approved|officially supported|marketplace verified/i,
    );
  });
});
