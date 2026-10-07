import { Prisma, type PrismaClient } from "@ppu/db";
import {
  displayNameKey,
  generateDisplayName,
  type AdminComment,
  type CommentRepository,
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

/**
 * Comments on guides and readers' public profiles (MVP-040). A comment is
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

  async listVisible(articleId: string, viewerId: string | null): Promise<GuideComment[]> {
    const rows = await this.db.articleComment.findMany({
      where: { articleId, removedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 200,
      select: {
        id: true,
        body: true,
        createdAt: true,
        acceptedAt: true,
        userId: true,
        user: { select: { displayName: true, avatarSeed: true } },
      },
    });
    const comments = rows.map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.createdAt,
      accepted: row.acceptedAt !== null,
      mine: viewerId !== null && row.userId === viewerId,
      // A profile is created before the first comment, so these are set.
      displayName: row.user.displayName ?? "A reader",
      avatarSeed: row.user.avatarSeed ?? row.id,
    }));
    return [...comments.filter((c) => c.accepted), ...comments.filter((c) => !c.accepted)];
  }

  async create(articleId: string, userId: string, body: string): Promise<{ id: string }> {
    return this.db.articleComment.create({ data: { articleId, userId, body }, select: { id: true } });
  }

  async deleteOwn(commentId: string, userId: string): Promise<boolean> {
    const { count } = await this.db.articleComment.deleteMany({ where: { id: commentId, userId } });
    return count === 1;
  }

  async report(commentId: string): Promise<boolean> {
    const comment = await this.db.articleComment.findFirst({
      where: { id: commentId, removedAt: null },
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
        article: { select: { slug: true, title: true } },
        user: { select: { displayName: true, avatarSeed: true } },
        _count: { select: { reports: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      articleSlug: row.article.slug,
      articleTitle: row.article.title,
      body: row.body,
      createdAt: row.createdAt,
      removed: row.removedAt !== null,
      accepted: row.acceptedAt !== null,
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
    const comment = await this.db.articleComment.findFirst({
      where: { id: commentId, removedAt: null },
      select: { articleId: true },
    });
    if (!comment) return false;
    await this.db.$transaction([
      ...(accepted
        ? [
            this.db.articleComment.updateMany({
              where: { articleId: comment.articleId, acceptedAt: { not: null } },
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
}
