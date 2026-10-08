import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { learnRepository } from "../../../../../lib/learn";
import { parseLessonBody } from "../../../../../lib/learn-input";
import { lessonConflicts } from "../../../../../lib/learn-lesson-conflicts";
import {
  badBody,
  invalidFields,
  notFoundEnvelope,
  readJsonObject,
} from "../../../../../lib/learn-routes";
import { withObservability } from "../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../lib/require-admin";

type Context = { params: Promise<{ id: string }> };

/** One lesson, for the admin editor (MVP-048 slice 1b). Admins only. */
export const GET = withObservability(
  "GET /api/admin/lessons/[id]",
  async (_request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    if (!(await requireAdmin())) return notFoundForNonAdmin(correlationId);
    const lesson = await learnRepository.findLessonById((await params).id);
    return lesson
      ? NextResponse.json({ lesson }, { status: 200 })
      : notFoundEnvelope(correlationId, "Lesson");
  },
);

/** Content-only edit: never changes status, publishedAt or topic (see LearnRepository). */
export const PATCH = withObservability(
  "PATCH /api/admin/lessons/[id]",
  async (request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    const existing = await learnRepository.findLessonById(id);
    if (!existing) return notFoundEnvelope(correlationId, "Lesson");

    const body = await readJsonObject(request);
    if (!body) return badBody(correlationId);
    const parsed = parseLessonBody(body);
    if (!parsed.ok) return invalidFields(correlationId, parsed.fieldErrors);
    const conflicts = await lessonConflicts(existing.topicId, parsed.input, id);
    if (conflicts)
      return invalidFields(correlationId, conflicts, "The slug or position is taken.", 409);

    const lesson = await learnRepository.updateLesson(id, parsed.input);
    logger.info("learn.lesson_edited", { lessonId: id, actorUserId: admin.userId });
    return NextResponse.json({ lesson }, { status: 200 });
  },
);
