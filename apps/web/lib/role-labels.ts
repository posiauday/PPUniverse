/**
 * Roles (MVP-047; docs/final-decisions.md, 2026-10-07): MEMBER (every
 * reader), CONTRIBUTOR (abilities still to be decided; until then exactly a
 * member's) and ADMIN. Only an admin changes roles, at /admin/users. No
 * database code here, so the browser's role control can use it.
 */
export const ROLES = ["MEMBER", "CONTRIBUTOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  MEMBER: "Member",
  CONTRIBUTOR: "Contributor",
  ADMIN: "Admin",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
