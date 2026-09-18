import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogRepository } from "../../../lib/catalog";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// See apps/web/app/page.tsx for why these catalog pages render
// per-request rather than being statically generated at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalogRepository.findPublishedProductBySlug(slug);
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
 * Deliberately minimal (name, summary, category link only) — the full
 * evidence-field detail page (license, version, compatibility, support,
 * screenshots) is MVP-005's scope (FR-003), not this story's. This page
 * exists so MVP-003's category-listing links have somewhere real to land.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await catalogRepository.findPublishedProductBySlug(slug);
  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href={`/categories/${product.category.slug}`} className="text-sm text-muted-foreground">
        &larr; {product.category.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{product.name}</h1>
      <p className="mt-4">{product.summary}</p>
    </main>
  );
}
