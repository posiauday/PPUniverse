import { presentProductEvidence } from "@ppu/domain-catalog";
import { ProductEvidence } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { catalogRepository } from "../../../lib/catalog";

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
    return { title: "Product not found" };
  }
  return {
    title: `${product.name} | Power Platform Universe`,
    description: product.summary,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

/**
 * Product detail (MVP-005, FR-003): name, summary and category, then the
 * evidence sections — license, version, support and compatibility. Screenshots,
 * changelog, pricing and checkout belong to later stories. Sections with no
 * data yet render explicit "not provided" wording rather than disappearing, and
 * nothing here is ever inferred or filled in on the creator's behalf.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/categories/${product.category.slug}`} className="text-sm text-muted-foreground">
        &larr; {product.category.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{product.name}</h1>
      <p className="mt-4">{product.summary}</p>

      <ProductEvidence evidence={presentProductEvidence(product)} />
    </main>
  );
}
