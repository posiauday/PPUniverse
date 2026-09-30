import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { catalogRepository } from "../../../lib/catalog";
import { SITE_NAME } from "../../../lib/seo/site";

export const metadata: Metadata = { title: `Products | ${SITE_NAME}` };

/**
 * The admin authoring surface MVP-012 requires (FR-009). Same deny-by-
 * default pattern as apps/web/app/admin/content/page.tsx: no session, and a
 * session with role !== ADMIN, both render the identical Next.js not-found
 * page -- first-party product authoring reuses ADMIN, no CREATOR/SELLER/
 * EDITOR/PUBLISHER role exists (docs/final-decisions.md, "First-party-only
 * publishing model" section 6). Role is re-queried from the database on
 * every request, never read from the session.
 */
export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    notFound();
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (actor?.role !== "ADMIN") {
    notFound();
  }

  const products = await catalogRepository.listProductsForAdmin();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Products</h1>
      <p className="mt-2">
        <Link href="/admin/products/new">New product</Link>
      </p>

      {products.length === 0 ? (
        <p className="mt-8">No products yet.</p>
      ) : (
        <ul className="mt-8">
          {products.map((product) => (
            <li key={product.id}>
              <Link href={`/admin/products/${product.id}/edit`}>{product.name}</Link> —{" "}
              {product.status}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
