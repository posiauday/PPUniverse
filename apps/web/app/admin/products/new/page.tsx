import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../../lib/auth";
import { catalogRepository } from "../../../../lib/catalog";
import { SITE_NAME } from "../../../../lib/seo/site";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: `New product | ${SITE_NAME}` };

/** Same deny-by-default pattern as apps/web/app/admin/products/page.tsx. */
export default async function NewProductPage() {
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

  const categories = await catalogRepository.listCategories();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm mode="create" categories={categories} />
    </main>
  );
}
