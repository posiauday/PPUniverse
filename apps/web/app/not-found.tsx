import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "../lib/seo/site";

// The title was the bare site name (BUG-008, WCAG 2.4.2). Robots stay noindex: the root
// layout's default is inherited, and Next adds noindex to a 404 response itself.
export const metadata: Metadata = { title: `Page not found | ${SITE_NAME}` };

// Without this file an unknown URL renders the framework default, which has no
// <main> landmark (BUG-008, WCAG 1.3.1 / 2.4.1). The status stays 404.
//
// Daylight (MVP-031): a big "4●4" with a glossy sphere for the zero. The
// heading itself says plainly what happened; the playful line is secondary.
export default function NotFound() {
  return (
    <main className="px-4 pb-6 md:px-6">
      <div className="relative mx-auto flex max-w-[77.5rem] flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] bg-tech-bi px-6 py-16 text-center md:py-24">
        <div
          aria-hidden="true"
          className="motion-drift pointer-events-none absolute -bottom-52 -left-32 h-[560px] w-[560px] rounded-full bg-[#fde68a] opacity-70 blur-[70px]"
        />
        <div aria-hidden="true" className="relative flex items-center gap-2.5">
          <span className="font-display text-[8rem] leading-[0.9] font-extrabold md:text-[12.5rem]">
            4
          </span>
          <span className="shape-sphere motion-bob h-28 w-28 md:h-[170px] md:w-[170px]" />
          <span className="font-display text-[8rem] leading-[0.9] font-extrabold md:text-[12.5rem]">
            4
          </span>
        </div>
        <h1 className="relative text-4xl font-bold md:text-5xl">Page not found</h1>
        <p className="relative max-w-xl text-lg">
          The page you asked for does not exist or is no longer available.{" "}
          <span className="accent-word text-xl">It isn&rsquo;t delegable.</span>
        </p>
        <div className="relative mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="motion-press inline-flex min-h-[3.375rem] items-center justify-center rounded-full bg-primary px-7 font-semibold text-primary-foreground no-underline"
          >
            Back to the home page
          </Link>
          <Link
            href="/guides"
            className="inline-flex min-h-[3.375rem] items-center justify-center rounded-full border-[1.5px] border-foreground bg-card px-7 font-semibold text-foreground no-underline hover:bg-muted"
          >
            Browse all guides
          </Link>
        </div>
      </div>
    </main>
  );
}
