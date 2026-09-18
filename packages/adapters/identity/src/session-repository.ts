import type { PrismaClient } from "@ppu/db";
import type { SessionRepository, SessionSummary } from "@ppu/domain-identity";

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: PrismaClient) {}

  async listByUser(userId: string): Promise<SessionSummary[]> {
    const rows = await this.db.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toSessionSummary);
  }

  async findById(id: string): Promise<SessionSummary | null> {
    const row = await this.db.session.findUnique({ where: { id } });
    return row ? toSessionSummary(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    await this.db.session.delete({ where: { id } });
  }
}

function toSessionSummary(row: {
  id: string;
  userId: string;
  expires: Date;
  createdAt: Date;
}): SessionSummary {
  return { id: row.id, userId: row.userId, expires: row.expires, createdAt: row.createdAt };
}
