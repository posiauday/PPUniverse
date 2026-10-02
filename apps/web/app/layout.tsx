import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { authOptions } from "../lib/auth";
import { contentRepository } from "../lib/content";
import { NOINDEX_ROBOTS } from "../lib/seo/metadata";
import { SITE_DESCRIPTION, SITE_NAME } from "../lib/seo/site";
import { loadTechnologyMenu } from "../lib/technology-menu";
import { THEME_COOKIE, resolveTheme } from "../lib/theme";
import { fontVariables } from "./fonts";
import { ALL_AREAS } from "./[technology]/OtherAreas";
import "./globals.css";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

// Deny by default (MVP-021, FR-017): every page is noindex unless it opts in.
// Only the home page, indexable category pages and published product pages
// override `robots` — so sign-in, account, admin, creator, preview and any
// future page stay out of search results without having to remember to say so.
export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  robots: NOINDEX_ROBOTS,
};

/**
 * MVP-027: every page gets the site header and footer, the design system's
 * fonts, and the visitor's theme -- read from its cookie here, on the
 * server, so the first paint is already in the right theme. A skip link is
 * the first thing a keyboard reaches (WCAG 2.4.1), jumping past the header
 * to the page's own content.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = resolveTheme((await cookies()).get(THEME_COOKIE)?.value);
  const [session, menu] = await Promise.all([
    getServerSession(authOptions),
    loadTechnologyMenu(ALL_AREAS, contentRepository),
  ]);

  return (
    <html lang="en" data-theme={theme} style={{ colorScheme: theme }} className={fontVariables}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader theme={theme} signedIn={Boolean(session)} menu={menu} />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
