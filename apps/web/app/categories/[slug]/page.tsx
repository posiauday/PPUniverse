import { ProductCard } from "@ppu/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogRepository } from "../../../lib/catalog";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

// See apps/web/app/page.tsx for why these catalog pages render
// per-request rather than being statically generated at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await catalogRepository.findCategoryBySlug(slug);
  if (!category) {
    return { title: "Category not found" };
  }
  return {
    title: `${category.name} | Power Platform Universe`,
    description: category.description ?? `Browse ${category.name} on Power Platform Universe.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await catalogRepository.findCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const products = await catalogRepository.listPublishedProductsByCategory(category.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{category.name}</h1>
      {category.description ? (
        <p className="mt-2 text-muted-foreground">{category.description}</p>
      ) : null}

      {products.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          No products have been published in this category yet. Check back soon.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                href={`/products/${product.slug}`}
                name={product.name}
                summary={product.summary}
                categoryName={category.name}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
