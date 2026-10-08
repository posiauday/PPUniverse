import { isValidComponentAccess, type ComponentAdminUpdate } from "@ppu/domain-content";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { componentNotFound } from "../../../../../lib/component-routes";
import { componentRepository } from "../../../../../lib/components";
import { badBody, invalidFields, readJsonObject } from "../../../../../lib/learn-routes";
import { withObservability } from "../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../lib/require-admin";

type Context = { params: Promise<{ id: string }> };

/**
 * Changes a component's settings (MVP-049): who can copy it (OPEN or MEMBERS)
 * and whether it is hidden from the site. Never touches its content or status.
 * Each real change is recorded in the audit log. Admins only.
 */
export const PATCH = withObservability(
  "PATCH /api/admin/components/[id]",
  async (request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    if (!(await componentRepository.findById(id))) return componentNotFound(correlationId);

    const body = await readJsonObject(request);
    if (!body) return badBody(correlationId);
    const change: ComponentAdminUpdate = {};
    const fieldErrors: Record<string, string[]> = {};
    if ("access" in body) {
      if (typeof body["access"] === "string" && isValidComponentAccess(body["access"])) {
        change.access = body["access"];
      } else fieldErrors["access"] = ["Choose Anyone or Signed-in readers."];
    }
    if ("hidden" in body) {
      if (typeof body["hidden"] === "boolean") change.hidden = body["hidden"];
      else fieldErrors["hidden"] = ["Hidden must be true or false."];
    }
    if (Object.keys(fieldErrors).length > 0) return invalidFields(correlationId, fieldErrors);

    const component = await componentRepository.updateSettings(id, change, admin.userId);
    logger.info("components.settings_changed", { componentId: id, actorUserId: admin.userId });
    return NextResponse.json({
      component: { id: component.id, access: component.access, hidden: component.hidden },
    });
  },
);
