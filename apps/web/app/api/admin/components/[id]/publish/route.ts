import { canPublishComponent } from "@ppu/domain-content";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { componentNotFound } from "../../../../../../lib/component-routes";
import { componentRepository } from "../../../../../../lib/components";
import { notifyIndexNow } from "../../../../../../lib/indexnow";
import { invalidState } from "../../../../../../lib/learn-routes";
import { withObservability } from "../../../../../../lib/observability";
import { componentsLibraryOn } from "../../../../../../lib/site-switches";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";
import { getSiteUrl } from "../../../../../../lib/site-url";

/**
 * Publishes a component: DRAFT -> PUBLISHED, only once its current YAML has a
 * recorded paste-test (MVP-049), with the audit event in the same
 * transaction. Already published, or not tested, is a 409. Admins only.
 */
export const POST = withObservability(
  "POST /api/admin/components/[id]/publish",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    const component = await componentRepository.findById(id);
    if (!component) return componentNotFound(correlationId);
    if (component.status !== "DRAFT")
      return invalidState(correlationId, "This component is already published.");
    if (!canPublishComponent(component)) {
      return invalidState(
        correlationId,
        "Record a paste-test of this version in Power Apps Studio before publishing it.",
      );
    }

    const published = await componentRepository.publish(id, admin.userId);
    logger.info("components.published", { componentId: id, actorUserId: admin.userId });
    // Tell IndexNow search engines once the library pages are public (never fails the publish).
    const site = getSiteUrl();
    if (site.ok && (await componentsLibraryOn())) {
      await notifyIndexNow(
        [`${site.origin}/components`, `${site.origin}/components/${published.slug}`],
        { site },
      );
    }
    return NextResponse.json({ component: { id: published.id, status: published.status } });
  },
);
