import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";
import {
  conflict,
  crossSiteResponse,
  readScheduleTime,
} from "../../../../../../lib/schedule-request";
import { updateRepository } from "../../../../../../lib/updates";

/**
 * Scheduled publishing for a draft platform update (MVP-050), exactly as for
 * guides (api/admin/content/[id]/schedule): PUT sets or changes the time,
 * DELETE cancels it; admins only, this site only, drafts only, audit-logged.
 */

type Context = { params: Promise<{ id: string }> };

function updateNotFound(correlationId: string): NextResponse {
  return NextResponse.json(createErrorEnvelope("NOT_FOUND", "Update not found.", correlationId), {
    status: 404,
  });
}

function body(update: { id: string; status: string; scheduledFor: Date | null }) {
  return {
    update: {
      id: update.id,
      status: update.status,
      scheduledFor: update.scheduledFor?.toISOString() ?? null,
    },
  };
}

export const PUT = withObservability(
  "PUT /api/admin/updates/[id]/schedule",
  async (request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);
    const read = await readScheduleTime(request, correlationId);
    if ("response" in read) return read.response;

    const { id } = await params;
    const update = await updateRepository.findUpdateById(id);
    if (!update) return updateNotFound(correlationId);
    if (update.status !== "DRAFT") {
      return conflict("Only a draft can be scheduled.", correlationId);
    }

    const scheduled = await updateRepository.scheduleUpdate(id, read.at, admin.userId);
    logger.info("content.update_scheduled", {
      updateId: id,
      scheduledFor: read.at.toISOString(),
      actorUserId: admin.userId,
    });
    return NextResponse.json(body(scheduled));
  },
);

export const DELETE = withObservability(
  "DELETE /api/admin/updates/[id]/schedule",
  async (request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);
    const crossSite = crossSiteResponse(request);
    if (crossSite) return crossSite;

    const { id } = await params;
    const update = await updateRepository.findUpdateById(id);
    if (!update) return updateNotFound(correlationId);
    if (update.status !== "DRAFT" || !update.scheduledFor) {
      return conflict("There is no schedule to cancel.", correlationId);
    }

    const cancelled = await updateRepository.cancelUpdateSchedule(id, admin.userId);
    logger.info("content.update_schedule_cancelled", { updateId: id, actorUserId: admin.userId });
    return NextResponse.json(body(cancelled));
  },
);
