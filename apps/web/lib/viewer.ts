import { prisma } from "@ppu/db";

/** What the header shows about the signed-in reader. */
export interface ViewerSummary {
  isAdmin: boolean;
  /** Null until the reader's profile is created (on first comment or profile visit). */
  displayName: string | null;
  /** Draws their avatar; falls back to the user id until a profile exists. */
  avatarSeed: string;
}

/**
 * The signed-in reader's avatar, name and whether they're an admin, for the
 * header: one small query. The role is read from the database, never the
 * session (the same rule as requireAdmin). Showing the Admin link is a
 * convenience only: every admin page and route still checks the role itself.
 */
export async function loadViewerSummary(userId: string): Promise<ViewerSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, displayName: true, avatarSeed: true },
  });
  return {
    isAdmin: user?.role === "ADMIN",
    displayName: user?.displayName ?? null,
    avatarSeed: user?.avatarSeed ?? userId,
  };
}
