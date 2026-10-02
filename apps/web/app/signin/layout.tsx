import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME } from "../../lib/seo/site";

// The sign-in page is a client component, which cannot export metadata, so its title
// comes from this route-segment layout (BUG-005, WCAG 2.4.2). The root layout's
// noindex default is inherited; only the title changes.
export const metadata: Metadata = { title: `Sign in | ${SITE_NAME}` };

/**
 * Daylight (MVP-031): the sign-in form in a card beside a decorative panel.
 * The page's own markup -- which carries the BUG-005/011/014 accessibility
 * fixes -- is untouched; this layout only frames it. The panel is decoration
 * (aria-hidden) and appears only on wide screens.
 */
export default function SignInLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[77.5rem] gap-5 px-4 pt-2 pb-6 md:px-6 lg:min-h-[44rem] lg:grid-cols-2">
      <div className="flex items-center rounded-[2.5rem] border border-border bg-card px-2 py-4 md:px-8 md:py-10">
        {children}
      </div>
      <div
        aria-hidden="true"
        className="relative hidden overflow-hidden rounded-[2.5rem] bg-stage lg:block"
      >
        <div className="motion-drift absolute -top-32 -left-24 h-[520px] w-[520px] rounded-full bg-[#c4b5fd] opacity-80 blur-[70px]" />
        <div className="motion-drift-alt absolute -right-28 -bottom-28 h-[480px] w-[480px] rounded-full bg-[#fdba74] opacity-60 blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 flex w-[340px] -translate-x-1/2 -translate-y-1/2 -rotate-[4deg] flex-col gap-3 rounded-[1.625rem] bg-white p-6 text-[#14141a] shadow-[0_40px_70px_-30px_rgb(20_20_26/0.5)]">
          <span className="font-mono text-[11px] text-[#6b6b78]">From: {SITE_NAME}</span>
          <span className="font-display text-[22px] font-bold">Your sign-in link</span>
          <span className="h-2.5 rounded bg-[#f4f1ea]" />
          <span className="h-2.5 w-[70%] rounded bg-[#f4f1ea]" />
          <span className="mt-1.5 self-start rounded-full bg-[#14141a] px-5 py-3 text-sm font-semibold text-white">
            Sign in →
          </span>
        </div>
        <span className="shape-sphere motion-bob absolute top-20 left-[70px] h-[100px] w-[100px]" />
        <span className="shape-ring motion-bob-alt absolute top-[120px] right-[70px] h-[110px] w-[110px]" />
        <span className="shape-pill motion-bob-alt absolute bottom-[90px] left-[90px] h-14 w-40" />
        <span className="shape-cube motion-bob absolute right-[100px] bottom-[100px] h-[76px] w-[76px] [animation-duration:10s]" />
      </div>
    </div>
  );
}
