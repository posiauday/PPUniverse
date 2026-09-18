import { describe, expect, it } from "vitest";
import { formatBuildLabel } from "./build-info";

describe("formatBuildLabel", () => {
  it("joins name and version with an @", () => {
    expect(formatBuildLabel("power-platform-universe", "0.0.0")).toBe(
      "power-platform-universe@0.0.0",
    );
  });
});
