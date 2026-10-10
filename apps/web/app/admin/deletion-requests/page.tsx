import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { currentDeletionRequestState, type DeletionRequestState } from "@ppu/domain-privacy";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { SITE_NAME } from "../../../lib/seo/site";
import { AdminDeletionRequestControls } from "./AdminDeletionRequestControls";
import { AdminPageHeader } from "../AdminPageHeader";

export const metadata: Metadata = { title: `Deletion requests | ${SITE_NAME}` };

const STATE_LABEL: Partial<Record<DeletionRequestState, string>> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
};

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
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Deletion requests"
        description="Readers' requests to delete their account, oldest first. Each step you take is recorded in the audit log."
      />
      {requests.length === 0 ? (
        <p className="rounded-[1.25rem] border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
          No pending deletion requests.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => {
            const state = currentDeletionRequestState(request);
            return (
              <li
                key={request.id}
                className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-card p-5"
              >
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold [overflow-wrap:anywhere]">
                    {emailByUserId.get(request.userId) ?? request.userId}
                  </span>
                  <span className="rounded-full bg-[#ffe4e6] px-2 py-px text-xs font-semibold text-[#9f1239]">
                    {STATE_LABEL[state] ?? state}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Submitted{" "}
                    <time dateTime={request.createdAt.toISOString()}>
                      {dateLabel(request.createdAt)}
                    </time>
                  </span>
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
