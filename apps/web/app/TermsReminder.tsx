"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * For a signed-in reader who hasn't agreed to the Terms of use yet, such as
 * an account made before agreeing was part of making one, or someone who
 * left the welcome page (docs/final-decisions.md, 2026-10-08, "Accounts
 * accept the Terms when they're made"). Hidden on the welcome page itself and
 * on the Terms and Privacy pages, which they may be reading to decide.
 */
export function TermsReminder() {
  const pathname = usePathname();
  if (pathname === "/account/welcome" || pathname === "/terms" || pathname === "/privacy")
    return null;
  return (
    <div className="px-3 md:px-6">
      <p className="mx-auto flex max-w-[77.5rem] flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-border bg-stage px-4 py-2 text-sm">
        <span>
          One step to finish your account: agree to the Terms of use and the Privacy notice.
        </span>
        <Link
          href={`/account/welcome?callbackUrl=${encodeURIComponent(pathname || "/account")}`}
          className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          Review and agree
        </Link>
      </p>
    </div>
  );
}
