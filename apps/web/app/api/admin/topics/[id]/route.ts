import { getCorrelationId, logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { learnRepository } from "../../../../../lib/learn";
import { parseTopicBody } from "../../../../../lib/learn-input";
import {
  badBody,
  invalidFields,
  notFoundEnvelope,
  readJsonObject,
} from "../../../../../lib/learn-routes";
import { withObservability } from "../../../../../lib/observability";
import { notFoundForNonAdmin, requireAdmin } from "../../../../../lib/require-admin";

type Context = { params: Promise<{ id: string }> };

/** One topic, for the admin editor (MVP-048 slice 1b). Admins only. */
export const GET = withObservability(
  "GET /api/admin/topics/[id]",
  async (_request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    if (!(await requireAdmin())) return notFoundForNonAdmin(correlationId);
    const topic = await learnRepository.findTopicById((await params).id);
    return topic
      ? NextResponse.json({ topic }, { status: 200 })
      : notFoundEnvelope(correlationId, "Topic");
  },
);

/** Content-only edit: never changes status or publishedAt (see LearnRepository). */
export const PATCH = withObservability(
  "PATCH /api/admin/topics/[id]",
  async (request: Request, { params }: Context) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return notFoundForNonAdmin(correlationId);

    const { id } = await params;
    const existing = await learnRepository.findTopicById(id);
    if (!existing) return notFoundEnvelope(correlationId, "Topic");

    const body = await readJsonObject(request);
    if (!body) return badBody(correlationId);
    const parsed = parseTopicBody(body);
    if (!parsed.ok) return invalidFields(correlationId, parsed.fieldErrors);
    if (parsed.input.slug !== existing.slug) {
      const taken = await learnRepository.findTopicBySlug(parsed.input.slug);
      if (taken && taken.id !== id) {
        return invalidFields(
          correlationId,
          { slug: ["This slug is already in use."] },
          "A topic with this slug already exists.",
          409,
        );
      }
    }

    const topic = await learnRepository.updateTopic(id, parsed.input);
    logger.info("learn.topic_edited", { topicId: id, actorUserId: admin.userId });
    return NextResponse.json({ topic }, { status: 200 });
  },
);
