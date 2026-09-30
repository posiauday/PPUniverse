import type { PrismaClient } from "@ppu/db";
import {
  isActiveDeletionRequestState,
  type ConsentRecord,
  type ConsentRecordInput,
  type DeletionRequestEventRecord,
  type DeletionRequestRecord,
  type DeletionRequestState,
  type PrivacyRepository,
} from "@ppu/domain-privacy";

export class PrismaPrivacyRepository implements PrivacyRepository {
  constructor(private readonly db: PrismaClient) {}

  /** Always inserts — never updates an earlier ConsentRecord row (append-only). */
  async recordConsent(input: ConsentRecordInput): Promise<ConsentRecord> {
    const row = await this.db.consentRecord.create({
      data: {
        userId: input.userId,
        category: input.category,
        granted: input.granted,
        policyVersionId: input.policyVersionId,
      },
    });
    return toConsentRecord(row);
  }

  /**
   * The latest row per category for this user. Uses Prisma's `distinct`
   * (SQL DISTINCT ON semantics under Postgres) against `recordedAt desc`, so
   * this is one query, not N — the row kept per category is the first one
   * in that order, i.e. the newest.
   */
  async getCurrentConsent(userId: string): Promise<ConsentRecord[]> {
    const rows = await this.db.consentRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      distinct: ["category"],
    });
    return rows.map(toConsentRecord);
  }

  /**
   * Creates the request and its initial SUBMITTED event atomically — a
   * DeletionRequest is never persisted without at least one event (the
   * domain layer's currentDeletionRequestState assumes this).
   */
  async createDeletionRequest(userId: string): Promise<DeletionRequestRecord> {
    const created = await this.db.$transaction(async (tx) => {
      const request = await tx.deletionRequest.create({ data: { userId } });
      const event = await tx.deletionRequestEvent.create({
        data: {
          deletionRequestId: request.id,
          toState: "SUBMITTED",
          actorUserId: userId,
          reason: null,
        },
      });
      return { request, events: [event] };
    });
    return toDeletionRequestRecord({ ...created.request, events: created.events });
  }

  /** Always inserts a new event — the DeletionRequest row itself is never updated. */
  async appendDeletionRequestEvent(
    deletionRequestId: string,
    toState: DeletionRequestState,
    actorUserId: string,
    reason: string | null,
  ): Promise<DeletionRequestEventRecord> {
    const row = await this.db.deletionRequestEvent.create({
      data: { deletionRequestId, toState, actorUserId, reason },
    });
    return toDeletionRequestEventRecord(row);
  }

  async getLatestDeletionRequestForUser(userId: string): Promise<DeletionRequestRecord | null> {
    const row = await this.db.deletionRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { events: { orderBy: { occurredAt: "asc" } } },
    });
    return row ? toDeletionRequestRecord(row) : null;
  }

  async getDeletionRequestById(id: string): Promise<DeletionRequestRecord | null> {
    const row = await this.db.deletionRequest.findUnique({
      where: { id },
      include: { events: { orderBy: { occurredAt: "asc" } } },
    });
    return row ? toDeletionRequestRecord(row) : null;
  }

  /**
   * Every request whose latest event is an active state (SUBMITTED,
   * UNDER_REVIEW or APPROVED) — the admin queue. Finds each request's latest
   * event in one query (DISTINCT ON deletionRequestId, newest first), then
   * fetches full history only for the requests that are actually active.
   */
  async listActiveDeletionRequests(): Promise<DeletionRequestRecord[]> {
    const latestEvents = await this.db.deletionRequestEvent.findMany({
      orderBy: [{ deletionRequestId: "asc" }, { occurredAt: "desc" }],
      distinct: ["deletionRequestId"],
    });
    const activeIds = latestEvents
      .filter((event) => isActiveDeletionRequestState(event.toState as DeletionRequestState))
      .map((event) => event.deletionRequestId);

    if (activeIds.length === 0) {
      return [];
    }

    const rows = await this.db.deletionRequest.findMany({
      where: { id: { in: activeIds } },
      orderBy: { createdAt: "asc" },
      include: { events: { orderBy: { occurredAt: "asc" } } },
    });
    return rows.map(toDeletionRequestRecord);
  }
}

function toConsentRecord(row: {
  id: string;
  userId: string;
  category: string;
  granted: boolean;
  policyVersionId: string | null;
  recordedAt: Date;
}): ConsentRecord {
  return {
    id: row.id,
    userId: row.userId,
    category: row.category as ConsentRecord["category"],
    granted: row.granted,
    policyVersionId: row.policyVersionId,
    recordedAt: row.recordedAt,
  };
}

function toDeletionRequestEventRecord(row: {
  id: string;
  deletionRequestId: string;
  toState: string;
  actorUserId: string;
  reason: string | null;
  occurredAt: Date;
}): DeletionRequestEventRecord {
  return {
    id: row.id,
    deletionRequestId: row.deletionRequestId,
    toState: row.toState as DeletionRequestState,
    actorUserId: row.actorUserId,
    reason: row.reason,
    occurredAt: row.occurredAt,
  };
}

function toDeletionRequestRecord(row: {
  id: string;
  userId: string;
  createdAt: Date;
  events: Array<{
    id: string;
    deletionRequestId: string;
    toState: string;
    actorUserId: string;
    reason: string | null;
    occurredAt: Date;
  }>;
}): DeletionRequestRecord {
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    events: row.events.map(toDeletionRequestEventRecord),
  };
}
