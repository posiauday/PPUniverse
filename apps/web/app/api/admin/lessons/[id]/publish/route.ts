import { isValidArticleStatusTransition, lessonBodyProblems } from "@ppu/domain-content";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { learnEnabled } from "../../../../../../lib/feature-flags";
import { notifyIndexNow } from "../../../../../../lib/indexnow";
import { learnRepository } from "../../../../../../lib/learn";
import { invalidState, notFoundEnvelope } from "../../../../../../lib/learn-routes";
import { withObservability } from "../../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../../lib/require-admin";
import { topicUrl } from "../../../../../../lib/seo/canonical";
import { getSiteUrl } from "../../../../../../lib/site-url";

/**
 * Publishes a lesson: DRAFT -> PUBLISHED only (MVP-048 slice 1b), appending
 * the audit event in the same transaction. The body is checked against the
 * fixed lesson shape once more, so a lesson saved before a rule changed can't
 * go public out of shape. It shows on the site only once its topic is
 * published too. An already-PUBLISHED lesson is a 409.
 */
export const POST = withObservability(
  "POST /api/admin/lessons/[id]/publish",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    const lesson = await learnRepository.findLessonById(id);
    if (!lesson) return notFoundEnvelope(correlationId, "Lesson");
    if (!isValidArticleStatusTransition(lesson.status, "PUBLISHED")) {
      return invalidState(correlationId, `Cannot publish a lesson in status ${lesson.status}.`);
    }
    const problems = lessonBodyProblems(lesson.body);
    if (problems.length > 0) {
      return invalidState(
        correlationId,
        `Fix the lesson before publishing: ${problems.join("; ")}`,
      );
    }

    const published = await learnRepository.publishLesson(id, admin.userId);
    logger.info("learn.lesson_published", { lessonId: id, actorUserId: admin.userId });
    // MVP-046/048: tell IndexNow search engines the topic page changed (it
    // lists the lesson), but only when it is public: the Learn pages are on and
    // the topic is published. Not the lesson page: it needs sign-in and is noindex.
    const site = getSiteUrl();
    if (site.ok && learnEnabled()) {
      const topic = await learnRepository.findTopicById(lesson.topicId);
      if (topic?.status === "PUBLISHED") {
        await notifyIndexNow([topicUrl(site.origin, topic.slug)], { site });
      }
    }
    return NextResponse.json({ lesson: published }, { status: 200 });
  },
);
