import { describe, expect, it } from "vitest";
import { fromPowerFx } from "./replica";

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
