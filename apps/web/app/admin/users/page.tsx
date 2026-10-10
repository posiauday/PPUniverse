import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/require-admin";
import { ROLES, ROLE_LABEL, countUsersByRole, listUsers } from "../../../lib/roles";
import { SITE_NAME } from "../../../lib/seo/site";
import { Avatar } from "../../Avatar";
import { ListFrame, ListRow, ListToolbar } from "../AdminList";
import { AdminPageHeader } from "../AdminPageHeader";
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

const COLUMNS = "md:grid-cols-[minmax(0,1fr)_9rem_minmax(14rem,auto)]";

const TAB_KEY = { ADMIN: "admins", CONTRIBUTOR: "contributors", MEMBER: "members" } as const;
const TAB_LABEL = { ADMIN: "Admins", CONTRIBUTOR: "Contributors", MEMBER: "Members" } as const;

/**
 * Users and roles (MVP-047, admin panel slice 2; redesigned in MVP-052 phase
 * 3): everyone with an account, newest first, searchable by email or display
 * name, with role tabs and counts, and each person's role. A Contributor can
 * do nothing a member can't until the product owner decides
 * (docs/final-decisions.md, 2026-10-07). Admins only.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const params = (await searchParams) ?? {};
  const raw = params["q"];
  const query = typeof raw === "string" ? raw.slice(0, 100) : "";
  const roleParam = typeof params["role"] === "string" ? params["role"] : "";
  const role = ROLES.find((value) => TAB_KEY[value] === roleParam);
  const [users, counts] = await Promise.all([
    listUsers(query, LIMIT, role),
    countUsersByRole(query),
  ]);
  const total = ROLES.reduce((sum, value) => sum + counts[value], 0);

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Users and roles"
        description={
          <>
            <strong>Member</strong>: every reader. <strong>Contributor</strong>: what a contributor
            may do is still to be decided; for now, the same as a member. <strong>Admin</strong>:
            the whole admin area. You can&rsquo;t change your own role, and the last admin always
            stays an admin.
          </>
        }
      />
      <ListToolbar
        path="/admin/users"
        noun="people"
        label="Find someone by email or display name"
        query={query}
        status={role ? TAB_KEY[role] : "all"}
        tabs={[
          { key: "all", label: "Everyone", count: total },
          ...(["ADMIN", "CONTRIBUTOR", "MEMBER"] as const).map((value) => ({
            key: TAB_KEY[value],
            label: TAB_LABEL[value],
            count: counts[value],
          })),
        ]}
        statusParam="role"
      />
      <ListFrame
        headings={["Person", "Joined", "Role"]}
        columns={COLUMNS}
        empty={query ? <>No one matches &ldquo;{query}&rdquo;.</> : <>No one here yet.</>}
      >
        {users.map((user) => (
          <ListRow key={user.id} columns={COLUMNS}>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                seed={user.avatarSeed ?? user.id}
                name={user.displayName ?? undefined}
                size={36}
              />
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="font-semibold">{user.displayName ?? "No display name yet"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Joined{" "}
              <time dateTime={user.createdAt.toISOString()}>{DATE.format(user.createdAt)}</time>
            </p>
            <div className="md:justify-self-end">
              {user.id === admin.userId ? (
                <span className="text-sm font-semibold">{ROLE_LABEL[user.role]} (you)</span>
              ) : (
                <RoleControl
                  userId={user.id}
                  role={user.role}
                  who={user.displayName ?? user.email}
                />
              )}
            </div>
          </ListRow>
        ))}
      </ListFrame>
      {users.length === LIMIT ? (
        <p className="text-sm text-muted-foreground">
          Showing the newest {LIMIT}. Search to find someone else.
        </p>
      ) : null}
    </main>
  );
}
