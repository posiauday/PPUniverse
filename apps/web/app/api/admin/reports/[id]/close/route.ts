import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { feedbackRepository } from "../../../../../../lib/feedback";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";

/**
 * Closes a "Something here changed?" report (MVP-038): the report is
 * deleted, as the Privacy notice says. Admin only; anyone else gets the
 * same 404 an unknown route gives.
 */
export const POST = withObservability(
  "POST /api/admin/reports/[id]/close",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);
    const { id } = await params;
    const closed = await feedbackRepository.closeReport(id);
    logger.info("feedback.report_closed", { reportId: id, closed, actorUserId: admin.userId });
    return NextResponse.json({ ok: true, closed });
  },
);
