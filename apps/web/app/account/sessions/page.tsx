import { PrismaSessionRepository } from "@ppu/adapter-identity";
import { prisma } from "@ppu/db";
import { toSessionListView } from "@ppu/domain-identity";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { getCurrentSessionId } from "../../../lib/current-session";
import { SessionRevokeButton } from "./SessionRevokeButton";
import { SessionsHeading } from "./SessionsHeading";
import { SignOutButton } from "./SignOutButton";

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
