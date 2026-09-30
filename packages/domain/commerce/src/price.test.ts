import { describe, expect, it } from "vitest";
import { formatPrice, parsePriceInputToCents } from "./order.js";

describe("parsePriceInputToCents", () => {
  it("parses whole dollars, one or two decimals, a leading $ and thousands commas", () => {
    expect(parsePriceInputToCents("49")).toBe(4900);
    expect(parsePriceInputToCents("49.9")).toBe(4990);
    expect(parsePriceInputToCents("49.00")).toBe(4900);
    expect(parsePriceInputToCents(" $1,299.50 ")).toBe(129950);
  });

  it("is exact for amounts floating-point arithmetic gets wrong", () => {
    expect(parsePriceInputToCents("19.99")).toBe(1999);
    expect(parsePriceInputToCents("0.29")).toBe(29);
    expect(parsePriceInputToCents("1.005")).toBeNull();
  });

  it("rejects zero, negatives, three decimals, text and empty input", () => {
    for (const bad of ["0", "0.00", "-5", "49.999", "forty", "", "  ", "4 9", "1e3"]) {
      expect(parsePriceInputToCents(bad)).toBeNull();
    }
  });

  it("rejects amounts above Stripe's USD ceiling", () => {
    expect(parsePriceInputToCents("999999.99")).toBe(99_999_999);
    expect(parsePriceInputToCents("1000000")).toBeNull();
  });
});

describe("formatPrice", () => {
  it("always shows two decimals and the currency code", () => {
    expect(formatPrice(4900, "USD")).toBe("$49.00 USD");
    expect(formatPrice(5, "USD")).toBe("$0.05 USD");
    expect(formatPrice(129950, "USD")).toBe("$1,299.50 USD");
  });
});
