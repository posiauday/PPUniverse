import { describe, expect, it } from "vitest";
import { computeTitleFallback } from "./SessionsHeading";

/**
 * BUG-013 (WCAG 2.4.2): unit coverage for the mitigation's decision logic.
 *
 * This does NOT reproduce the underlying browser race (router.refresh() removing the
 * <title> element from <head> for a brief window in Firefox, observed in CI). That was
 * attempted and could not be made to fail deterministically:
 * - dozens of manual local revoke cycles across all three engines: never reproduced;
 * - delaying the RSC refetch response by 0, 300, 800 and 1500ms (three attempts each,
 *   Firefox): never reproduced — the gap is not simply "wider under a slower fetch";
 * - nine concurrent revoke cycles across all three engines, to mimic CI's parallel-worker
 *   load: never reproduced in the attempts that completed before the local server
 *   dropped under the load.
 * The real evidence stands in: the captured title/announcer trace and the failure-time
 * HTML snapshot in planning/bugs/BUG-013.md, both from actual CI failures.
 *
 * What IS deterministic, and is tested here: the code path this fix adds. The pre-fix
 * component had no title-repair logic at all, so ANY <title> disruption during the race
 * was completely unhandled — in particular, the CI failure's HTML snapshot showed the
 * element absent, not merely emptied, which a naive "assign to whatever's there" repair
 * would have missed entirely (there is nothing to assign to).
 */
describe("computeTitleFallback (BUG-013 mitigation logic)", () => {
  const EXPECTED = "Active sessions | LowCodeStacks";

  it("creates a title when none exists — the absent case the CI failure actually showed", () => {
    expect(computeTitleFallback(null, EXPECTED)).toEqual({ action: "create", text: EXPECTED });
  });

  it("updates an existing title when its text is empty", () => {
    expect(computeTitleFallback({ text: "" }, EXPECTED)).toEqual({
      action: "update",
      text: EXPECTED,
    });
  });

  it("updates an existing title when its text belongs to a different page", () => {
    expect(computeTitleFallback({ text: "Search | LowCodeStacks" }, EXPECTED)).toEqual({
      action: "update",
      text: EXPECTED,
    });
  });

  it("does nothing when the title is already correct, so a healthy page is left untouched", () => {
    expect(computeTitleFallback({ text: EXPECTED }, EXPECTED)).toEqual({
      action: "none",
      text: EXPECTED,
    });
  });
});
