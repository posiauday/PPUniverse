import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "../lib/seo/site";

// The title was the bare site name (BUG-008, WCAG 2.4.2). Robots stay noindex: the root
// layout's default is inherited, and Next adds noindex to a 404 response itself.
export const metadata: Metadata = { title: `Page not found | ${SITE_NAME}` };

// Without this file an unknown URL renders the framework default, which has no
// <main> landmark (BUG-008, WCAG 1.3.1 / 2.4.1). The status stays 404.
export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you asked for does not exist or is no longer available.
      </p>
      <p className="mt-4">
        <Link href="/">Back to the home page</Link>
      </p>
    </main>
  );
}
