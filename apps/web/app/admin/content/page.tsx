import { prisma } from "@ppu/db";
import { contentRepository } from "../../../lib/content";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { SITE_NAME } from "../../../lib/seo/site";
import { ArticlePublishControl } from "./ArticlePublishControl";

export const metadata: Metadata = { title: `Content | ${SITE_NAME}` };

/**
 * The admin authoring surface MVP-017 requires (FR-014). Same deny-by-default
 * pattern as apps/web/app/admin/deletion-requests/page.tsx: no session, and a
 * session with role !== ADMIN, both render the identical Next.js not-found
 * page — content-publishing authority reuses ADMIN, no EDITOR role exists
 * (docs/final-decisions.md, "MVP-017 implementation: content-publishing
 * authorization reuses ADMIN"). Role is re-queried from the database on
 * every request, never read from the session.
 */
export default async function AdminContentPage() {
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

  const articles = await contentRepository.listArticles();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Content</h1>
      <p className="mt-2">
        <Link href="/admin/content/new">New article</Link>
      </p>

      {articles.length === 0 ? (
        <p className="mt-8">No articles yet.</p>
      ) : (
        <ul className="mt-8">
          {articles.map((article) => (
            <li key={article.id}>
              <p>
                <Link href={`/admin/content/${article.id}/edit`}>{article.title}</Link> —{" "}
                {article.type} — {article.status}
              </p>
              {article.status === "DRAFT" ? <ArticlePublishControl articleId={article.id} /> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
