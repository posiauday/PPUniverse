/**
 * The emailed sign-in link opens a confirmation page instead of signing in
 * straight away (MVP-034; docs/final-decisions.md, 2026-10-06, "Sign-in
 * methods"). Work email often runs through link scanners (Microsoft Defender
 * for Office 365 scans and sandboxes links before delivery). Auth.js signs in,
 * and uses up the one-time token, on a plain GET of its callback URL, so a
 * scanner could spend the link before the person clicks it. Scanners follow
 * links but don't submit forms, so the confirmation page holds the token in a
 * form that only the "Sign me in" button submits.
 */

export const CONFIRM_PATH = "/signin/confirm";

/** Auth.js's email callback, which the confirmation form submits to. */
export const EMAIL_CALLBACK_PATH = "/api/auth/callback/email";

/** The only query parameters the confirmation page passes on. */
export const CONFIRM_FIELDS = ["token", "email", "callbackUrl"] as const;
export type ConfirmField = (typeof CONFIRM_FIELDS)[number];

/** Turns Auth.js's callback URL into the confirmation page's URL, same origin. */
export function confirmLinkFrom(callbackUrl: string): string {
  const source = new URL(callbackUrl);
  const target = new URL(CONFIRM_PATH, source.origin);
  for (const field of CONFIRM_FIELDS) {
    const value = source.searchParams.get(field);
    if (value !== null) target.searchParams.set(field, value);
  }
  return target.toString();
}

/**
 * The hidden form fields for the confirmation page, from its query string:
 * only the known fields, each a single string. Null when the token or email
 * is missing, so the page shows "request a new link" instead of a form that
 * can't work.
 */
export function confirmFormFields(
  searchParams: Record<string, string | string[] | undefined>,
): Partial<Record<ConfirmField, string>> | null {
  const fields: Partial<Record<ConfirmField, string>> = {};
  for (const field of CONFIRM_FIELDS) {
    const value = searchParams[field];
    if (typeof value === "string" && value !== "") fields[field] = value;
  }
  return fields.token && fields.email ? fields : null;
}
