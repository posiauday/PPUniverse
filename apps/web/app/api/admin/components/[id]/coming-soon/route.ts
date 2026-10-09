import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { componentNotFound } from "../../../../../../lib/component-routes";
import { componentRepository } from "../../../../../../lib/components";
import { invalidState } from "../../../../../../lib/learn-routes";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";

/**
 * Moves a published component back to Coming soon (docs/final-decisions.md,
 * 2026-10-09, "Component library: back to Coming soon"): PUBLISHED -> DRAFT
 * with Coming soon on, its test record kept, and the audit event in the same
 * transaction. Not published is a 409. Admins only.
 */
export const POST = withObservability(
  "POST /api/admin/components/[id]/coming-soon",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    const component = await componentRepository.findById(id);
    if (!component) return componentNotFound(correlationId);
    if (component.status !== "PUBLISHED") {
      return invalidState(
        correlationId,
        "This component isn't published. Tick Coming soon in its settings instead.",
      );
    }

    const moved = await componentRepository.moveToComingSoon(id, admin.userId);
    logger.info("components.moved_to_coming_soon", { componentId: id, actorUserId: admin.userId });
    return NextResponse.json({
      component: { id: moved.id, status: moved.status, comingSoon: moved.comingSoon },
    });
  },
);
