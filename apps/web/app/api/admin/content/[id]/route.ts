import { prisma } from "@ppu/db";
import {
  isValidArticleBody,
  isValidArticleExcerpt,
  isValidArticleSlug,
  isValidArticleTitle,
  isValidArticleType,
  isValidTechnology,
  isValidTopic,
  type ArticleType,
  type Technology,
} from "@ppu/domain-content";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { contentRepository } from "../../../../../lib/content";
import { withObservability } from "../../../../../lib/observability";

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

interface ArticleInputBody {
  slug?: unknown;
  title?: unknown;
  type?: unknown;
  technology?: unknown;
  topic?: unknown;
  excerpt?: unknown;
  body?: unknown;
}

function validateArticleFields(body: ArticleInputBody): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  if (typeof body.slug !== "string" || !isValidArticleSlug(body.slug)) {
    fieldErrors["slug"] = [
      "slug must be lowercase, hyphen-separated and 1-200 characters (e.g. my-tutorial).",
    ];
  }
  if (typeof body.title !== "string" || !isValidArticleTitle(body.title)) {
    fieldErrors["title"] = ["title is required and must be 200 characters or fewer."];
  }
  if (typeof body.type !== "string" || !isValidArticleType(body.type)) {
    fieldErrors["type"] = ["type must be one of TUTORIAL, PATTERN, COMPARISON, KPI_GUIDE, REFERENCE."];
  }
  // MVP-028: optional -- absent, null or "" means no technology section.
  const technology = technologyOf(body);
  if (technology === undefined) {
    fieldErrors["technology"] = [
      "technology must be one of POWER_APPS, POWER_AUTOMATE, POWER_BI, COPILOT_STUDIO, DATAVERSE, POWER_PAGES, GOVERNANCE_ADMIN, or empty.",
    ];
  } else if (topicOf(body, technology) === undefined) {
    // MVP-033: optional, and only one of the chosen technology's sections.
    fieldErrors["topic"] = ["topic must be one of the chosen technology's sections, or empty."];
  }
  if (typeof body.body !== "string" || !isValidArticleBody(body.body)) {
    fieldErrors["body"] = ["body is required."];
  }
  const excerpt = body.excerpt === undefined || body.excerpt === null ? null : body.excerpt;
  if (excerpt !== null && typeof excerpt !== "string") {
    fieldErrors["excerpt"] = ["excerpt must be a string or null."];
  } else if (typeof excerpt === "string" && !isValidArticleExcerpt(excerpt)) {
    fieldErrors["excerpt"] = ["excerpt must be 500 characters or fewer."];
  }

  return fieldErrors;
}

export const GET = withObservability(
  "GET /api/admin/content/[id]",
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
    return NextResponse.json({ article }, { status: 200 });
  },
);

/**
 * Content-only edit. Never accepts or changes `status`/`publishedAt` — those
 * fields do not exist in ArticleUpdateInput at all, so a malicious or
 * accidental client payload cannot silently publish or unpublish an
 * Article through this route (the immutability-adjacent guarantee CLAUDE.md's
 * vertical-slice checklist calls for). Publishing is the dedicated
 * [id]/publish route only.
 */
export const PATCH = withObservability(
  "PATCH /api/admin/content/[id]",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id } = await params;
    const existingArticle = await contentRepository.findArticleById(id);
    if (!existingArticle) {
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Article not found.", correlationId),
        { status: 404 },
      );
    }

    let body: ArticleInputBody;
    try {
      body = (await request.json()) as ArticleInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    const fieldErrors = validateArticleFields(body);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors,
        }),
        { status: 400 },
      );
    }

    const slug = body.slug as string;
    if (slug !== existingArticle.slug) {
      const conflict = await contentRepository.findArticleBySlug(slug);
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          createErrorEnvelope(
            "VALIDATION",
            "An article with this slug already exists.",
            correlationId,
            { fieldErrors: { slug: ["This slug is already in use."] } },
          ),
          { status: 409 },
        );
      }
    }

    const article = await contentRepository.updateArticle(id, {
      slug,
      title: body.title as string,
      type: body.type as ArticleType,
      technology: technologyOf(body) ?? null,
      topic: topicOf(body, technologyOf(body) ?? null) ?? null,
      body: body.body as string,
      excerpt:
        body.excerpt === undefined || body.excerpt === null ? null : (body.excerpt as string),
    });

    logger.info("content.article_updated", { articleId: article.id, actorUserId: admin.userId });

    return NextResponse.json({ article }, { status: 200 });
  },
);

/** The submitted technology: null for none, undefined when the value is not allowed (MVP-028). */
function technologyOf(body: ArticleInputBody): Technology | null | undefined {
  if (body.technology === undefined || body.technology === null || body.technology === "")
    return null;
  return typeof body.technology === "string" && isValidTechnology(body.technology)
    ? body.technology
    : undefined;
}

/** The submitted topic (MVP-033): null for none, undefined when it is not one of
 * the technology's sections (or is given without a technology). */
function topicOf(body: ArticleInputBody, technology: Technology | null): string | null | undefined {
  if (body.topic === undefined || body.topic === null || body.topic === "") return null;
  if (typeof body.topic !== "string" || technology === null) return undefined;
  return isValidTopic(technology, body.topic) ? body.topic : undefined;
}
