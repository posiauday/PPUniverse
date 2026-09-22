import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME } from "../../lib/seo/site";

// The sign-in page is a client component, which cannot export metadata, so its title
// comes from this route-segment layout (BUG-005, WCAG 2.4.2). The root layout's
// noindex default is inherited; only the title changes.
export const metadata: Metadata = { title: `Sign in | ${SITE_NAME}` };

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
