import { Prisma } from "@ppu/db";
import { prisma } from "@ppu/db";
import { isValidProductName, isValidProductSlug, isValidProductSummary } from "@ppu/domain-catalog";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { catalogRepository } from "../../../../lib/catalog";
import { withObservability } from "../../../../lib/observability";

/**
 * Product-authoring surface (MVP-012, FR-009). Authorization mirrors
 * api/admin/content/route.ts exactly: no session, or a session whose role
 * is not ADMIN, both get the identical 404 -- first-party product
 * authoring reuses ADMIN, no CREATOR/SELLER/EDITOR/PUBLISHER role exists
 * (docs/final-decisions.md, "First-party-only publishing model" section 6).
 * Role is always re-queried fresh from the database, never read from the
 * session.
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

interface ProductInputBody {
  name?: unknown;
  slug?: unknown;
  summary?: unknown;
  categoryId?: unknown;
}

/** Shared create/update field validation -- returns a field-error map (empty means valid).
 * categoryId's referential check needs the repository (a real DB lookup),
 * so this is async, unlike @ppu/domain-content's purely synchronous
 * validateArticleFields -- Product.categoryId has no pure-domain equivalent
 * to check against. */
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

/** True when `error` is a Postgres unique-constraint violation on Product.slug. */
function isDuplicateSlugError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray((error.meta as { target?: unknown } | undefined)?.target) &&
    ((error.meta as { target?: unknown[] }).target ?? []).includes("slug")
  );
}

export const GET = withObservability("GET /api/admin/products", async () => {
  const correlationId = getCorrelationId() ?? "unknown";
  const admin = await requireAdmin();
  if (!admin) return deny(correlationId);

  const products = await catalogRepository.listProductsForAdmin();
  return NextResponse.json({ products }, { status: 200 });
});

export const POST = withObservability("POST /api/admin/products", async (request: Request) => {
  const correlationId = getCorrelationId() ?? "unknown";
  const admin = await requireAdmin();
  if (!admin) return deny(correlationId);

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
    const product = await catalogRepository.createProductDraft({
      name: body.name as string,
      slug: body.slug as string,
      summary: body.summary as string,
      categoryId: body.categoryId as string,
    });

    logger.info("product.created", { productId: product.id, actorUserId: admin.userId });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (isDuplicateSlugError(error)) {
      return NextResponse.json(
        createErrorEnvelope(
          "VALIDATION",
          "A product with this slug already exists.",
          correlationId,
          {
            fieldErrors: { slug: ["This slug is already in use."] },
          },
        ),
        { status: 409 },
      );
    }
    throw error;
  }
});
