import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { commentRepository } from "../../../../../../lib/comments";
import { commentsEnabled } from "../../../../../../lib/feature-flags";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";

const ACTIONS = {
  remove: (id: string) => commentRepository.setRemoved(id, true),
  restore: (id: string) => commentRepository.setRemoved(id, false),
  accept: (id: string) => commentRepository.setAccepted(id, true),
  unaccept: (id: string) => commentRepository.setAccepted(id, false),
} as const;

/**
 * Moderates a comment (MVP-040): remove (hidden from the guide, kept for the
 * record), restore, or mark as the guide's accepted fix. Admin only; anyone
 * else gets the same 404 an unknown route gives.
 */
export const POST = withObservability(
  "POST /api/admin/comments/[id]/[action]",
  async (_request: Request, { params }: { params: Promise<{ id: string; action: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin || !commentsEnabled()) return notFoundForNonAdmin(correlationId);
    const { id, action } = await params;
    if (!(action in ACTIONS)) return notFoundForNonAdmin(correlationId);
    const done = await ACTIONS[action as keyof typeof ACTIONS](id);
    logger.info("comments.moderated", { commentId: id, action, done, actorUserId: admin.userId });
    return NextResponse.json({ ok: true, done });
  },
);
