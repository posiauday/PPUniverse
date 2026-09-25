import { prisma } from "@ppu/db";
import { createErrorEnvelope } from "@ppu/shared";
import { getCorrelationId, logger } from "@ppu/telemetry";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../../lib/auth";
import { catalogRepository } from "../../../../../../lib/catalog";
import { withObservability } from "../../../../../../lib/observability";

/** Same deny-by-default pattern as api/admin/products/route.ts. */
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

interface LicensesInputBody {
  licenseDefinitionIds?: unknown;
}

/**
 * Replaces the product's full assigned license set (MVP-012, FR-009).
 * PUT, not PATCH/POST, because the semantics really are "this is now the
 * complete set" (CatalogRepository.setProductLicenses' own contract) --
 * matches HTTP's own definition of PUT as a full-resource replacement.
 */
export const PUT = withObservability(
  "PUT /api/admin/products/[id]/licenses",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
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

    let body: LicensesInputBody;
    try {
      body = (await request.json()) as LicensesInputBody;
    } catch {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "Invalid request body.", correlationId),
        { status: 400 },
      );
    }

    const ids = body.licenseDefinitionIds;
    if (!Array.isArray(ids) || !ids.every((entry) => typeof entry === "string")) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors: { licenseDefinitionIds: ["licenseDefinitionIds must be an array of strings."] },
        }),
        { status: 400 },
      );
    }

    const definitions = await catalogRepository.listLicenseDefinitions();
    const validIds = new Set(definitions.map((definition) => definition.id));
    const unknownIds = ids.filter((licenseId) => !validIds.has(licenseId));
    if (unknownIds.length > 0) {
      return NextResponse.json(
        createErrorEnvelope("VALIDATION", "One or more fields are invalid.", correlationId, {
          fieldErrors: {
            licenseDefinitionIds: ["Every id must reference an existing license definition."],
          },
        }),
        { status: 400 },
      );
    }

    await catalogRepository.setProductLicenses(id, [...new Set(ids)]);

    logger.info("product.license_set", {
      productId: id,
      actorUserId: admin.userId,
      licenseCount: new Set(ids).size,
    });

    return NextResponse.json({ licenseDefinitionIds: [...new Set(ids)] }, { status: 200 });
  },
);
