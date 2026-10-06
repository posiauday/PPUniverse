import type { PrismaClient } from "@ppu/db";
import type {
  PasswordAuthStore,
  PasswordTokenPurpose,
  StoredToken,
  ThrottleState,
} from "@ppu/domain-identity";

/**
 * Spent or expired links, and throttle counters nobody has touched, are
 * deleted after a day (the Privacy notice's "How long we keep it"). The
 * clean-up runs on each new link or failed attempt, so nothing needs a schedule.
 */
const KEEP_FOR_MS = 24 * 60 * 60 * 1000;

/** Postgres-backed store for email and password sign-in (MVP-036). */
export class PrismaPasswordAuthStore implements PasswordAuthStore {
  constructor(private readonly db: PrismaClient) {}

  async findUserByEmail(email: string) {
    const user = await this.db.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });
    return user ?? null;
  }

  async createOrVerifyUser(email: string, now: Date) {
    const user = await this.db.user.upsert({
      where: { email },
      create: { email, emailVerified: now },
      update: {},
      select: { id: true, emailVerified: true },
    });
    if (!user.emailVerified)
      await this.db.user.update({ where: { id: user.id }, data: { emailVerified: now } });
    return { id: user.id };
  }

  async getCredential(userId: string) {
    const row = await this.db.passwordCredential.findUnique({
      where: { userId },
      select: { hash: true },
    });
    return row?.hash ?? null;
  }

  async setCredential(userId: string, hash: string) {
    await this.db.passwordCredential.upsert({
      where: { userId },
      create: { userId, hash },
      update: { hash },
    });
  }

  async createToken(token: {
    tokenHash: string;
    purpose: PasswordTokenPurpose;
    email: string;
    pendingHash: string | null;
    expiresAt: Date;
  }) {
    const cutoff = new Date(Date.now() - KEEP_FOR_MS);
    await this.db.passwordToken.deleteMany({ where: { expiresAt: { lt: cutoff } } });
    await this.db.passwordToken.create({ data: token });
  }

  async peekToken(
    tokenHash: string,
    purpose: PasswordTokenPurpose,
    now: Date,
  ): Promise<StoredToken | null> {
    const row = await this.db.passwordToken.findFirst({
      where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: now } },
      select: { email: true, pendingHash: true },
    });
    return row ?? null;
  }

  async consumeToken(
    tokenHash: string,
    purpose: PasswordTokenPurpose,
    now: Date,
  ): Promise<StoredToken | null> {
    // One conditional UPDATE: of two requests racing with the same link, only one wins.
    const { count } = await this.db.passwordToken.updateMany({
      where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (count !== 1) return null;
    const row = await this.db.passwordToken.findUnique({
      where: { tokenHash },
      select: { email: true, pendingHash: true },
    });
    return row ?? null;
  }

  async createSession(userId: string, sessionToken: string, expires: Date) {
    await this.db.session.create({ data: { userId, sessionToken, expires } });
  }

  async deleteSessions(userId: string) {
    await this.db.session.deleteMany({ where: { userId } });
  }

  async getThrottle(key: string): Promise<ThrottleState | null> {
    const row = await this.db.authThrottle.findUnique({
      where: { key },
      select: { failures: true, windowStart: true, lockedUntil: true },
    });
    return row ?? null;
  }

  async saveThrottle(key: string, state: ThrottleState) {
    const cutoff = new Date(Date.now() - KEEP_FOR_MS);
    await this.db.authThrottle.deleteMany({
      where: {
        updatedAt: { lt: cutoff },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: cutoff } }],
      },
    });
    await this.db.authThrottle.upsert({ where: { key }, create: { key, ...state }, update: state });
  }

  async clearThrottle(key: string) {
    await this.db.authThrottle.deleteMany({ where: { key } });
  }
}
