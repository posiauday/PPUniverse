import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { withObservability } from "../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../lib/require-admin";
import { parseUpdateBody, type UpdateInputBody } from "../../../../../lib/update-input";
import { updateRepository } from "../../../../../lib/updates";

type Context = { params: Promise<{ id: string }> };

function notFound(correlationId: string): NextResponse {
  return NextResponse.json(createErrorEnvelope("NOT_FOUND", "Update not found.", correlationId), {
    status: 404,
  });
}

/** One update, for the admin editor (MVP-033 slice D). Admins only. */
export const GET = withObservability(
  "GET /api/admin/updates/[id]",
  async (_request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    if (!(await requireAdmin())) return notFoundForNonAdmin(correlationId);
    const update = await updateRepository.findUpdateById((await params).id);
    return update ? NextResponse.json({ update }, { status: 200 }) : notFound(correlationId);
  },
);

/** Content-only edit: never changes status or publishedAt (see UpdateRepository). */
export const PATCH = withObservability(
  "PATCH /api/admin/updates/[id]",
  async (request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    const existing = await updateRepository.findUpdateById(id);
    if (!existing) return notFound(correlationId);

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
    if (parsed.input.slug !== existing.slug) {
      const taken = await updateRepository.findUpdateBySlug(parsed.input.slug);
      if (taken && taken.id !== id) {
        return NextResponse.json(
          createErrorEnvelope(
            "VALIDATION",
            "An update with this slug already exists.",
            correlationId,
            { fieldErrors: { slug: ["This slug is already in use."] } },
          ),
          { status: 409 },
        );
      }
    }

    const update = await updateRepository.updateUpdate(id, parsed.input);
    logger.info("content.update_edited", { updateId: id, actorUserId: admin.userId });
    return NextResponse.json({ update }, { status: 200 });
  },
);
