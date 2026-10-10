import { Prisma, type PrismaClient } from "@ppu/db";
import {
  displayNameKey,
  generateDisplayName,
  type AdminComment,
  type CommentRepository,
  type CommentTarget,
  type GuideComment,
  type PublicProfile,
} from "@ppu/domain-content";

/** How many random names to try before falling back to a longer number. */
const NAME_ATTEMPTS = 5;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function randomSeed(random: () => number): string {
  return Math.floor(random() * 2 ** 48).toString(36);
}

/** The column that ties a comment to its guide or component (MVP-051). */
function onTarget(target: CommentTarget): { articleId: string } | { componentId: string } {
  return target.kind === "guide"
    ? { articleId: target.articleId }
    : { componentId: target.componentId };
}

/**
 * Comments on guides (MVP-040) and components (MVP-051), and readers' public
 * profiles. A comment is
 * only ever shown with the author's display name and avatar seed: the email
 * and the sign-in provider's `name` are never selected here.
 */
export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly db: PrismaClient) {}

  async getOrCreateProfile(userId: string, random: () => number): Promise<PublicProfile> {
    const user = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { displayName: true, avatarSeed: true },
    });
    if (user.displayName && user.avatarSeed) {
      return { displayName: user.displayName, avatarSeed: user.avatarSeed };
    }
    const avatarSeed = user.avatarSeed ?? randomSeed(random);
    if (user.displayName) {
      await this.db.user.update({ where: { id: userId }, data: { avatarSeed } });
      return { displayName: user.displayName, avatarSeed };
    }
    for (let attempt = 0; attempt <= NAME_ATTEMPTS; attempt += 1) {
      // Names collide rarely (16 x 16 x 900); the last try adds more digits.
      const base = generateDisplayName(random);
      const displayName =
        attempt < NAME_ATTEMPTS ? base : `${base}${Math.floor(random() * 1000)}`;
      try {
        await this.db.user.update({
          where: { id: userId },
          data: { displayName, displayNameKey: displayNameKey(displayName), avatarSeed },
        });
        return { displayName, avatarSeed };
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new Error("Could not give the reader a unique display name.");
  }

  async setDisplayName(userId: string, name: string): Promise<boolean> {
    try {
      await this.db.user.update({
        where: { id: userId },
        data: { displayName: name, displayNameKey: displayNameKey(name) },
      });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async setAvatarSeed(userId: string, seed: string): Promise<void> {
    await this.db.user.update({ where: { id: userId }, data: { avatarSeed: seed } });
  }

  async listVisible(target: CommentTarget, viewerId: string | null): Promise<GuideComment[]> {
    const rows = await this.db.articleComment.findMany({
      where: { ...onTarget(target), removedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 200,
      select: {
        id: true,
        body: true,
        createdAt: true,
        acceptedAt: true,
        pinnedAt: true,
        userId: true,
        user: { select: { displayName: true, avatarSeed: true } },
      },
    });
    const comments = rows.map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.createdAt,
      accepted: row.acceptedAt !== null,
      team: row.pinnedAt !== null,
      mine: viewerId !== null && row.userId === viewerId,
      // A profile is created before the first comment, so these are set.
      displayName: row.user.displayName ?? "A reader",
      avatarSeed: row.user.avatarSeed ?? row.id,
    }));
    // MVP-053: the team post first, then the accepted answer, then the rest.
    const rank = (c: GuideComment) => (c.team ? 0 : c.accepted ? 1 : 2);
    return [...comments].sort((a, b) => rank(a) - rank(b));
  }

  async create(target: CommentTarget, userId: string, body: string): Promise<{ id: string }> {
    return this.db.articleComment.create({
      data: { ...onTarget(target), userId, body },
      select: { id: true },
    });
  }

  async deleteOwn(commentId: string, userId: string): Promise<boolean> {
    const { count } = await this.db.articleComment.deleteMany({ where: { id: commentId, userId } });
    return count === 1;
  }

  async report(commentId: string): Promise<boolean> {
    // A team post (MVP-053) is the site's own, so it can't be reported.
    const comment = await this.db.articleComment.findFirst({
      where: { id: commentId, removedAt: null, pinnedAt: null },
      select: { id: true },
    });
    if (!comment) return false;
    await this.db.commentReport.create({ data: { commentId } });
    return true;
  }

  async listForAdmin(filter: "reported" | "latest", limit: number): Promise<AdminComment[]> {
    const rows = await this.db.articleComment.findMany({
      where: filter === "reported" ? { removedAt: null, reports: { some: {} } } : {},
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        id: true,
        body: true,
        createdAt: true,
        removedAt: true,
        acceptedAt: true,
        pinnedAt: true,
        article: { select: { slug: true, title: true } },
        component: { select: { slug: true, title: true } },
        user: { select: { displayName: true, avatarSeed: true } },
        _count: { select: { reports: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      // The table's CHECK sets exactly one of the two.
      on: row.article
        ? { kind: "guide" as const, ...row.article }
        : { kind: "component" as const, slug: row.component?.slug ?? "", title: row.component?.title ?? "" },
      body: row.body,
      createdAt: row.createdAt,
      removed: row.removedAt !== null,
      accepted: row.acceptedAt !== null,
      team: row.pinnedAt !== null,
      reportCount: row._count.reports,
      displayName: row.user.displayName ?? "A reader",
      avatarSeed: row.user.avatarSeed ?? row.id,
    }));
  }

  async setRemoved(commentId: string, removed: boolean): Promise<boolean> {
    const { count } = await this.db.articleComment.updateMany({
      where: { id: commentId },
      // A removed comment can't stay the accepted fix.
      data: removed ? { removedAt: new Date(), acceptedAt: null } : { removedAt: null },
    });
    return count === 1;
  }

  async clearReports(commentId: string): Promise<boolean> {
    const { count } = await this.db.commentReport.deleteMany({ where: { commentId } });
    return count > 0;
  }

  async setAccepted(commentId: string, accepted: boolean): Promise<boolean> {
    // A team post (MVP-053) can't be the accepted answer.
    const comment = await this.db.articleComment.findFirst({
      where: { id: commentId, removedAt: null, pinnedAt: null },
      select: { articleId: true, componentId: true },
    });
    if (!comment) return false;
    // One accepted answer per guide or component, not across the site.
    const sameTarget = comment.articleId
      ? { articleId: comment.articleId }
      : { componentId: comment.componentId };
    await this.db.$transaction([
      ...(accepted
        ? [
            this.db.articleComment.updateMany({
              where: { ...sameTarget, acceptedAt: { not: null } },
              data: { acceptedAt: null },
            }),
          ]
        : []),
      this.db.articleComment.update({
        where: { id: commentId },
        data: { acceptedAt: accepted ? new Date() : null },
      }),
    ]);
    return true;
  }

  async findTeamPost(componentId: string): Promise<{ id: string; body: string } | null> {
    return this.db.articleComment.findFirst({
      where: { componentId, removedAt: null, pinnedAt: { not: null } },
      orderBy: [{ pinnedAt: "desc" }, { id: "desc" }],
      select: { id: true, body: true },
    });
  }

  async saveTeamPost(componentId: string, userId: string, body: string): Promise<{ id: string }> {
    return this.db.$transaction(async (tx) => {
      const live = await tx.articleComment.findFirst({
        where: { componentId, removedAt: null, pinnedAt: { not: null } },
        orderBy: [{ pinnedAt: "desc" }, { id: "desc" }],
        select: { id: true },
      });
      if (live) {
        return tx.articleComment.update({
          where: { id: live.id },
          data: { body, userId },
          select: { id: true },
        });
      }
      return tx.articleComment.create({
        data: { componentId, userId, body, pinnedAt: new Date() },
        select: { id: true },
      });
    });
  }
}
