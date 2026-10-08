import { describe, expect, it } from "vitest";
import { cssColor, fromPowerFx } from "./replica";

describe("fromPowerFx", () => {
  it("reads text, booleans and numbers, with or without the leading =", () => {
    expect(fromPowerFx('"Outline"')).toBe("Outline");
    expect(fromPowerFx('="Say ""hi"""')).toBe('Say "hi"');
    expect(fromPowerFx("=true")).toBe(true);
    expect(fromPowerFx("false")).toBe(false);
    expect(fromPowerFx("42")).toBe(42);
  });

  it("returns anything else as its source", () => {
    expect(fromPowerFx("Upper(Text)")).toBe("Upper(Text)");
  });
});

describe("cssColor", () => {
  it("reads RGBA and ColorValue colours, and falls back for anything else", () => {
    expect(cssColor("=RGBA(124, 58, 237, 1)", "#000")).toBe("rgba(124, 58, 237, 1)");
    expect(cssColor('ColorValue("#7C3AED")', "#000")).toBe("#7C3AED");
    expect(cssColor("Color.Red", "#0f6cbd")).toBe("#0f6cbd");
  });
});
