import { describe, expect, it } from "vitest";
import { outlineOf } from "../article-outline";
import { buildInfoPageMetadata } from "../seo/metadata";
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE_SECONDS } from "../theme";
import { LAST_VISIT_KEY } from "../updates-visit";
import {
  ABOUT_PAGE,
  CONTACT_EMAIL,
  HOW_WE_WRITE_PAGE,
  INFO_PAGES,
  OPERATOR_NAME,
  PRIVACY_PAGE,
  TERMS_PAGE,
} from "./pages";

/**
 * MVP-032 (docs/final-decisions.md, "About, Privacy and Terms pages"): the
 * pages must keep matching what the code does, and must never claim
 * compliance with anything.
 */
describe("About, Privacy and Terms", () => {
  it("name the operator on About, Privacy and Terms, and the contact address on every page", () => {
    for (const page of [ABOUT_PAGE, PRIVACY_PAGE, TERMS_PAGE]) {
      expect(page.markdown).toContain(OPERATOR_NAME);
    }
    for (const page of INFO_PAGES) {
      expect(page.markdown).toContain(`mailto:${CONTACT_EMAIL}`);
    }
  });

  it("How we write (MVP-042) keeps the approved AI sentence and promises nothing unbuilt", () => {
    expect(HOW_WE_WRITE_PAGE.markdown).toContain(
      "Drafts are written with the help of AI, then fact-checked line by line.",
    );
    // Interim until the report button ships (guide redesign slice 4).
    expect(HOW_WE_WRITE_PAGE.markdown).not.toContain("Something here changed?");
    expect(HOW_WE_WRITE_PAGE.markdown).toMatch(/never copy anyone's text/);
  });

  it("make no compliance claim", () => {
    for (const page of INFO_PAGES) {
      expect(page.markdown).not.toMatch(
        /\bcomplian(t|ce)\b|\bcomply\b|\bGDPR\b|\bcertified\b(?! by Microsoft)/i,
      );
    }
  });

  it("names the theme cookie the code actually sets, and its one-year life", () => {
    expect(PRIVACY_PAGE.markdown).toContain(THEME_COOKIE);
    expect(THEME_COOKIE_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 365);
    expect(PRIVACY_PAGE.markdown).toMatch(/lasts a year/);
  });

  it("names the Updates badge's browser-only storage key the code actually uses (MVP-033)", () => {
    expect(PRIVACY_PAGE.markdown).toContain(LAST_VISIT_KEY);
    expect(PRIVACY_PAGE.markdown).toMatch(/never sent to us/);
  });

  it("names every service provider that processes personal information", () => {
    for (const provider of ["Netlify", "Supabase", "Resend"]) {
      expect(PRIVACY_PAGE.markdown).toContain(provider);
    }
    expect(PRIVACY_PAGE.markdown).toMatch(/outside Canada/);
  });

  it("says there is no tracking, and commits to a 30-day reply", () => {
    expect(PRIVACY_PAGE.markdown).toMatch(/no advertising, no analytics service/);
    expect(PRIVACY_PAGE.markdown).toMatch(/within 30 days/);
    expect(PRIVACY_PAGE.markdown).toContain("https://www.priv.gc.ca/");
  });

  it("licenses code under MIT, keeps text reserved, and links to its own MIT section", () => {
    expect(TERMS_PAGE.markdown).toContain("](#mit-license)");
    expect(outlineOf(TERMS_PAGE.markdown).map((item) => item.id)).toContain("mit-license");
    expect(TERMS_PAGE.markdown).toMatch(/Permission is hereby granted, free of charge/);
    expect(TERMS_PAGE.markdown).toMatch(/Please don't republish whole guides/);
    expect(TERMS_PAGE.markdown).toMatch(/laws of the Province of Saskatchewan/);
  });

  it("keeps the non-affiliation statement on About and Terms", () => {
    for (const page of [ABOUT_PAGE, TERMS_PAGE]) {
      expect(page.markdown).toMatch(/isn't affiliated with, endorsed by or certified by Microsoft/);
    }
  });

  it("are indexable, with an absolute canonical URL", () => {
    const metadata = buildInfoPageMetadata({
      site: { ok: true, origin: "https://example.com" },
      path: PRIVACY_PAGE.path,
      title: PRIVACY_PAGE.title,
      description: PRIVACY_PAGE.description,
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe("https://example.com/privacy");
    expect(metadata.title).toBe("Privacy notice | LowCodeStacks");
  });
});
