import { cleanCommentBody, type CommentProblem } from "@ppu/domain-content";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { commentRepository, secureRandom } from "../../../../../../lib/comments";
import { componentNotFound } from "../../../../../../lib/component-routes";
import { componentRepository } from "../../../../../../lib/components";
import { commentsEnabled } from "../../../../../../lib/feature-flags";
import { invalidFields, invalidState } from "../../../../../../lib/learn-routes";
import { withObservability } from "../../../../../../lib/observability";
import { readFields } from "../../../../../../lib/request-guards";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";

/** 2,000 characters can take up to 8,000 bytes in UTF-8, plus the JSON around them. */
const MAX_BYTES = 9000;

const PROBLEM: Record<CommentProblem, string> = {
  "too-short": "Write at least 10 characters.",
  "too-long": "Keep it to 2,000 characters or fewer.",
  "too-many-links": "Use at most 2 links.",
};

/**
 * Posts a component's team post, or changes the text of the live one
 * (MVP-053; docs/final-decisions.md, 2026-10-10, "Team posts start the
 * conversation on components"). It shows first on the component's page under
 * the site's name, with the same text rules as any comment. Only on a
 * published component that isn't hidden, since only those show comments.
 * Admins only, from this site only; anyone else gets the same 404 as an
 * unknown route, and so does everyone while comments are off.
 */
export const POST = withObservability(
  "POST /api/admin/components/[id]/team-post",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin || !commentsEnabled()) return notFoundForNonAdmin(correlationId);

    const read = await readFields(request, ["body"], MAX_BYTES);
    if ("response" in read) return read.response;

    const { id } = await params;
    const component = await componentRepository.findById(id);
    if (!component) return componentNotFound(correlationId);
    if (component.status !== "PUBLISHED" || component.hidden) {
      return invalidState(
        correlationId,
        "Team posts show on published components only. Publish it, or show it again, first.",
      );
    }

    const cleaned = cleanCommentBody(read.fields["body"] ?? "");
    if (!cleaned.ok) {
      return invalidFields(
        correlationId,
        { body: [PROBLEM[cleaned.problem]] },
        PROBLEM[cleaned.problem],
      );
    }

    // The admin's profile, so the moderation list can name who wrote it.
    await commentRepository.getOrCreateProfile(admin.userId, secureRandom);
    const saved = await commentRepository.saveTeamPost(id, admin.userId, cleaned.body);
    logger.info("comments.team_post_saved", {
      componentId: id,
      commentId: saved.id,
      actorUserId: admin.userId,
      length: cleaned.body.length,
    });
    return NextResponse.json({ ok: true, id: saved.id });
  },
);
