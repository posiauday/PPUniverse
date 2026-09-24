import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../../lib/auth";
import { SITE_NAME } from "../../../../lib/seo/site";
import { ArticleForm } from "../ArticleForm";

export const metadata: Metadata = { title: `New article | ${SITE_NAME}` };

/** Same deny-by-default pattern as apps/web/app/admin/content/page.tsx. */
export default async function NewArticlePage() {
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">New article</h1>
      <ArticleForm mode="create" />
    </main>
  );
}
