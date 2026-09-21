import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOINDEX_ROBOTS } from "../lib/seo/metadata";
import { SITE_DESCRIPTION, SITE_NAME } from "../lib/seo/site";
import "./globals.css";

// Deny by default (MVP-021, FR-017): every page is noindex unless it opts in.
// Only the home page, indexable category pages and published product pages
// override `robots` — so sign-in, account, admin, creator, preview and any
// future page stay out of search results without having to remember to say so.
export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  robots: NOINDEX_ROBOTS,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
