import { randomInt } from "node:crypto";
import { prisma } from "@ppu/db";
import { CROWN_SEED, newAvatarSeed } from "./avatar-seeds";
import type { Role } from "./role-labels";

export { ROLES, ROLE_LABEL, isRole, type Role } from "./role-labels";

export type RoleChangeProblem = "unknown-role" | "self" | "same" | "last-admin" | "not-found";

/**
 * Why a role change isn't allowed, or null. An admin can't change their own
 * role (so nobody locks themselves out by mistake), and the last admin can
 * never be made something else.
 */
export function checkRoleChange(input: {
  actorId: string;
  targetId: string;
  from: Role;
  to: Role;
  adminCount: number;
}): RoleChangeProblem | null {
  if (input.actorId === input.targetId) return "self";
  if (input.from === input.to) return "same";
  if (input.from === "ADMIN" && input.adminCount <= 1) return "last-admin";
  return null;
}

/**
 * Changes a role and records it, in one serializable transaction: two admins
 * demoting the last two admins at the same moment can't both succeed.
 */
export async function changeRole(
  actorId: string,
  targetId: string,
  to: Role,
): Promise<{ ok: true; from: Role } | { ok: false; problem: RoleChangeProblem }> {
  return prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true } });
      if (!target) return { ok: false as const, problem: "not-found" as const };
      const from = target.role as Role;
      const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
      const problem = checkRoleChange({ actorId, targetId, from, to, adminCount });
      if (problem) return { ok: false as const, problem };
      await tx.user.update({ where: { id: targetId }, data: { role: to } });
      // The crown is for admins only (2026-10-08): someone who stops being an
      // admin gets a new critter instead, so their comments don't still look
      // like staff (site review, 2026-10-10).
      if (from === "ADMIN" && to !== "ADMIN")
        await tx.user.updateMany({
          where: { id: targetId, avatarSeed: CROWN_SEED },
          data: { avatarSeed: newAvatarSeed(() => randomInt(0, 2 ** 32) / 2 ** 32) },
        });
      await tx.roleChangeEvent.create({
        data: { targetUserId: targetId, actorUserId: actorId, fromRole: from, toRole: to },
      });
      return { ok: true as const, from };
    },
    { isolationLevel: "Serializable" },
  );
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string | null;
  avatarSeed: string | null;
  role: Role;
  createdAt: Date;
}

function matching(query: string) {
  const q = query.trim();
  return q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { displayName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
}

/** People, newest first, optionally filtered by email or display name and by role. */
export async function listUsers(
  query: string,
  limit: number,
  role?: Role,
): Promise<AdminUserRow[]> {
  const rows = await prisma.user.findMany({
    where: { ...matching(query), ...(role ? { role } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: limit,
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarSeed: true,
      role: true,
      createdAt: true,
    },
  });
  return rows.map((row) => ({ ...row, role: row.role as Role }));
}

/** How many people match the search, per role (the Users page's tabs, MVP-052 phase 3). */
export async function countUsersByRole(query: string): Promise<Record<Role, number>> {
  const groups = await prisma.user.groupBy({
    by: ["role"],
    where: matching(query),
    _count: { _all: true },
  });
  const counts = { MEMBER: 0, CONTRIBUTOR: 0, ADMIN: 0 } as Record<Role, number>;
  for (const group of groups) counts[group.role as Role] = group._count._all;
  return counts;
}
