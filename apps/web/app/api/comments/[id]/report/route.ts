import { logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { COMMENT_LIMITS, commentRepository } from "../../../../../lib/comments";
import { feedbackKey, feedbackRepository } from "../../../../../lib/feedback";
import { commentsEnabled } from "../../../../../lib/feature-flags";
import { withObservability } from "../../../../../lib/observability";
import { clientIp, noStore, readFields } from "../../../../../lib/request-guards";

/**
 * Reports a comment (MVP-040). Anyone may report; nothing about them is
 * kept, and a hashed per-address counter limits reports. The comment stays
 * up until an admin removes it in /admin/comments.
 */
export const POST = withObservability(
  "POST /api/comments/[id]/report",
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    if (!commentsEnabled())
      return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));
    const read = await readFields(request, []);
    if ("response" in read) return noStore(read.response);

    const { reportsPerAddress } = COMMENT_LIMITS;
    const allowed = await feedbackRepository.consumeAllowance(
      feedbackKey("comment-reports", clientIp(request)),
      reportsPerAddress.limit,
      reportsPerAddress.windowMs,
      new Date(),
    );
    if (!allowed) return noStore(NextResponse.json({ error: "too-many" }, { status: 429 }));

    const { id } = await context.params;
    const reported = await commentRepository.report(id);
    if (!reported) return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));
    logger.info("comments.reported", { commentId: id });
    return noStore(NextResponse.json({ ok: true }));
  },
);
