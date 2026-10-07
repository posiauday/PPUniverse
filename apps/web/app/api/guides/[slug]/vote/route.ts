import { NextResponse } from "next/server";
import { logger } from "@ppu/telemetry";
import { contentRepository } from "../../../../../lib/content";
import { LIMITS, feedbackKey, feedbackRepository } from "../../../../../lib/feedback";
import { withObservability } from "../../../../../lib/observability";
import { clientIp, noStore, readFields } from "../../../../../lib/request-guards";

/**
 * "Did this fix it?" (MVP-039): { helpful: "yes" | "no" } for a published
 * guide. Nothing about the reader is stored. A repeat vote, or one over the
 * hourly limit, is quietly not counted and still answered "ok", so the
 * answer can't be used to probe the limits.
 */
export const POST = withObservability(
  "POST /api/guides/[slug]/vote",
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    const read = await readFields(request, ["helpful"]);
    if ("response" in read) return noStore(read.response);
    const helpful = read.fields["helpful"];
    if (helpful !== "yes" && helpful !== "no") {
      return noStore(NextResponse.json({ error: "bad-request" }, { status: 400 }));
    }
    const { slug } = await context.params;
    const article = await contentRepository.findPublishedArticleBySlug(slug);
    if (!article) return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));

    const ip = clientIp(request);
    const now = new Date();
    const { votePerGuide, votesPerAddress } = LIMITS;
    const allowed =
      (await feedbackRepository.consumeAllowance(
        feedbackKey("vote", ip, article.id),
        votePerGuide.limit,
        votePerGuide.windowMs,
        now,
      )) &&
      (await feedbackRepository.consumeAllowance(
        feedbackKey("votes", ip),
        votesPerAddress.limit,
        votesPerAddress.windowMs,
        now,
      ));
    if (allowed) await feedbackRepository.recordVote(article.id, helpful === "yes");
    logger.info("feedback.vote", { slug, helpful, counted: allowed });
    return noStore(NextResponse.json({ ok: true }));
  },
);
