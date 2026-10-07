import { SITE_NAME } from "./seo/site";

/**
 * The look of every email the site sends (MVP-044; docs/final-decisions.md,
 * 2026-10-06, "Branded emails"): concept E1, "Card on cream", from the design
 * board. The site's cream page, a white card, the X2 logo, a lime marker
 * under the heading's last words and a black pill button.
 *
 * Email-safe on purpose: tables and inline styles (Gmail and Outlook drop
 * most of the rest), system fonts (web fonts don't load in most inboxes),
 * the logo as a PNG served from the site (Gmail shows no SVG), and a working
 * plain link under every button. A <style> block adds dark-mode colours for
 * the mail apps that honour prefers-color-scheme; everywhere else the light
 * design shows. No tracking pixel, no tracked links. Every email also has a
 * plain-text version.
 */

export interface BrandedEmail {
  /** The subject line. */
  subject: string;
  /** The inbox preview line shown after the subject. */
  preheader: string;
  /** The heading: the plain start, then the words drawn with the lime marker. */
  heading: { lead: string; marked: string };
  paragraphs: readonly string[];
  button: { label: string; url: string };
  /** A short line under the button (how long the link lasts), if any. */
  note?: string;
  /** What to do if this email was unexpected. */
  safety: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const FONT = "'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const FOOTER_TEXT = `${SITE_NAME} is an independent site, not affiliated with or endorsed by Microsoft. You're getting this email because this address was used on lowcodestacks.com.`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders one email as HTML and plain text. `origin` is the site's public
 * origin (https://lowcodestacks.com); without one, the logo image and the
 * Privacy link are left out rather than pointing somewhere wrong.
 */
export function renderEmail(email: BrandedEmail, origin: string | null): RenderedEmail {
  const e = escapeHtml;
  const url = e(email.button.url);
  const logo = origin
    ? `<img src="${e(`${origin}/email/logo.png`)}" width="32" height="32" alt="" style="display:block;border:0;outline:none">`
    : "";
  const privacy = origin
    ? `<br><a href="${e(`${origin}/privacy`)}" class="lcs-muted" style="color:#55525F">Privacy notice</a>`
    : "";
  const paragraphs = email.paragraphs
    .map(
      (p) =>
        `<p class="lcs-ink" style="margin:14px 0 0;font:400 16px/26px ${FONT};color:#14141A">${e(p)}</p>`,
    )
    .join("");
  const note = email.note
    ? `<p class="lcs-muted" style="margin:12px 0 0;font:400 13px/20px ${FONT};color:#55525F">${e(email.note)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${e(email.subject)}</title>
<style>
@media (max-width: 480px) {
  .lcs-card { padding: 30px 22px 26px !important; border-radius: 22px !important; }
}
@media (prefers-color-scheme: dark) {
  .lcs-page { background: #14141A !important; }
  .lcs-card { background: #1D1D24 !important; border-color: #2C2C36 !important; }
  .lcs-ink, .lcs-ink a { color: #F4F1EA !important; }
  .lcs-muted, .lcs-muted a { color: #B9B6C3 !important; }
  .lcs-rule { border-color: #2C2C36 !important; }
  .lcs-mark { background: #3F5B12 !important; }
  .lcs-btn { background: #F4F1EA !important; }
  .lcs-btn a { color: #14141A !important; }
}
</style>
</head>
<body class="lcs-page" style="margin:0;padding:0;background:#FBF8F3">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${e(email.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="lcs-page" style="background:#FBF8F3">
<tr><td style="padding:0 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto">
<tr><td style="padding:28px 8px 18px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
${logo ? `<td style="vertical-align:middle;padding-right:10px">${logo}</td>` : ""}
<td class="lcs-ink" style="vertical-align:middle;font:700 18px/22px ${FONT};letter-spacing:-0.01em;color:#14141A">${e(SITE_NAME)}</td>
</tr></table>
</td></tr>
<tr><td class="lcs-card" style="background:#FFFFFF;border:1px solid #ECE7DD;border-radius:28px;padding:40px 40px 32px">
<h1 class="lcs-ink" style="margin:0;font:800 32px/40px ${FONT};letter-spacing:-0.02em;color:#14141A">${e(email.heading.lead)} <span class="lcs-mark" style="background:#D9F99D;padding:0 4px;border-radius:4px">${e(email.heading.marked)}</span></h1>
${paragraphs}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0"><tr>
<td class="lcs-btn" style="border-radius:999px;background:#14141A"><a href="${url}" style="display:inline-block;padding:15px 28px;font:600 16px/20px ${FONT};color:#FFFFFF;text-decoration:none;border-radius:999px">${e(email.button.label)} &rarr;</a></td>
</tr></table>
${note}
<p class="lcs-muted" style="margin:22px 0 0;font:400 13px/20px ${FONT};color:#55525F">Button not working? Paste this link into your browser:<br><a href="${url}" class="lcs-ink" style="color:#14141A;word-break:break-all">${url}</a></p>
<p class="lcs-muted lcs-rule" style="margin:22px 0 0;padding-top:18px;border-top:1px solid #ECE7DD;font:400 13px/20px ${FONT};color:#55525F">${e(email.safety)}</p>
</td></tr>
<tr><td class="lcs-muted" style="padding:22px 12px 34px;font:400 12px/18px ${FONT};color:#55525F">${e(FOOTER_TEXT)}${privacy}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `${email.heading.lead} ${email.heading.marked}`,
    "",
    ...email.paragraphs.flatMap((p) => [p, ""]),
    `${email.button.label}: ${email.button.url}`,
    ...(email.note ? [email.note] : []),
    "",
    email.safety,
    "",
    "--",
    FOOTER_TEXT,
    ...(origin ? [`Privacy notice: ${origin}/privacy`] : []),
  ].join("\n");

  return { subject: email.subject, html, text };
}

/** The four emails the site sends, with the wording approved in MVP-044. */
export const EMAILS = {
  signInLink: (url: string): BrandedEmail => ({
    subject: `Sign in to ${SITE_NAME}`,
    preheader: "Your sign-in link. It works once and expires in 24 hours.",
    heading: { lead: "Your sign-in", marked: "link" },
    paragraphs: [
      "Press the button to sign in. On our site you'll press one more button, so email scanners can't use the link up.",
    ],
    button: { label: "Sign in", url },
    note: "The link works once and expires in 24 hours.",
    safety: "Didn't ask to sign in? Ignore this email. Nobody can sign in without the link.",
  }),
  confirmSignUp: (url: string): BrandedEmail => ({
    subject: `Confirm your email for ${SITE_NAME}`,
    preheader: "One step left: confirm your email to finish creating your account.",
    heading: { lead: "Confirm your", marked: "email" },
    paragraphs: [
      "One step left. Press the button, then Confirm, to finish creating your account. Your password works from then on.",
    ],
    button: { label: "Confirm my email", url },
    note: "The link works once and expires in 1 hour.",
    safety: "Didn't sign up? Ignore this email. No account is created.",
  }),
  setPassword: (url: string): BrandedEmail => ({
    subject: `Set your ${SITE_NAME} password`,
    preheader: "Choose a new password. The link expires in 1 hour.",
    heading: { lead: "Choose a new", marked: "password" },
    paragraphs: [
      "Someone asked to set or reset the password for your account. Press the button to choose one.",
      "Saving it signs you out on every other device.",
    ],
    button: { label: "Choose a password", url },
    note: "The link works once and expires in 1 hour.",
    safety: "Wasn't you? Ignore this email. Your password hasn't changed.",
  }),
  deletionRequestReceived: (url: string, contact: string): BrandedEmail => ({
    subject: "We received your account deletion request",
    preheader: "We'll review it and reply within 30 days.",
    heading: { lead: "We received your", marked: "request" },
    paragraphs: [
      `You asked us to delete your ${SITE_NAME} account. We'll review the request and reply within 30 days, as our Privacy notice promises.`,
      "You can see where it stands on your account page.",
    ],
    button: { label: "See your request", url },
    safety: `Didn't ask for this? Email ${contact} and we'll look into it.`,
  }),
} as const;
