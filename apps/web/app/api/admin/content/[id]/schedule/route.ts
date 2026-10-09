import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { contentRepository } from "../../../../../../lib/content";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";
import {
  conflict,
  crossSiteResponse,
  readScheduleTime,
} from "../../../../../../lib/schedule-request";

/**
 * Scheduled publishing for a draft guide (MVP-050; docs/final-decisions.md,
 * 2026-10-09). PUT `{ "publishAt": "<ISO date-time with offset>" }` sets or
 * changes the time; DELETE cancels it. Admins only (anyone else gets the
 * same 404 an unknown route gives), from this site only, and drafts only.
 * The guide goes live on the first visit after the time
 * (lib/scheduled-publishing.ts). Each change is recorded for the audit log.
 */

type Context = { params: Promise<{ id: string }> };

function articleNotFound(correlationId: string): NextResponse {
  return NextResponse.json(createErrorEnvelope("NOT_FOUND", "Article not found.", correlationId), {
    status: 404,
  });
}

function body(article: { id: string; status: string; scheduledFor: Date | null }) {
  return {
    article: {
      id: article.id,
      status: article.status,
      scheduledFor: article.scheduledFor?.toISOString() ?? null,
    },
  };
}

export const PUT = withObservability(
  "PUT /api/admin/content/[id]/schedule",
  async (request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);
    const read = await readScheduleTime(request, correlationId);
    if ("response" in read) return read.response;

    const { id } = await params;
    const article = await contentRepository.findArticleById(id);
    if (!article) return articleNotFound(correlationId);
    if (article.status !== "DRAFT") {
      return conflict("Only a draft can be scheduled.", correlationId);
    }

    const scheduled = await contentRepository.scheduleArticle(id, read.at, admin.userId);
    logger.info("content.article_scheduled", {
      articleId: id,
      scheduledFor: read.at.toISOString(),
      actorUserId: admin.userId,
    });
    return NextResponse.json(body(scheduled));
  },
);

export const DELETE = withObservability(
  "DELETE /api/admin/content/[id]/schedule",
  async (request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);
    const crossSite = crossSiteResponse(request);
    if (crossSite) return crossSite;

    const { id } = await params;
    const article = await contentRepository.findArticleById(id);
    if (!article) return articleNotFound(correlationId);
    if (article.status !== "DRAFT" || !article.scheduledFor) {
      return conflict("There is no schedule to cancel.", correlationId);
    }

    const cancelled = await contentRepository.cancelArticleSchedule(id, admin.userId);
    logger.info("content.article_schedule_cancelled", { articleId: id, actorUserId: admin.userId });
    return NextResponse.json(body(cancelled));
  },
);
