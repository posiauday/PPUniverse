import { Prisma, prisma } from "@ppu/db";
import { isValidProductName, isValidProductSlug, isValidProductSummary } from "@ppu/domain-catalog";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { catalogRepository } from "../../../../../lib/catalog";
import { withObservability } from "../../../../../lib/observability";

/** Same deny-by-default pattern as api/admin/products/route.ts -- see that
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

interface ProductInputBody {
  name?: unknown;
  slug?: unknown;
  summary?: unknown;
  categoryId?: unknown;
}

async function validateProductFields(body: ProductInputBody): Promise<Record<string, string[]>> {
  const fieldErrors: Record<string, string[]> = {};

  if (typeof body.name !== "string" || !isValidProductName(body.name)) {
    fieldErrors["name"] = ["name is required and must be 200 characters or fewer."];
  }
  if (typeof body.slug !== "string" || !isValidProductSlug(body.slug)) {
    fieldErrors["slug"] = [
      "slug must be lowercase, hyphen-separated and 1-200 characters (e.g. my-product).",
    ];
  }
  if (typeof body.summary !== "string" || !isValidProductSummary(body.summary)) {
    fieldErrors["summary"] = ["summary is required and must be 500 characters or fewer."];
  }
  if (typeof body.categoryId !== "string" || body.categoryId.length === 0) {
    fieldErrors["categoryId"] = ["categoryId is required."];
  } else {
    const categories = await catalogRepository.listCategories();
    if (!categories.some((category) => category.id === body.categoryId)) {
      fieldErrors["categoryId"] = ["categoryId must reference an existing category."];
    }
  }

  return fieldErrors;
}

function isDuplicateSlugError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray((error.meta as { target?: unknown } | undefined)?.target) &&
    ((error.meta as { target?: unknown[] }).target ?? []).includes("slug")
  );
}

export const GET = withObservability(
  "GET /api/admin/products/[id]",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id } = await params;
    const product = await catalogRepository.findProductByIdForAdmin(id);
    if (!product) {
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Product not found.", correlationId),
        { status: 404 },
      );
    }
    return NextResponse.json({ product }, { status: 200 });
  },
);

/**
 * Core-field-only edit. Never accepts or changes `status`/`publishedAt` --
 * ProductUpdateInput has no such fields at all, so a malicious or accidental
 * client payload cannot silently publish or unpublish a Product through
 * this route (mirrors api/admin/content/[id]/route.ts's PATCH exactly).
 * Publishing is the dedicated [id]/publish route only.
 */
export const PATCH = withObservability(
  "PATCH /api/admin/products/[id]",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const correlationId = getCorrelationId() ?? "unknown";
    const admin = await requireAdmin();
    if (!admin) return deny(correlationId);

    const { id } = await params;
    const existingProduct = await catalogRepository.findProductByIdForAdmin(id);
    if (!existingProduct) {
      return NextResponse.json(
        createErrorEnvelope("NOT_FOUND", "Product not found.", correlationId),
        { status: 404 },
      );
    }

    let body: ProductInputBody;
    try {
      body = (await request.json()) as ProductInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    const fieldErrors = await validateProductFields(body);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors,
        }),
        { status: 400 },
      );
    }

    try {
      const product = await catalogRepository.updateProductDraft(id, {
        name: body.name as string,
        slug: body.slug as string,
        summary: body.summary as string,
        categoryId: body.categoryId as string,
      });

      logger.info("product.updated", { productId: product.id, actorUserId: admin.userId });

      return NextResponse.json({ product }, { status: 200 });
    } catch (error) {
      if (isDuplicateSlugError(error)) {
        return NextResponse.json(
          createErrorEnvelope(
            "VALIDATION",
            "A product with this slug already exists.",
            correlationId,
            { fieldErrors: { slug: ["This slug is already in use."] } },
          ),
          { status: 409 },
        );
      }
      throw error;
    }
  },
);
