import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { currentDeletionRequestState } from "@ppu/domain-privacy";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authOptions } from "../../lib/auth";
import { CONTACT_EMAIL } from "../../lib/legal/pages";
import { commentsEnabled, learnEnabled } from "../../lib/feature-flags";
import { learnRepository } from "../../lib/learn";
import { SITE_NAME } from "../../lib/seo/site";
import { loadViewerSummary } from "../../lib/viewer";
import { Avatar } from "../Avatar";
import { SignOutButton } from "./sessions/SignOutButton";

// Authenticated, self-service account content: not indexed (the root
// layout's default noindex is inherited), like every /account page.
export const metadata: Metadata = { title: `Your account | ${SITE_NAME}` };

export const dynamic = "force-dynamic";

/** Where each admin area is, so an admin never has to remember an address. */
const ADMIN_LINKS = [
  { href: "/admin", name: "Overview" },
  { href: "/admin/content", name: "Guides" },
  { href: "/admin/updates", name: "Updates" },
  { href: "/admin/topics", name: "Learn topics" },
  { href: "/admin/components", name: "Component library" },
  { href: "/admin/products", name: "Marketplace products" },
  { href: "/admin/comments", name: "Comments" },
  { href: "/admin/feedback", name: "Feedback" },
  { href: "/admin/users", name: "Users and roles" },
  { href: "/admin/deletion-requests", name: "Deletion requests" },
  { href: "/admin/settings", name: "Settings and indexing" },
  { href: "/admin/audit", name: "Audit log" },
] as const;

const REQUEST_LABEL: Record<string, string> = {
  SUBMITTED: "Your deletion request is waiting for review.",
  UNDER_REVIEW: "Your deletion request is being reviewed.",
  APPROVED: "Your deletion request was approved and is being carried out.",
  DENIED: "Your last deletion request was declined; see why on the privacy page.",
  WITHDRAWN: "You withdrew your last deletion request.",
  COMPLETED: "Your deletion request was completed.",
};

function Card({
  href,
  title,
  children,
  action,
}: {
  href: string;
  title: string;
  children: ReactNode;
  action: string;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-[1.5rem] border border-border bg-card p-5">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="text-[0.9375rem] leading-relaxed text-muted-foreground">{children}</div>
      <Link href={href} className="mt-auto pt-2 font-semibold underline underline-offset-4">
        {action} <span aria-hidden="true">→</span>
      </Link>
    </li>
  );
}

/**
 * The account overview (2026-10-08): where "Account" in the header goes. Who
 * you are (your avatar, name and email), then everything you can do: your
 * profile, where you're signed in, your privacy choices and deletion request,
 * and, for admins, every admin area in one place.
 */
export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/signin?callbackUrl=%2Faccount");

  const [viewer, latestRequest, progress] = await Promise.all([
    loadViewerSummary(userId),
    new PrismaPrivacyRepository(prisma).getLatestDeletionRequestForUser(userId).catch(() => null),
    learnEnabled() ? learnRepository.listProgress(userId).catch(() => []) : Promise.resolve(null),
  ]);
  const requestState = latestRequest ? currentDeletionRequestState(latestRequest) : null;
  const lessonsDone = progress?.reduce((sum, topic) => sum + topic.done, 0) ?? 0;

  return (
    <main>
      <div className="flex flex-wrap items-center gap-5 rounded-[2rem] bg-stage p-6">
        <Avatar seed={viewer.avatarSeed} name={viewer.displayName ?? undefined} size={80} />
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Your account
          </p>
          <h1 className="mt-1 [overflow-wrap:anywhere]">{viewer.displayName ?? "Welcome"}</h1>
          <p className="mt-1 [overflow-wrap:anywhere]">{session.user?.email}</p>
        </div>
        <div className="ml-auto [&_button]:inline-flex [&_button]:min-h-11 [&_button]:items-center [&_button]:rounded-full [&_button]:border-[1.5px] [&_button]:border-foreground [&_button]:bg-card [&_button]:px-5 [&_button]:font-semibold">
          <SignOutButton />
        </div>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {commentsEnabled() ? (
          <Card href="/account/profile" title="Profile" action="Edit your profile">
            The name and avatar shown with your comments.{" "}
            {viewer.displayName ? <>You&apos;re {viewer.displayName}.</> : null}
            {progress ? (
              <>
                {" "}
                Learn progress: {lessonsDone} {lessonsDone === 1 ? "lesson" : "lessons"} done.
              </>
            ) : null}
          </Card>
        ) : null}
        <Card href="/account/sessions" title="Sign-in and devices" action="See your devices">
          Where you&apos;re signed in. Sign out of a device you don&apos;t recognise.
        </Card>
        <Card href="/account/privacy" title="Privacy and your data" action="Manage your privacy">
          Your email choices, and asking us to delete your account.{" "}
          {requestState ? (
            <strong className="text-foreground">{REQUEST_LABEL[requestState]}</strong>
          ) : null}
        </Card>
        <Card href="/privacy" title="How we use your data" action="Read the Privacy notice">
          What we keep and why. To get a copy of your data, email{" "}
          <span className="text-foreground">{CONTACT_EMAIL}</span> from this address.
        </Card>
      </ul>

      {viewer.isAdmin ? (
        <section
          aria-labelledby="admin_heading"
          className="rounded-[1.5rem] border-[1.5px] border-foreground bg-card p-5"
        >
          <h2 id="admin_heading" className="!mt-0 font-display text-xl font-bold">
            Admin
          </h2>
          <p className="mt-1 text-muted-foreground">You&apos;re an admin. Everything you manage:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ADMIN_LINKS.map((link) => (
              <li key={link.href} className="!mt-0">
                <Link
                  href={link.href}
                  className="flex min-h-11 items-center rounded-xl bg-muted px-3 font-medium text-foreground no-underline hover:bg-stage"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
