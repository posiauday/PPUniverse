/**
 * Light and dark themes (MVP-027; docs/final-decisions.md, "Design direction:
 * A + B combined"). Light is the default. A visitor's choice is kept in one
 * first-party cookie, set only when they press the theme toggle -- a
 * preference they explicitly asked for, so it needs no consent banner. It
 * holds nothing but the word "light" or "dark", and is read on the server
 * so the page is rendered in the right theme from the first byte, with no
 * flash of the wrong one and no inline script.
 */

export type Theme = "light" | "dark";

export const THEME_COOKIE = "lcs-theme";

/** One year: the choice persists across visits until changed. */
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Anything but exactly "dark" -- missing, empty, tampered with -- is light. */
export function resolveTheme(value: string | undefined | null): Theme {
  return value === "dark" ? "dark" : "light";
}

/** The Set-Cookie string the toggle writes; Secure whenever the page is on https. */
export function themeCookie(theme: Theme, secure: boolean): string {
  return [
    `${THEME_COOKIE}=${theme}`,
    "Path=/",
    `Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}
