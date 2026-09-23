import { prisma } from "@ppu/db";
import {
  isValidArticleBody,
  isValidArticleExcerpt,
  isValidArticleSlug,
  isValidArticleTitle,
  isValidArticleType,
} from "@ppu/domain-content";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { contentRepository } from "../../../../lib/content";
import { withObservability } from "../../../../lib/observability";

/**
 * Content-authoring surface (MVP-017, FR-014). Authorization mirrors
 * api/admin/deletion-requests/[id]/route.ts exactly: no session, or a
 * session whose role is not ADMIN, both get the identical 404 — content-
 * publishing authority reuses ADMIN, no EDITOR role exists (docs/final-
 * decisions.md, "MVP-017 implementation: content-publishing authorization
 * reuses ADMIN"). Role is always re-queried fresh from the database, never
 * read from the session.
 */
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
  excerpt?: unknown;
  body?: unknown;
}

/** Shared create/update field validation — returns a field-error map (empty means valid). */
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
    fieldErrors["type"] = ["type must be one of TUTORIAL, PATTERN, COMPARISON."];
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

export const GET = withObservability("GET /api/admin/content", async () => {
  const correlationId = getCorrelationId() ?? "unknown";
  const admin = await requireAdmin();
  if (!admin) return deny(correlationId);

  const articles = await contentRepository.listArticles();
  return NextResponse.json({ articles }, { status: 200 });
});

export const POST = withObservability("POST /api/admin/content", async (request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";
  const admin = await requireAdmin();
  if (!admin) return deny(correlationId);

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
  const existing = await contentRepository.findArticleBySlug(slug);
  if (existing) {
    return NextResponse.json(
      createErrorEnvelope(
        "VALIDATION",
        "An article with this slug already exists.",
        correlationId,
        {
          fieldErrors: { slug: ["This slug is already in use."] },
        },
      ),
      { status: 409 },
    );
  }

  const article = await contentRepository.createArticle({
    slug,
    title: body.title as string,
    type: body.type as "TUTORIAL" | "PATTERN" | "COMPARISON",
    body: body.body as string,
    excerpt: body.excerpt === undefined || body.excerpt === null ? null : (body.excerpt as string),
    authorUserId: admin.userId,
  });

  logger.info("content.article_created", { articleId: article.id, actorUserId: admin.userId });

  return NextResponse.json({ article }, { status: 201 });
});
