import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";
import { changeRole, isRole } from "../../../../../../lib/roles";

/**
 * Changes someone's role (MVP-047): `{ "role": "MEMBER" | "CONTRIBUTOR" |
 * "ADMIN" }`. Admin only; anyone else gets the same 404 an unknown route
 * gives. Refuses an admin's own role and the last admin, and records every
 * change in the audit log.
 */
export const POST = withObservability(
  "POST /api/admin/users/[id]/role",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);
    const body = (await request.json().catch(() => null)) as { role?: unknown } | null;
    if (!isRole(body?.role)) {
      return NextResponse.json({ error: "unknown-role" }, { status: 400 });
    }
    const { id } = await params;
    const result = await changeRole(admin.userId, id, body.role);
    if (!result.ok) {
      const status = result.problem === "not-found" ? 404 : 409;
      return NextResponse.json({ error: result.problem }, { status });
    }
    logger.info("admin.role_changed", {
      targetUserId: id,
      from: result.from,
      to: body.role,
      actorUserId: admin.userId,
    });
    return NextResponse.json({ ok: true });
  },
);
