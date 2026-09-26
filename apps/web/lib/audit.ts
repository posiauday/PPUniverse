import { prisma } from "@ppu/db";
import { catalogRepository } from "./catalog";

/**
 * A unified, read-only admin audit log (MVP-019, FR-015/NFR-009; direct
 * product-owner decision, "MVP-019 operations console and audit" --
 * question 4). Reads and merges the existing append-only per-domain event
 * tables rather than writing to a new unified table: ProductStatusEvent
 * (MVP-019, this story), DeletionRequestEvent (MVP-020), and
 * ArticlePublishEvent (MVP-017). No new schema, no dual writes, no change
 * to any existing write path. ReleasePublishEvent (MVP-014) is a fourth,
 * pending source -- see this story's pre-work analysis, section 8, for why
 * it is deliberately not included here yet (MVP-014 has not merged) and how
 * it will be added later as a purely additive change.
 *
 * `limit` bounds each underlying query independently, then the merged,
 * sorted result is truncated to `limit` overall -- so increasing the number
 * of source tables can never silently shrink how far back any single
 * domain's history is visible.
 */

export type AuditLogDomain = "product_status" | "deletion_request" | "article_publish";

export interface AuditLogEntry {
  id: string;
  domain: AuditLogDomain;
  actorUserId: string;
  summary: string;
  reason: string | null;
  occurredAt: Date;
}

async function listProductStatusEntries(limit: number): Promise<AuditLogEntry[]> {
  const rows = await catalogRepository.listRecentProductStatusEvents(limit);
  return rows.map((row) => ({
    id: row.id,
    domain: "product_status",
    actorUserId: row.actorUserId,
    summary: `Changed product "${row.productName}" from ${row.fromStatus} to ${row.toStatus}`,
    reason: row.reason,
    occurredAt: row.createdAt,
  }));
}

async function listDeletionRequestEntries(limit: number): Promise<AuditLogEntry[]> {
  const rows = await prisma.deletionRequestEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: { deletionRequest: { include: { user: { select: { email: true } } } } },
  });
  return rows.map((row) => ({
    id: row.id,
    domain: "deletion_request",
    actorUserId: row.actorUserId,
    summary: `Deletion request for ${row.deletionRequest.user.email} moved to ${row.toState}`,
    reason: row.reason,
    occurredAt: row.occurredAt,
  }));
}

async function listArticlePublishEntries(limit: number): Promise<AuditLogEntry[]> {
  const rows = await prisma.articlePublishEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { article: { select: { title: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    domain: "article_publish",
    actorUserId: row.actorUserId,
    summary: `${row.action === "PUBLISHED" ? "Published" : row.action} article "${row.article.title}"`,
    reason: null,
    occurredAt: row.createdAt,
  }));
}

export async function listRecentAuditLogEntries(limit: number): Promise<AuditLogEntry[]> {
  const [productStatus, deletionRequests, articlePublishes] = await Promise.all([
    listProductStatusEntries(limit),
    listDeletionRequestEntries(limit),
    listArticlePublishEntries(limit),
  ]);
  return [...productStatus, ...deletionRequests, ...articlePublishes]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit);
}
