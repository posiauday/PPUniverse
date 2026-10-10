import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "../../../../../lib/auth";
import { contentRepository } from "../../../../../lib/content";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { StatusPill } from "../../../AdminList";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { LocalTime } from "../../../LocalTime";
import { SchedulePanel } from "../../../SchedulePanel";
import { ArticleForm } from "../../ArticleForm";

export const metadata: Metadata = { title: `Edit guide | ${SITE_NAME}` };

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

/** Same deny-by-default pattern as apps/web/app/admin/content/page.tsx. An
 * unknown article id is also a 404 — no information about which case it is.
 * MVP-052 phase 4: the form, with publishing beside it on wide screens. */
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
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: "/admin/content", label: "Guides" }}
        title="Edit guide"
        actions={
          <StatusPill
            status={
              article.status === "PUBLISHED"
                ? "Published"
                : article.scheduledFor
                  ? "Scheduled"
                  : "Draft"
            }
          />
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <ArticleForm
          mode="edit"
          articleId={article.id}
          initialValues={{
            slug: article.slug,
            title: article.title,
            type: article.type,
            technology: article.technology ?? "",
            topic: article.topic ?? "",
            excerpt: article.excerpt ?? "",
            body: article.body,
          }}
        />
        {article.status === "DRAFT" ? (
          <SchedulePanel
            endpoint={`/api/admin/content/${article.id}/schedule`}
            previewHref={`/preview/guides/${article.id}`}
            noun="guide"
            scheduledFor={article.scheduledFor?.toISOString() ?? null}
          />
        ) : article.publishedAt ? (
          <section className="rounded-[1.5rem] border border-border bg-card p-5">
            <p>
              Published <LocalTime iso={article.publishedAt.toISOString()} />.{" "}
              <Link href={`/guides/${article.slug}`} className="font-semibold underline">
                View it on the site
              </Link>
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
