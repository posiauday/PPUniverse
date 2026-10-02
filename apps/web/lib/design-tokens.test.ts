import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * MVP-027: the design tokens are checked against WCAG 2.2 contrast in BOTH
 * themes, straight from globals.css, so a colour tweak that breaks a pairing
 * fails here before it reaches a page. The accessibility gate (axe, every
 * page state, light and dark) is the second line; this one names the exact
 * token pair.
 */

// Line endings normalised: a Windows checkout (core.autocrlf) has CRLF, and
// the block parsers below look for a newline-brace-newline end (BUG-017).
const CSS = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
).replace(/\r\n/g, "\n");

function block(selector: RegExp): Record<string, string> {
  const match = CSS.match(selector);
  if (!match?.[1]) throw new Error(`no block for ${selector}`);
  const tokens: Record<string, string> = {};
  for (const [, name, value] of match[1].matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    tokens[name as string] = (value as string).toLowerCase();
  }
  return tokens;
}

const LIGHT = block(/@theme\s*\{([\s\S]*?)\n\}/);
const DARK = { ...LIGHT, ...block(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/) };

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The six technology palettes (MVP-031): a tint and an ink each. */
const TECH = ["apps", "automate", "bi", "copilot", "dataverse", "pages"] as const;

/** [text, background] pairs that carry body-size text: 4.5:1 (WCAG 1.4.3). */
const TEXT_PAIRS: Array<[string, string]> = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["foreground", "muted"],
  ["card-foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["primary", "background"],
  ["primary", "card"],
  ["highlight-foreground", "highlight"],
  ["code-foreground", "code"],
  ["code-muted", "code"],
  // MVP-031 (Daylight): violet accent words and prose links, the hero stage,
  // and each technology's ink and the page's ink on that technology's tint.
  ["accent", "background"],
  ["accent", "card"],
  ["accent", "muted"],
  ["coral", "background"],
  ["coral", "card"],
  // The hero's "New" pill: highlight text on the primary pill.
  ["highlight", "primary"],
  ["foreground", "stage"],
  ["muted-foreground", "stage"],
  ...TECH.flatMap((name): Array<[string, string]> => [
    [`tech-${name}-ink`, `tech-${name}`],
    ["foreground", `tech-${name}`],
  ]),
];

/** Control boundaries and the focus ring: 3:1 (WCAG 1.4.11, 2.4.13). The
 * search input's border is muted-foreground (BUG-004). The ring is its own
 * token (MVP-031) and must stand out on every surface it can sit on. */
const NON_TEXT_PAIRS: Array<[string, string]> = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "card"],
  ["muted-foreground", "background"],
  ["ring", "background"],
  ["ring", "card"],
  ["ring", "muted"],
  ["ring", "stage"],
  ["ring", "highlight"],
  ...TECH.map((name): [string, string] => ["ring", `tech-${name}`]),
];

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
] as const)("%s theme tokens", (_name, tokens) => {
  it("defines every token the pairs use", () => {
    for (const [a, b] of [...TEXT_PAIRS, ...NON_TEXT_PAIRS]) {
      expect(tokens[a], a).toMatch(/^#[0-9a-f]{6}$/);
      expect(tokens[b], b).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it.each(TEXT_PAIRS)("%s on %s is at least 4.5:1", (text, background) => {
    expect(contrast(tokens[text] as string, tokens[background] as string)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each(NON_TEXT_PAIRS)("%s against %s is at least 3:1", (edge, background) => {
    expect(contrast(tokens[edge] as string, tokens[background] as string)).toBeGreaterThanOrEqual(
      3,
    );
  });
});

describe("contrast()", () => {
  it("matches known WCAG values", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });
});

describe("reduced motion", () => {
  const reduced =
    CSS.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("switches animation and transitions off entirely, never to a tiny duration", () => {
    // A tiny duration on `*` makes every property change animate (transition-property
    // defaults to `all`), so focus rings were caught mid-transition in CI. See globals.css.
    expect(reduced).toMatch(/animation:\s*none\s*!important/);
    expect(reduced).toMatch(/transition:\s*none\s*!important/);
    expect(reduced).not.toMatch(/duration:\s*0?\.0*1ms/);
  });
});

describe("defaults for unstyled elements (BUG-009)", () => {
  const start = CSS.indexOf("@layer base {");
  // Comments are removed first so the selector scan below sees only rules.
  const block = (start >= 0 ? CSS.slice(start, CSS.indexOf("\n}\n", start)) : "").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );

  it("exists", () => {
    expect(block.length).toBeGreaterThan(0);
  });

  it("only ever targets elements WITHOUT a class, so styled components are untouched", () => {
    const selectors = [...block.matchAll(/^\s{2}([^@{}][^{}]*)\{/gm)]
      .flatMap((match) => (match[1] as string).split(","))
      .map((selector) => selector.trim())
      .filter(Boolean);
    expect(selectors.length).toBeGreaterThan(10);
    for (const selector of selectors) {
      // Each selector's styled (last) element must exclude classed elements.
      const target = selector
        .split(/\s+|>|\+/)
        .filter(Boolean)
        .at(-1) as string;
      expect(target, selector).toContain(":not([class])");
    }
  });
});
