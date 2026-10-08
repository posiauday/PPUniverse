import { getServerSession } from "next-auth/next";
import type { ReactNode } from "react";
import { authOptions } from "../../lib/auth";
import { commentsEnabled } from "../../lib/feature-flags";
import { loadViewerSummary } from "../../lib/viewer";
import { AccountNav } from "./AccountNav";

/**
 * Every /account page sits beside the account menu (2026-10-08), so a reader
 * can move between their overview, profile, sessions and privacy without
 * remembering addresses. Each page still checks sign-in itself. The shared
 * classes give the older pages the design system's headings and spacing.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const viewer = session?.user?.id
    ? await loadViewerSummary(session.user.id).catch(() => null)
    : null;
  const links = [
    { href: "/account", name: "Overview" },
    // The profile (name and avatar) belongs to comments (MVP-040).
    ...(commentsEnabled() ? [{ href: "/account/profile", name: "Profile" }] : []),
    { href: "/account/sessions", name: "Sign-in and devices" },
    { href: "/account/privacy", name: "Privacy and your data" },
  ];
  return (
    <div className="mx-auto grid max-w-[66rem] gap-6 px-4 py-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10 md:px-6">
      {session ? (
        <div className="md:sticky md:top-28 md:self-start">
          <AccountNav links={links} adminLink={viewer?.isAdmin ?? false} />
        </div>
      ) : (
        <div />
      )}
      <div className="min-w-0 [&_h1]:font-display [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_li]:mt-2 [&_main>p]:mt-3 [&_section]:mt-6">
        {children}
      </div>
    </div>
  );
}
