import { PrismaEntitlementRepository } from "@ppu/adapter-entitlements";
import { prisma } from "@ppu/db";
import { presentProductEvidence } from "@ppu/domain-catalog";
import { FreeDownloadControl, JsonLd, ProductEvidence } from "@ppu/ui";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { authOptions } from "../../../lib/auth";
import { catalogRepository } from "../../../lib/catalog";
import { productUrl } from "../../../lib/seo/canonical";
import { buildProductJsonLd } from "../../../lib/seo/json-ld";
import { buildNotFoundMetadata, buildProductMetadata } from "../../../lib/seo/metadata";
import { getSiteUrl } from "../../../lib/site-url";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// See apps/web/app/page.tsx for why these catalog pages render
// per-request rather than being statically generated at build time.
export const dynamic = "force-dynamic";

// generateMetadata and the page both need the product; cache() shares one
// query between them for the duration of a request.
const getProductDetail = cache((slug: string) =>
  catalogRepository.findPublishedProductDetailBySlug(slug),
);

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) {
    return buildNotFoundMetadata("Product not found");
  }
  return buildProductMetadata({ site: getSiteUrl(), product });
}

/**
 * Product detail (MVP-005, FR-003): name, summary and category, then the
 * evidence sections — license, version, support and compatibility. Screenshots,
 * changelog, pricing and checkout belong to later stories. Sections with no
 * data yet render explicit "not provided" wording rather than disappearing, and
 * nothing here is ever inferred or filled in on the creator's behalf.
 *
 * Structured data (MVP-021): Product JSON-LD is emitted WITHOUT Offer data and
 * makes no rich-result eligibility claim — see lib/seo/json-ld.ts.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) {
    notFound();
  }

  const site = getSiteUrl();
  const jsonLd = site.ok
    ? buildProductJsonLd({
        url: productUrl(site.origin, product.slug),
        name: product.name,
        summary: product.summary,
        categoryName: product.category.name,
        currentVersion: product.currentVersion,
      })
    : null;

  // MVP-010 (FR-005): decided server-side, on every request — never inferred
  // client-side, and never trusting anything the client could supply. Sign-in
  // is required for every free download in this story (docs/final-
  // decisions.md, "MVP-010 open questions 44 and 45", Q44); there is no
  // guest path and no per-product policy field.
  const session = await getServerSession(authOptions);
  const existingEntitlement =
    session?.user?.id != null
      ? await new PrismaEntitlementRepository(prisma).findEntitlement(session.user.id, product.id)
      : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/categories/${product.category.slug}`} className="text-sm text-muted-foreground">
        &larr; {product.category.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{product.name}</h1>
      <p className="mt-4">{product.summary}</p>

      <div className="mt-6">
        {!session?.user?.id ? (
          <p>
            <Link href="/signin">Sign in</Link> to get this for free.
          </p>
        ) : existingEntitlement ? (
          <p>You already have this.</p>
        ) : (
          <FreeDownloadControl productSlug={product.slug} />
        )}
      </div>

      <ProductEvidence evidence={presentProductEvidence(product)} />

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
    </main>
  );
}
