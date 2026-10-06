import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandMark } from "../app/BrandMark";
import { brandMarkSvg, markVariantFor } from "./brand-mark";

describe("brand mark (X2 Code stack)", () => {
  it("swaps to the simplified drawing at 20px and below", () => {
    expect(markVariantFor(16)).toBe("small");
    expect(markVariantFor(20)).toBe("small");
    expect(markVariantFor(22)).toBe("full");
    expect(markVariantFor(28)).toBe("full");
  });

  it("keeps app/icon.svg in step with the shared geometry", () => {
    const icon = readFileSync(join(__dirname, "..", "app", "icon.svg"), "utf8").trim();
    expect(icon).toBe(brandMarkSvg("small"));
  });

  it("gives every rendered copy its own gradient ids", () => {
    const html = renderToStaticMarkup(
      <>
        <BrandMark />
        <BrandMark size={22} />
      </>,
    );
    const ids = [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    for (const id of ids) expect(html).toContain(`url(#${id})`);
  });

  it("is decorative: hidden from assistive technology", () => {
    const html = renderToStaticMarkup(<BrandMark />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
  });
});
