import { describe, expect, it } from "vitest";
import { SUPPORT_STATUS_LABELS, safeSupportChannelHref } from "./support.js";

describe("SUPPORT_STATUS_LABELS", () => {
  it("covers exactly the four documented statuses", () => {
    expect(Object.values(SUPPORT_STATUS_LABELS)).toEqual([
      "Creator-supported",
      "Platform-supported",
      "Community-supported",
      "Unsupported",
    ]);
  });
});

describe("safeSupportChannelHref", () => {
  it("turns a plain http(s) URL into a link", () => {
    expect(safeSupportChannelHref("https://example.test/support")).toBe(
      "https://example.test/support",
    );
    expect(safeSupportChannelHref("  http://example.test/help  ")).toBe("http://example.test/help");
  });

  it("refuses script and data URLs so a hostile value can't become a clickable script", () => {
    expect(safeSupportChannelHref("javascript:alert(1)")).toBeNull();
    expect(safeSupportChannelHref("JaVaScRiPt:alert(1)")).toBeNull();
    expect(safeSupportChannelHref("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeSupportChannelHref("java\nscript:alert(1)")).toBeNull();
  });

  it("shows anything that is not a web URL as text, not a link", () => {
    expect(safeSupportChannelHref("help@example.test")).toBeNull();
    expect(safeSupportChannelHref("mailto:help@example.test")).toBeNull();
    expect(safeSupportChannelHref("example.test/support")).toBeNull();
    expect(safeSupportChannelHref("//example.test/support")).toBeNull();
    expect(safeSupportChannelHref("Ask in the community forum")).toBeNull();
  });

  it("refuses URLs that embed credentials", () => {
    expect(safeSupportChannelHref("https://user:secret@example.test/")).toBeNull();
  });

  it("returns null for missing or blank input", () => {
    expect(safeSupportChannelHref(null)).toBeNull();
    expect(safeSupportChannelHref(undefined)).toBeNull();
    expect(safeSupportChannelHref("   ")).toBeNull();
  });
});
