import { describe, expect, it } from "vitest";
import { highlightPowerFx } from "./FormulaList";

describe("highlightPowerFx", () => {
  it("colours strings, numbers, function calls and dotted names, and keeps every character", () => {
    const formula =
      'Notify("Clicked " & Count & If(Count = 1, " time", " times"), NotificationType.Success)';
    const tokens = highlightPowerFx(formula);
    expect(tokens.map((token) => token.text).join("")).toBe(formula);
    expect(tokens.filter((token) => token.kind === "function").map((token) => token.text)).toEqual([
      "Notify",
      "If",
    ]);
    expect(tokens.filter((token) => token.kind === "string").map((token) => token.text)).toEqual([
      '"Clicked "',
      '" time"',
      '" times"',
    ]);
    expect(tokens.find((token) => token.kind === "number")?.text).toBe("1");
    expect(tokens.find((token) => token.kind === "name")?.text).toBe("NotificationType.Success");
  });

  it("reads a doubled quote as part of the text", () => {
    const tokens = highlightPowerFx('"Don""t save"');
    expect(tokens).toEqual([{ text: '"Don""t save"', kind: "string" }]);
  });

  it("treats a control's action as a dotted name", () => {
    expect(highlightPowerFx("lcsDialog_1.Open()")[0]).toEqual({
      text: "lcsDialog_1.Open",
      kind: "name",
    });
  });
});
