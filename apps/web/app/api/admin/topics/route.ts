import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { learnRepository } from "../../../../lib/learn";
import { parseTopicBody } from "../../../../lib/learn-input";
import { badBody, invalidFields, readJsonObject } from "../../../../lib/learn-routes";
import { withObservability } from "../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../lib/require-admin";

/**
 * Learn topics authoring (MVP-048 slice 1b). The same rules as
 * /api/admin/updates: admins only (the role re-read from the database), and
 * anyone else gets the identical 404. Topics are created DRAFT; publishing is
 * the separate .../[id]/publish route.
 */
export const GET = withObservability("GET /api/admin/topics", async () => {
  const correlationId = getCorrelationId() ?? "unknown";
  if (!(await requireAdmin())) return notFoundForNonAdmin(correlationId);
  return NextResponse.json({ topics: await learnRepository.listTopics() }, { status: 200 });
});

export const POST = withObservability("POST /api/admin/topics", async (request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";
  const admin = await requireAdmin();
  if (!admin) return notFoundForNonAdmin(correlationId);

  const body = await readJsonObject(request);
  if (!body) return badBody(correlationId);
  const parsed = parseTopicBody(body);
  if (!parsed.ok) return invalidFields(correlationId, parsed.fieldErrors);
  if (await learnRepository.findTopicBySlug(parsed.input.slug)) {
    return invalidFields(
      correlationId,
      { slug: ["This slug is already in use."] },
      "A topic with this slug already exists.",
      409,
    );
  }

  const topic = await learnRepository.createTopic({ ...parsed.input, authorUserId: admin.userId });
  logger.info("learn.topic_created", { topicId: topic.id, actorUserId: admin.userId });
  return NextResponse.json({ topic }, { status: 201 });
});
