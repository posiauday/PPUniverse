import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { learnRepository } from "../../../../../../lib/learn";
import { parseLessonBody } from "../../../../../../lib/learn-input";
import { lessonConflicts } from "../../../../../../lib/learn-lesson-conflicts";
import {
  badBody,
  invalidFields,
  notFoundEnvelope,
  readJsonObject,
} from "../../../../../../lib/learn-routes";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";

/**
 * Adds a lesson to a topic (MVP-048 slice 1b), as a DRAFT. Admins only; anyone
 * else gets the identical 404. The body must follow the fixed lesson shape
 * and the knowledge-check rules; slug and position must be free in the topic.
 */
export const POST = withObservability(
  "POST /api/admin/topics/[id]/lessons",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id: topicId } = await params;
    if (!(await learnRepository.findTopicById(topicId)))
      return notFoundEnvelope(correlationId, "Topic");

    const body = await readJsonObject(request);
    if (!body) return badBody(correlationId);
    const parsed = parseLessonBody(body);
    if (!parsed.ok) return invalidFields(correlationId, parsed.fieldErrors);
    const conflicts = await lessonConflicts(topicId, parsed.input, null);
    if (conflicts)
      return invalidFields(correlationId, conflicts, "The slug or position is taken.", 409);

    const lesson = await learnRepository.createLesson({
      ...parsed.input,
      topicId,
      authorUserId: admin.userId,
    });
    logger.info("learn.lesson_created", {
      topicId,
      lessonId: lesson.id,
      actorUserId: admin.userId,
    });
    return NextResponse.json({ lesson }, { status: 201 });
  },
);
