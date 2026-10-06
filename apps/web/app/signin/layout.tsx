import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME } from "../../lib/seo/site";
import { AuthFrame } from "../AuthFrame";

// The sign-in page is a client component, which cannot export metadata, so its title
// comes from this route-segment layout (BUG-005, WCAG 2.4.2). The root layout's
// noindex default is inherited; only the title changes.
export const metadata: Metadata = { title: `Sign in | ${SITE_NAME}` };

/** The sign-in form framed by the shared Daylight card (MVP-031, AuthFrame). */
export default function SignInLayout({ children }: { children: ReactNode }) {
  return <AuthFrame panelTitle="Your sign-in link">{children}</AuthFrame>;
}
