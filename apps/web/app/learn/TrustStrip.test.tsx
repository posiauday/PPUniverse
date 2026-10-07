import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; children?: unknown; className?: string }) =>
      createElement("a", { href: props.href, className: props.className }, props.children as never),
  };
});

import { TrustStrip } from "./TrustStrip";

const trust = {
  checkedOn: new Date("2026-10-06T00:00:00Z"),
  sourceCount: 5,
  quickAnswer: null,
  body: "",
};

describe("TrustStrip", () => {
  it("credits the site's byline, never a person (No personal details on the site)", () => {
    const text = renderToStaticMarkup(
      <TrustStrip trust={trust} updatedAt={new Date("2026-10-07T00:00:00Z")} />,
    ).replace(/<[^>]+>/g, "");
    expect(text).toContain("Posted by the Maker Desk");
    expect(text).toContain("Checked against Microsoft Learn");
    expect(text).toContain("6 Oct 2026 · 5 sources");
  });
});
