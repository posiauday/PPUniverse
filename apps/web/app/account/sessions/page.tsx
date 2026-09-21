import { PrismaSessionRepository } from "@ppu/adapter-identity";
import { prisma } from "@ppu/db";
import { toSessionListView } from "@ppu/domain-identity";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { getCurrentSessionId } from "../../../lib/current-session";
import { SITE_NAME } from "../../../lib/seo/site";
import { SessionRevokeButton } from "./SessionRevokeButton";
import { SessionsHeading } from "./SessionsHeading";
import { SignOutButton } from "./SignOutButton";

// The title was the bare site name (BUG-006, WCAG 2.4.2). Robots stay noindex: the root
// layout's default is inherited.
export const metadata: Metadata = { title: `Active sessions | ${SITE_NAME}` };

export default async function AccountSessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const repository = new PrismaSessionRepository(prisma);
  const sessions = await repository.listByUser(session.user.id);
  const currentSessionId = await getCurrentSessionId();
  const view = toSessionListView(sessions, currentSessionId ?? "");

  return (
    <main>
      <SessionsHeading sessionCount={view.length} />
      <p>Signed in as {session.user.email}.</p>
      <SignOutButton />
      {view.length === 0 ? (
        <p>No active sessions found.</p>
      ) : (
        <ul>
          {view.map((s) => {
            const createdLabel = new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(s.createdAt);
            return (
              <li key={s.id}>
                Session started {createdLabel}
                {s.isCurrent ? (
                  <strong> (this device)</strong>
                ) : (
                  <SessionRevokeButton sessionId={s.id} label={`session started ${createdLabel}`} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
