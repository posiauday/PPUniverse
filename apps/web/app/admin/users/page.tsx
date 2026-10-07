import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/require-admin";
import { ROLE_LABEL, listUsers } from "../../../lib/roles";
import { SITE_NAME } from "../../../lib/seo/site";
import { RoleControl } from "./RoleControl";

export const metadata: Metadata = { title: `Users and roles | ${SITE_NAME}` };

// Reads the database per request.
export const dynamic = "force-dynamic";

const LIMIT = 100;

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Users and roles (MVP-047, admin panel slice 2): everyone with an account,
 * newest first, searchable by email or display name, and their role. A
 * Contributor can do nothing a member can't until the product owner decides
 * (docs/final-decisions.md, 2026-10-07). Admins only.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const raw = (await searchParams)?.["q"];
  const query = typeof raw === "string" ? raw.slice(0, 100) : "";
  const users = await listUsers(query, LIMIT);

  return (
    <main className="flex flex-col gap-5 pb-10">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Users and roles</h1>
      <p>
        <strong>Member</strong>: every reader. <strong>Contributor</strong>: what a contributor may
        do is still to be decided; for now, the same as a member. <strong>Admin</strong>: the whole
        admin area. You can&rsquo;t change your own role, and the last admin always stays an admin.
      </p>
      <form
        role="search"
        action="/admin/users"
        method="GET"
        className="flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-1.5 font-semibold">
          Find someone by email or display name
          <input
            name="q"
            type="search"
            defaultValue={query}
            className="h-11 w-full max-w-[24rem] rounded-2xl border-[1.5px] border-muted-foreground bg-card px-3 text-base font-normal"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground"
        >
          Search
        </button>
      </form>
      {users.length === 0 ? (
        <p>{query ? `No one matches "${query}".` : "No one has an account yet."}</p>
      ) : (
        <div role="region" aria-label="People, scrollable" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left">
            <caption className="sr-only">
              {users.length === LIMIT ? `The newest ${LIMIT} people` : "Everyone"}, newest first
            </caption>
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Display name</th>
                <th scope="col">Joined</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border align-top">
                  <td className="py-2.5 pr-3 [overflow-wrap:anywhere]">{user.email}</td>
                  <td className="py-2.5 pr-3">{user.displayName ?? "–"}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <time dateTime={user.createdAt.toISOString()}>
                      {DATE.format(user.createdAt)}
                    </time>
                  </td>
                  <td className="py-2.5">
                    {user.id === admin.userId ? (
                      `${ROLE_LABEL[user.role]} (you)`
                    ) : (
                      <RoleControl
                        userId={user.id}
                        role={user.role}
                        who={user.displayName ?? user.email}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
