import { describe, expect, it } from "vitest";
import { normalizeDisplayText } from "./text.js";

// Invisible characters are built from code points so the test source stays readable and greppable.
const chars = (...codePoints: number[]): string => String.fromCharCode(...codePoints);

const NUL = chars(0x0000);
const BEL = chars(0x0007);
const DEL = chars(0x007f);
const C1_CONTROL = chars(0x0085);
const ZERO_WIDTH_SPACE = chars(0x200b);
const RIGHT_TO_LEFT_OVERRIDE = chars(0x202e);
const POP_DIRECTIONAL_FORMATTING = chars(0x202c);
const LEFT_TO_RIGHT_ISOLATE = chars(0x2066);
const POP_DIRECTIONAL_ISOLATE = chars(0x2069);
const WORD_JOINER = chars(0x2060);

describe("normalizeDisplayText", () => {
  it("returns null for missing, empty, or whitespace-only input", () => {
    expect(normalizeDisplayText(undefined)).toBeNull();
    expect(normalizeDisplayText(null)).toBeNull();
    expect(normalizeDisplayText("")).toBeNull();
    expect(normalizeDisplayText("  \n\t  ")).toBeNull();
  });

  it("returns null when nothing but invisible characters remain", () => {
    expect(normalizeDisplayText(`${ZERO_WIDTH_SPACE}${WORD_JOINER} ${NUL}`)).toBeNull();
  });

  it("collapses newlines, tabs and repeated spaces into single spaces", () => {
    expect(normalizeDisplayText("Requires   Dataverse.\nUses premium\tconnectors.")).toBe(
      "Requires Dataverse. Uses premium connectors.",
    );
  });

  it("strips control characters", () => {
    expect(normalizeDisplayText(`a${NUL}b${BEL}c${DEL}d${C1_CONTROL}e`)).toBe("abcde");
  });

  it("strips zero-width characters", () => {
    expect(normalizeDisplayText(`Requires${ZERO_WIDTH_SPACE} Dataverse`)).toBe(
      "Requires Dataverse",
    );
    expect(normalizeDisplayText(`Data${WORD_JOINER}verse`)).toBe("Dataverse");
  });

  it("strips bidirectional overrides and isolates that can visually spoof text", () => {
    expect(
      normalizeDisplayText(`ok${RIGHT_TO_LEFT_OVERRIDE}txt.exe${POP_DIRECTIONAL_FORMATTING}`),
    ).toBe("oktxt.exe");
    expect(normalizeDisplayText(`a${LEFT_TO_RIGHT_ISOLATE}b${POP_DIRECTIONAL_ISOLATE}c`)).toBe(
      "abc",
    );
  });

  it("keeps ordinary international text intact", () => {
    expect(normalizeDisplayText("café 日本語")).toBe("café 日本語");
  });

  it("leaves markup characters alone — escaping is the renderer's job, not this function's", () => {
    expect(normalizeDisplayText("<b>bold</b> & more")).toBe("<b>bold</b> & more");
  });
});
