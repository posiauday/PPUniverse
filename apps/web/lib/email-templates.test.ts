import { describe, expect, it } from "vitest";
import { EMAILS, renderEmail } from "./email-templates";

const ORIGIN = "https://lowcodestacks.example";
const LINK = `${ORIGIN}/signin/confirm?token=abc&email=a%40b.test`;

describe("branded emails (MVP-044)", () => {
  it("renders every email with its subject, heading, button and a plain link", () => {
    const all = [
      EMAILS.signInLink(LINK),
      EMAILS.confirmSignUp(LINK),
      EMAILS.setPassword(LINK),
      EMAILS.deletionRequestReceived(`${ORIGIN}/account/privacy`, "contact@example.test"),
    ];
    for (const email of all) {
      const { subject, html, text } = renderEmail(email, ORIGIN);
      expect(subject).toBe(email.subject);
      expect(html).toContain(`<title>${subject.replace(/'/g, "&#39;")}</title>`);
      expect(html).toContain(email.button.label);
      // The button and the "Button not working?" line both carry the link.
      const href = email.button.url.replace(/&/g, "&amp;");
      expect(html.split(`href="${href}"`).length - 1).toBe(2);
      // The plain-text version has the heading, the link and the safety line.
      expect(text).toContain(email.heading.marked);
      expect(text).toContain(email.button.url);
      expect(text).toContain(email.safety);
    }
  });

  it("escapes the link and every piece of text", () => {
    const email = { ...EMAILS.signInLink(`${ORIGIN}/x?a=1&b="<script>`), safety: "<b>hi</b>" };
    const { html } = renderEmail(email, ORIGIN);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>hi</b>");
    expect(html).toContain("&lt;b&gt;hi&lt;/b&gt;");
    expect(html).toContain("a=1&amp;b=&quot;&lt;script&gt;");
  });

  it("loads only the logo from the site: no tracking pixel, no other images", () => {
    const { html } = renderEmail(EMAILS.setPassword(LINK), ORIGIN);
    const images = html.match(/<img\b[^>]*>/g) ?? [];
    expect(images).toHaveLength(1);
    expect(images[0]).toContain(`src="${ORIGIN}/email/logo.png"`);
    expect(images[0]).toContain('alt=""');
  });

  it("leaves the logo and Privacy link out when the site origin is unknown", () => {
    const { html, text } = renderEmail(EMAILS.signInLink(LINK), null);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("Privacy notice");
    expect(text).not.toContain("Privacy notice");
  });

  it("says independent, and supports dark mode where the mail app does", () => {
    const { html, text } = renderEmail(EMAILS.signInLink(LINK), ORIGIN);
    expect(html).toContain("not affiliated with or endorsed by Microsoft");
    expect(text).toContain("not affiliated with or endorsed by Microsoft");
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain("@media (prefers-color-scheme: dark)");
  });

  it("states each link's real lifetime", () => {
    expect(EMAILS.signInLink(LINK).note).toContain("24 hours");
    expect(EMAILS.confirmSignUp(LINK).note).toContain("1 hour");
    expect(EMAILS.setPassword(LINK).note).toContain("1 hour");
    expect(EMAILS.deletionRequestReceived(LINK, "c@example.test").paragraphs[0]).toContain(
      "within 30 days",
    );
  });
});
