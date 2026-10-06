import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { withObservability } from "../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../lib/require-admin";
import { parseUpdateBody, type UpdateInputBody } from "../../../../lib/update-input";
import { updateRepository } from "../../../../lib/updates";

/**
 * Platform updates authoring (MVP-033 slice D). The same rules as
 * /api/admin/content: admins only (the role re-read from the database), and
 * anyone else gets the identical 404. Updates are created DRAFT; publishing
 * is the separate .../[id]/publish route.
 */
export const GET = withObservability("GET /api/admin/updates", async () => {
  const correlationId = getCorrelationId() ?? "unknown";
  if (!(await requireAdmin())) return notFoundForNonAdmin(correlationId);
  return NextResponse.json({ updates: await updateRepository.listUpdates() }, { status: 200 });
});

export const POST = withObservability("POST /api/admin/updates", async (request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";
  const admin = await requireAdmin();
  if (!admin) return notFoundForNonAdmin(correlationId);

  let body: UpdateInputBody;
  try {
    body = (await request.json()) as UpdateInputBody;
  } catch {
    return NextResponse.json(
      createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
      { status: 400 },
    );
  }

  const parsed = parseUpdateBody(body);
  if (!parsed.ok) {
    return NextResponse.json(
      createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
        fieldErrors: parsed.fieldErrors,
      }),
      { status: 400 },
    );
  }
  if (await updateRepository.findUpdateBySlug(parsed.input.slug)) {
    return NextResponse.json(
      createErrorEnvelope("VALIDATION", "An update with this slug already exists.", correlationId, {
        fieldErrors: { slug: ["This slug is already in use."] },
      }),
      { status: 409 },
    );
  }

  const update = await updateRepository.createUpdate({
    ...parsed.input,
    authorUserId: admin.userId,
  });
  logger.info("content.update_created", { updateId: update.id, actorUserId: admin.userId });
  return NextResponse.json({ update }, { status: 201 });
});
