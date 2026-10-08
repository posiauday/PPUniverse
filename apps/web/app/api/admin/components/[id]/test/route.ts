import { STUDIO_VERSION_MAX, isValidStudioVersion } from "@ppu/domain-content";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { componentNotFound } from "../../../../../../lib/component-routes";
import { componentRepository } from "../../../../../../lib/components";
import { badBody, invalidFields, readJsonObject } from "../../../../../../lib/learn-routes";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";

/**
 * Records that the product owner paste-tested a component's current YAML in
 * Power Apps Studio (MVP-049): the Studio version and today's date. A
 * component can be published only after this. Admins only.
 */
export const POST = withObservability(
  "POST /api/admin/components/[id]/test",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    if (!(await componentRepository.findById(id))) return componentNotFound(correlationId);
    const body = await readJsonObject(request);
    if (!body) return badBody(correlationId);
    const version = typeof body["studioVersion"] === "string" ? body["studioVersion"] : "";
    if (!isValidStudioVersion(version)) {
      return invalidFields(correlationId, {
        studioVersion: [
          `Enter the Studio version from Settings > Support (letters, numbers, dots; up to ${STUDIO_VERSION_MAX} characters).`,
        ],
      });
    }

    const component = await componentRepository.markTested(id, version, admin.userId);
    logger.info("components.tested", { componentId: id, actorUserId: admin.userId });
    return NextResponse.json({
      component: {
        id: component.id,
        testedAt: component.testedAt,
        testedStudioVersion: component.testedStudioVersion,
      },
    });
  },
);
