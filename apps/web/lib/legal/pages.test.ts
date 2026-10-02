import { describe, expect, it } from "vitest";
import { outlineOf } from "../article-outline";
import { buildInfoPageMetadata } from "../seo/metadata";
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE_SECONDS } from "../theme";
import {
  ABOUT_PAGE,
  CONTACT_EMAIL,
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
  it("name the operator and the contact address on every page", () => {
    for (const page of INFO_PAGES) {
      expect(page.markdown).toContain(OPERATOR_NAME);
      expect(page.markdown).toContain(`mailto:${CONTACT_EMAIL}`);
    }
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
