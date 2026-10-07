import { logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { commentRepository, currentUserId } from "../../../../../lib/comments";
import { commentsEnabled } from "../../../../../lib/feature-flags";
import { withObservability } from "../../../../../lib/observability";
import { noStore, readFields } from "../../../../../lib/request-guards";

/**
 * Deletes the signed-in reader's own comment (MVP-040), for good, with any
 * reports on it. Someone else's comment, or none, is the same 404.
 */
export const POST = withObservability(
  "POST /api/comments/[id]/delete",
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    if (!commentsEnabled())
      return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));
    const read = await readFields(request, []);
    if ("response" in read) return noStore(read.response);
    const userId = await currentUserId();
    if (!userId) return noStore(NextResponse.json({ error: "sign-in" }, { status: 401 }));

    const { id } = await context.params;
    const deleted = await commentRepository.deleteOwn(id, userId);
    if (!deleted) return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));
    logger.info("comments.deleted_by_author", { commentId: id });
    return noStore(NextResponse.json({ ok: true }));
  },
);
