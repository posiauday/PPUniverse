import { prisma } from "@ppu/db";
import { isValidArticleStatusTransition } from "@ppu/domain-content";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../../lib/auth";
import { contentRepository } from "../../../../../../lib/content";
import { withObservability } from "../../../../../../lib/observability";

/** Same deny-by-default pattern as api/admin/content/route.ts — see that
 * file's requireAdmin doc comment for the full rationale. */
async function requireAdmin(): Promise<{ userId: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (actor?.role !== "ADMIN") return null;
  return { userId: session.user.id };
}

function deny(correlationId: string): NextResponse {
  return NextResponse.json(createErrorEnvelope("NOT_FOUND", "Not found.", correlationId), {
    status: 404,
  });
}

/**
 * Publishes an Article: DRAFT -> PUBLISHED only (MVP-017, FR-014). A
 * dedicated sub-route, not a PATCH-with-action-field, so the general content
 * edit route (PATCH .../[id]) can never carry a publish side effect — the
 * two are deliberately separate write paths. Rejects (409) an
 * already-PUBLISHED article rather than silently no-op'ing, using the same
 * pure transition check @ppu/domain-content exposes.
 */
export const POST = withObservability(
  "POST /api/admin/content/[id]/publish",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id } = await params;
    const article = await contentRepository.findArticleById(id);
    if (!article) {
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Article not found.", correlationId),
        { status: 404 },
      );
    }

    if (!isValidArticleStatusTransition(article.status, "PUBLISHED")) {
      return NextResponse.json(
        createErrorEnvelope(
          "INVALID_STATE",
          `Cannot publish an article in status ${article.status}.`,
          correlationId,
        ),
        { status: 409 },
      );
    }

    const published = await contentRepository.publishArticle(id, admin.userId);

    logger.info("content.article_published", {
      articleId: published.id,
      actorUserId: admin.userId,
    });

    return NextResponse.json({ article: published }, { status: 200 });
  },
);
