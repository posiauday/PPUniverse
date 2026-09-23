import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../../../lib/auth";
import { contentRepository } from "../../../../../lib/content";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { ArticleForm } from "../../ArticleForm";

export const metadata: Metadata = { title: `Edit article | ${SITE_NAME}` };

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

/** Same deny-by-default pattern as apps/web/app/admin/content/page.tsx. An
 * unknown article id is also a 404 — no information about which case it is. */
export default async function EditArticlePage({ params }: EditArticlePageProps) {
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

  const { id } = await params;
  const article = await contentRepository.findArticleById(id);
  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Edit article</h1>
      <ArticleForm
        mode="edit"
        articleId={article.id}
        initialValues={{
          slug: article.slug,
          title: article.title,
          type: article.type,
          excerpt: article.excerpt ?? "",
          body: article.body,
        }}
      />
    </main>
  );
}
