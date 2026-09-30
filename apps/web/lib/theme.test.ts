import { describe, expect, it } from "vitest";
import { THEME_COOKIE, resolveTheme, themeCookie } from "./theme";

describe("resolveTheme", () => {
  it("is dark only for exactly 'dark'; anything else, including tampering, is light", () => {
    expect(resolveTheme("dark")).toBe("dark");
    for (const value of ["light", undefined, null, "", "DARK", "dark;", "<script>"]) {
      expect(resolveTheme(value)).toBe("light");
    }
  });
});

describe("themeCookie", () => {
  it("is a first-party, site-wide, one-year, SameSite=Lax cookie holding only the theme", () => {
    expect(themeCookie("dark", false)).toBe(
      `${THEME_COOKIE}=dark; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  });

  it("adds Secure on https", () => {
    expect(themeCookie("light", true)).toMatch(/; Secure$/);
  });
});
