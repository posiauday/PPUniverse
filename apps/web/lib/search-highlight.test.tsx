import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Highlighted, splitMarked } from "./search-highlight";

const S = String.fromCharCode(1);
const E = String.fromCharCode(2);

describe("splitMarked", () => {
  it("splits plain and matched runs", () => {
    expect(splitMarked(`Why ${S}delegation${E} stops at ${S}500${E} rows`)).toEqual([
      { text: "Why ", match: false },
      { text: "delegation", match: true },
      { text: " stops at ", match: false },
      { text: "500", match: true },
      { text: " rows", match: false },
    ]);
  });

  it("returns text with no markers as one plain run", () => {
    expect(splitMarked("No match here")).toEqual([{ text: "No match here", match: false }]);
  });

  it("drops unpaired markers instead of trusting them", () => {
    expect(splitMarked(`a ${S}b`)).toEqual([{ text: "a b", match: false }]);
    expect(splitMarked(`a ${E}b`)).toEqual([{ text: "a b", match: false }]);
  });
});

describe("Highlighted", () => {
  it("wraps matches in <mark> and escapes everything as text", () => {
    const html = renderToStaticMarkup(<Highlighted marked={`<b>x</b> ${S}delegation${E}`} />);
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).toMatch(/<mark[^>]*>delegation<\/mark>/);
  });
});
