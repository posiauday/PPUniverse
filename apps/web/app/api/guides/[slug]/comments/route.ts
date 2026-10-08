import { cleanCommentBody } from "@ppu/domain-content";
import { logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import {
  COMMENT_LIMITS,
  commentRepository,
  currentUserId,
  secureRandom,
} from "../../../../../lib/comments";
import { contentRepository } from "../../../../../lib/content";
import { feedbackKey, feedbackRepository } from "../../../../../lib/feedback";
import { commentsEnabled } from "../../../../../lib/feature-flags";
import { withObservability } from "../../../../../lib/observability";
import { noStore, readFields } from "../../../../../lib/request-guards";

/** 2,000 characters can take up to 8,000 bytes in UTF-8, plus the JSON around them. */
const MAX_BYTES = 9000;

/**
 * Posts a comment on a published guide (MVP-040): signed-in readers only,
 * plain text with ``` code, at most 2 links. It shows at once. The reader's
 * profile (display name and avatar) is created on their first comment. The
 * text is never logged.
 */
export const POST = withObservability(
  "POST /api/guides/[slug]/comments",
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    if (!commentsEnabled())
      return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));
    const read = await readFields(request, ["body"], MAX_BYTES);
    if ("response" in read) return noStore(read.response);
    const userId = await currentUserId();
    if (!userId) return noStore(NextResponse.json({ error: "sign-in" }, { status: 401 }));

    const cleaned = cleanCommentBody(read.fields["body"] ?? "");
    if (!cleaned.ok) return noStore(NextResponse.json({ error: cleaned.problem }, { status: 400 }));

    const { slug } = await context.params;
    const article = await contentRepository.findPublishedArticleBySlug(slug);
    if (!article) return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));

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
      logger.info("comments.limited", { slug });
      return noStore(NextResponse.json({ error: "too-many" }, { status: 429 }));
    }

    await commentRepository.getOrCreateProfile(userId, secureRandom);
    const { id } = await commentRepository.create(article.id, userId, cleaned.body);
    logger.info("comments.created", { slug, commentId: id, length: cleaned.body.length });
    return noStore(NextResponse.json({ ok: true, id }));
  },
);
