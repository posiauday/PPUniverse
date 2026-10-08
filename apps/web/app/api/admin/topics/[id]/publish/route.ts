import { TOPIC_LESSONS_MIN, isValidArticleStatusTransition } from "@ppu/domain-content";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { learnRepository } from "../../../../../../lib/learn";
import { invalidState, notFoundEnvelope } from "../../../../../../lib/learn-routes";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";

/**
 * Publishes a topic: DRAFT -> PUBLISHED only (MVP-048 slice 1b), appending
 * the audit event in the same transaction. A topic is 3 to 6 lessons, so it
 * can't be published with fewer than 3 (of any status); its lessons are
 * published one by one, and only published lessons are ever shown. An
 * already-PUBLISHED topic is a 409, not a silent no-op.
 */
export const POST = withObservability(
  "POST /api/admin/topics/[id]/publish",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    const topic = await learnRepository.findTopicWithLessons(id);
    if (!topic) return notFoundEnvelope(correlationId, "Topic");
    if (!isValidArticleStatusTransition(topic.status, "PUBLISHED")) {
      return invalidState(correlationId, `Cannot publish a topic in status ${topic.status}.`);
    }
    if (topic.lessons.length < TOPIC_LESSONS_MIN) {
      return invalidState(
        correlationId,
        `A topic needs at least ${TOPIC_LESSONS_MIN} lessons before it can be published; it has ${topic.lessons.length}.`,
      );
    }

    const published = await learnRepository.publishTopic(id, admin.userId);
    logger.info("learn.topic_published", { topicId: id, actorUserId: admin.userId });
    return NextResponse.json({ topic: published }, { status: 200 });
  },
);
