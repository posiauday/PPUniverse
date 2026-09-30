import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { currentDeletionRequestState } from "@ppu/domain-privacy";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { SITE_NAME } from "../../../lib/seo/site";
import { AdminDeletionRequestControls } from "./AdminDeletionRequestControls";

export const metadata: Metadata = { title: `Deletion requests | ${SITE_NAME}` };

/**
 * The admin surface MVP-020's scope requires (docs/final-decisions.md,
 * "MVP-020 open questions 46, 47 and 48", question 48). No session, and a
 * session with role !== ADMIN, both render the identical Next.js not-found
 * page — the same "no information disclosed about the existence of the
 * surface" treatment the API route (api/admin/deletion-requests/[id])
 * applies, deliberately not a redirect-to-signin (which would itself
 * confirm the page exists). Role is re-queried from the database on every
 * request, never read from the session (auth.ts is unmodified by this
 * story).
 */
export default async function AdminDeletionRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    notFound();
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (actor?.role !== "ADMIN") {
    notFound();
  }

  const repository = new PrismaPrivacyRepository(prisma);
  const requests = await repository.listActiveDeletionRequests();

  const requesterIds = requests.map((request) => request.userId);
  const requesters = requesterIds.length
    ? await prisma.user.findMany({
        where: { id: { in: requesterIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailByUserId = new Map(requesters.map((user) => [user.id, user.email]));

  const dateLabel = (date: Date) =>
    new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);

  return (
    <main>
      <h1>Deletion requests</h1>
      {requests.length === 0 ? (
        <p>No pending deletion requests.</p>
      ) : (
        <ul>
          {requests.map((request) => {
            const state = currentDeletionRequestState(request);
            return (
              <li key={request.id}>
                <p>
                  {emailByUserId.get(request.userId) ?? request.userId} — submitted{" "}
                  {dateLabel(request.createdAt)} — {state}
                </p>
                <AdminDeletionRequestControls requestId={request.id} currentState={state} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
