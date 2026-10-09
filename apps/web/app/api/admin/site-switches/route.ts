import { getCorrelationId, logger } from "@ppu/telemetry";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { withObservability } from "../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../lib/require-admin";
import { isSiteSwitchKey, setSiteSwitch } from "../../../../lib/site-switches";

/**
 * Flips a site switch (docs/final-decisions.md, 2026-10-09, "Component
 * library: a switch in the admin, and Coming soon"): `{ "key": "components",
 * "enabled": true | false }`. Admins only; anyone else gets the same 404 an
 * unknown route gives. Every change is recorded for the audit log, and every
 * page is refreshed so the header, footer and sitemap follow at once.
 */
export const POST = withObservability("POST /api/admin/site-switches", async (request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";
  const admin = await requireAdmin();
  if (!admin) return notFoundForNonAdmin(correlationId);

  const body = (await request.json().catch(() => null)) as {
    key?: unknown;
    enabled?: unknown;
  } | null;
  if (!isSiteSwitchKey(body?.key)) {
    return NextResponse.json({ error: "unknown-switch", correlationId }, { status: 400 });
  }
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled-not-boolean", correlationId }, { status: 400 });
  }

  await setSiteSwitch(body.key, body.enabled, admin.userId);
  revalidatePath("/", "layout");
  logger.info("admin.site_switch_changed", {
    key: body.key,
    enabled: body.enabled,
    actorUserId: admin.userId,
  });
  return NextResponse.json({ key: body.key, enabled: body.enabled });
});
