/**
 * Password rules (MVP-036; docs/final-decisions.md, 2026-10-06, "Email and
 * password sign-in: rules"). Length is counted in Unicode code points, so an
 * emoji or an accented letter is one character, as a person would count it.
 * No composition rules: NIST SP 800-63B rev. 4 forbids them.
 */
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordProblem =
  | "too-short"
  | "too-long"
  | "contains-email-name"
  | "contains-site-name"
  | "one-repeated-character"
  | "found-in-breach";

/** What each problem means, worded for the person typing the password. */
export const PASSWORD_PROBLEM_MESSAGES: Record<PasswordProblem, string> = {
  "too-short": `Use at least ${MIN_PASSWORD_LENGTH} characters. A few words with spaces works well.`,
  "too-long": `Use ${MAX_PASSWORD_LENGTH} characters or fewer.`,
  "contains-email-name":
    "Don't use your email address, or the part before the @, in your password.",
  "contains-site-name": "Don't use the site's name in your password.",
  "one-repeated-character": "Don't use one character repeated.",
  "found-in-breach":
    "This password has appeared in a known data breach, so attackers try it first. Choose a different one.",
};

function codePoints(text: string): number {
  return [...text].length;
}

/**
 * Local checks only; the breach check is separate (it needs the network).
 * Returns every problem found, in a stable order, or an empty list.
 */
export function checkPasswordLocally(
  password: string,
  context: { email: string; siteName: string },
): PasswordProblem[] {
  const problems: PasswordProblem[] = [];
  const length = codePoints(password);
  if (length < MIN_PASSWORD_LENGTH) problems.push("too-short");
  if (length > MAX_PASSWORD_LENGTH) problems.push("too-long");

  const lower = password.toLowerCase();
  const localPart = context.email.split("@")[0]?.toLowerCase() ?? "";
  if (localPart.length >= 4 && lower.includes(localPart)) problems.push("contains-email-name");
  const site = context.siteName.toLowerCase().replace(/\s+/g, "");
  if (site.length > 0 && lower.replace(/\s+/g, "").includes(site))
    problems.push("contains-site-name");
  if (length > 0 && new Set([...password]).size === 1) problems.push("one-repeated-character");
  return problems;
}
