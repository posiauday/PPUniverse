import { randomInt } from "node:crypto";
import { PrismaCommentRepository } from "@ppu/adapter-content";
import type { GuideComment, PublicProfile } from "@ppu/domain-content";
import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { commentsEnabled } from "./feature-flags";

/**
 * Comments on guides and readers' profiles (MVP-040), wired to the database.
 * Abuse limits reuse the hashed counters of guide feedback (lib/feedback.ts).
 */
export const commentRepository = new PrismaCommentRepository(prisma);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * - At most 5 comments an hour and 20 a day from one reader.
 * - At most 10 reports an hour from one address.
 * - At most 10 profile changes a day from one reader.
 */
export const COMMENT_LIMITS = {
  commentsPerHour: { limit: 5, windowMs: HOUR },
  commentsPerDay: { limit: 20, windowMs: DAY },
  reportsPerAddress: { limit: 10, windowMs: HOUR },
  profileChangesPerDay: { limit: 10, windowMs: DAY },
} as const;

/** A cryptographically random number in [0, 1), for names and avatar seeds. */
export function secureRandom(): number {
  return randomInt(0, 2 ** 32) / 2 ** 32;
}

/** The signed-in reader's id, or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/**
 * What the guide page needs for its comments, or null when comments are off
 * or can't be read (the page then shows no comments section rather than fail).
 * A signed-in reader is given their profile here, the first time.
 */
export async function loadGuideComments(
  articleId: string,
): Promise<{ comments: GuideComment[]; viewer: PublicProfile | null } | null> {
  if (!commentsEnabled()) return null;
  try {
    const userId = await currentUserId();
    const [comments, viewer] = await Promise.all([
      commentRepository.listVisible(articleId, userId),
      userId ? commentRepository.getOrCreateProfile(userId, secureRandom) : Promise.resolve(null),
    ]);
    return { comments, viewer };
  } catch {
    return null;
  }
}
