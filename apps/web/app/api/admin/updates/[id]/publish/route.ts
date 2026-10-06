import { isValidArticleStatusTransition } from "@ppu/domain-content";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";
import { updateRepository } from "../../../../../../lib/updates";

/**
 * Publishes an update: DRAFT -> PUBLISHED only (MVP-033 slice D), appending
 * the audit event in the same transaction. A dedicated route, as for articles,
 * so an edit can never carry a publish side effect. An already-PUBLISHED
 * update is a 409, not a silent no-op.
 */
export const POST = withObservability(
  "POST /api/admin/updates/[id]/publish",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    const update = await updateRepository.findUpdateById(id);
    if (!update) {
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Update not found.", correlationId),
        { status: 404 },
      );
    }
    if (!isValidArticleStatusTransition(update.status, "PUBLISHED")) {
      return NextResponse.json(
        createErrorEnvelope(
          "INVALID_STATE",
          `Cannot publish an update in status ${update.status}.`,
          correlationId,
        ),
        { status: 409 },
      );
    }

    const published = await updateRepository.publishUpdate(id, admin.userId);
    logger.info("content.update_published", { updateId: id, actorUserId: admin.userId });
    return NextResponse.json({ update: published }, { status: 200 });
  },
);
