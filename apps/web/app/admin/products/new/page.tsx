import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../../lib/auth";
import { catalogRepository } from "../../../../lib/catalog";
import { SITE_NAME } from "../../../../lib/seo/site";
import { ProductForm } from "../ProductForm";
import { AdminPageHeader } from "../../AdminPageHeader";

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
    <main className="flex max-w-3xl flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title="New product"
        description="Start with the core details. Licenses, price, support, compatibility and releases are added on the next page."
      />
      <ProductForm mode="create" categories={categories} />
    </main>
  );
}
