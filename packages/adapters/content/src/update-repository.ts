import type { PrismaClient } from "@ppu/db";
import { DUE_BATCH_SIZE } from "./content-repository.js";
import {
  isValidArticleStatusTransition,
  type PublishedUpdate,
  type Technology,
  type UpdateCreateInput,
  type UpdateInput,
  type UpdateKind,
  type UpdateRecord,
  type UpdateRepository,
  type UpdateStatus,
} from "@ppu/domain-content";

/**
 * Platform updates (MVP-033 slice D) against Prisma. Mirrors
 * PrismaContentRepository's article rules: created DRAFT, content edits never
 * touch status or publishedAt, and publishing is one transaction that also
 * appends the audit event.
 */
export class PrismaUpdateRepository implements UpdateRepository {
  constructor(private readonly db: PrismaClient) {}

  async createUpdate(input: UpdateCreateInput): Promise<UpdateRecord> {
    const row = await this.db.updateItem.create({ data: { ...input } });
    return toUpdateRecord(row);
  }

  async updateUpdate(id: string, input: UpdateInput): Promise<UpdateRecord> {
    const row = await this.db.updateItem.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        technology: input.technology,
        kind: input.kind,
        action: input.action,
        sourceUrl: input.sourceUrl,
        effectiveDate: input.effectiveDate,
        replacement: input.replacement,
      },
    });
    return toUpdateRecord(row);
  }

  async publishUpdate(id: string, actorUserId: string): Promise<UpdateRecord> {
    const publishedAt = new Date();
    const row = await this.db.$transaction(async (tx) => {
      const current = await tx.updateItem.findUnique({ where: { id } });
      if (!current) throw new Error(`Update ${id} not found`);
      if (!isValidArticleStatusTransition(current.status as UpdateStatus, "PUBLISHED")) {
        throw new Error(`Cannot publish an update in status ${current.status}`);
      }
      // MVP-050: publishing by hand also clears any schedule.
      const updated = await tx.updateItem.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt, scheduledFor: null },
      });
      await tx.updatePublishEvent.create({
        data: { updateId: id, actorUserId, action: "PUBLISHED" },
      });
      return updated;
    });
    return toUpdateRecord(row);
  }

  /** MVP-050: as PrismaContentRepository.scheduleArticle. */
  async scheduleUpdate(id: string, at: Date, actorUserId: string): Promise<UpdateRecord> {
    const row = await this.db.$transaction(async (tx) => {
      const current = await tx.updateItem.findUnique({ where: { id } });
      if (!current) throw new Error(`Update ${id} not found`);
      if (current.status !== "DRAFT") {
        throw new Error(`Cannot schedule an update in status ${current.status}`);
      }
      const updated = await tx.updateItem.update({ where: { id }, data: { scheduledFor: at } });
      await tx.updateScheduleEvent.create({
        data: { updateId: id, actorUserId, action: "SCHEDULED", scheduledFor: at },
      });
      return updated;
    });
    return toUpdateRecord(row);
  }

  /** MVP-050: as PrismaContentRepository.cancelArticleSchedule. */
  async cancelUpdateSchedule(id: string, actorUserId: string): Promise<UpdateRecord> {
    const row = await this.db.$transaction(async (tx) => {
      const current = await tx.updateItem.findUnique({ where: { id } });
      if (!current) throw new Error(`Update ${id} not found`);
      if (current.status !== "DRAFT" || !current.scheduledFor) {
        throw new Error(`Update ${id} has no schedule to cancel`);
      }
      const updated = await tx.updateItem.update({ where: { id }, data: { scheduledFor: null } });
      await tx.updateScheduleEvent.create({
        data: { updateId: id, actorUserId, action: "CANCELLED" },
      });
      return updated;
    });
    return toUpdateRecord(row);
  }

  /** MVP-050: as PrismaContentRepository.publishDueArticles, including the claim that stops a double publish. */
  async publishDueUpdates(now: Date): Promise<UpdateRecord[]> {
    const due = await this.db.updateItem.findMany({
      where: { status: "DRAFT", scheduledFor: { lte: now } },
      select: { id: true, scheduledFor: true, authorUserId: true },
      orderBy: [{ scheduledFor: "asc" }, { id: "asc" }],
      take: DUE_BATCH_SIZE,
    });
    const published: UpdateRecord[] = [];
    for (const candidate of due) {
      const scheduledFor = candidate.scheduledFor as Date;
      const row = await this.db.$transaction(async (tx) => {
        const claimed = await tx.updateItem.updateMany({
          where: { id: candidate.id, status: "DRAFT", scheduledFor },
          data: { status: "PUBLISHED", publishedAt: scheduledFor, scheduledFor: null },
        });
        if (claimed.count === 0) return null;
        const scheduled = await tx.updateScheduleEvent.findFirst({
          where: { updateId: candidate.id, action: "SCHEDULED" },
          orderBy: { createdAt: "desc" },
          select: { actorUserId: true },
        });
        await tx.updatePublishEvent.create({
          data: {
            updateId: candidate.id,
            actorUserId: scheduled?.actorUserId ?? candidate.authorUserId,
            action: "PUBLISHED",
          },
        });
        return tx.updateItem.findUnique({ where: { id: candidate.id } });
      });
      if (row) published.push(toUpdateRecord(row));
    }
    return published;
  }

  async findUpdateById(id: string): Promise<UpdateRecord | null> {
    const row = await this.db.updateItem.findUnique({ where: { id } });
    return row ? toUpdateRecord(row) : null;
  }

  async findUpdateBySlug(slug: string): Promise<UpdateRecord | null> {
    const row = await this.db.updateItem.findUnique({ where: { slug } });
    return row ? toUpdateRecord(row) : null;
  }

  async listUpdates(): Promise<UpdateRecord[]> {
    const rows = await this.db.updateItem.findMany({ orderBy: [{ createdAt: "desc" }] });
    return rows.map(toUpdateRecord);
  }

  /** Newest first. With `technology`, only that area's updates (a hub's "What changed"). */
  async listPublishedUpdates(options: {
    limit: number;
    technology?: Technology;
  }): Promise<PublishedUpdate[]> {
    const rows = await this.db.updateItem.findMany({
      where: {
        status: "PUBLISHED",
        ...(options.technology ? { technology: options.technology } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { slug: "asc" }],
      take: options.limit,
    });
    return rows.map((row) => {
      const record = toUpdateRecord(row);
      return {
        id: record.id,
        slug: record.slug,
        title: record.title,
        summary: record.summary,
        technology: record.technology,
        kind: record.kind,
        action: record.action,
        sourceUrl: record.sourceUrl,
        effectiveDate: record.effectiveDate,
        replacement: record.replacement,
        // PUBLISHED rows always have publishedAt set.
        publishedAt: record.publishedAt as Date,
      };
    });
  }

  async listPublishedUpdateTimes(limit: number): Promise<Date[]> {
    const rows = await this.db.updateItem.findMany({
      where: { status: "PUBLISHED" },
      select: { publishedAt: true },
      orderBy: [{ publishedAt: "desc" }],
      take: limit,
    });
    return rows.map((row) => row.publishedAt as Date);
  }
}

function toUpdateRecord(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  technology: string | null;
  kind: string;
  action: string | null;
  sourceUrl: string;
  effectiveDate: Date | null;
  replacement: string | null;
  status: string;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}): UpdateRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    technology: row.technology as Technology | null,
    kind: row.kind as UpdateKind,
    action: row.action,
    sourceUrl: row.sourceUrl,
    effectiveDate: row.effectiveDate,
    replacement: row.replacement,
    status: row.status as UpdateStatus,
    publishedAt: row.publishedAt,
    scheduledFor: row.scheduledFor,
    authorUserId: row.authorUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
