import { cleanReportMessage } from "@ppu/domain-content";
import { NextResponse } from "next/server";
import { logger } from "@ppu/telemetry";
import { contentRepository } from "../../../../../lib/content";
import { LIMITS, feedbackKey, feedbackRepository } from "../../../../../lib/feedback";
import { withObservability } from "../../../../../lib/observability";
import { clientIp, noStore, readFields } from "../../../../../lib/request-guards";

/**
 * "Something here changed?" (MVP-038): { message } for a published guide,
 * 10–500 characters, anonymous. It waits in /admin/feedback until closed.
 * The message is never logged.
 */
export const POST = withObservability(
  "POST /api/guides/[slug]/report",
  async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    const read = await readFields(request, ["message"]);
    if ("response" in read) return noStore(read.response);
    const cleaned = cleanReportMessage(read.fields["message"] ?? "");
    if (!cleaned.ok) {
      return noStore(NextResponse.json({ error: cleaned.problem }, { status: 400 }));
    }
    const { slug } = await context.params;
    const article = await contentRepository.findPublishedArticleBySlug(slug);
    if (!article) return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));

    const { reportsPerAddress } = LIMITS;
    const allowed = await feedbackRepository.consumeAllowance(
      feedbackKey("reports", clientIp(request)),
      reportsPerAddress.limit,
      reportsPerAddress.windowMs,
      new Date(),
    );
    if (!allowed) {
      logger.info("feedback.report_limited", { slug });
      return noStore(NextResponse.json({ error: "too-many" }, { status: 429 }));
    }
    await feedbackRepository.recordReport(article.id, cleaned.message);
    logger.info("feedback.report", { slug, length: cleaned.message.length });
    return noStore(NextResponse.json({ ok: true }));
  },
);
