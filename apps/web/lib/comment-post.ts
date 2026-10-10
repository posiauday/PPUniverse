import { cleanCommentBody, type CommentTarget } from "@ppu/domain-content";
import { logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { COMMENT_LIMITS, commentRepository, currentUserId, secureRandom } from "./comments";
import { feedbackKey, feedbackRepository } from "./feedback";
import { commentsEnabled } from "./feature-flags";
import { noStore, readFields } from "./request-guards";

/** 2,000 characters can take up to 8,000 bytes in UTF-8, plus the JSON around them. */
const MAX_BYTES = 9000;

/**
 * Posts a comment on a published guide (MVP-040) or component (MVP-051):
 * signed-in readers only, plain text with ``` code, at most 2 links, and the
 * same hourly and daily limits wherever they post. It shows at once. The
 * reader's profile (display name and avatar) is created on their first
 * comment. The text is never logged. `findTarget` answers null for anything
 * that isn't public, which is a 404.
 */
export async function postComment(
  request: Request,
  slug: string,
  findTarget: () => Promise<CommentTarget | null>,
): Promise<Response> {
  if (!commentsEnabled())
    return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));
  const read = await readFields(request, ["body"], MAX_BYTES);
  if ("response" in read) return noStore(read.response);
  const userId = await currentUserId();
  if (!userId) return noStore(NextResponse.json({ error: "sign-in" }, { status: 401 }));

  const cleaned = cleanCommentBody(read.fields["body"] ?? "");
  if (!cleaned.ok) return noStore(NextResponse.json({ error: cleaned.problem }, { status: 400 }));

  const target = await findTarget();
  if (!target) return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));

  const now = new Date();
  const { commentsPerHour, commentsPerDay } = COMMENT_LIMITS;
  const allowed =
    (await feedbackRepository.consumeAllowance(
      feedbackKey("comments-hour", userId),
      commentsPerHour.limit,
      commentsPerHour.windowMs,
      now,
    )) &&
    (await feedbackRepository.consumeAllowance(
      feedbackKey("comments-day", userId),
      commentsPerDay.limit,
      commentsPerDay.windowMs,
      now,
    ));
  if (!allowed) {
    logger.info("comments.limited", { on: target.kind, slug });
    return noStore(NextResponse.json({ error: "too-many" }, { status: 429 }));
  }

  await commentRepository.getOrCreateProfile(userId, secureRandom);
  const { id } = await commentRepository.create(target, userId, cleaned.body);
  logger.info("comments.created", {
    on: target.kind,
    slug,
    commentId: id,
    length: cleaned.body.length,
  });
  return noStore(NextResponse.json({ ok: true, id }));
}
